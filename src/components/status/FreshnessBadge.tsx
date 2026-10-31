import React from 'react';
import { FreshnessState } from '../../services/marketData/types';
import { Radio, Clock, Database, AlertTriangle, UserCheck, ShieldAlert } from 'lucide-react';

interface Props {
  state: FreshnessState;
  showIcon?: boolean;
  className?: string;
}

export const FreshnessBadge: React.FC<Props> = ({ state, showIcon = true, className = '' }) => {
  const getBadgeConfig = () => {
    switch (state) {
      case 'LIVE':
        return {
          bg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400',
          dot: 'bg-emerald-400 animate-pulse',
          icon: Radio,
          label: 'LIVE SESSION'
        };
      case 'DELAYED':
        return {
          bg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
          icon: Clock,
          label: 'DELAYED / CLOSE'
        };
      case 'CACHED':
        return {
          bg: 'bg-blue-950/60 border-blue-500/40 text-blue-300',
          dot: 'bg-blue-400',
          icon: Database,
          label: 'CACHED OFFLINE'
        };
      case 'STALE':
        return {
          bg: 'bg-orange-950/60 border-orange-500/40 text-orange-400',
          dot: 'bg-orange-400',
          icon: AlertTriangle,
          label: 'STALE DATA'
        };
      case 'MANUAL':
        return {
          bg: 'bg-purple-950/60 border-purple-500/40 text-purple-300',
          dot: 'bg-purple-400',
          icon: UserCheck,
          label: 'MANUAL ENTRY'
        };
      case 'ERROR':
      case 'UNAVAILABLE':
      default:
        return {
          bg: 'bg-rose-950/60 border-rose-500/40 text-rose-400',
          dot: 'bg-rose-400',
          icon: ShieldAlert,
          label: 'UNAVAILABLE'
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium tracking-wide uppercase border ${config.bg} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showIcon && <IconComponent className="w-3 h-3" />}
      <span>{config.label}</span>
    </span>
  );
};

