/**
 * WhatsApp Gold Rate Text Parser for AURUM PULSE.
 * Safely extracts rates, detects cities, purities, currencies, and units.
 * Never treats untrusted text as authoritative automatically.
 */

export interface ParsedRateItem {
  id: string;
  rawKey: string;
  rawValue: string;
  fieldLabel: string;
  detectedInstrument: string; // e.g. Gold 24K, Gold 22K, Silver, MCX Gold
  numericValue: number;
  detectedUnit: '10g' | '1g' | '1kg' | 'troy_oz' | 'points' | 'unknown';
  detectedCurrency: 'INR' | 'USD';
  location?: string; // Chennai, Madurai, Kerala, Mumbai, etc.
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  isAmbiguous: boolean;
  ambiguityReason?: string;
}

export interface ParseResult {
  originalMessage: string;
  detectedDate?: string;
  detectedTime?: string;
  parsedItems: ParsedRateItem[];
  unparsedLines: string[];
  hasWarnings: boolean;
  warnings: string[];
}

const CITY_PATTERNS: Record<string, RegExp> = {
  'Chennai': /chennai|mas/i,
  'Madurai': /madurai|mdu/i,
  'Kerala': /kerala|cochin|kochi|calicut/i,
  'Mumbai': /mumbai|bom/i,
  'Delhi': /delhi/i,
  'Coimbatore': /coimbatore|cbe/i,
  'Trichy': /trichy/i,
  'Salem': /salem/i
};

export function parseWhatsAppMessage(rawText: string): ParseResult {
  const result: ParseResult = {
    originalMessage: rawText,
    parsedItems: [],
    unparsedLines: [],
    hasWarnings: false,
    warnings: []
  };

  if (!rawText || !rawText.trim()) {
    result.hasWarnings = true;
    result.warnings.push("Empty text provided");
    return result;
  }

  // Detect message timestamp if present in WhatsApp export format
  // e.g. [10/30/26, 10:15:30 AM] or 30/10/2026, 10:15 -
  const timestampRegex = /(?:\[?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})[,\s]+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AaPp][Mm])?)\]?\s*[-:]?\s*)/;
  const matchTs = rawText.match(timestampRegex);
  if (matchTs) {
    result.detectedDate = matchTs[1];
    result.detectedTime = matchTs[2];
  }

  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let currentContextLocation: string | undefined = undefined;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Check if entire line is just a location header (e.g. "Chennai:", "Madurai")
    let lineMatchedLocation: string | undefined = undefined;
    for (const [city, regex] of Object.entries(CITY_PATTERNS)) {
      if (regex.test(line)) {
        lineMatchedLocation = city;
        break;
      }
    }

    // Split line by colon, hyphen, equals, or common delimiters
    // Examples: "G 10GM : 118,500", "22K : 10870", "MCX Gold: 119200", "Madurai 22k - 10860", "S: 125"
    const pairRegex = /^([A-Za-z0-9\s\/\.\(\)]+?)[\:\=\-]([0-9,\.\s]+.*)$/;
    const match = line.match(pairRegex);

    if (match) {
      const rawKey = match[1].trim();
      const rawValPart = match[2].trim();

      // Extract numeric value (stripping commas and currency symbols)
      const numMatch = rawValPart.match(/([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)/);
      if (!numMatch) {
        result.unparsedLines.push(line);
        continue;
      }

      const cleanNumStr = numMatch[1].replace(/,/g, '');
      const numericValue = parseFloat(cleanNumStr);

      if (isNaN(numericValue) || numericValue <= 0) {
        result.warnings.push(`Invalid number in line: "${line}"`);
        result.unparsedLines.push(line);
        continue;
      }

      // Identify instrument, purity, unit, and location
      let detectedInstrument = 'Unknown';
      let fieldLabel = rawKey;
      let detectedUnit: ParsedRateItem['detectedUnit'] = 'unknown';
      let detectedCurrency: ParsedRateItem['detectedCurrency'] = 'INR';
      let location = lineMatchedLocation || currentContextLocation;
      let confidence: ParsedRateItem['confidence'] = 'MEDIUM';
      let isAmbiguous = false;
      let ambiguityReason: string | undefined = undefined;

      const lowerKey = rawKey.toLowerCase();
      const lowerLine = line.toLowerCase();

      // Detect location from key if present
      for (const [city, regex] of Object.entries(CITY_PATTERNS)) {
        if (regex.test(lowerKey)) {
          location = city;
          break;
        }
      }

      // Unit detection
      if (/10\s*gm|10gm|10g|10\s*gram/i.test(lowerKey) || /10\s*gm|10gm|10g|10\s*gram/i.test(lowerLine)) {
        detectedUnit = '10g';
      } else if (/1\s*kg|1kg|1000\s*gm/i.test(lowerKey) || /1\s*kg|1kg/i.test(lowerLine)) {
        detectedUnit = '1kg';
      } else if (/1\s*gm|1gm|per\s*gm|gram/i.test(lowerKey) || /per\s*gm/i.test(lowerLine)) {
        detectedUnit = '1g';
      } else if (/oz|ounce/i.test(lowerKey)) {
        detectedUnit = 'troy_oz';
      }

      // Instrument detection
      if (/mcx\s*gold/i.test(lowerKey)) {
        detectedInstrument = 'MCX Gold Futures';
        detectedUnit = detectedUnit === 'unknown' ? '10g' : detectedUnit;
        confidence = 'HIGH';
      } else if (/mcx\s*silver/i.test(lowerKey)) {
        detectedInstrument = 'MCX Silver Futures';
        detectedUnit = detectedUnit === 'unknown' ? '1kg' : detectedUnit;
        confidence = 'HIGH';
      } else if (/22\s*k|22k|916/i.test(lowerKey) || /22\s*k|22k|916/i.test(lowerLine)) {
        detectedInstrument = 'Gold 22K (916)';
        // Infer unit based on reasonable Indian market price ranges
        if (detectedUnit === 'unknown') {
          detectedUnit = numericValue > 50000 ? '10g' : '1g';
        }
        confidence = 'HIGH';
      } else if (/24\s*k|24k|999|9999/i.test(lowerKey) || /24\s*k|24k|999/i.test(lowerLine)) {
        detectedInstrument = 'Gold 24K (999)';
        if (detectedUnit === 'unknown') {
          detectedUnit = numericValue > 50000 ? '10g' : '1g';
        }
        confidence = 'HIGH';
      } else if (/18\s*k|18k|750/i.test(lowerKey) || /18\s*k|18k/i.test(lowerLine)) {
        detectedInstrument = 'Gold 18K (750)';
        if (detectedUnit === 'unknown') {
          detectedUnit = numericValue > 40000 ? '10g' : '1g';
        }
        confidence = 'HIGH';
      } else if (/^g$/i.test(lowerKey) || /^gold$/i.test(lowerKey)) {
        detectedInstrument = 'Gold (Unspecified Purity)';
        if (detectedUnit === 'unknown') {
          detectedUnit = numericValue > 50000 ? '10g' : '1g';
        }
        isAmbiguous = true;
        ambiguityReason = "Single letter 'G' does not specify purity (24K vs 22K)";
        confidence = 'LOW';
      } else if (/^s$/i.test(lowerKey) || /silver/i.test(lowerKey)) {
        detectedInstrument = 'Silver';
        if (detectedUnit === 'unknown') {
          detectedUnit = numericValue > 50000 ? '1kg' : '1g';
        }
        confidence = 'MEDIUM';
      } else if (/^i$/i.test(lowerKey)) {
        detectedInstrument = 'Index / Ambiguous Indicator';
        isAmbiguous = true;
        ambiguityReason = "Single letter 'I' is ambiguous";
        confidence = 'LOW';
      } else {
        detectedInstrument = `Quotation (${rawKey})`;
        isAmbiguous = true;
        ambiguityReason = "Unknown field identifier";
        confidence = 'LOW';
      }

      result.parsedItems.push({
        id: `item-${idx}-${Date.now()}`,
        rawKey,
        rawValue: rawValPart,
        fieldLabel,
        detectedInstrument,
        numericValue,
        detectedUnit,
        detectedCurrency,
        location,
        confidence,
        isAmbiguous,
        ambiguityReason
      });
    } else {
      // Line is not a key-value pair, check if it sets a location context
      if (lineMatchedLocation) {
        currentContextLocation = lineMatchedLocation;
      } else {
        result.unparsedLines.push(line);
      }
    }
  }

  if (result.parsedItems.length === 0) {
    result.hasWarnings = true;
    result.warnings.push("No recognizable price pairs found in the pasted text.");
  }

  return result;
}

/**
 * Checks for duplicate quotations
 */
export function isDuplicateQuotation(
  newItem: { location?: string; detectedInstrument: string; numericValue: number; detectedUnit: string },
  existingItems: Array<{ location?: string; purity: string; pricePer10g: number }>
): boolean {
  return existingItems.some(existing => {
    const locMatch = (!existing.location && !newItem.location) || existing.location === newItem.location;
    const priceMatch = Math.abs(existing.pricePer10g - newItem.numericValue) < 1.0;
    return locMatch && priceMatch;
  });
}

