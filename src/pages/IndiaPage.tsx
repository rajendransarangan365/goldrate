import React, { useState, useEffect } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { MetricCard } from '../components/cards/MetricCard';
import { getAllLocalQuotations, LocalQuotation, deleteLocalQuotation } from '../storage/database';
import { 
  Landmark, 
  MapPin, 
  Plus, 
  Trash2, 
  Info, 
  HelpCircle, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface Props {
  setActiveTab: (tab: string) => void;
}

export const IndiaPage: React.FC<Props> = ({ setActiveTab }) => {
  const { snapshot } = useMarketData();
  const [localQuotes, setLocalQuotes] = useState<LocalQuotation[]>([]);

  useEffect(() => {
    loadLocalQuotes();
  }, []);

  const loadLocalQuotes = async () => {
    const quotes = await getAllLocalQuotations();
    setLocalQuotes(quotes);
  };

  const handleDelete = async (id: string) => {
    await deleteLocalQuotation(id);
    await loadLocalQuotes();
  };

  const theo24k10g = snapshot?.theoretical24kInr10g.value || 0;
  const theo22k10g = snapshot?.theoretical22kInr10g.value || 0;
  const theo18k10g = snapshot?.theoretical18kInr10g.value || 0;

  // Filter quotes by key hubs
  const chennaiQuotes = localQuotes.filter(q => q.location.toLowerCase().includes('chennai'));
  const maduraiQuotes = localQuotes.filter(q => q.location.toLowerCase().includes('madurai'));
  const keralaQuotes = localQuotes.filter(q => q.location.toLowerCase().includes('kerala'));
  const otherQuotes = localQuotes.filter(q => 
    !q.location.toLowerCase().includes('chennai') && 
    !q.location.toLowerCase().includes('madurai') && 
    !q.location.toLowerCase().includes('kerala')
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Landmark className="w-5 h-5 text-aurum-gold" />
            Indian Domestic Market Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Theoretical conversion rates, retail jewellery estimates, and verified local jeweller quotations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('whatsapp')}
            className="px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80 text-xs font-medium flex items-center gap-1.5"
          >
            Import WhatsApp Rates
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className="px-3 py-1.5 rounded-lg bg-aurum-card border border-aurum-border text-slate-200 hover:bg-aurum-card/80 text-xs font-medium flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Local Quote
          </button>
        </div>
      </div>

      {/* Critical Pricing Distinctions Notice */}
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-3.5 text-xs text-amber-200/90 flex items-start gap-3">
        <Info className="w-4 h-4 text-aurum-gold shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-aurum-gold">Important Indian Pricing Distinction</p>
          <p className="text-slate-300 leading-relaxed">
            The values below represent the <strong>pure theoretical mathematical conversion</strong> of international spot gold (XAU/USD) converted into Indian Rupees (USD/INR). Retail jeweller prices in India (IBJA, Chennai, Madurai, Kerala) naturally incorporate customs import duties, landing charges, dealer premiums, and retail logistics. They are not identical.
          </p>
        </div>
      </div>

      {/* Section 1: Pure Theoretical Spot Conversions */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            1. Theoretical Spot Conversions (Before Taxes &amp; Duties)
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            Formula: (XAU/USD × USD/INR ÷ 31.1034768) × 10
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MetricCard
            title="Theoretical 24K Gold"
            value={theo24k10g}
            currencyPrefix="₹"
            unitLabel="per 10g"
            freshness={snapshot?.theoretical24kInr10g.freshness || 'UNAVAILABLE'}
            observationType="CALCULATED"
            sourceText="(Spot Gold USD * USD/INR / 31.1034768) * 10"
            subtitle={`₹${(theo24k10g / 10).toFixed(2)} per gram`}
            highlight={true}
          />

          <MetricCard
            title="Theoretical 22K (Standard Hallmark)"
            value={theo22k10g}
            currencyPrefix="₹"
            unitLabel="per 10g"
            freshness={snapshot?.theoretical22kInr10g.freshness || 'UNAVAILABLE'}
            observationType="CALCULATED"
            sourceText="Theoretical 24K * (22 / 24)"
            subtitle={`₹${(theo22k10g / 10).toFixed(2)} per gram`}
          />

          <MetricCard
            title="Theoretical 18K Gold"
            value={theo18k10g}
            currencyPrefix="₹"
            unitLabel="per 10g"
            freshness={snapshot?.theoretical18kInr10g.freshness || 'UNAVAILABLE'}
            observationType="CALCULATED"
            sourceText="Theoretical 24K * (18 / 24)"
            subtitle={`₹${(theo18k10g / 10).toFixed(2)} per gram`}
          />
        </div>
      </div>

      {/* Section 2: Local Regional Retail Quotations */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              2. Local City &amp; Regional Quotations
            </h2>
            <p className="text-[11px] text-slate-400">
              Imported via WhatsApp messages or manually entered by user. Clearly distinguished from calculated spot.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('manual')}
            className="text-xs text-aurum-gold hover:underline flex items-center gap-1"
          >
            Manage Entries <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {localQuotes.length === 0 ? (
          <div className="bg-aurum-card/40 border border-aurum-border border-dashed rounded-xl p-8 text-center space-y-3">
            <MapPin className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="font-semibold text-slate-300 text-sm">No Local Quotations Stored Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Free public market APIs do not provide authorized live retail quotes for individual Indian cities (Chennai, Madurai, Kerala). You can paste your jeweller's daily WhatsApp rate message or add them manually.
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setActiveTab('whatsapp')}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-medium"
              >
                Import WhatsApp Rates
              </button>
              <button
                onClick={() => setActiveTab('manual')}
                className="px-3.5 py-1.5 rounded-lg bg-aurum-card border border-aurum-border text-slate-200 text-xs font-medium"
              >
                Manual Entry
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {localQuotes.map((q) => (
              <div key={q.id} className="bg-aurum-card/70 border border-aurum-border rounded-xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-aurum-gold" />
                      {q.location}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/70 text-purple-300 border border-purple-500/30 uppercase font-mono">
                      {q.purity}
                    </span>
                  </div>

                  <div className="my-2">
                    <p className="text-2xl font-mono font-bold text-white">
                      ₹{q.pricePer10g.toLocaleString()}
                    </p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      ₹{q.pricePerGram.toLocaleString()} / gram
                    </p>
                  </div>

                  {q.shopName && (
                    <p className="text-xs text-slate-400">Shop: {q.shopName}</p>
                  )}
                  {q.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">{q.notes}</p>
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-aurum-border/60 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Imported: {new Date(q.importedAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="text-rose-400 hover:text-rose-300 transition-colors p-1"
                    title="Delete quote"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 3: Indian Jewellery Cost Estimator Shortcut */}
      <div className="bg-aurum-card/50 border border-aurum-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-white text-sm">Need exact purchase price with GST &amp; making charges?</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Use the Gold Value Calculator to configure weight (grams, tola, sovereign), wastage, making charge %, and 3% GST.
          </p>
        </div>
        <button
          onClick={() => setActiveTab('calculator')}
          className="px-4 py-2 rounded-lg bg-aurum-gold text-aurum-dark font-semibold text-xs whitespace-nowrap hover:bg-amber-300 transition-colors"
        >
          Open Gold Calculator
        </button>
      </div>
    </div>
  );
};

