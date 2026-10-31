import { describe, it, expect } from 'vitest';
import { parseWhatsAppMessage, isDuplicateQuotation } from '../services/importers/whatsappParser';

describe('WhatsApp Gold-Rate Message Parser', () => {
  it('parses valid multi-city gold rate messages accurately', () => {
    const rawMsg = `
[30/10/26, 10:15 AM] Market Rates:
Chennai 22K : 10,870
Madurai 22K - 10,865
MCX Gold : 119,250
Silver 1KG : 124,500
    `.trim();

    const result = parseWhatsAppMessage(rawMsg);
    expect(result.detectedDate).toBe('30/10/26');
    expect(result.detectedTime).toBe('10:15 AM');
    expect(result.parsedItems.length).toBe(4);

    const chennai = result.parsedItems.find(i => i.location === 'Chennai');
    expect(chennai).toBeDefined();
    expect(chennai?.numericValue).toBe(10870);
    expect(chennai?.detectedInstrument).toBe('Gold 22K (916)');
    expect(chennai?.detectedUnit).toBe('1g');

    const mcx = result.parsedItems.find(i => i.detectedInstrument.includes('MCX Gold'));
    expect(mcx).toBeDefined();
    expect(mcx?.numericValue).toBe(119250);
    expect(mcx?.detectedUnit).toBe('10g');
  });

  it('flags ambiguous single-letter fields like G and I with warnings', () => {
    const rawMsg = `
G: 118,500
S: 125
I: 95.2
    `.trim();

    const result = parseWhatsAppMessage(rawMsg);
    expect(result.parsedItems.length).toBe(3);

    const gItem = result.parsedItems.find(i => i.rawKey.toLowerCase() === 'g');
    expect(gItem?.isAmbiguous).toBe(true);
    expect(gItem?.ambiguityReason).toContain("does not specify purity");

    const iItem = result.parsedItems.find(i => i.rawKey.toLowerCase() === 'i');
    expect(iItem?.isAmbiguous).toBe(true);
  });

  it('handles invalid numbers and unparsed lines gracefully', () => {
    const rawMsg = `
Gold 22K : N/A
Invalid line without colon
Chennai 24K : 11,880
    `.trim();

    const result = parseWhatsAppMessage(rawMsg);
    expect(result.parsedItems.length).toBe(1);
    expect(result.parsedItems[0].numericValue).toBe(11880);
    expect(result.unparsedLines).toContain('Gold 22K : N/A');
    expect(result.unparsedLines).toContain('Invalid line without colon');
  });

  it('detects duplicate quotations correctly', () => {
    const existing = [
      { location: 'Chennai', purity: '22K', pricePer10g: 108700 }
    ];

    const duplicateItem = {
      location: 'Chennai',
      detectedInstrument: 'Gold 22K',
      numericValue: 108700,
      detectedUnit: '10g'
    };

    const differentItem = {
      location: 'Madurai',
      detectedInstrument: 'Gold 22K',
      numericValue: 108700,
      detectedUnit: '10g'
    };

    expect(isDuplicateQuotation(duplicateItem, existing)).toBe(true);
    expect(isDuplicateQuotation(differentItem, existing)).toBe(false);
  });
});

