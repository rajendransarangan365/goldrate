import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { LiveMarketSnapshot, MarketObservation, AttributionInfo } from '../types';
import { calculateGoldPrices } from '../../../utils/goldCalculations';

export const GOLDPRICEDEV_ATTRIBUTION: AttributionInfo = {
  required: true,
  text: 'Gold Price by goldprice.dev',
  url: 'https://goldprice.dev/',
  license: 'Free anonymous tier (subject to rate limit headers)',
  terms: 'https://goldprice.dev/onboarding'
};

async function fetchGoldPriceDevJson(timeoutMs: number): Promise<any> {
  // Strategy 1: Native Mobile (Capacitor Http - bypasses browser CORS entirely)
  if (Capacitor.isNativePlatform()) {
    try {
      const capRes = await CapacitorHttp.get({
        url: 'https://api.goldprice.dev/v1/prices',
        headers: { 'Accept': 'application/json' },
        connectTimeout: timeoutMs,
        readTimeout: timeoutMs
      });
      if (capRes.status >= 200 && capRes.status < 300) {
        return typeof capRes.data === 'string' ? JSON.parse(capRes.data) : capRes.data;
      }
    } catch (e) {
      console.warn('Capacitor native HTTP failed, falling back to web fetch', e);
    }
  }

  // Strategy 2: Vite Dev Server Proxy (prevents CORS during local development)
  if (import.meta.env.DEV) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), Math.min(timeoutMs, 5000));
      const proxyRes = await fetch('/api/goldprice-proxy/v1/prices', {
        signal: ctrl.signal,
        headers: { 'Accept': 'application/json' }
      });
      clearTimeout(t);
      if (proxyRes.ok) {
        return await proxyRes.json();
      }
    } catch {
      // Continue to next strategy
    }
  }

  // Strategy 3: Direct browser fetch (works if browser/environment permits or CORS extension is active)
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), Math.min(timeoutMs, 3000));
    const directRes = await fetch('https://api.goldprice.dev/v1/prices', {
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(t);
    if (directRes.ok) {
      return await directRes.json();
    }
  } catch {
    // Normal browser CORS block - continue to Strategy 4
  }

  // Strategy 4: High-availability CORS bridge fallback
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const corsProxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent('https://api.goldprice.dev/v1/prices');
    const bridgeRes = await fetch(corsProxyUrl, {
      signal: ctrl.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(t);
    if (bridgeRes.ok) {
      const data = await bridgeRes.json();
      return typeof data === 'string' ? JSON.parse(data) : data;
    }
  } catch (bridgeErr) {
    console.warn('CORS bridge fallback also failed', bridgeErr);
  }

  throw new Error('goldprice.dev is currently unreachable directly due to browser CORS policy without API proxy.');
}

export async function fetchGoldPriceDevLatest(timeoutMs: number = 8000): Promise<LiveMarketSnapshot> {
  const json = await fetchGoldPriceDevJson(timeoutMs);

  if (!json || !Array.isArray(json.symbols)) {
    throw new Error('Malformed response from goldprice.dev');
  }

    const xauUsdObj = json.symbols.find((s: any) => s.symbol === 'XAU' && s.quote_currency === 'USD');
    const xauInrObj = json.symbols.find((s: any) => s.symbol === 'XAU' && s.quote_currency === 'INR');
    const xagUsdObj = json.symbols.find((s: any) => s.symbol === 'XAG' && s.quote_currency === 'USD');

    if (!xauUsdObj || isNaN(Number(xauUsdObj.price))) {
      throw new Error('XAU/USD not found in goldprice.dev payload');
    }

    const xauUsd = Number(xauUsdObj.price);
    const xauInr = xauInrObj ? Number(xauInrObj.price) : undefined;
    const xagUsd = xagUsdObj ? Number(xagUsdObj.price) : undefined;

    // If provider gives XAU/INR, implied USD/INR = XAU/INR / XAU/USD
    const usdInr = (xauInr && xauUsd) ? (xauInr / xauUsd) : 94.95;

    const fetchedAt = new Date().toISOString();
    const observedAt = xauUsdObj.computed_at || fetchedAt;
    const freshness = xauUsdObj.is_stale ? 'STALE' : 'LIVE';

    const prices = calculateGoldPrices({
      xauUsdPerOunce: xauUsd,
      usdInrRate: usdInr
    });

    const goldObs: MarketObservation = {
      id: `goldpricedev-xau-usd-${observedAt}`,
      instrument: 'XAU/USD',
      value: xauUsd,
      currency: 'USD',
      unit: 'per_troy_ounce',
      source: 'goldprice.dev spot API',
      observedAt,
      fetchedAt,
      freshness,
      observationType: 'ACTUAL_MARKET'
    };

    const usdInrObs: MarketObservation = {
      id: `goldpricedev-usd-inr-${observedAt}`,
      instrument: 'USD/INR',
      value: usdInr,
      currency: 'INR',
      unit: 'fx_rate',
      source: xauInr ? 'Implied from goldprice.dev XAU/INR' : 'Reference Fallback',
      observedAt,
      fetchedAt,
      freshness,
      observationType: 'ACTUAL_MARKET'
    };

    const theo24kObs: MarketObservation = {
      id: `theo-24k-gpd-${observedAt}`,
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
      id: `theo-22k-gpd-${observedAt}`,
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
      id: `theo-18k-gpd-${observedAt}`,
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

    const silverObs: MarketObservation | undefined = xagUsd ? {
      id: `goldpricedev-xag-usd-${observedAt}`,
      instrument: 'XAG/USD',
      value: xagUsd,
      currency: 'USD',
      unit: 'per_troy_ounce',
      source: 'goldprice.dev spot API',
      observedAt,
      fetchedAt,
      freshness,
      observationType: 'ACTUAL_MARKET'
    } : undefined;

    return {
      goldUsdPerOz: goldObs,
      usdInrRate: usdInrObs,
      silverUsdPerOz: silverObs,
      theoretical24kInr10g: theo24kObs,
      theoretical22kInr10g: theo22kObs,
      theoretical18kInr10g: theo18kObs,
      provider: 'goldprice_dev',
      attribution: GOLDPRICEDEV_ATTRIBUTION,
      lastSuccessfulFetch: fetchedAt,
      overallFreshness: freshness
    };
}
