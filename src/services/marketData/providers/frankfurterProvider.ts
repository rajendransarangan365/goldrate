import { MarketObservation, AttributionInfo } from '../types';

export const FRANKFURTER_ATTRIBUTION: AttributionInfo = {
  required: true,
  text: 'Exchange rates via Frankfurter (European Central Bank Reference Rates)',
  url: 'https://frankfurter.dev/',
  license: 'Open source data (ECB daily reference rates)',
  terms: 'https://frankfurter.dev/'
};

export interface FrankfurterFxResult {
  observation: MarketObservation;
  rate: number;
  date: string;
}

/**
 * Fetches daily reference USD/INR exchange rate from Frankfurter.
 * Note: These are daily reference rates, NOT continuously streaming live FX quotes.
 */
export async function fetchFrankfurterUsdInr(timeoutMs: number = 6000): Promise<FrankfurterFxResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR', {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Frankfurter API returned HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.rates || typeof data.rates.INR !== 'number') {
      throw new Error('Malformed rates object from Frankfurter');
    }

    const rate = data.rates.INR;
    const date = data.date;
    const fetchedAt = new Date().toISOString();

    const observation: MarketObservation = {
      id: `frankfurter-usd-inr-${date}`,
      instrument: 'USD/INR',
      value: rate,
      currency: 'INR',
      unit: 'fx_rate',
      source: 'Frankfurter (ECB Daily Reference Rate - NOT continuous live FX)',
      observedAt: date,
      fetchedAt,
      freshness: 'DELAYED', // explicitly labeled DELAYED / REFERENCE
      observationType: 'ACTUAL_MARKET',
      metadata: {
        note: 'Daily reference rate published by European Central Bank, not a continuous streaming market quote.'
      }
    };

    return {
      observation,
      rate,
      date
    };
  } finally {
    clearTimeout(timer);
  }
}

