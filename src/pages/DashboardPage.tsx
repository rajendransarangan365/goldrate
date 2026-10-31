import React, { useEffect, useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { MetricCard } from '../components/cards/MetricCard';
import { SimpleLineChart, ChartDataPoint } from '../components/charts/SimpleLineChart';
import { getHistoricalBars } from '../storage/database';
import { calculateStatisticalForecast, StatisticalEstimate } from '../services/forecasting/statisticalEngine';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Clock, 
  ArrowRight, 
  Calculator, 
  MessageSquare, 
  Cpu, 
  AlertCircle 
} from 'lucide-react';

interface Props {
  setActiveTab: (tab: string) => void;
}

export const DashboardPage: React.FC<Props> = ({ setActiveTab }) => {
  const { snapshot, status, isCached, isLive } = useMarketData();
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [estimate, setEstimate] = useState<StatisticalEstimate | null>(null);

  useEffect(() => {
    async function loadHistory() {
      const bars = await getHistoricalBars(60);
      if (bars.length > 0) {
        setChartData(bars.map(b => ({
          date: b.date,
          value: b.close
        })));
        const usdInr = snapshot?.usdInrRate.value || 94.95;
        const est = calculateStatisticalForecast(bars, usdInr);
        setEstimate(est);
      }
    }
    loadHistory();
  }, [snapshot]);

  return (
    <div className="space-y-6">
      {/* Offline / Cached Warning Banner (if cached data is displayed) */}
      {isCached && (
        <div className="bg-blue-950/40 border border-blue-500/40 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-200">
          <Clock className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-blue-300">Displaying Cached Offline Prices</p>
            <p className="text-slate-300 mt-0.5">
              Live market feed is currently offline or unreachable. Prices reflect your last successful synchronization on{' '}
              <span className="font-mono">{snapshot?.lastSuccessfulFetch ? new Date(snapshot.lastSuccessfulFetch).toLocaleString() : 'N/A'}</span>.
            </p>
          </div>
        </div>
      )}

      {/* Hero Pulse Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* International Gold XAU/USD */}
        <MetricCard
          title="XAU/USD (Spot Gold)"
          value={snapshot?.goldUsdPerOz.value || 0}
          currencyPrefix="$"
          unitLabel="per oz"
          changePct={snapshot?.changePct}
          changeValue={snapshot?.changeUsd}
          freshness={snapshot?.goldUsdPerOz.freshness || 'UNAVAILABLE'}
          observationType="ACTUAL_MARKET"
          observedAt={snapshot?.goldUsdPerOz.observedAt}
          sourceText={snapshot?.goldUsdPerOz.source}
          subtitle="International spot benchmark"
        />

        {/* Currency Rate USD/INR */}
        <MetricCard
          title="USD / INR Exchange"
          value={snapshot?.usdInrRate.value || 0}
          currencyPrefix="₹"
          unitLabel="per USD"
          freshness={snapshot?.usdInrRate.freshness || 'UNAVAILABLE'}
          observationType="ACTUAL_MARKET"
          observedAt={snapshot?.usdInrRate.observedAt}
          sourceText={snapshot?.usdInrRate.source}
          subtitle="Reference currency conversion"
        />

        {/* Theoretical 24K INR per 10g (Primary Highlight) */}
        <MetricCard
          title="Theoretical 24K Gold"
          value={snapshot?.theoretical24kInr10g.value || 0}
          currencyPrefix="₹"
          unitLabel="per 10g"
          freshness={snapshot?.theoretical24kInr10g.freshness || 'UNAVAILABLE'}
          observationType="CALCULATED"
          sourceText="(XAU/USD * USD/INR / 31.1034768) * 10"
          subtitle="Theoretical spot conversion"
          highlight={true}
        />

        {/* Theoretical 22K (Standard Hallmark Purity in India) */}
        <MetricCard
          title="Theoretical 22K Gold"
          value={snapshot?.theoretical22kInr10g.value || 0}
          currencyPrefix="₹"
          unitLabel="per 10g"
          freshness={snapshot?.theoretical22kInr10g.freshness || 'UNAVAILABLE'}
          observationType="CALCULATED"
          sourceText="Theoretical 24K * 22/24"
          subtitle="91.6% Hallmark benchmark"
        />
      </div>

      {/* Secondary Highlights Row: 18K & Today's Statistical Projection */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Theoretical 18K */}
        <MetricCard
          title="Theoretical 18K Gold"
          value={snapshot?.theoretical18kInr10g.value || 0}
          currencyPrefix="₹"
          unitLabel="per 10g"
          freshness={snapshot?.theoretical18kInr10g.freshness || 'UNAVAILABLE'}
          observationType="CALCULATED"
          sourceText="Theoretical 24K * 18/24"
          subtitle="75.0% Diamond jewellery grade"
        />

        {/* Statistical Estimation Card */}
        <div className="lg:col-span-2 bg-aurum-card/70 border border-aurum-border rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Today's Statistical Estimate
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-950/70 border border-purple-500/40 text-purple-300">
                Quantitative Baseline
              </span>
            </div>

            {estimate?.sufficientData ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-2">
                <div>
                  <p className="text-[11px] text-slate-400">Central 24K Target</p>
                  <p className="text-xl font-mono font-bold text-white mt-0.5">
                    ₹{Math.round(estimate.estimatedCentral24k10g).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Est. move: {estimate.estimatedReturnPct > 0 ? '+' : ''}{estimate.estimatedReturnPct.toFixed(2)}%
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">Expected Range (90%)</p>
                  <p className="text-sm font-mono font-semibold text-aurum-gold mt-1">
                    ₹{Math.round(estimate.estimatedLow24k10g).toLocaleString()} — ₹{Math.round(estimate.estimatedHigh24k10g).toLocaleString()}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Spread: ±₹{Math.round(estimate.estimatedRangeWidthInr / 2).toLocaleString()}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] text-slate-400">Trend &amp; Volatility</p>
                  <div className="flex items-center gap-1.5 mt-1 font-semibold text-xs">
                    {estimate.trendDirection === 'BULLISH' && <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
                    {estimate.trendDirection === 'BEARISH' && <TrendingDown className="w-3.5 h-3.5 text-rose-400" />}
                    <span className={estimate.trendDirection === 'BULLISH' ? 'text-emerald-400' : 'text-slate-300'}>
                      {estimate.trendDirection}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Daily Vol: {estimate.dailyVolatilityPct.toFixed(2)}%
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-300 py-3">
                {estimate?.message || "Insufficient historical data to calculate a reliable estimate."}
              </p>
            )}
          </div>

          <div className="pt-2 mt-2 border-t border-aurum-border/60 flex items-center justify-between text-[11px] text-slate-400">
            <span>Historical correlation baseline. Not guaranteed future performance.</span>
            <button
              onClick={() => setActiveTab('forecast')}
              className="text-aurum-gold hover:underline flex items-center gap-1 text-xs font-medium"
            >
              Full Forecast Analysis <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Historical Trend Chart */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
            60-Day International Gold Spot Trajectory (USD/oz)
          </h2>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs text-aurum-gold hover:underline flex items-center gap-1"
          >
            Interactive Chart <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <SimpleLineChart
          data={chartData}
          title="XAU/USD Daily Close"
          valuePrefix="$"
          primaryLabel="Spot Close"
          height={220}
        />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <button
          onClick={() => setActiveTab('calculator')}
          className="bg-aurum-card/60 hover:bg-aurum-card border border-aurum-border rounded-xl p-4 text-left transition-all group"
        >
          <div className="flex items-center justify-between">
            <Calculator className="w-5 h-5 text-aurum-gold" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-aurum-gold transition-colors" />
          </div>
          <h4 className="font-semibold text-white text-sm mt-3">Gold Purchase Calculator</h4>
          <p className="text-xs text-slate-400 mt-1">Compute exact jewellery costs with custom purity, making charges, and 3% GST.</p>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className="bg-aurum-card/60 hover:bg-aurum-card border border-aurum-border rounded-xl p-4 text-left transition-all group"
        >
          <div className="flex items-center justify-between">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
          </div>
          <h4 className="font-semibold text-white text-sm mt-3">WhatsApp Rate Importer</h4>
          <p className="text-xs text-slate-400 mt-1">Paste daily market messages to parse Chennai, Madurai, and Kerala local quotations.</p>
        </button>

        <button
          onClick={() => setActiveTab('ailab')}
          className="bg-aurum-card/60 hover:bg-aurum-card border border-aurum-border rounded-xl p-4 text-left transition-all group"
        >
          <div className="flex items-center justify-between">
            <Cpu className="w-5 h-5 text-purple-400" />
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 transition-colors" />
          </div>
          <h4 className="font-semibold text-white text-sm mt-3">Local AI Lab</h4>
          <p className="text-xs text-slate-400 mt-1">Train machine learning models locally on 26 years of historical data without cloud AI APIs.</p>
        </button>
      </div>
    </div>
  );
};

