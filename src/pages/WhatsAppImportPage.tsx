import React, { useState } from 'react';
import { parseWhatsAppMessage, ParseResult, ParsedRateItem, isDuplicateQuotation } from '../services/importers/whatsappParser';
import { saveLocalQuotation, getAllLocalQuotations } from '../storage/database';
import { 
  MessageSquare, 
  Check, 
  AlertTriangle, 
  Copy, 
  Trash2, 
  Save, 
  HelpCircle, 
  ArrowRight,
  Info
} from 'lucide-react';

interface Props {
  setActiveTab: (tab: string) => void;
}

const SAMPLE_MESSAGE = `[30/10/26, 10:15 AM] Daily Bullion Rates:
Chennai 22K : 10,870
Madurai 22K - 10,865
Kerala 22K : 10,875
MCX Gold 10GM : 119,250
Silver 1KG : 124,500`;

export const WhatsAppImportPage: React.FC<Props> = ({ setActiveTab }) => {
  const [rawText, setRawText] = useState<string>('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedRateItem[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleParse = () => {
    if (!rawText.trim()) return;
    const res = parseWhatsAppMessage(rawText);
    setParseResult(res);
    setParsedItems(res.parsedItems);
    setSuccessMessage(null);
  };

  const handleItemChange = (id: string, field: keyof ParsedRateItem, value: any) => {
    setParsedItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleConfirmSave = async () => {
    if (parsedItems.length === 0) return;

    const existing = await getAllLocalQuotations();

    for (const item of parsedItems) {
      // Determine per 10g and per gram based on detected unit
      let pricePer10g = item.numericValue;
      let pricePerGram = item.numericValue / 10;
      if (item.detectedUnit === '1g') {
        pricePer10g = item.numericValue * 10;
        pricePerGram = item.numericValue;
      }

      const purity = item.detectedInstrument.includes('24K') ? '24K' 
        : item.detectedInstrument.includes('18K') ? '18K' : '22K';

      await saveLocalQuotation({
        id: `quote-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        location: item.location || 'Imported Quote',
        purity,
        pricePer10g,
        pricePerGram,
        sourceType: 'WHATSAPP_IMPORT',
        sourceLabel: 'WhatsApp Import',
        notes: `Imported from: "${item.rawKey}: ${item.rawValue}"`,
        messageTimestamp: parseResult?.detectedDate ? `${parseResult.detectedDate} ${parseResult.detectedTime || ''}` : undefined,
        importedAt: new Date().toISOString()
      });
    }

    setSuccessMessage(`Successfully saved ${parsedItems.length} quotation(s) to your local database!`);
    setParsedItems([]);
    setParseResult(null);
    setRawText('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            WhatsApp Gold-Rate Message Importer
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Safely parse, review, and confirm domestic bullion rates forwarded from local jewellers.
          </p>
        </div>

        <button
          onClick={() => setRawText(SAMPLE_MESSAGE)}
          className="text-xs text-aurum-gold hover:underline flex items-center gap-1 self-start sm:self-auto"
        >
          <Copy className="w-3.5 h-3.5" />
          Load Sample Message
        </button>
      </div>

      {/* Untrusted Data Notice */}
      <div className="bg-aurum-card/40 border border-aurum-border rounded-xl p-3.5 text-xs text-slate-300 flex items-start gap-3">
        <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Privacy &amp; Integrity Notice:</strong> All text parsing runs 100% locally in your browser. WhatsApp messages are never transmitted to external clouds or third-party servers. You can inspect, adjust detected fields, and confirm before saving.
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-950/60 border border-emerald-500/50 rounded-xl p-4 flex items-center justify-between text-xs text-emerald-200">
          <div className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setActiveTab('india')}
            className="px-3 py-1 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-500 flex items-center gap-1"
          >
            View in India Rates <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Textarea Input Section */}
      <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-4 space-y-3">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
          Paste Raw WhatsApp Message Text
        </label>
        <textarea
          rows={5}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={`Paste message here...\nExample:\nChennai 22K : 10870\nMadurai 22K : 10865\nMCX Gold : 119250`}
          className="w-full bg-aurum-navy border border-aurum-border rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-aurum-gold placeholder:text-slate-600 resize-y"
        />

        <div className="flex justify-end gap-2">
          <button
            onClick={() => { setRawText(''); setParseResult(null); setParsedItems([]); }}
            className="px-3 py-1.5 rounded-lg border border-aurum-border text-xs text-slate-400 hover:text-white"
          >
            Clear
          </button>
          <button
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
          >
            Parse Message
          </button>
        </div>
      </div>

      {/* Review Parsed Fields Section */}
      {parseResult && (
        <div className="bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-aurum-border/60 pb-3">
            <div>
              <h3 className="font-bold text-white text-sm">Review &amp; Verify Parsed Quotations</h3>
              <p className="text-xs text-slate-400">
                Verify detected values and units before saving to local database.
              </p>
            </div>
            {parseResult.detectedDate && (
              <span className="text-xs font-mono text-aurum-gold">
                Detected Timestamp: {parseResult.detectedDate} {parseResult.detectedTime || ''}
              </span>
            )}
          </div>

          {/* Warnings */}
          {parseResult.warnings.length > 0 && (
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-lg p-3 text-xs text-amber-200 space-y-1">
              {parseResult.warnings.map((w, idx) => (
                <p key={idx} className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}

          {/* Parsed Items Table / List */}
          {parsedItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No valid price records extracted.</p>
          ) : (
            <div className="space-y-3">
              {parsedItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 ${
                    item.isAmbiguous ? 'bg-amber-950/20 border-amber-500/40' : 'bg-aurum-navy/70 border-aurum-border'
                  }`}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 w-full">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Field Key</span>
                      <p className="text-xs font-mono text-slate-200 truncate">{item.rawKey}</p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Location</span>
                      <input
                        type="text"
                        value={item.location || ''}
                        placeholder="e.g. Chennai"
                        onChange={(e) => handleItemChange(item.id, 'location', e.target.value)}
                        className="w-full bg-aurum-card border border-aurum-border rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-aurum-gold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Numeric Rate</span>
                      <input
                        type="number"
                        value={item.numericValue}
                        onChange={(e) => handleItemChange(item.id, 'numericValue', parseFloat(e.target.value) || 0)}
                        className="w-full bg-aurum-card border border-aurum-border rounded px-2 py-1 text-xs text-white font-mono focus:outline-none focus:border-aurum-gold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase">Detected Unit</span>
                      <select
                        value={item.detectedUnit}
                        onChange={(e) => handleItemChange(item.id, 'detectedUnit', e.target.value)}
                        className="w-full bg-aurum-card border border-aurum-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-aurum-gold cursor-pointer"
                      >
                        <option value="1g">Per 1 Gram</option>
                        <option value="10g">Per 10 Grams</option>
                        <option value="1kg">Per 1 KG</option>
                        <option value="troy_oz">Per Troy Oz</option>
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 self-end md:self-center"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {/* Confirm Save Button */}
              <div className="pt-3 border-t border-aurum-border/60 flex justify-end">
                <button
                  onClick={handleConfirmSave}
                  className="px-5 py-2 rounded-lg bg-aurum-gold text-aurum-dark font-bold text-xs hover:bg-amber-300 transition-all flex items-center gap-1.5 shadow-md"
                >
                  <Save className="w-4 h-4" />
                  Confirm &amp; Save ({parsedItems.length}) Quotations
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

