import React from 'react';
import { 
  RefreshCw, 
  Wifi, 
  WifiOff, 
  SlidersHorizontal,
  ChevronDown,
  Layers,
  Sparkles
} from 'lucide-react';
import { FreshnessBadge } from '../status/FreshnessBadge';
import { useMarketData } from '../../hooks/useMarketData';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Navbar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const { snapshot, status, refresh, setProvider } = useMarketData();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return (
    <header className="sticky top-0 z-40 bg-aurum-navy/90 backdrop-blur-md border-b border-aurum-border">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
        {/* Logo & Title */}
        <div 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 via-aurum-gold to-yellow-200 p-[1px]">
            <div className="w-full h-full bg-aurum-navy rounded-[7px] flex items-center justify-center">
              <span className="font-serif font-bold text-aurum-gold text-base leading-none">A</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-serif font-black tracking-wider text-white text-base leading-none">AURUM</span>
              <span className="font-sans font-light tracking-widest text-aurum-gold text-xs leading-none">PULSE</span>
            </div>
            <p className="text-[9px] tracking-wider text-slate-400 uppercase hidden sm:block">Gold Market Intelligence</p>
          </div>
        </div>

        {/* Status Indicators & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Provider selector pill */}
          <div className="relative hidden md:block">
            <select
              value={status.activeProvider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="appearance-none bg-aurum-card border border-aurum-border rounded-lg pl-2.5 pr-7 py-1 text-xs text-slate-300 font-mono focus:outline-none focus:border-aurum-gold cursor-pointer"
            >
              <option value="corgano">Provider: Corgano API</option>
              <option value="goldprice_dev">Provider: goldprice.dev</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2 pointer-events-none" />
          </div>

          {/* Freshness Badge */}
          {snapshot && (
            <FreshnessBadge state={snapshot.overallFreshness} />
          )}

          {/* Online/Offline network state */}
          <div className="flex items-center text-xs text-slate-400" title={isOnline ? 'Online' : 'Offline mode'}>
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-400" />
            )}
          </div>

          {/* Manual Refresh Button */}
          <button
            onClick={refresh}
            disabled={status.isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-aurum-card hover:bg-aurum-card/80 active:scale-95 border border-aurum-border text-xs text-slate-200 transition-all disabled:opacity-50"
            title="Fetch latest market data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-aurum-gold ${status.isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline font-medium">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};

