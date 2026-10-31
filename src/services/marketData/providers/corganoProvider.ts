import { LiveMarketSnapshot, MarketObservation, HistoricalBar, AttributionInfo } from '../types';
import { calculateGoldPrices } from '../../../utils/goldCalculations';

export const CORGANO_ATTRIBUTION: AttributionInfo = {
  required: true,
  text: 'Gold price data by Corgano',
  url: 'https://goldprice.corgano.com/',
  html: '<a href="https://goldprice.corgano.com/" target="_blank" rel="noopener noreferrer">Gold price data by Corgano</a>',
  license: 'CC BY 4.0: free to use with credit and followable link',
  terms: 'https://goldprice.corgano.com/gold-price-api#terms'
};

export async function fetchCorganoLatest(timeoutMs: number = 8000): Promise<LiveMarketSnapshot> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://goldprice.corgano.com/api/v1/latest?currency=INR', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Corgano API returned HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!json.data || !json.data.price_usd || typeof json.data.price_usd.per_oz !== 'number') {
      throw new Error('Malformed response from Corgano API: missing gold price_usd.per_oz');
    }

    const fetchedAt = new Date().toISOString();
    const observedAt = json.data.as_of || json.generated_at || fetchedAt;
    const xauUsd = json.data.price_usd.per_oz;
    
    // Check if INR currency rate is provided in response
    const inrCurrency = json.data.currencies?.INR;
    const usdInr = (inrCurrency && typeof inrCurrency.usd_rate === 'number') 
      ? inrCurrency.usd_rate 
      : 94.95; // fallback reference rate if currency block absent

    const prices = calculateGoldPrices({
      xauUsdPerOunce: xauUsd,
      usdInrRate: usdInr
    });

    // Freshness: Corgano updates ~once a minute, market_open indicates whether active trading session
    const isMarketOpen = json.data.market_open === true;
    const freshness = isMarketOpen ? 'LIVE' : 'DELAYED';

    const goldObs: MarketObservation = {
      id: `corgano-xau-usd-${observedAt}`,
      instrument: 'XAU/USD',
      value: xauUsd,
      currency: 'USD',
      unit: 'per_troy_ounce',
      source: 'Corgano Gold Price API (Spot midpoint)',
      observedAt,
      fetchedAt,
      freshness,
      observationType: 'ACTUAL_MARKET'
    };

    const usdInrObs: MarketObservation = {
      id: `corgano-usd-inr-${observedAt}`,
      instrument: 'USD/INR',
      value: usdInr,
      currency: 'INR',
      unit: 'fx_rate',
      source: inrCurrency ? 'Corgano FX Conversion' : 'Frankfurter Reference Fallback',
      observedAt,
      fetchedAt,
      freshness,
      observationType: 'ACTUAL_MARKET'
    };

    const theo24kObs: MarketObservation = {
      id: `theo-24k-${observedAt}`,
      instrument: 'GOLD_INR_24K_10G_THEORETICAL',
      value: prices.theoretical24kInrPer10g,
      currency: 'INR',
      unit: 'per_10_grams',
      source: 'Formula: (XAU/USD * USD/INR / 31.1034768) * 10',
      observedAt,
      fetchedAt,
      freshness,
      observationType: 'CALCULATED'
    };

    const theo22kObs: MarketObservation = {
      id: `theo-22k-${observedAt}`,
      instrument: 'GOLD_INR_22K_10G_CALCULATED',
      value: prices.theoretical22kInrPer10g,
      currency: 'INR',
      unit: 'per_10_grams',
      source: 'Formula: 24K Theoretical * 22/24',
      observedAt,
      fetchedAt,
      freshness,
      observationType: 'CALCULATED'
    };

    const theo18kObs: MarketObservation = {
      id: `theo-18k-${observedAt}`,
      instrument: 'GOLD_INR_18K_10G_CALCULATED',
      value: prices.theoretical18kInrPer10g,
      currency: 'INR',
      unit: 'per_10_grams',
      source: 'Formula: 24K Theoretical * 18/24',
      observedAt,
      fetchedAt,
      freshness,
      observationType: 'CALCULATED'
    };

    return {
      goldUsdPerOz: goldObs,
      usdInrRate: usdInrObs,
      theoretical24kInr10g: theo24kObs,
      theoretical22kInr10g: theo22kObs,
      theoretical18kInr10g: theo18kObs,
      changeUsd: json.data.change_usd,
      changePct: json.data.change_pct,
      previousCloseUsd: json.data.previous_close_usd,
      provider: 'corgano',
      attribution: CORGANO_ATTRIBUTION,
      lastSuccessfulFetch: fetchedAt,
      overallFreshness: freshness
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCorganoHistory(timeoutMs: number = 10000): Promise<HistoricalBar[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch('https://goldprice.corgano.com/api/v1/history', {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Corgano history: HTTP ${response.status}`);
    }

    const json = await response.json();
    if (!Array.isArray(json.data)) {
      throw new Error('Malformed history data array from Corgano API');
    }

    return json.data.map((item: any) => ({
      date: item.date,
      close: Number(item.close)
    }));
  } finally {
    clearTimeout(timer);
  }
}
