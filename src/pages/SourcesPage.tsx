import React from 'react';
import { Database, ExternalLink, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export const SourcesPage: React.FC = () => {
  const sources = [
    {
      name: 'Corgano Gold Price API',
      role: 'Primary International Spot Gold & INR Converter',
      url: 'https://goldprice.corgano.com/',
      docsUrl: 'https://goldprice.corgano.com/gold-price-api',
      instruments: 'XAU/USD, XAU/INR, Karat breakdown (24K, 22K, 21K, 18K, 14K)',
      frequency: 'Updates approximately once per minute during active sessions',
      history: '252 daily historical bars via API + full CSV from 2000 to present',
      auth: 'Free, no API key required',
      rateLimit: '10 requests / minute per client IP',
      cors: 'Full browser CORS supported (Access-Control-Allow-Origin: *)',
      license: 'Creative Commons Attribution 4.0 International (CC BY 4.0)',
      requiredAttribution: 'Gold price data by Corgano (followable link)',
      failureBehavior: 'Automatic retry with exponential backoff; graceful fallback to goldprice.dev and offline cache'
    },
    {
      name: 'goldprice.dev',
      role: 'Alternative Spot Gold, Silver & Currency Provider',
      url: 'https://goldprice.dev/',
      docsUrl: 'https://goldprice.dev/docs/endpoints/prices',
      instruments: 'XAU/USD, XAU/INR, XAG/USD (Silver), Copper (HG)',
      frequency: 'Near real-time spot updates',
      history: 'Current market snapshot and computed spot rates',
      auth: 'Free anonymous tier supported (higher limits with free key)',
      rateLimit: 'Rate limit headers enforced by Cloudflare / Fly.io',
      cors: 'Full browser CORS supported',
      license: 'Free personal access',
      requiredAttribution: 'Credit to goldprice.dev',
      failureBehavior: 'Failover to cached prices or Corgano API'
    },
    {
      name: 'Frankfurter API',
      role: 'Currency Conversion Reference Benchmark',
      url: 'https://frankfurter.dev/',
      docsUrl: 'https://frankfurter.dev/',
      instruments: 'USD/INR, EUR/INR reference benchmark exchange rates',
      frequency: 'Daily reference update published by the European Central Bank (ECB) at ~16:00 CET',
      history: 'Extensive historical daily reference rates',
      auth: 'Open source, no authentication required',
      rateLimit: 'Generous public limits',
      cors: 'Full browser CORS supported',
      license: 'Open source public data',
      requiredAttribution: 'European Central Bank reference rates via Frankfurter',
      failureBehavior: 'Preserves previous day ECB benchmark rate'
    },
    {
      name: 'Federal Reserve Bank of St. Louis (FRED)',
      role: 'Historical USD/INR Exchange Rate Benchmark',
      url: 'https://fred.stlouisfed.org/series/DEXINUS',
      docsUrl: 'https://fred.stlouisfed.org/',
      instruments: 'DEXINUS (India / U.S. Foreign Exchange Rate, Noon Buying Rate in New York)',
      frequency: 'Daily on banking business days',
      history: 'Historical records dating from 1973 to present (14,039 observations)',
      auth: 'Public domain dataset',
      rateLimit: 'Local offline CSV storage in datasets/raw/DEXINUS.csv',
      cors: 'Local filesystem / client cache',
      license: 'Public domain (Federal Reserve Board)',
      requiredAttribution: 'Federal Reserve Bank of St. Louis (FRED)',
      failureBehavior: 'Embedded locally for offline and historical training'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-aurum-gold" />
          Verified Free Market Data Providers &amp; Attribution
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          AURUM PULSE strictly adheres to transparent provider licensing, CORS compliance, and rate-limit governance.
        </p>
      </div>

      {/* Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {sources.map((src) => (
          <div key={src.name} className="bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-2 border-b border-aurum-border/60 pb-2.5">
                <div>
                  <h3 className="font-bold text-white text-sm">{src.name}</h3>
                  <p className="text-[11px] text-aurum-gold mt-0.5">{src.role}</p>
                </div>
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-aurum-navy border border-aurum-border text-slate-300 hover:text-white hover:border-aurum-gold transition-colors"
                  title="Visit provider"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2 pt-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium text-[11px]">Supported Instruments:</span>
                  <p className="text-slate-200 mt-0.5">{src.instruments}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium text-[11px]">Update Frequency:</span>
                  <p className="text-slate-200 mt-0.5">{src.frequency}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium text-[11px]">Free Tier Limits:</span>
                  <p className="text-slate-200 mt-0.5">{src.rateLimit}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium text-[11px]">CORS Support:</span>
                  <p className="text-emerald-400 mt-0.5 font-mono text-[11px]">{src.cors}</p>
                </div>

                <div>
                  <span className="text-slate-400 font-medium text-[11px]">Licensing &amp; Credit:</span>
                  <p className="text-slate-200 mt-0.5 font-medium">{src.license}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-aurum-border/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Required Credit:</span>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-aurum-gold hover:underline font-semibold"
              >
                {src.requiredAttribution}
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Free-Only Integrity Guarantee */}
      <div className="bg-aurum-navy/70 border border-aurum-border rounded-xl p-4 text-xs text-slate-300 space-y-2">
        <h4 className="font-semibold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          Strict Free-Only Architecture Guarantee
        </h4>
        <p className="leading-relaxed text-slate-400">
          AURUM PULSE contains zero mandatory paid subscriptions, paid charting tools, or paid cloud APIs. In the event of provider connectivity loss or rate-limit saturation, the application preserves cached data and falls back to mathematical and statistical projections without inventing or fabricating market quotes.
        </p>
      </div>
    </div>
  );
};

