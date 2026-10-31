/**
 * Core Gold Price Calculation Utilities for AURUM PULSE.
 * Strictly adheres to unit conversion standards:
 * 1 Troy Ounce = 31.1034768 Grams
 */

export const TROY_OUNCE_IN_GRAMS = 31.1034768;

export interface GoldCalculationInput {
  xauUsdPerOunce: number;
  usdInrRate: number;
  premiumAdjustmentPct?: number; // optional user-configured adjustment percentage
  fixedAdjustmentInr?: number;    // optional fixed INR adjustment
}

export interface CalculatedGoldPrices {
  usdPerGram: number;
  theoretical24kInrPer10g: number;
  theoretical24kInrPerGram: number;
  theoretical22kInrPer10g: number;
  theoretical22kInrPerGram: number;
  theoretical18kInrPer10g: number;
  theoretical18kInrPerGram: number;
  theoretical14kInrPer10g: number;
  theoretical14kInrPerGram: number;
  adjusted24kInrPer10g: number;
  adjusted22kInrPer10g: number;
  adjusted18kInrPer10g: number;
}

/**
 * Calculates international gold price per gram in USD
 */
export function calculateUsdPerGram(xauUsdPerOunce: number): number {
  if (xauUsdPerOunce <= 0 || isNaN(xauUsdPerOunce)) {
    throw new Error("Invalid gold price per ounce: must be a positive number");
  }
  return xauUsdPerOunce / TROY_OUNCE_IN_GRAMS;
}

/**
 * Calculates theoretical 24K gold price per 10 grams in INR:
 * (XAU_USD_PER_OUNCE * USD_INR / 31.1034768) * 10
 */
export function calculateTheoretical24kInrPer10g(xauUsdPerOunce: number, usdInrRate: number): number {
  if (xauUsdPerOunce <= 0 || isNaN(xauUsdPerOunce)) {
    throw new Error("Invalid gold price per ounce");
  }
  if (usdInrRate <= 0 || isNaN(usdInrRate)) {
    throw new Error("Invalid USD/INR exchange rate");
  }
  return (xauUsdPerOunce * usdInrRate / TROY_OUNCE_IN_GRAMS) * 10;
}

/**
 * Calculates purity breakdown and optional premium adjustments
 */
export function calculateGoldPrices(input: GoldCalculationInput): CalculatedGoldPrices {
  const { xauUsdPerOunce, usdInrRate, premiumAdjustmentPct = 0, fixedAdjustmentInr = 0 } = input;
  
  const usdPerGram = calculateUsdPerGram(xauUsdPerOunce);
  const theoretical24kInrPer10g = calculateTheoretical24kInrPer10g(xauUsdPerOunce, usdInrRate);
  const theoretical24kInrPerGram = theoretical24kInrPer10g / 10;

  // 22K is 22/24 purity (91.6% hallmarked)
  const theoretical22kInrPer10g = theoretical24kInrPer10g * (22 / 24);
  const theoretical22kInrPerGram = theoretical22kInrPer10g / 10;

  // 18K is 18/24 purity (75.0%)
  const theoretical18kInrPer10g = theoretical24kInrPer10g * (18 / 24);
  const theoretical18kInrPerGram = theoretical18kInrPer10g / 10;

  // 14K is 14/24 purity (58.3%)
  const theoretical14kInrPer10g = theoretical24kInrPer10g * (14 / 24);
  const theoretical14kInrPerGram = theoretical14kInrPer10g / 10;

  // Premium adjustments (if configured by user)
  const adjustmentMultiplier = 1 + (premiumAdjustmentPct / 100);
  const adjusted24kInrPer10g = (theoretical24kInrPer10g * adjustmentMultiplier) + fixedAdjustmentInr;
  const adjusted22kInrPer10g = (theoretical22kInrPer10g * adjustmentMultiplier) + (fixedAdjustmentInr * 22 / 24);
  const adjusted18kInrPer10g = (theoretical18kInrPer10g * adjustmentMultiplier) + (fixedAdjustmentInr * 18 / 24);

  return {
    usdPerGram,
    theoretical24kInrPer10g,
    theoretical24kInrPerGram,
    theoretical22kInrPer10g,
    theoretical22kInrPerGram,
    theoretical18kInrPer10g,
    theoretical18kInrPerGram,
    theoretical14kInrPer10g,
    theoretical14kInrPerGram,
    adjusted24kInrPer10g,
    adjusted22kInrPer10g,
    adjusted18kInrPer10g,
  };
}

/**
 * Calculates complete Indian retail jewellery cost
 * Formula: Base Metal Cost + Making Charges + GST (3% on metal + making charges)
 */
export function calculateJewelleryCost(params: {
  grams: number;
  ratePerGram: number;
  makingChargePct?: number;
  makingChargeFixedPerGram?: number;
  gstPct?: number; // default 3% in India
}): {
  metalCost: number;
  makingCharges: number;
  taxableAmount: number;
  gstAmount: number;
  totalCost: number;
} {
  const { grams, ratePerGram, makingChargePct = 0, makingChargeFixedPerGram = 0, gstPct = 3 } = params;
  
  if (grams <= 0 || ratePerGram <= 0) {
    return { metalCost: 0, makingCharges: 0, taxableAmount: 0, gstAmount: 0, totalCost: 0 };
  }

  const metalCost = grams * ratePerGram;
  const makingFromPct = metalCost * (makingChargePct / 100);
  const makingFromFixed = grams * makingChargeFixedPerGram;
  const makingCharges = makingFromPct + makingFromFixed;
  const taxableAmount = metalCost + makingCharges;
  const gstAmount = taxableAmount * (gstPct / 100);
  const totalCost = taxableAmount + gstAmount;

  return {
    metalCost,
    makingCharges,
    taxableAmount,
    gstAmount,
    totalCost
  };
}

