import React, { useState, useEffect } from 'react';
import { saveLocalQuotation, getAllLocalQuotations, deleteLocalQuotation, LocalQuotation } from '../storage/database';
import { PlusCircle, Trash2, MapPin, Check, Landmark, ArrowRight } from 'lucide-react';

interface Props {
  setActiveTab: (tab: string) => void;
}

export const ManualEntryPage: React.FC<Props> = ({ setActiveTab }) => {
  const [quotations, setQuotations] = useState<LocalQuotation[]>([]);
  const [location, setLocation] = useState<string>('Chennai');
  const [purity, setPurity] = useState<'24K' | '22K' | '18K'>('22K');
  const [ratePerGram, setRatePerGram] = useState<number | ''>(10870);
  const [shopName, setShopName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    const list = await getAllLocalQuotations();
    setQuotations(list);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim() || !ratePerGram || Number(ratePerGram) <= 0) return;

    const rate = Number(ratePerGram);
    const newQuote: LocalQuotation = {
      id: `manual-${Date.now()}`,
      location: location.trim(),
      purity,
      pricePerGram: rate,
      pricePer10g: rate * 10,
      sourceType: 'MANUAL_ENTRY',
      sourceLabel: 'Manual Local Entry',
      shopName: shopName.trim() || undefined,
      notes: notes.trim() || undefined,
      importedAt: new Date().toISOString()
    };

    await saveLocalQuotation(newQuote);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
    setShopName('');
    setNotes('');
    await loadQuotations();
  };

  const handleDelete = async (id: string) => {
    await deleteLocalQuotation(id);
    await loadQuotations();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-aurum-gold" />
            Manual Local Quotation Entry
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Log quotations directly from your local jeweller or bullion association.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('india')}
          className="text-xs text-aurum-gold hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          View India Rates Overview <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-6 bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-aurum-border/60 pb-2">
            Add New City Quotation
          </h2>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 block mb-1">City or Hub</label>
              <input
                type="text"
                required
                placeholder="e.g. Chennai, Madurai, Kerala, Coimbatore"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-aurum-gold font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Purity</label>
                <select
                  value={purity}
                  onChange={(e) => setPurity(e.target.value as any)}
                  className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aurum-gold cursor-pointer"
                >
                  <option value="24K">24K (99.9% Pure)</option>
                  <option value="22K">22K (91.6% Hallmark)</option>
                  <option value="18K">18K (75.0% Diamond)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Rate Per Gram (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="0.1"
                  value={ratePerGram}
                  onChange={(e) => setRatePerGram(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-aurum-gold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Shop / Jeweller Name (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Lalitha Jewellery, GRT, Malabar, Kalyan"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aurum-gold"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Notes / Board Rate Details</label>
              <textarea
                rows={2}
                placeholder="e.g. IBJA closing rate, Morning opening quotation"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-aurum-navy border border-aurum-border rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-aurum-gold resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {success ? (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Quotation saved!
                </span>
              ) : <div />}

              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-aurum-gold text-aurum-dark font-bold text-xs hover:bg-amber-300 transition-colors shadow-sm"
              >
                Save Quotation
              </button>
            </div>
          </form>
        </div>

        {/* List of Existing Local Quotations */}
        <div className="lg:col-span-6 bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-aurum-border/60 pb-2 flex items-center justify-between">
            <span>Stored Local Records ({quotations.length})</span>
            <span className="text-[10px] text-slate-500 font-normal">IndexedDB Persistent</span>
          </h2>

          {quotations.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No quotations saved yet.</p>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {quotations.map((q) => (
                <div
                  key={q.id}
                  className="p-3 rounded-lg bg-aurum-navy/70 border border-aurum-border flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-aurum-gold" />
                        {q.location}
                      </span>
                      <span className="px-1.5 py-0.2 rounded bg-purple-950/70 text-purple-300 border border-purple-500/30 text-[10px] uppercase font-mono">
                        {q.purity}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-mono font-bold text-slate-200">
                        ₹{q.pricePerGram.toLocaleString()} / g
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        (₹{q.pricePer10g.toLocaleString()} / 10g)
                      </span>
                    </div>
                    {q.shopName && (
                      <p className="text-[11px] text-slate-400 mt-0.5">{q.shopName}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

