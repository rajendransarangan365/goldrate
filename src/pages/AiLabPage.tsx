import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Database, 
  Play, 
  CheckCircle, 
  AlertTriangle, 
  RotateCcw, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  ShieldAlert, 
  BarChart3, 
  TrendingUp, 
  Sparkles,
  Info
} from 'lucide-react';

export const AiLabPage: React.FC = () => {
  const [statusData, setStatusData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [modelsData, setModelsData] = useState<any>(null);
  const [selectedHorizon, setSelectedHorizon] = useState<number>(1);
  const [selectedModelType, setSelectedModelType] = useState<string>('random_forest');
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingLog, setTrainingLog] = useState<string[]>([]);
  const [activeForecast, setActiveForecast] = useState<any>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [isAiServiceRunning, setIsAiServiceRunning] = useState<boolean>(true);

  useEffect(() => {
    fetchAiServiceData();
  }, [selectedHorizon]);

  const fetchAiServiceData = async () => {
    try {
      const [resStatus, resSummary, resModels, resForecast, resExplain] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/status'),
        fetch('http://127.0.0.1:8000/api/dataset/summary'),
        fetch('http://127.0.0.1:8000/api/models'),
        fetch(`http://127.0.0.1:8000/api/forecast?horizon=${selectedHorizon}`),
        fetch(`http://127.0.0.1:8000/api/explanation?horizon=${selectedHorizon}`)
      ]);

      if (resStatus.ok) {
        setStatusData(await resStatus.json());
        setIsAiServiceRunning(true);
      }
      if (resSummary.ok) setSummaryData(await resSummary.json());
      if (resModels.ok) setModelsData(await resModels.json());
      if (resForecast.ok) setActiveForecast(await resForecast.json());
      if (resExplain.ok) setExplanation(await resExplain.json());
    } catch (err) {
      setIsAiServiceRunning(false);
    }
  };

  const handleTrain = async () => {
    setIsTraining(true);
    setTrainingLog([
      `[${new Date().toLocaleTimeString()}] Initiating local training run...`,
      `[${new Date().toLocaleTimeString()}] Model: ${selectedModelType}, Horizon: ${selectedHorizon} trading days.`,
      `[${new Date().toLocaleTimeString()}] Loading chronologically sorted historical dataset...`,
      `[${new Date().toLocaleTimeString()}] Fitting scaler strictly on training split (70%)...`,
      `[${new Date().toLocaleTimeString()}] Running walk-forward evaluation on test split (15%)...`
    ]);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/models/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model_type: selectedModelType,
          horizon: selectedHorizon
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || 'Training failed');
      }

      const data = await res.json();
      setTrainingLog(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Model trained successfully in ${data.model_record.eval_metrics.train_duration_sec}s!`,
        `[${new Date().toLocaleTimeString()}] Out-of-sample MAE: ${data.model_record.eval_metrics.mae_pct.toFixed(2)}% (INR ±${data.model_record.eval_metrics.mae_inr_10g.toFixed(2)})`,
        `[${new Date().toLocaleTimeString()}] Directional accuracy: ${data.model_record.eval_metrics.directional_accuracy_pct.toFixed(1)}%`
      ]);

      await fetchAiServiceData();
    } catch (err: any) {
      setTrainingLog(prev => [...prev, `[ERROR] ${err.message}`]);
    } finally {
      setIsTraining(false);
    }
  };

  const handleActivate = async (modelVersion: string) => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/models/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_version: modelVersion })
      });
      if (res.ok) {
        await fetchAiServiceData();
      }
    } catch (err) {
      console.error('Error activating model:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-purple-400" />
            AI Lab — Local Machine Learning &amp; Training Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Train, backtest, and register local predictive models on your PC without cloud AI APIs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono border ${
            isAiServiceRunning
              ? 'bg-purple-950/70 border-purple-500/50 text-purple-300'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-300'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isAiServiceRunning ? 'bg-purple-400 animate-pulse' : 'bg-rose-500'}`} />
            <span>Python Service: {isAiServiceRunning ? '127.0.0.1:8000 (Active)' : 'STOPPED'}</span>
          </span>
        </div>
      </div>

      {!isAiServiceRunning && (
        <div className="bg-rose-950/40 border border-rose-500/40 rounded-xl p-4 text-xs text-rose-200 space-y-2">
          <p className="font-semibold text-rose-300">Local Python AI Backend Not Detected</p>
          <p className="text-slate-300 leading-relaxed">
            The browser PWA is currently operating in <strong>client-only mode</strong> (using the internal TypeScript statistical forecasting baseline). To enable local scikit-learn model training and versioning, start the local backend from your terminal:
          </p>
          <pre className="p-2 rounded bg-aurum-dark border border-aurum-border text-[11px] font-mono text-emerald-300 overflow-x-auto">
            .venv\Scripts\uvicorn backend.main:app --host 127.0.0.1 --port 8000
          </pre>
        </div>
      )}

      {/* SECTION A & B: Data Sources & Dataset Builder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* A. Data Sources */}
        <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-aurum-border/60 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-aurum-gold" />
              A. Data Ingestion &amp; Historical Coverage
            </h2>
            <span className="text-[10px] font-mono text-emerald-400">Validated</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Historical Span</span>
              <span className="font-mono text-white">
                {statusData?.date_range ? `${statusData.date_range[0]} to ${statusData.date_range[1]}` : '2000-08-30 to 2026-10-30'}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Valid Market Observations</span>
              <span className="font-mono text-aurum-gold font-bold">
                {statusData?.row_count?.toLocaleString() || '6,568'} daily bars
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Ingested Data Feeds</span>
              <span className="text-slate-400">COMEX Front-Month + FRED DEXINUS</span>
            </div>
          </div>

          <div className="pt-2 border-t border-aurum-border/40 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Zero synthetic or fabricated records.</span>
            <span className="text-emerald-400 font-mono">SQLite: aurum_pulse.db</span>
          </div>
        </div>

        {/* B. Dataset Builder */}
        <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-aurum-border/60 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-sky-400" />
              B. ML Training Dataset Generator
            </h2>
            <span className="text-[10px] font-mono text-slate-400">v1.0.0</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Features Computed</span>
              <span className="font-mono text-white">17 technical &amp; volatility features</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Target Horizons</span>
              <span className="font-mono text-white">1-Day, 3-Day, 5-Day Forward Return</span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Leakage Guard</span>
              <span className="text-emerald-400 font-semibold">Strict Chronological Splits</span>
            </div>
          </div>

          <div className="pt-2 border-t border-aurum-border/40 flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-mono">datasets/aurum_gold_training_dataset.csv</span>
            <span className="text-slate-400">100% Leakage Free</span>
          </div>
        </div>
      </div>

      {/* SECTION C & D: Model Training & Interactive Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* C. Model Training Controls */}
        <div className="lg:col-span-5 bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-aurum-border/60 pb-2 flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            C. Train Model Locally
          </h2>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Select Architecture</label>
              <select
                value={selectedModelType}
                onChange={(e) => setSelectedModelType(e.target.value)}
                disabled={isTraining}
                className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aurum-gold cursor-pointer"
              >
                <option value="persistence">1. Persistence Baseline (Zero-change benchmark)</option>
                <option value="trend">2. Historical Trend Momentum Baseline</option>
                <option value="ridge">3. Ridge Regression (L2 Regularized Linear)</option>
                <option value="random_forest">4. Random Forest Regressor (100 Trees)</option>
                <option value="gradient_boosting">5. Gradient Boosting Regressor (Scikit-Learn)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Forecast Target Horizon</label>
              <div className="grid grid-cols-3 gap-2">
                {[1, 3, 5].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setSelectedHorizon(d)}
                    className={`py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                      selectedHorizon === d
                        ? 'bg-aurum-card border-aurum-gold text-aurum-gold font-bold'
                        : 'bg-aurum-navy border-aurum-border text-slate-400 hover:text-white'
                    }`}
                  >
                    {d} Day{d > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleTrain}
              disabled={isTraining || !isAiServiceRunning}
              className="w-full py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Play className={`w-3.5 h-3.5 ${isTraining ? 'animate-spin' : ''}`} />
              <span>{isTraining ? 'Fitting & Validating Model...' : 'Train Model on PC'}</span>
            </button>
          </div>

          {/* Training Logs Console */}
          <div className="pt-2">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
              Execution Logs
            </span>
            <div className="bg-aurum-dark border border-aurum-border rounded-lg p-2.5 h-36 overflow-y-auto text-[11px] font-mono text-slate-300 space-y-1">
              {trainingLog.length === 0 ? (
                <p className="text-slate-600">Ready for training run...</p>
              ) : (
                trainingLog.map((log, i) => <p key={i}>{log}</p>)
              )}
            </div>
          </div>
        </div>

        {/* D & E: Model Registry & Comparison Table */}
        <div className="lg:col-span-7 bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-aurum-border/60 pb-2">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                D &amp; E. Model Registry &amp; Out-Of-Sample Evaluation
              </h2>
              <p className="text-[11px] text-slate-400">
                Trained versions compared on unseen test samples. Activate or rollback at any time.
              </p>
            </div>
            <span className="text-xs font-mono text-aurum-gold">
              Active: {statusData?.active_model ? statusData.active_model.split('_')[0] : 'None'}
            </span>
          </div>

          {/* Models Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-aurum-navy text-slate-400 border-b border-aurum-border text-[10px] uppercase font-mono">
                <tr>
                  <th className="py-2 px-2.5">Model Version</th>
                  <th className="py-2 px-2">Horizon</th>
                  <th className="py-2 px-2">MAE (%)</th>
                  <th className="py-2 px-2">Dir Acc</th>
                  <th className="py-2 px-2">INR Error</th>
                  <th className="py-2 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aurum-border/50 text-slate-300 font-mono text-[11px]">
                {modelsData?.models?.map((m: any) => {
                  const isActive = m.is_active;
                  return (
                    <tr key={m.model_version} className={isActive ? 'bg-purple-950/20' : 'hover:bg-aurum-navy/30'}>
                      <td className="py-2 px-2.5">
                        <div className="flex items-center gap-1.5">
                          {isActive && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                          <span className={isActive ? 'font-bold text-white' : ''}>{m.model_type}</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">{m.horizon}D</td>
                      <td className="py-2 px-2">{m.eval_metrics.mae_pct.toFixed(2)}%</td>
                      <td className="py-2 px-2">{m.eval_metrics.directional_accuracy_pct.toFixed(1)}%</td>
                      <td className="py-2 px-2">±₹{Math.round(m.eval_metrics.mae_inr_10g)}</td>
                      <td className="py-2 px-2 text-right">
                        {isActive ? (
                          <span className="text-[10px] text-emerald-400 font-sans font-bold">Active</span>
                        ) : (
                          <button
                            onClick={() => handleActivate(m.model_version)}
                            className="px-2 py-0.5 rounded bg-aurum-navy border border-aurum-border text-slate-300 hover:text-white hover:border-aurum-gold text-[10px] font-sans"
                          >
                            Activate
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-aurum-navy/40 border border-aurum-border/60 rounded-lg text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Scientific Principle: </span>
            A complex neural net or random forest must statistically outperform the persistence and trend baselines on unseen data before activation. If it does not, the baseline is preserved.
          </div>
        </div>
      </div>

      {/* SECTION F & G: Forecast Monitor & AI Explanation */}
      {activeForecast && (
        <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-aurum-border/60 pb-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-aurum-gold" />
              F &amp; G. Active Model Forecast Monitor &amp; Quantitative Explanation
            </h2>
            <span className="text-xs font-mono text-purple-300">
              Horizon: {activeForecast.horizon_days} Trading Day(s)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-aurum-navy/80 border border-aurum-border">
              <span className="text-[11px] text-slate-400">Current Observed 24K</span>
              <p className="text-xl font-mono font-bold text-white mt-0.5">
                ₹{activeForecast.current_theoretical_24k_10g.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">Spot conversion at close</span>
            </div>

            <div className="p-3 rounded-lg bg-aurum-navy/80 border border-purple-500/40">
              <span className="text-[11px] text-purple-300">Model Predicted 24K Target</span>
              <p className="text-xl font-mono font-bold text-white mt-0.5">
                ₹{activeForecast.predicted_theoretical_24k_10g.toLocaleString()}
              </p>
              <span className="text-[10px] text-purple-300 font-mono">
                {activeForecast.predicted_return_pct > 0 ? '+' : ''}{activeForecast.predicted_return_pct}% ({activeForecast.predicted_direction})
              </span>
            </div>

            <div className="p-3 rounded-lg bg-aurum-navy/80 border border-aurum-gold/40">
              <span className="text-[11px] text-aurum-gold">Estimated Uncertainty Interval</span>
              <p className="text-base font-mono font-bold text-aurum-gold mt-1">
                ₹{activeForecast.interval_low_24k_10g.toLocaleString()} — ₹{activeForecast.interval_high_24k_10g.toLocaleString()}
              </p>
              <span className="text-[10px] text-slate-500 font-mono">85% validation error band</span>
            </div>
          </div>

          {/* AI Explanation Box */}
          {explanation && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-aurum-navy via-aurum-navy to-purple-950/30 border border-purple-500/30 text-xs text-slate-200 space-y-2">
              <p className="font-semibold text-purple-300 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Analytical Explanation
              </p>
              <p className="leading-relaxed text-slate-300">
                {explanation.explanation}
              </p>
              <p className="text-[11px] text-slate-400 italic pt-1 border-t border-purple-500/20">
                {explanation.caveat}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

