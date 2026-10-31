import React, { useState, useEffect } from 'react';
import { getHistoricalBars } from '../storage/database';
import { HistoricalBar } from '../services/marketData/types';
import { SimpleLineChart, ChartDataPoint } from '../components/charts/SimpleLineChart';
import { useMarketData } from '../hooks/useMarketData';
import { LineChart, Calendar, TrendingUp, TrendingDown, ArrowUpDown } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { snapshot } = useMarketData();
  const [history, setHistory] = useState<HistoricalBar[]>([]);
  const [rangeDays, setRangeDays] = useState<number>(90);
  const [currencyMode, setCurrencyMode] = useState<'USD' | 'INR'>('USD');
  const [showSma, setShowSma] = useState<boolean>(true);

  useEffect(() => {
    async function fetchHistoricalData() {
      // Fetch up to 2000 bars from IndexedDB
      const bars = await getHistoricalBars(2000);
      setHistory(bars);
    }
    fetchHistoricalData();
  }, []);

  const usdInr = snapshot?.usdInrRate.value || 94.95;
  const TROY_OUNCE_GRAMS = 31.1034768;

  // Filter by selected range
  const filteredBars = history.slice(-rangeDays);

  // Compute Simple Moving Average (20-day)
  const computeSMA = (data: number[], period: number = 20) => {
    return data.map((_, idx) => {
      if (idx < period - 1) return undefined;
      const slice = data.slice(idx - period + 1, idx + 1);
      return slice.reduce((a, b) => a + b, 0) / period;
    });
  };

  const rawValues = filteredBars.map(b => {
    if (currencyMode === 'INR') {
      return (b.close * usdInr / TROY_OUNCE_GRAMS) * 10;
    }
    return b.close;
  });

  const smaValues = showSma ? computeSMA(rawValues, 20) : [];

  const chartData: ChartDataPoint[] = filteredBars.map((b, idx) => ({
    date: b.date,
    value: rawValues[idx],
    secondaryValue: smaValues[idx]
  }));

  // Statistics
  const firstVal = rawValues[0] || 0;
  const lastVal = rawValues[rawValues.length - 1] || 0;
  const periodReturnPct = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;
  const periodHigh = rawValues.length > 0 ? Math.max(...rawValues) : 0;
  const periodLow = rawValues.length > 0 ? Math.min(...rawValues) : 0;

  return (
    <div className="space-y-6">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <LineChart className="w-5 h-5 text-aurum-gold" />
            Historical Price Charts &amp; Trends
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified daily closing observations stored locally in your browser IndexedDB.
          </p>
        </div>

        {/* Currency & Range Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Currency Toggle */}
          <div className="flex rounded-lg bg-aurum-card border border-aurum-border p-0.5 text-xs">
            <button
              onClick={() => setCurrencyMode('USD')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currencyMode === 'USD' ? 'bg-aurum-gold text-aurum-dark font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              USD / oz
            </button>
            <button
              onClick={() => setCurrencyMode('INR')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                currencyMode === 'INR' ? 'bg-aurum-gold text-aurum-dark font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              INR / 10g
            </button>
          </div>

          {/* Time Horizon Pills */}
          <div className="flex rounded-lg bg-aurum-card border border-aurum-border p-0.5 text-xs font-mono">
            {[
              { label: '1M', days: 30 },
              { label: '3M', days: 90 },
              { label: '6M', days: 180 },
              { label: '1Y', days: 365 },
              { label: '5Y', days: 1825 },
            ].map(item => (
              <button
                key={item.label}
                onClick={() => setRangeDays(item.days)}
                className={`px-2 py-1 rounded-md transition-colors ${
                  rangeDays === item.days ? 'bg-aurum-navy text-aurum-gold border border-aurum-border' : 'text-slate-400 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* SMA Toggle */}
          <button
            onClick={() => setShowSma(!showSma)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono transition-colors ${
              showSma ? 'border-sky-500/50 text-sky-400 bg-sky-950/30' : 'border-aurum-border text-slate-400'
            }`}
          >
            SMA 20
          </button>
        </div>
      </div>

      {/* Period Statistics Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400">Period Return</span>
          <div className={`flex items-center gap-1 font-mono font-bold text-lg mt-0.5 ${
            periodReturnPct >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {periodReturnPct >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span>{periodReturnPct >= 0 ? '+' : ''}{periodReturnPct.toFixed(2)}%</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Past {rangeDays} days</span>
        </div>

        <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400">Period High</span>
          <p className="font-mono font-bold text-lg text-white mt-0.5">
            {currencyMode === 'USD' ? '$' : '₹'}{Math.round(periodHigh).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">Peak close</span>
        </div>

        <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400">Period Low</span>
          <p className="font-mono font-bold text-lg text-white mt-0.5">
            {currencyMode === 'USD' ? '$' : '₹'}{Math.round(periodLow).toLocaleString()}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">Trough close</span>
        </div>

        <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-3">
          <span className="text-[11px] text-slate-400">Observations</span>
          <p className="font-mono font-bold text-lg text-aurum-gold mt-0.5">
            {filteredBars.length}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">Trading days recorded</span>
        </div>
      </div>

      {/* Main Interactive Chart */}
      <SimpleLineChart
        data={chartData}
        title={currencyMode === 'USD' ? "XAU/USD Spot Gold (Daily Close)" : "Theoretical 24K Gold (INR per 10g)"}
        valuePrefix={currencyMode === 'USD' ? '$' : '₹'}
        primaryLabel={currencyMode === 'USD' ? 'Spot USD' : 'Theoretical INR'}
        secondaryLabel={showSma ? '20-Day SMA' : undefined}
        height={320}
      />
    </div>
  );
};

