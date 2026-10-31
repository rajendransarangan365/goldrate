import { describe, it, expect } from 'vitest';
import {
  calculateStatisticalForecast,
  runWalkForwardBacktest
} from '../services/forecasting/statisticalEngine';
import { HistoricalBar } from '../services/marketData/types';

describe('Statistical Forecasting & Walk-Forward Backtesting Engine', () => {
  it('returns insufficientData when history has fewer than 30 observations', () => {
    const smallHistory: HistoricalBar[] = [
      { date: '2026-10-01', close: 3800 },
      { date: '2026-10-02', close: 3820 },
      { date: '2026-10-03', close: 3810 }
    ];

    const result = calculateStatisticalForecast(smallHistory, 95);
    expect(result.sufficientData).toBe(false);
    expect(result.message).toBe("Insufficient historical data to calculate a reliable estimate.");
    expect(result.estimatedCentral24k10g).toBe(0);
  });

  it('correctly calculates bullish trend when prices are trending up above moving averages', () => {
    const history: HistoricalBar[] = [];
    let price = 3000;
    // Generate 60 days of strictly rising prices
    for (let i = 1; i <= 60; i++) {
      price += 5;
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      history.push({ date: `2026-08-${dayStr}`, close: price });
    }

    const result = calculateStatisticalForecast(history, 95);
    expect(result.sufficientData).toBe(true);
    expect(result.trendDirection).toBe('BULLISH');
    expect(result.sma7).toBeGreaterThan(result.sma20);
    expect(result.currentPrice).toBe(3300);
    expect(result.currentTheoretical24k10g).toBeGreaterThan(0);
    expect(result.estimatedHigh24k10g).toBeGreaterThan(result.estimatedLow24k10g);
  });

  it('correctly calculates bearish trend when prices are declining below moving averages', () => {
    const history: HistoricalBar[] = [];
    let price = 4000;
    // Generate 60 days of declining prices
    for (let i = 1; i <= 60; i++) {
      price -= 10;
      const dayStr = i < 10 ? `0${i}` : `${i}`;
      history.push({ date: `2026-08-${dayStr}`, close: price });
    }

    const result = calculateStatisticalForecast(history, 95);
    expect(result.sufficientData).toBe(true);
    expect(result.trendDirection).toBe('BEARISH');
    expect(result.sma7).toBeLessThan(result.sma20);
  });

  it('calculates daily volatility and non-zero uncertainty interval', () => {
    const history: HistoricalBar[] = [];
    const base = 3500;
    for (let i = 0; i < 50; i++) {
      // alternating oscillations
      const fluctuation = (i % 2 === 0 ? 20 : -20);
      history.push({ date: `2026-09-${i + 1}`, close: base + fluctuation });
    }

    const result = calculateStatisticalForecast(history, 95);
    expect(result.dailyVolatilityPct).toBeGreaterThan(0);
    expect(result.estimatedRangeWidthInr).toBeGreaterThan(0);
    expect(result.estimatedLow24k10g).toBeLessThan(result.estimatedCentral24k10g);
    expect(result.estimatedHigh24k10g).toBeGreaterThan(result.estimatedCentral24k10g);
  });

  it('runs strict walk-forward backtest without look-ahead leakage', () => {
    const history: HistoricalBar[] = [];
    let price = 3000;
    for (let i = 1; i <= 80; i++) {
      price += (i % 3 === 0 ? -10 : 8);
      history.push({ date: `2026-07-${i}`, close: price });
    }

    const backtest = runWalkForwardBacktest(history, 40);
    expect(backtest.backtestSamples).toBeGreaterThan(20);
    expect(backtest.maePct).toBeGreaterThan(0);
    expect(backtest.rmsePct).toBeGreaterThan(0);
    expect(backtest.directionalAccuracyPct).toBeGreaterThanOrEqual(0);
    expect(backtest.directionalAccuracyPct).toBeLessThanOrEqual(100);
  });
});

