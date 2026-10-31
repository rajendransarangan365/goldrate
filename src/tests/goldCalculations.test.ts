import { describe, it, expect } from 'vitest';
import {
  TROY_OUNCE_IN_GRAMS,
  calculateUsdPerGram,
  calculateTheoretical24kInrPer10g,
  calculateGoldPrices,
  calculateJewelleryCost
} from '../utils/goldCalculations';

describe('Gold Calculation Formulas', () => {
  it('correctly defines troy ounce in grams', () => {
    expect(TROY_OUNCE_IN_GRAMS).toBeCloseTo(31.1034768, 7);
  });

  it('calculates USD per gram accurately', () => {
    const usdPerGram = calculateUsdPerGram(3996.78);
    // 3996.78 / 31.1034768 = ~128.4994
    expect(usdPerGram).toBeCloseTo(128.4994, 2);
  });

  it('calculates theoretical 24K gold price per 10 grams matching prompt specification', () => {
    // Inputs specified in prompt: $3,996.78 and 95.21 USD/INR -> ~122,344 per 10g
    const theoretical10g = calculateTheoretical24kInrPer10g(3996.78, 95.21);
    expect(Math.round(theoretical10g)).toBe(122344);
  });

  it('calculates 22K and 18K estimates accurately', () => {
    const prices = calculateGoldPrices({
      xauUsdPerOunce: 3996.78,
      usdInrRate: 95.21
    });

    const expected24k = 122344.34;
    expect(prices.theoretical24kInrPer10g).toBeCloseTo(expected24k, 0);

    // 22K is 22/24 of 24K
    const expected22k = expected24k * (22 / 24);
    expect(prices.theoretical22kInrPer10g).toBeCloseTo(expected22k, 0);

    // 18K is 18/24 of 24K
    const expected18k = expected24k * (18 / 24);
    expect(prices.theoretical18kInrPer10g).toBeCloseTo(expected18k, 0);
  });

  it('applies custom percentage and fixed adjustments correctly', () => {
    const prices = calculateGoldPrices({
      xauUsdPerOunce: 3000,
      usdInrRate: 90,
      premiumAdjustmentPct: 5, // +5%
      fixedAdjustmentInr: 1000 // +1000 INR
    });

    const base24k = (3000 * 90 / TROY_OUNCE_IN_GRAMS) * 10;
    const expectedAdjusted = (base24k * 1.05) + 1000;
    expect(prices.adjusted24kInrPer10g).toBeCloseTo(expectedAdjusted, 2);
  });

  it('throws errors on invalid inputs', () => {
    expect(() => calculateTheoretical24kInrPer10g(-100, 90)).toThrow();
    expect(() => calculateTheoretical24kInrPer10g(3000, 0)).toThrow();
    expect(() => calculateTheoretical24kInrPer10g(NaN, 90)).toThrow();
  });

  it('calculates retail jewellery total with making charges and 3% GST', () => {
    const result = calculateJewelleryCost({
      grams: 10,
      ratePerGram: 10000,
      makingChargePct: 10, // 10% making charge = 10,000 INR
      gstPct: 3            // 3% GST on (100,000 + 10,000) = 3,300 INR
    });

    expect(result.metalCost).toBe(100000);
    expect(result.makingCharges).toBe(10000);
    expect(result.taxableAmount).toBe(110000);
    expect(result.gstAmount).toBe(3300);
    expect(result.totalCost).toBe(113300);
  });
});

