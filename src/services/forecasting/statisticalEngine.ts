/**
 * Client-Side Statistical Forecasting & Walk-Forward Backtesting Engine.
 * Runs in the browser and PWA even without any backend connection.
 * Guarantees zero look-ahead data leakage.
 */

import { HistoricalBar } from '../marketData/types';

export interface StatisticalEstimate {
  sufficientData: boolean;
  message?: string;
  currentPrice: number;
  usdInrRate: number;
  currentTheoretical24k10g: number;
  currentTheoretical22k10g: number;
  currentTheoretical18k10g: number;
  sma7: number;
  sma20: number;
  sma50: number;
  dailyVolatilityPct: number;
  recentMomentumPct: number;
  trendDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  estimatedReturnPct: number;
  estimatedCentral24k10g: number;
  estimatedLow24k10g: number;
  estimatedHigh24k10g: number;
  estimatedRangeWidthInr: number;
  forecastTimestamp: string;
  modelName: string;
  evaluationMetrics?: {
    maePct: number;
    rmsePct: number;
    directionalAccuracyPct: number;
    coveragePct: number;
    backtestSamples: number;
  };
}

export interface BacktestResult {
  maePct: number;
  rmsePct: number;
  directionalAccuracyPct: number;
  coveragePct: number;
  samplesEvaluated: number;
}

const TROY_OUNCE_GRAMS = 31.1034768;

/**
 * Calculates statistical forecast for today / next trading day.
 */
export function calculateStatisticalForecast(
  history: HistoricalBar[],
  usdInrRate: number = 94.95,
  windowDays: number = 50,
  includeBacktest: boolean = false
): StatisticalEstimate {
  const minRequired = 30;

  if (!history || history.length < minRequired) {
    return {
      sufficientData: false,
      message: "Insufficient historical data to calculate a reliable estimate.",
      currentPrice: 0,
      usdInrRate,
      currentTheoretical24k10g: 0,
      currentTheoretical22k10g: 0,
      currentTheoretical18k10g: 0,
      sma7: 0,
      sma20: 0,
      sma50: 0,
      dailyVolatilityPct: 0,
      recentMomentumPct: 0,
      trendDirection: 'NEUTRAL',
      estimatedReturnPct: 0,
      estimatedCentral24k10g: 0,
      estimatedLow24k10g: 0,
      estimatedHigh24k10g: 0,
      estimatedRangeWidthInr: 0,
      forecastTimestamp: new Date().toISOString(),
      modelName: "Statistical Trend & Volatility Baseline"
    };
  }

  // Sort chronologically
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const latestBar = sorted[sorted.length - 1];
  const currentPrice = latestBar.close;

  // Theoretical conversion: (price * fx / 31.1034768) * 10
  const currentTheoretical24k10g = (currentPrice * usdInrRate / TROY_OUNCE_GRAMS) * 10;
  const currentTheoretical22k10g = currentTheoretical24k10g * (22 / 24);
  const currentTheoretical18k10g = currentTheoretical24k10g * (18 / 24);

  // Calculate daily returns for the window
  const slice = sorted.slice(-windowDays);
  const returns: number[] = [];
  for (let i = 1; i < slice.length; i++) {
    const prev = slice[i - 1].close;
    const curr = slice[i].close;
    if (prev > 0) {
      returns.push(((curr - prev) / prev) * 100);
    }
  }

  // Moving averages (strictly using past and current prices)
  const closes = sorted.map(b => b.close);
  const sma7 = calculateSMA(closes, 7);
  const sma20 = calculateSMA(closes, 20);
  const sma50 = calculateSMA(closes, 50);

  // Volatility: standard deviation of daily returns
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / (returns.length || 1);
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / (returns.length > 1 ? returns.length - 1 : 1);
  const dailyVolatilityPct = Math.sqrt(variance);

  // Recent 5-day momentum
  const p5DaysAgo = sorted[sorted.length - 6]?.close || currentPrice;
  const recentMomentumPct = ((currentPrice - p5DaysAgo) / p5DaysAgo) * 100;

  // Trend direction
  let trendDirection: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL';
  if (sma7 > sma20 && currentPrice > sma50) {
    trendDirection = 'BULLISH';
  } else if (sma7 < sma20 && currentPrice < sma50) {
    trendDirection = 'BEARISH';
  }

  // Central estimated daily return (damped momentum baseline)
  // Historical trend regression baseline: 30% of recent 5-day average daily rate
  const estimatedReturnPct = (recentMomentumPct / 5) * 0.3;

  const estimatedCentralPrice = currentPrice * (1 + estimatedReturnPct / 100);
  const estimatedCentral24k10g = (estimatedCentralPrice * usdInrRate / TROY_OUNCE_GRAMS) * 10;

  // Illustrative range based on 1.65 * daily volatility (~90% normal coverage band)
  const rangeFactor = Math.max(dailyVolatilityPct * 1.65, 0.75); // at least 0.75%
  const estimatedLowPrice = currentPrice * (1 + (estimatedReturnPct - rangeFactor) / 100);
  const estimatedHighPrice = currentPrice * (1 + (estimatedReturnPct + rangeFactor) / 100);

  const estimatedLow24k10g = (estimatedLowPrice * usdInrRate / TROY_OUNCE_GRAMS) * 10;
  const estimatedHigh24k10g = (estimatedHighPrice * usdInrRate / TROY_OUNCE_GRAMS) * 10;
  const estimatedRangeWidthInr = estimatedHigh24k10g - estimatedLow24k10g;

  // Run walk-forward backtest on historical data only when explicitly requested
  let evaluationMetrics;
  if (includeBacktest && sorted.length >= 60) {
    evaluationMetrics = runWalkForwardBacktest(sorted, Math.min(60, sorted.length - 30));
  }

  return {
    sufficientData: true,
    currentPrice,
    usdInrRate,
    currentTheoretical24k10g,
    currentTheoretical22k10g,
    currentTheoretical18k10g,
    sma7,
    sma20,
    sma50,
    dailyVolatilityPct,
    recentMomentumPct,
    trendDirection,
    estimatedReturnPct,
    estimatedCentral24k10g,
    estimatedLow24k10g,
    estimatedHigh24k10g,
    estimatedRangeWidthInr,
    forecastTimestamp: new Date().toISOString(),
    modelName: "Statistical Trend & Volatility Baseline",
    evaluationMetrics
  };
}

function calculateSMA(data: number[], period: number): number {
  if (data.length < period) return data[data.length - 1] || 0;
  const slice = data.slice(-period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return sum / period;
}

/**
 * Strict Walk-Forward Out-Of-Sample Backtester
 * Prevents lookahead data leakage by only using observations strictly prior to t to forecast t+1.
 */
export function runWalkForwardBacktest(history: HistoricalBar[], testCount: number = 60): {
  maePct: number;
  rmsePct: number;
  directionalAccuracyPct: number;
  coveragePct: number;
  backtestSamples: number;
} {
  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const total = sorted.length;
  const actualTestCount = Math.min(testCount, total - 30);
  
  if (actualTestCount <= 0) {
    return { maePct: 0, rmsePct: 0, directionalAccuracyPct: 0, coveragePct: 0, backtestSamples: 0 };
  }

  let absErrors: number[] = [];
  let sqErrors: number[] = [];
  let correctDirectionCount = 0;
  let withinRangeCount = 0;

  for (let i = total - actualTestCount; i < total - 1; i++) {
    // Observations available ONLY up to day i (no lookahead!)
    const historyUpToI = sorted.slice(0, i + 1);
    const actualTomorrow = sorted[i + 1].close;
    const currentClose = sorted[i].close;
    const actualReturnPct = ((actualTomorrow - currentClose) / currentClose) * 100;

    // Generate forecast using only historyUpToI
    const forecast = calculateStatisticalForecast(historyUpToI);
    const predictedReturnPct = forecast.estimatedReturnPct;

    const error = Math.abs(actualReturnPct - predictedReturnPct);
    absErrors.push(error);
    sqErrors.push(error * error);

    // Check direction (sign match)
    const actualDir = actualReturnPct >= 0 ? 1 : -1;
    const predDir = predictedReturnPct >= 0 ? 1 : -1;
    if (actualDir === predDir) {
      correctDirectionCount++;
    }

    // Check coverage (did actual price land in forecast range?)
    const lowPred = currentClose * (1 + (predictedReturnPct - forecast.dailyVolatilityPct * 1.65) / 100);
    const highPred = currentClose * (1 + (predictedReturnPct + forecast.dailyVolatilityPct * 1.65) / 100);
    if (actualTomorrow >= lowPred && actualTomorrow <= highPred) {
      withinRangeCount++;
    }
  }

  const n = absErrors.length || 1;
  const maePct = absErrors.reduce((a, b) => a + b, 0) / n;
  const rmsePct = Math.sqrt(sqErrors.reduce((a, b) => a + b, 0) / n);
  const directionalAccuracyPct = (correctDirectionCount / n) * 100;
  const coveragePct = (withinRangeCount / n) * 100;

  return {
    maePct,
    rmsePct,
    directionalAccuracyPct,
    coveragePct,
    backtestSamples: n
  };
}
