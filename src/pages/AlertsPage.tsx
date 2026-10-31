import React, { useState, useEffect } from 'react';
import { getAllPriceAlerts, savePriceAlert, deletePriceAlert, PriceAlert } from '../storage/database';
import { useMarketData } from '../hooks/useMarketData';
import { Bell, Plus, Trash2, CheckCircle, ShieldAlert, AlertTriangle } from 'lucide-react';

export const AlertsPage: React.FC = () => {
  const { snapshot } = useMarketData();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [instrument, setInstrument] = useState<string>('GOLD_INR_24K_10G');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW' | 'DAILY_MOVE_PCT'>('ABOVE');
  const [targetPrice, setTargetPrice] = useState<number>(120000);
  const [label, setLabel] = useState<string>('Target Alert');
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    loadAlerts();
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const loadAlerts = async () => {
    const list = await getAllPriceAlerts();
    setAlerts(list);
  };

  const requestPermission = async () => {
    if ('Notification' in window) {
      const res = await Notification.requestPermission();
      setPermission(res);
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPrice || targetPrice <= 0) return;

    const newAlert: PriceAlert = {
      id: `alert-${Date.now()}`,
      instrument,
      condition,
      targetPrice,
      label: label.trim() || `${instrument} ${condition} ${targetPrice}`,
      active: true,
      createdAt: new Date().toISOString()
    };

    await savePriceAlert(newAlert);
    await loadAlerts();
  };

  const handleDelete = async (id: string) => {
    await deletePriceAlert(id);
    await loadAlerts();
  };

  // Check alert triggers against current snapshot
  const current24k = snapshot?.theoretical24kInr10g.value || 0;
  const currentXau = snapshot?.goldUsdPerOz.value || 0;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-aurum-gold" />
            Price Alerts &amp; Target Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure price threshold alerts and daily volatility notifications.
          </p>
        </div>

        {permission !== 'granted' && (
          <button
            onClick={requestPermission}
            className="px-3.5 py-1.5 rounded-lg bg-aurum-gold text-aurum-dark font-semibold text-xs hover:bg-amber-300 transition-colors self-start sm:self-auto"
          >
            Enable Browser Notifications
          </button>
        )}
      </div>

      {/* Honest Limitations Notice */}
      <div className="bg-aurum-card/40 border border-aurum-border rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-3">
        <ShieldAlert className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Browser &amp; PWA Execution Architecture</p>
          <p className="text-slate-400 leading-relaxed">
            Standard web browsers (Chrome, Edge, Android Chrome) intentionally restrict continuous background timer execution when the application tab is completely closed to preserve device battery life. Threshold checks execute instantaneously upon opening or during active background sync.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Create Alert Form */}
        <div className="lg:col-span-5 bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-aurum-border/60 pb-2">
            Add New Target Alert
          </h2>

          <form onSubmit={handleAddAlert} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Target Instrument</label>
              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aurum-gold cursor-pointer"
              >
                <option value="GOLD_INR_24K_10G">Theoretical 24K Gold (INR / 10g)</option>
                <option value="GOLD_INR_22K_10G">Theoretical 22K Gold (INR / 10g)</option>
                <option value="XAU_USD">International Spot Gold (USD / oz)</option>
                <option value="DAILY_MOVE_PCT">Daily Move Percentage (%)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as any)}
                  className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aurum-gold cursor-pointer"
                >
                  <option value="ABOVE">Rises Above (&gt;=)</option>
                  <option value="BELOW">Falls Below (&lt;=)</option>
                  <option value="DAILY_MOVE_PCT">Daily % Change</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Target Threshold</label>
                <input
                  type="number"
                  required
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-aurum-gold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Alert Label / Description</label>
              <input
                type="text"
                placeholder="e.g. Buying target, Sell profit threshold"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aurum-gold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-aurum-gold text-aurum-dark font-bold text-xs hover:bg-amber-300 transition-colors shadow-sm"
            >
              Create Price Alert
            </button>
          </form>
        </div>

        {/* Existing Alerts */}
        <div className="lg:col-span-7 bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-aurum-border/60 pb-2">
            Active Watchlist Alerts ({alerts.length})
          </h2>

          {alerts.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No alerts configured yet.</p>
          ) : (
            <div className="space-y-2.5">
              {alerts.map((a) => {
                const isTriggered = 
                  (a.instrument === 'GOLD_INR_24K_10G' && a.condition === 'ABOVE' && current24k >= a.targetPrice) ||
                  (a.instrument === 'GOLD_INR_24K_10G' && a.condition === 'BELOW' && current24k <= a.targetPrice && current24k > 0) ||
                  (a.instrument === 'XAU_USD' && a.condition === 'ABOVE' && currentXau >= a.targetPrice) ||
                  (a.instrument === 'XAU_USD' && a.condition === 'BELOW' && currentXau <= a.targetPrice && currentXau > 0);

                return (
                  <div
                    key={a.id}
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                      isTriggered 
                        ? 'bg-amber-950/40 border-aurum-gold text-amber-200' 
                        : 'bg-aurum-navy/70 border-aurum-border text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">{a.label}</span>
                        {isTriggered && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500 text-aurum-dark font-bold text-[9px] uppercase tracking-wide animate-pulse">
                            Triggered!
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-400 mt-1">
                        {a.instrument}: {a.condition} {a.targetPrice.toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDelete(a.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                      title="Remove alert"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

