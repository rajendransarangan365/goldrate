import React, { useState } from 'react';
import { useMarketData } from '../hooks/useMarketData';
import { calculateJewelleryCost } from '../utils/goldCalculations';
import { Calculator, Receipt, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react';

export const CalculatorPage: React.FC = () => {
  const { snapshot } = useMarketData();

  // Inputs
  const [weight, setWeight] = useState<number>(8); // default 1 Sovereign / Pavan = 8g
  const [unit, setUnit] = useState<'grams' | 'sovereign' | 'tola' | 'troy_oz'>('grams');
  const [purity, setPurity] = useState<'24K' | '22K' | '18K' | '14K'>('22K');
  const [makingChargePct, setMakingChargePct] = useState<number>(10); // default 10%
  const [makingChargeFixed, setMakingChargeFixed] = useState<number>(0);
  const [gstPct, setGstPct] = useState<number>(3);
  const [customRatePerGram, setCustomRatePerGram] = useState<number | ''>('');

  // Determine base rate per gram
  const theo24kGram = (snapshot?.theoretical24kInr10g.value || 118500) / 10;
  const purityMultiplier = {
    '24K': 1.0,
    '22K': 22 / 24,
    '18K': 18 / 24,
    '14K': 14 / 24
  }[purity];

  const defaultRatePerGram = Math.round(theo24kGram * purityMultiplier);
  const effectiveRatePerGram = customRatePerGram !== '' ? Number(customRatePerGram) : defaultRatePerGram;

  // Convert selected unit to grams
  const getWeightInGrams = () => {
    switch (unit) {
      case 'sovereign': return weight * 8; // 1 sovereign / pavan = 8g
      case 'tola': return weight * 11.6638; // 1 tola = 11.6638g
      case 'troy_oz': return weight * 31.1034768;
      case 'grams':
      default:
        return weight;
    }
  };

  const grams = getWeightInGrams();

  const cost = calculateJewelleryCost({
    grams,
    ratePerGram: effectiveRatePerGram,
    makingChargePct,
    makingChargeFixedPerGram: makingChargeFixed,
    gstPct
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Calculator className="w-5 h-5 text-aurum-gold" />
          Gold Value &amp; Jewellery Cost Calculator
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Compute accurate jewellery invoice amounts including making charges, wastage, and Indian 3% GST.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Form (Left Column) */}
        <div className="lg:col-span-7 bg-aurum-card/70 border border-aurum-border rounded-xl p-5 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-aurum-border/60 pb-2">
            Configuration Parameters
          </h2>

          {/* Weight & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Weight Value</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={weight || ''}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-aurum-gold"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Unit of Measurement</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full bg-aurum-navy border border-aurum-border rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-aurum-gold cursor-pointer"
              >
                <option value="grams">Grams (g)</option>
                <option value="sovereign">Sovereign / Pavan (8g)</option>
                <option value="tola">Tola (11.66g)</option>
                <option value="troy_oz">Troy Ounce (31.1g)</option>
              </select>
            </div>
          </div>

          {/* Purity Selection */}
          <div>
            <label className="text-xs text-slate-300 block mb-1">Gold Karat / Purity</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { k: '24K', desc: '99.9%' },
                { k: '22K', desc: '91.6% Hallmark' },
                { k: '18K', desc: '75.0% Diamond' },
                { k: '14K', desc: '58.3%' },
              ].map(item => (
                <button
                  key={item.k}
                  type="button"
                  onClick={() => setPurity(item.k as any)}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    purity === item.k
                      ? 'bg-aurum-gold text-aurum-dark border-aurum-gold font-bold shadow-sm'
                      : 'bg-aurum-navy border-aurum-border text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <p className="text-xs">{item.k}</p>
                  <p className="text-[10px] opacity-80">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Gold Rate per Gram */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-300">Rate Per Gram (INR)</label>
              <span className="text-[10px] text-slate-400">
                Default theoretical: ₹{defaultRatePerGram.toLocaleString()} / g
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm font-mono">₹</span>
              <input
                type="number"
                placeholder={defaultRatePerGram.toString()}
                value={customRatePerGram}
                onChange={(e) => setCustomRatePerGram(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="w-full bg-aurum-navy border border-aurum-border rounded-lg pl-8 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-aurum-gold"
              />
            </div>
          </div>

          {/* Making Charges & Wastage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-300 block mb-1">Making Charges (%)</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={makingChargePct}
                  onChange={(e) => setMakingChargePct(parseFloat(e.target.value) || 0)}
                  className="w-full bg-aurum-navy border border-aurum-border rounded-lg pl-3 pr-8 py-2 text-sm text-white font-mono focus:outline-none focus:border-aurum-gold"
                />
                <span className="absolute right-3 top-2 text-slate-400 text-xs">%</span>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Fixed Making (₹/g)</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 text-xs font-mono">₹</span>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={makingChargeFixed}
                  onChange={(e) => setMakingChargeFixed(parseFloat(e.target.value) || 0)}
                  className="w-full bg-aurum-navy border border-aurum-border rounded-lg pl-7 pr-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-aurum-gold"
                />
              </div>
            </div>
          </div>

          {/* GST % */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-slate-300">Goods &amp; Services Tax (GST)</label>
              <span className="text-[10px] text-slate-400">Statutory Indian Rate: 3%</span>
            </div>
            <div className="flex gap-2">
              {[0, 3, 5].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setGstPct(val)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                    gstPct === val
                      ? 'bg-aurum-card border-aurum-gold text-aurum-gold font-bold'
                      : 'bg-aurum-navy border-aurum-border text-slate-400'
                  }`}
                >
                  {val}% GST
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Itemized Estimate Invoice Receipt (Right Column) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-aurum-card to-aurum-navy border border-aurum-border rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-aurum-border/60 pb-3">
              <span className="font-semibold text-xs uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-aurum-gold" />
                Itemized Jewellery Estimate
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-aurum-navy border border-aurum-border text-slate-400">
                {purity} • {grams.toFixed(2)}g
              </span>
            </div>

            {/* Receipt Table */}
            <div className="space-y-3 pt-3 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>Gold Rate Applied</span>
                <span className="font-mono">₹{effectiveRatePerGram.toLocaleString()} / g</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Pure Metal Value ({grams.toFixed(2)} g)</span>
                <span className="font-mono font-semibold text-white">₹{Math.round(cost.metalCost).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>Making Charges ({makingChargePct}% + fixed)</span>
                <span className="font-mono text-amber-300">+ ₹{Math.round(cost.makingCharges).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-400 pt-2 border-t border-aurum-border/40">
                <span>Taxable Amount</span>
                <span className="font-mono">₹{Math.round(cost.taxableAmount).toLocaleString()}</span>
              </div>

              <div className="flex justify-between items-center text-slate-300">
                <span>GST ({gstPct}%)</span>
                <span className="font-mono text-amber-300">+ ₹{Math.round(cost.gstAmount).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Grand Total */}
          <div className="pt-4 border-t border-aurum-border/80">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Estimated Total Purchase Cost
            </span>
            <div className="text-3xl font-mono font-bold text-aurum-gold mt-1">
              ₹{Math.round(cost.totalCost).toLocaleString()}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Inclusive of raw gold bullion value, craftsmanship charges, and 3% tax.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

