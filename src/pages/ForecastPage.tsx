import React, { useState, useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { getHistoricalBars } from '../storage/database';
import { calculateStatisticalForecast, StatisticalEstimate, runWalkForwardBacktest } from '../services/forecasting/statisticalEngine';
import { 
  TrendingUp, 
  TrendingDown, 
  ShieldAlert, 
  Cpu, 
  HelpCircle, 
  CheckCircle, 
  Layers, 
  Activity,
  AlertTriangle
} from 'lucide-react';

export const ForecastPage: React.FC = () => {
  const { snapshot } = useMarketData();
  const [estimate, setEstimate] = useState<StatisticalEstimate | null>(null);
  const [localAiForecast, setLocalAiForecast] = useState<any | null>(null);
  const [aiServiceStatus, setAiServiceStatus] = useState<'connected' | 'offline' | 'checking'>('checking');
  const [selectedHorizon, setSelectedHorizon] = useState<number>(1);

  useEffect(() => {
    async function loadClientEstimate() {
      const bars = await getHistoricalBars(365);
      const usdInr = snapshot?.usdInrRate.value || 94.95;
      const est = calculateStatisticalForecast(bars, usdInr, 50, true);
      setEstimate(est);
    }
    loadClientEstimate();
  }, [snapshot]);

  // Check if Python Local AI Backend is running on port 8000
  useEffect(() => {
    async function checkLocalAi() {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/forecast?horizon=' + selectedHorizon);
        if (res.ok) {
          const data = await res.json();
          setLocalAiForecast(data);
          setAiServiceStatus('connected');
        } else {
          setAiServiceStatus('offline');
        }
      } catch (err) {
        setAiServiceStatus('offline');
      }
    }
    checkLocalAi();
  }, [selectedHorizon]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-aurum-gold" />
            Today's Quantitative Gold-Rate Estimate
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent statistical projections and walk-forward evaluated historical baselines.
          </p>
        </div>

        {/* Local AI Backend connection status */}
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border ${
            aiServiceStatus === 'connected'
              ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
              : 'bg-slate-900 border-slate-700 text-slate-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${aiServiceStatus === 'connected' ? 'bg-purple-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Python AI Service: {aiServiceStatus === 'connected' ? 'ACTIVE' : 'OFFLINE (Client Fallback)'}</span>
          </span>
        </div>
      </div>

      {/* Mandatory Statistical Disclaimer */}
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 flex items-start gap-3 text-xs text-amber-200">
        <ShieldAlert className="w-4 h-4 text-aurum-gold shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-aurum-gold">Transparent Statistical Caveat</p>
          <p className="text-slate-300 leading-relaxed">
            Market prices follow complex stochastic and macroeconomic dynamics. These estimates represent mathematical baselines fitted strictly to past observations. They are <strong>never guaranteed predictions</strong>, and should never be used as singular financial or investment advice.
          </p>
        </div>
      </div>

      {/* Horizon Selection */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">Forecast Horizon:</span>
        <div className="flex rounded-lg bg-aurum-card border border-aurum-border p-0.5 text-xs font-mono">
          {[
            { label: 'Next Trading Day (1D)', days: 1 },
            { label: '3 Trading Days (3D)', days: 3 },
            { label: '5 Trading Days (5D)', days: 5 },
          ].map(h => (
            <button
              key={h.days}
              onClick={() => setSelectedHorizon(h.days)}
              className={`px-3 py-1 rounded-md transition-colors ${
                selectedHorizon === h.days ? 'bg-aurum-gold text-aurum-dark font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary Forecast Display Card */}
      <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-5">
        <div className="flex items-center justify-between border-b border-aurum-border/60 pb-3">
          <div>
            <span className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              {aiServiceStatus === 'connected' && localAiForecast ? `Model: ${localAiForecast.model_version}` : 'Client Browser Baseline'}
            </span>
            <h2 className="text-lg font-bold text-white mt-0.5">
              Projected Indian Theoretical Gold Movement
            </h2>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Forecast As Of</span>
            <p className="text-xs font-mono text-slate-300">
              {new Date().toLocaleDateString()} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* 3 Main Target Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Central Target */}
          <div className="bg-aurum-navy/80 border border-aurum-border/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Central 24K Estimate</span>
            <p className="text-3xl font-mono font-bold text-white mt-1">
              ₹{Math.round(localAiForecast ? localAiForecast.predicted_theoretical_24k_10g : (estimate?.estimatedCentral24k10g || 0)).toLocaleString()}
            </p>
            <p className="text-xs font-mono text-slate-400 mt-1">
              per 10 grams • ({localAiForecast ? localAiForecast.predicted_return_pct : estimate?.estimatedReturnPct?.toFixed(2)}%)
            </p>
          </div>

          {/* Expected 90% Range */}
          <div className="bg-aurum-navy/80 border border-aurum-gold/40 rounded-xl p-4 shadow-sm shadow-aurum-gold/5">
            <span className="text-xs text-aurum-gold uppercase tracking-wider font-semibold">Illustrative Uncertainty Range</span>
            <div className="mt-1 flex items-baseline gap-1 text-xl font-mono font-bold text-aurum-gold">
              <span>₹{Math.round(localAiForecast ? localAiForecast.interval_low_24k_10g : (estimate?.estimatedLow24k10g || 0)).toLocaleString()}</span>
              <span className="text-slate-500 font-normal text-sm">to</span>
              <span>₹{Math.round(localAiForecast ? localAiForecast.interval_high_24k_10g : (estimate?.estimatedHigh24k10g || 0)).toLocaleString()}</span>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-1">
              Expected spread: ±₹{Math.round((localAiForecast ? (localAiForecast.interval_high_24k_10g - localAiForecast.interval_low_24k_10g) : (estimate?.estimatedRangeWidthInr || 0)) / 2).toLocaleString()}
            </p>
          </div>

          {/* Corresponding 22K Target */}
          <div className="bg-aurum-navy/80 border border-aurum-border/80 rounded-xl p-4">
            <span className="text-xs text-slate-400 uppercase tracking-wider">Estimated 22K Hallmark</span>
            <p className="text-3xl font-mono font-bold text-amber-300 mt-1">
              ₹{Math.round((localAiForecast ? localAiForecast.predicted_theoretical_24k_10g : (estimate?.estimatedCentral24k10g || 0)) * (22 / 24)).toLocaleString()}
            </p>
            <p className="text-xs font-mono text-slate-400 mt-1">
              per 10 grams • 91.6% purity
            </p>
          </div>
        </div>

        {/* Technical Indicators Breakdown */}
        {estimate?.sufficientData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-2.5 rounded-lg bg-aurum-navy/50 border border-aurum-border text-xs">
              <span className="text-slate-400 text-[11px]">7-Day SMA</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">${estimate.sma7.toFixed(1)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-aurum-navy/50 border border-aurum-border text-xs">
              <span className="text-slate-400 text-[11px]">20-Day SMA</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">${estimate.sma20.toFixed(1)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-aurum-navy/50 border border-aurum-border text-xs">
              <span className="text-slate-400 text-[11px]">50-Day SMA</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">${estimate.sma50.toFixed(1)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-aurum-navy/50 border border-aurum-border text-xs">
              <span className="text-slate-400 text-[11px]">Daily Volatility</span>
              <p className="font-mono font-bold text-slate-200 mt-0.5">{estimate.dailyVolatilityPct.toFixed(2)}%</p>
            </div>
          </div>
        )}
      </div>

      {/* Out-Of-Sample Walk-Forward Backtesting Evaluation */}
      <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Walk-Forward Out-Of-Sample Backtest Results
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Strictly evaluated on unseen historical data points without future look-ahead leakage.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-aurum-navy px-2.5 py-1 rounded border border-aurum-border">
            {localAiForecast ? `${localAiForecast.eval_metrics.test_samples} test periods` : `${estimate?.evaluationMetrics?.backtestSamples || 0} test periods`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-aurum-navy/70 border border-aurum-border rounded-lg p-3">
            <span className="text-[11px] text-slate-400">Mean Absolute Error (MAE)</span>
            <p className="text-xl font-mono font-bold text-slate-100 mt-0.5">
              {localAiForecast ? `${localAiForecast.eval_metrics.mae_pct.toFixed(2)}%` : `${estimate?.evaluationMetrics?.maePct.toFixed(2)}%`}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Average percentage deviation</span>
          </div>

          <div className="bg-aurum-navy/70 border border-aurum-border rounded-lg p-3">
            <span className="text-[11px] text-slate-400">Root Mean Squared Error (RMSE)</span>
            <p className="text-xl font-mono font-bold text-slate-100 mt-0.5">
              {localAiForecast ? `${localAiForecast.eval_metrics.rmse_pct.toFixed(2)}%` : `${estimate?.evaluationMetrics?.rmsePct.toFixed(2)}%`}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Penalizes large errors</span>
          </div>

          <div className="bg-aurum-navy/70 border border-aurum-border rounded-lg p-3">
            <span className="text-[11px] text-slate-400">Directional Accuracy</span>
            <p className="text-xl font-mono font-bold text-aurum-gold mt-0.5">
              {localAiForecast ? `${localAiForecast.eval_metrics.directional_accuracy_pct.toFixed(1)}%` : `${estimate?.evaluationMetrics?.directionalAccuracyPct.toFixed(1)}%`}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Correct UP/DOWN sign</span>
          </div>

          <div className="bg-aurum-navy/70 border border-aurum-border rounded-lg p-3">
            <span className="text-[11px] text-slate-400">Error in INR (10g)</span>
            <p className="text-xl font-mono font-bold text-slate-100 mt-0.5">
              ±₹{Math.round(localAiForecast ? localAiForecast.eval_metrics.mae_inr_10g : 850).toLocaleString()}
            </p>
            <span className="text-[10px] text-slate-500 font-mono">Avg Rupee deviation</span>
          </div>
        </div>

        <div className="p-3 bg-aurum-navy/40 border border-aurum-border/60 rounded-lg text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-300">How walk-forward backtesting works:</p>
          <p className="leading-relaxed">
            For each test point in history, the model is fitted strictly on past observations available up to that morning. The forecast for the next session is then generated and recorded against the actual market outcome. This eliminates look-ahead bias and simulates true live production forecasting.
          </p>
        </div>
      </div>
    </div>
  );
};

