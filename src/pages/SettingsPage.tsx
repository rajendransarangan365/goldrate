import React, { useState, useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { clearAllLocalData } from '../storage/database';
import { 
  Settings, 
  Trash2, 
  Shield, 
  Smartphone, 
  Sliders, 
  RefreshCw, 
  Check, 
  Download,
  AlertTriangle
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { status, setProvider, refresh } = useMarketData();
  const [premiumPct, setPremiumPct] = useState<number>(() => {
    return parseFloat(localStorage.getItem('aurum_premium_pct') || '0');
  });
  const [fixedPremium, setFixedPremium] = useState<number>(() => {
    return parseFloat(localStorage.getItem('aurum_fixed_premium') || '0');
  });
  const [refreshInterval, setRefreshInterval] = useState<number>(() => {
    return parseInt(localStorage.getItem('aurum_refresh_interval') || '60000', 10);
  });
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [clearSuccess, setClearSuccess] = useState<boolean>(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('aurum_premium_pct', premiumPct.toString());
    localStorage.setItem('aurum_fixed_premium', fixedPremium.toString());
    localStorage.setItem('aurum_refresh_interval', refreshInterval.toString());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
    refresh();
  };

  const handleClearData = async () => {
    if (window.confirm("Are you sure you want to clear all locally cached snapshots, WhatsApp imports, and alerts? This cannot be undone.")) {
      await clearAllLocalData();
      setClearSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-aurum-gold" />
          Settings &amp; Application Configuration
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage local calculation adjustments, refresh intervals, PWA installation, and privacy storage.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Calculation & Refresh Settings */}
        <div className="lg:col-span-7 bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-aurum-border/60 pb-2">
            Pricing &amp; Sync Preferences
          </h2>

          <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
            {/* Provider Switcher */}
            <div>
              <label className="text-slate-300 font-semibold block mb-1">Active Market Data Provider</label>
              <select
                value={status.activeProvider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-aurum-gold cursor-pointer"
              >
                <option value="corgano">Corgano Gold Price API (Free CC BY 4.0 - Recommended)</option>
                <option value="goldprice_dev">goldprice.dev (Free Anonymous Tier)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Both providers permit direct browser CORS fetch without backend proxies.
              </p>
            </div>

            {/* Custom Theoretical Adjustment */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">Custom Markup / Premium (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    value={premiumPct}
                    onChange={(e) => setPremiumPct(parseFloat(e.target.value) || 0)}
                    className="w-full bg-aurum-navy border border-aurum-border rounded-lg pl-3 pr-7 py-2 text-white font-mono focus:outline-none focus:border-aurum-gold"
                  />
                  <span className="absolute right-2.5 top-2 text-slate-500 font-mono">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">e.g. +2.5% for local bullion duty</p>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Fixed Adjustment (₹/10g)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-500 font-mono">₹</span>
                  <input
                    type="number"
                    step="50"
                    value={fixedPremium}
                    onChange={(e) => setFixedPremium(parseFloat(e.target.value) || 0)}
                    className="w-full bg-aurum-navy border border-aurum-border rounded-lg pl-7 pr-3 py-2 text-white font-mono focus:outline-none focus:border-aurum-gold"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">Fixed Rupee offset per 10 grams</p>
              </div>
            </div>

            {/* Refresh Interval */}
            <div className="pt-2">
              <label className="text-slate-300 font-semibold block mb-1">Automatic Background Refresh</label>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(parseInt(e.target.value, 10))}
                className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-aurum-gold cursor-pointer"
              >
                <option value="30000">Every 30 Seconds (Fast)</option>
                <option value="60000">Every 60 Seconds (Recommended)</option>
                <option value="120000">Every 2 Minutes (Quota Friendly)</option>
                <option value="0">Manual Refresh Only</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-aurum-border/60">
              {savedSuccess ? (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Preferences saved!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-aurum-gold text-aurum-dark font-bold text-xs hover:bg-amber-300 transition-colors shadow-sm"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Android PWA & Privacy */}
        <div className="lg:col-span-5 space-y-4">
          {/* PWA Installation Card */}
          <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-aurum-gold" />
              Android PWA Installation
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              AURUM PULSE is configured as a standalone Progressive Web App. You can install it on any Android device without Google Play Store:
            </p>
            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-1.5 font-sans pl-1">
              <li>Open this web address in <strong>Chrome on Android</strong>.</li>
              <li>Tap the three dots (<strong>⋮</strong>) menu icon in the top right.</li>
              <li>Select <strong>"Add to Home screen"</strong> or <strong>"Install app"</strong>.</li>
              <li>The app will launch in full-screen standalone mode with offline shell caching.</li>
            </ol>
          </div>

          {/* Privacy & Clear Data */}
          <div className="bg-aurum-card/70 border border-rose-500/30 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-rose-400" />
              Privacy &amp; Local Storage Management
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              All market observations, WhatsApp messages, and price alerts reside strictly in your local device storage. No user accounts or third-party advertising cookies are used.
            </p>
            {clearSuccess ? (
              <p className="text-xs text-emerald-400 font-medium">Local database erased. Reloading...</p>
            ) : (
              <button
                type="button"
                onClick={handleClearData}
                className="w-full py-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 hover:bg-rose-900 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All Local Data &amp; Cache
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

