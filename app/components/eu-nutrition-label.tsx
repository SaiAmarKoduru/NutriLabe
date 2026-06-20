/**
 * ============================================================
 * EU Nutrition Declaration Label
 * ============================================================
 *
 * Renders a nutrition label compliant with:
 *   EU Regulation No 1169/2011 on the provision of food
 *   information to consumers (FIC Regulation)
 *
 * Key regulatory requirements implemented:
 *
 *   Article 33 — Expression per 100g:
 *     All nutrient values MUST be expressed per 100g or per 100ml.
 *     Optional: may also show per portion alongside per 100g.
 *
 *   Annex XV — Mandatory nutrients and order:
 *     Energy (kJ AND kcal), Fat, Saturates, Carbohydrate,
 *     Sugars, Fibre, Protein, Salt (not Sodium — see note below)
 *
 *   Salt vs Sodium:
 *     EU regulation requires "Salt" not "Sodium".
 *     Salt (g) = Sodium (mg) × 2.5 / 1000
 *     This converts our stored sodium (mg) to salt (g).
 *
 * FIXED (1.3):
 *   Previously: raw per-serving values were shown under "Per 100g" header.
 *   Now: all values are correctly normalized to per-100g using the formula:
 *        per100g = (perServing / servingSize) × 100
 *
 *   Previously: energy shown in kcal only.
 *   Now: energy shown as "X kJ / Y kcal" per Annex XV requirement.
 *
 * Reference:
 *   https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32011R1169
 * ============================================================
 */

"use client";

import { NutritionData } from "../types/nutrition";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/**
 * Standard thermochemical conversion: 1 kcal = 4.184 kJ
 * Required by EU Regulation 1169/2011 Annex XV for energy display.
 */
const KCAL_TO_KJ = 4.184;

/**
 * Salt conversion factor per EU FIC Regulation.
 * Salt (g) = Sodium (mg) × 2.5 / 1000
 * The /1000 converts mg to g.
 */
const SODIUM_MG_TO_SALT_G = 2.5 / 1000;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface EUNutritionLabelProps {
  data: NutritionData;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function EUNutritionLabel({ data }: EUNutritionLabelProps) {
  /**
   * servingSize in grams. Used as the denominator for per-100g normalization.
   * Default to 100 to avoid division by zero if not set.
   */
  const servingSize = Number(data.servingSize) || 100;

  /**
   * per100g
   *
   * Normalizes any per-serving value to its per-100g equivalent.
   * Formula: (perServingValue / servingSize) × 100
   *
   * This is the core fix for this feature. Previously raw data values
   * were displayed directly — now they are always scaled to per-100g.
   *
   * @param value - Per-serving nutrient amount
   * @returns Per-100g amount, rounded to 1 decimal place
   */
  const per100g = (value: number): string => {
    return ((value / servingSize) * 100).toFixed(1);
  };

  /**
   * energyKjPer100g
   *
   * Converts per-serving kcal to per-100g kJ in one step.
   * Steps:
   *   1. kcal → kJ: multiply by 4.184
   *   2. per-serving → per-100g: divide by servingSize, multiply by 100
   *
   * @param kcal - Per-serving energy in kilocalories
   * @returns Per-100g energy in kilojoules, rounded to 0 decimal places
   */
  const energyKjPer100g = (kcal: number): string => {
    return Math.round((kcal / servingSize) * 100 * KCAL_TO_KJ).toString();
  };

  /**
   * energyKjPerServing
   *
   * Converts per-serving kcal to kJ for the per-serving column.
   *
   * @param kcal - Per-serving energy in kilocalories
   * @returns Per-serving energy in kilojoules, rounded to 0 decimal places
   */
  const energyKjPerServing = (kcal: number): string => {
    return Math.round(kcal * KCAL_TO_KJ).toString();
  };

  /**
   * saltPer100g
   *
   * Converts stored sodium (mg, per-serving) to salt (g, per-100g).
   * EU regulation requires "Salt" not "Sodium" on the label.
   * Formula: salt_g_per100g = (sodium_mg_per_serving × 2.5 / 1000 / servingSize) × 100
   *
   * @param sodiumMg - Per-serving sodium in milligrams
   * @returns Per-100g salt in grams, rounded to 2 decimal places
   */
  const saltPer100g = (sodiumMg: number): string => {
    return ((sodiumMg * SODIUM_MG_TO_SALT_G / servingSize) * 100).toFixed(2);
  };

  /**
   * saltPerServing
   *
   * Converts stored sodium (mg, per-serving) to salt (g, per-serving).
   *
   * @param sodiumMg - Per-serving sodium in milligrams
   * @returns Per-serving salt in grams, rounded to 2 decimal places
   */
  const saltPerServing = (sodiumMg: number): string => {
    return (sodiumMg * SODIUM_MG_TO_SALT_G).toFixed(2);
  };

  return (
    <div
      className="w-[400px] bg-white p-8 border border-black text-black"
      id="nutrition-label"
      style={{
        fontFamily: 'Helvetica, Arial, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      {/* ── Title ─────────────────────────────────────────────────────── */}
      <div className="text-3xl font-bold mb-6 text-center">
        Nutrition Declaration
      </div>

      {/* ── Serving reference ─────────────────────────────────────────── */}
      <div className="text-base mb-4 text-gray-700">
        Per serving: {data.servingSize}g &nbsp;|&nbsp; Servings: {data.servingsPerContainer}
      </div>

      {/* ── Nutrient Table ────────────────────────────────────────────── */}
      <table className="w-full text-base">
        <thead>
          {/*
            Column headers per EU FIC Regulation Article 33.
            We show both Per Serving (optional) and Per 100g (mandatory).
          */}
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 font-bold">Nutrient</th>
            <th className="text-right py-2 font-bold">Per Serving</th>
            <th className="text-right py-2 font-bold">Per 100g</th>
          </tr>
        </thead>
        <tbody>

          {/*
            ── Energy Row ───────────────────────────────────────────────
            EU Annex XV requires energy in BOTH kJ and kcal.
            Format: "X kJ / Y kcal"
            FIXED: values now correctly reflect per-100g normalization.
          */}
          <tr className="border-b border-gray-300">
            <td className="py-2 font-semibold">Energy</td>
            <td className="text-right py-2 text-sm">
              {energyKjPerServing(data.calories)} kJ
              <br />
              <span className="text-gray-600">{data.calories.toFixed(0)} kcal</span>
            </td>
            <td className="text-right py-2 text-sm">
              {energyKjPer100g(data.calories)} kJ
              <br />
              <span className="text-gray-600">{per100g(data.calories)} kcal</span>
            </td>
          </tr>

          {/* ── Fat ──────────────────────────────────────────────────── */}
          <tr className="border-b border-gray-300">
            <td className="py-2 font-semibold">Fat</td>
            <td className="text-right py-2">{data.totalFat.toFixed(1)}g</td>
            <td className="text-right py-2">{per100g(data.totalFat)}g</td>
          </tr>

          {/* ── Saturates (mandatory sub-row per Annex XV) ───────────── */}
          <tr className="border-b border-gray-300">
            <td className="py-2 pl-6 text-sm">of which saturates</td>
            <td className="text-right py-2 text-sm">{data.saturatedFat.toFixed(1)}g</td>
            <td className="text-right py-2 text-sm">{per100g(data.saturatedFat)}g</td>
          </tr>

          {/* ── Carbohydrate ─────────────────────────────────────────── */}
          <tr className="border-b border-gray-300">
            <td className="py-2 font-semibold">Carbohydrate</td>
            <td className="text-right py-2">{data.totalCarbohydrates.toFixed(1)}g</td>
            <td className="text-right py-2">{per100g(data.totalCarbohydrates)}g</td>
          </tr>

          {/* ── Sugars (mandatory sub-row per Annex XV) ──────────────── */}
          <tr className="border-b border-gray-300">
            <td className="py-2 pl-6 text-sm">of which sugars</td>
            <td className="text-right py-2 text-sm">{data.sugars.toFixed(1)}g</td>
            <td className="text-right py-2 text-sm">{per100g(data.sugars)}g</td>
          </tr>

          {/* ── Fibre ────────────────────────────────────────────────── */}
          <tr className="border-b border-gray-300">
            <td className="py-2 font-semibold">Fibre</td>
            <td className="text-right py-2">{data.dietaryFiber.toFixed(1)}g</td>
            <td className="text-right py-2">{per100g(data.dietaryFiber)}g</td>
          </tr>

          {/* ── Protein ──────────────────────────────────────────────── */}
          <tr className="border-b border-gray-300">
            <td className="py-2 font-semibold">Protein</td>
            <td className="text-right py-2">{data.protein.toFixed(1)}g</td>
            <td className="text-right py-2">{per100g(data.protein)}g</td>
          </tr>

          {/*
            ── Salt ─────────────────────────────────────────────────────
            EU FIC uses "Salt" not "Sodium".
            Our NutritionData stores sodium in mg (per-serving).
            We convert: salt(g) = sodium(mg) × 2.5 / 1000
          */}
          <tr className="border-b border-gray-300">
            <td className="py-2 font-semibold">Salt</td>
            <td className="text-right py-2">{saltPerServing(data.sodium)}g</td>
            <td className="text-right py-2">{saltPer100g(data.sodium)}g</td>
          </tr>

        </tbody>
      </table>

      {/* ── Reference Intake Footer ───────────────────────────────────── */}
      {/*
        EU FIC Regulation Article 35 allows reference intake (RI) statements.
        2000 kcal / 8400 kJ is the standard adult daily energy reference.
      */}
      <div className="mt-6 text-xs leading-tight text-gray-600">
        Reference intake of an average adult (8400 kJ / 2000 kcal).
      </div>
    </div>
  );
}
