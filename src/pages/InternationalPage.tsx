import React from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { MetricCard } from '../components/cards/MetricCard';
import { Globe, ShieldCheck, ExternalLink, RefreshCw } from 'lucide-react';

export const InternationalPage: React.FC = () => {
  const { snapshot, status, setProvider, refresh } = useMarketData();

  const xauUsd = snapshot?.goldUsdPerOz.value || 0;
  const xauGramUsd = xauUsd / 31.1034768;
  const xauKgUsd = xauGramUsd * 1000;

  return (
    <div className="space-y-6">
      {/* Page Title & Provider Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-aurum-gold" />
            International Spot Market Feeds
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time &amp; delayed spot gold (XAU) and silver (XAG) quotes in US Dollars.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Data Source:</label>
          <select
            value={status.activeProvider}
            onChange={(e) => setProvider(e.target.value as any)}
            className="bg-aurum-card border border-aurum-border rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-aurum-gold"
          >
            <option value="corgano">Corgano API (Free CC BY 4.0)</option>
            <option value="goldprice_dev">goldprice.dev (Free Anonymous)</option>
          </select>
        </div>
      </div>

      {/* Primary International Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="XAU/USD (Troy Ounce)"
          value={xauUsd}
          currencyPrefix="$"
          unitLabel="per oz"
          changePct={snapshot?.changePct}
          changeValue={snapshot?.changeUsd}
          freshness={snapshot?.goldUsdPerOz.freshness || 'UNAVAILABLE'}
          observationType="ACTUAL_MARKET"
          observedAt={snapshot?.goldUsdPerOz.observedAt}
          sourceText={snapshot?.goldUsdPerOz.source}
          subtitle="1 troy ounce = 31.1034768 grams"
          highlight={true}
        />

        <MetricCard
          title="Gold Price Per Gram (USD)"
          value={xauGramUsd}
          currencyPrefix="$"
          unitLabel="per gram"
          freshness={snapshot?.goldUsdPerOz.freshness || 'UNAVAILABLE'}
          observationType="CALCULATED"
          sourceText="XAU_USD / 31.1034768"
          subtitle="International metric equivalent"
        />

        <MetricCard
          title="Gold Price Per Kilogram (USD)"
          value={xauKgUsd}
          currencyPrefix="$"
          unitLabel="per kg"
          freshness={snapshot?.goldUsdPerOz.freshness || 'UNAVAILABLE'}
          observationType="CALCULATED"
          sourceText="Gold Price Per Gram * 1000"
          subtitle="Standard 1kg bullion bar value"
        />
      </div>

      {/* Silver Spot Quote (if provided) */}
      {snapshot?.silverUsdPerOz && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MetricCard
            title="XAG/USD (Spot Silver)"
            value={snapshot.silverUsdPerOz.value}
            currencyPrefix="$"
            unitLabel="per oz"
            freshness={snapshot.silverUsdPerOz.freshness}
            observationType="ACTUAL_MARKET"
            observedAt={snapshot.silverUsdPerOz.observedAt}
            sourceText={snapshot.silverUsdPerOz.source}
            subtitle="International silver benchmark"
          />

          <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-4 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Gold/Silver Ratio</h3>
              <p className="text-2xl font-mono font-bold text-white mt-1">
                {(xauUsd / (snapshot.silverUsdPerOz.value || 1)).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Number of ounces of silver required to purchase one ounce of gold.
              </p>
            </div>
            <div className="text-[11px] text-slate-500 border-t border-aurum-border/60 pt-2 mt-2">
              Historically tracked indicator for relative precious metals valuation.
            </div>
          </div>
        </div>
      )}

      {/* Karat Breakdown in USD */}
      <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
          International Gold Value By Purity (USD per Gram)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { karat: '24K', fraction: '24/24 (99.9%)', value: xauGramUsd },
            { karat: '22K', fraction: '22/24 (91.6%)', value: xauGramUsd * (22 / 24) },
            { karat: '21K', fraction: '21/24 (87.5%)', value: xauGramUsd * (21 / 24) },
            { karat: '18K', fraction: '18/24 (75.0%)', value: xauGramUsd * (18 / 24) },
            { karat: '14K', fraction: '14/24 (58.3%)', value: xauGramUsd * (14 / 24) }
          ].map((item) => (
            <div key={item.karat} className="bg-aurum-navy/70 border border-aurum-border/80 rounded-lg p-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-aurum-gold">{item.karat}</span>
                <span className="text-[10px]">{item.fraction}</span>
              </div>
              <p className="text-lg font-mono font-bold text-white mt-1.5">
                ${item.value.toFixed(2)}
              </p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">per gram</p>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Details & Terms */}
      <div className="bg-aurum-navy/60 border border-aurum-border rounded-xl p-4 space-y-2 text-xs text-slate-400">
        <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Data Integrity &amp; Attribution Notes
        </h4>
        <p>
          Quotes reflect spot market bid/ask midpoints. Spot prices represent raw metal before government customs duties, local tariffs, logistics, and jeweler retail premiums.
        </p>
        <div className="pt-2 flex flex-wrap items-center gap-4 text-[11px]">
          <a
            href={snapshot?.attribution.url || "https://goldprice.corgano.com/"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-aurum-gold hover:underline flex items-center gap-1 font-medium"
          >
            {snapshot?.attribution.text || "Gold price data by Corgano"}
            <ExternalLink className="w-3 h-3" />
          </a>
          <span className="text-slate-500">•</span>
          <span>License: {snapshot?.attribution.license || "CC BY 4.0"}</span>
        </div>
      </div>
    </div>
  );
};

