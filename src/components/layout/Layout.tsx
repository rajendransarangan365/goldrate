import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { 
  LayoutDashboard, 
  Globe, 
  Landmark, 
  LineChart, 
  TrendingUp, 
  Calculator, 
  MessageSquare, 
  PlusCircle, 
  Bell, 
  Cpu, 
  Database, 
  Settings,
  Download
} from 'lucide-react';
import { useMarketData } from '../../hooks/useMarketData';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<Props> = ({ activeTab, setActiveTab, children }) => {
  const { snapshot } = useMarketData();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    });

    window.addEventListener('appinstalled', () => {
      setCanInstall(false);
      setDeferredPrompt(null);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'international', label: 'Global', icon: Globe },
    { id: 'india', label: 'India Rates', icon: Landmark },
    { id: 'history', label: 'History', icon: LineChart },
    { id: 'forecast', label: 'Forecast', icon: TrendingUp },
    { id: 'calculator', label: 'Calculator', icon: Calculator },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'manual', label: 'Local Entry', icon: PlusCircle },
    { id: 'alerts', label: 'Alerts', icon: Bell },
    { id: 'ailab', label: 'AI Lab', icon: Cpu },
    { id: 'sources', label: 'Sources', icon: Database },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-aurum-dark text-slate-100 flex flex-col font-sans pb-16 md:pb-0">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Desktop & Tablet Navigation Bar */}
      <nav className="hidden md:block bg-aurum-navy border-b border-aurum-border">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-aurum-card text-aurum-gold border border-aurum-border/80 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-aurum-card/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-aurum-gold' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Install PWA Prompt Banner (if available) */}
      {canInstall && (
        <div className="bg-amber-950/60 border-b border-aurum-gold/30 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-aurum-gold" />
            <span>Install <strong>AURUM PULSE</strong> on your phone for offline access and instant updates.</span>
          </div>
          <button
            onClick={handleInstallClick}
            className="px-3 py-1 rounded bg-aurum-gold text-aurum-dark font-semibold hover:bg-amber-300"
          >
            Install App
          </button>
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {children}
      </main>

      {/* Mandatory Attribution Footer */}
      <footer className="mt-auto border-t border-aurum-border/60 bg-aurum-navy/50 py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-left text-[11px]">
            <p className="font-semibold text-slate-300">AURUM PULSE — Free Gold Market Intelligence PWA</p>
            <p className="text-slate-400 mt-0.5">
              Theoretical rates calculated from spot gold &amp; currency feeds. Not certified trading advice.
            </p>
          </div>
          <div className="text-right text-[11px] text-slate-400">
            <span>Market Data Attribution: </span>
            <a
              href="https://goldprice.corgano.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-aurum-gold hover:underline font-medium"
            >
              Gold price data by Corgano
            </a>
            <span className="mx-1.5">•</span>
            <a
              href="https://goldprice.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:underline"
            >
              goldprice.dev
            </a>
            <span className="mx-1.5">•</span>
            <a
              href="https://frankfurter.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:underline"
            >
              Frankfurter (ECB FX)
            </a>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-aurum-navy/95 backdrop-blur-lg border-t border-aurum-border">
        <div className="grid grid-cols-5 h-14">
          {[
            { id: 'dashboard', label: 'Pulse', icon: LayoutDashboard },
            { id: 'india', label: 'India', icon: Landmark },
            { id: 'forecast', label: 'Estimate', icon: TrendingUp },
            { id: 'calculator', label: 'Calc', icon: Calculator },
            { id: 'ailab', label: 'AI Lab', icon: Cpu },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive ? 'text-aurum-gold font-medium' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

