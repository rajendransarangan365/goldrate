/**
 * Core Data Models & Freshness States for AURUM PULSE.
 */

export type FreshnessState =
  | 'LIVE'
  | 'DELAYED'
  | 'CACHED'
  | 'STALE'
  | 'MANUAL'
  | 'UNAVAILABLE'
  | 'ERROR';

export type ObservationType =
  | 'ACTUAL_MARKET'     // Direct quote from a data provider
  | 'CALCULATED'        // Formulaically derived (e.g. theoretical 24K INR)
  | 'STATISTICAL_PRED'  // Machine learning / quantitative forecast
  | 'MANUAL_IMPORT';    // User entered or WhatsApp/CSV import

export type MarketInstrument =
  | 'XAU/USD'
  | 'USD/INR'
  | 'XAU/INR'
  | 'XAG/USD'
  | 'XAG/INR'
  | 'GOLD_INR_24K_10G_THEORETICAL'
  | 'GOLD_INR_22K_10G_CALCULATED'
  | 'GOLD_INR_18K_10G_CALCULATED'
  | 'MCX_GOLD_10G'
  | 'LOCAL_CHENNAI_24K_10G'
  | 'LOCAL_CHENNAI_22K_10G'
  | 'LOCAL_MADURAI_22K_10G'
  | 'LOCAL_KERALA_22K_10G'
  | 'LOCAL_CUSTOM';

export interface MarketObservation {
  id: string;
  instrument: MarketInstrument;
  value: number;
  currency: 'USD' | 'INR' | 'EUR';
  unit: 'per_troy_ounce' | 'per_10_grams' | 'per_gram' | 'per_kg' | 'fx_rate';
  source: string;
  observedAt: string;     // ISO timestamp from provider or market time
  fetchedAt: string;      // ISO timestamp when client received data
  freshness: FreshnessState;
  observationType: ObservationType;
  metadata?: Record<string, any>;
}

export interface AttributionInfo {
  required: boolean;
  text: string;
  url: string;
  html?: string;
  license?: string;
  terms?: string;
}

export interface LiveMarketSnapshot {
  goldUsdPerOz: MarketObservation;
  usdInrRate: MarketObservation;
  goldInrPerOz?: MarketObservation;
  silverUsdPerOz?: MarketObservation;
  theoretical24kInr10g: MarketObservation;
  theoretical22kInr10g: MarketObservation;
  theoretical18kInr10g: MarketObservation;
  changeUsd?: number;
  changePct?: number;
  previousCloseUsd?: number;
  provider: 'corgano' | 'goldprice_dev' | 'frankfurter' | 'offline_cache';
  attribution: AttributionInfo;
  lastSuccessfulFetch: string;
  overallFreshness: FreshnessState;
}

export interface HistoricalBar {
  date: string;
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  inrTheoretical10g?: number;
}

