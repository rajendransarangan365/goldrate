import React from 'react';
import { FreshnessBadge } from '../status/FreshnessBadge';
import { FreshnessState, ObservationType } from '../../services/marketData/types';
import { TrendingUp, TrendingDown, Minus, Info } from 'lucide-react';

interface Props {
  title: string;
  value: number;
  currencyPrefix?: string;
  unitLabel?: string;
  changePct?: number;
  changeValue?: number;
  freshness: FreshnessState;
  observationType: ObservationType;
  sourceText?: string;
  observedAt?: string;
  subtitle?: string;
  highlight?: boolean;
}

export const MetricCard: React.FC<Props> = ({
  title,
  value,
  currencyPrefix = '',
  unitLabel = '',
  changePct,
  changeValue,
  freshness,
  observationType,
  sourceText,
  observedAt,
  subtitle,
  highlight = false
}) => {
  const isUp = (changePct !== undefined && changePct > 0) || (changeValue !== undefined && changeValue > 0);
  const isDown = (changePct !== undefined && changePct < 0) || (changeValue !== undefined && changeValue < 0);

  const getObservationTypeLabel = () => {
    switch (observationType) {
      case 'ACTUAL_MARKET':
        return { label: 'Provider Market Quote', color: 'text-emerald-400 border-emerald-500/30' };
      case 'CALCULATED':
        return { label: 'Theoretical Calculation', color: 'text-amber-400 border-amber-500/30' };
      case 'STATISTICAL_PRED':
        return { label: 'Statistical Estimate', color: 'text-purple-400 border-purple-500/30' };
      case 'MANUAL_IMPORT':
        return { label: 'Imported / Manual', color: 'text-blue-400 border-blue-500/30' };
    }
  };

  const obsTypeConfig = getObservationTypeLabel();

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      highlight 
        ? 'bg-gradient-to-br from-aurum-card via-aurum-card to-amber-950/20 border-aurum-gold/50 shadow-lg shadow-aurum-gold/5' 
        : 'bg-aurum-card/70 border-aurum-border hover:border-aurum-border/80'
    }`}>
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        <FreshnessBadge state={freshness} />
      </div>

      {/* Main Value Display */}
      <div className="my-2 flex items-baseline gap-1.5 flex-wrap">
        <span className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-white">
          {currencyPrefix}
          {value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        {unitLabel && <span className="text-xs text-slate-400 font-medium">{unitLabel}</span>}
      </div>

      {/* Change Display */}
      {(changePct !== undefined || changeValue !== undefined) && (
        <div className="flex items-center gap-2 mb-2 text-xs font-mono">
          <div className={`flex items-center gap-1 font-semibold ${
            isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {isUp && <TrendingUp className="w-3.5 h-3.5" />}
            {isDown && <TrendingDown className="w-3.5 h-3.5" />}
            {!isUp && !isDown && <Minus className="w-3.5 h-3.5" />}
            <span>
              {isUp ? '+' : ''}{changePct?.toFixed(2)}%
            </span>
          </div>
          {changeValue !== undefined && (
            <span className="text-slate-400 text-[11px]">
              ({isUp ? '+' : ''}{changeValue.toFixed(2)})
            </span>
          )}
        </div>
      )}

      {/* Metadata & Attribution Footer */}
      <div className="pt-2.5 mt-2 border-t border-aurum-border/60 flex flex-col gap-1 text-[11px] text-slate-400">
        <div className="flex items-center justify-between gap-2">
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium tracking-wide uppercase ${obsTypeConfig.color}`}>
            {obsTypeConfig.label}
          </span>
          {observedAt && (
            <span className="font-mono text-[10px] text-slate-400 truncate">
              {new Date(observedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        {sourceText && (
          <p className="text-[10px] text-slate-400 truncate flex items-center gap-1" title={sourceText}>
            <Info className="w-2.5 h-2.5 shrink-0 text-slate-400" />
            <span className="truncate">{sourceText}</span>
          </p>
        )}
      </div>
    </div>
  );
};

