/**
 * ============================================================
 * Australian Nutrition Information Panel (NIP)
 * ============================================================
 *
 * Renders a nutrition label compliant with:
 *   Food Standards Australia New Zealand (FSANZ)
 *   Australia New Zealand Food Standards Code — Standard 1.2.8
 *
 * Key regulatory requirements implemented:
 *   - Mandatory display of both Per Serving AND Per 100g columns
 *   - Energy MUST be shown in kilojoules (kJ), NOT kilocalories
 *   - Core nutrients: energy, protein, fat, saturated fat,
 *     carbohydrate, sugars, dietary fibre, sodium
 *   - Servings per package and serving size must appear in header
 *
 * FIXED (1.2):
 *   Previously: data.calories (kcal) was displayed with a "kJ" label — wrong unit.
 *   Now: kcal values are correctly converted to kJ using the standard
 *        conversion factor of 1 kcal = 4.184 kJ before display.
 *
 * Reference:
 *   https://www.foodstandards.gov.au/consumer/labelling/panels
 * ============================================================
 */

import React from 'react';
import { NutritionData } from '../types/nutrition';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/**
 * Standard thermochemical conversion factor.
 * 1 kilocalorie (kcal) = 4.184 kilojoules (kJ)
 * Source: FSANZ Food Standards Code, Schedule 13
 */
const KCAL_TO_KJ = 4.184;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AustraliaNutritionLabelProps {
  data: NutritionData;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export const AustraliaNutritionLabel: React.FC<AustraliaNutritionLabelProps> = ({ data }) => {
  /**
   * servingSize is stored as a number in NutritionData (grams).
   * We default to 100 if not set to avoid division by zero in per-100g math.
   */
  const servingSize: number = Number(data.servingSize) || 100;

  /**
   * calculatePer100g
   *
   * Scales any per-serving nutrient value to its per-100g equivalent.
   * Formula: (value / servingSize) * 100
   *
   * @param value - Per-serving nutrient value
   * @returns Per-100g nutrient value string, rounded to 1 decimal place
   */
  const calculatePer100g = (value: number): string => {
    return ((value * 100) / servingSize).toFixed(1);
  };

  /**
   * convertToKj
   *
   * Converts a kilocalorie (kcal) value to kilojoules (kJ).
   * FSANZ Standard 1.2.8 mandates energy labelling in kJ only.
   *
   * @param kcal - Energy value in kilocalories
   * @returns Energy in kilojoules as string, rounded to 1 decimal place
   */
  const convertToKj = (kcal: number): string => {
    return (kcal * KCAL_TO_KJ).toFixed(1);
  };

  /**
   * calculateEnergyPer100gKj
   *
   * Combines unit conversion and per-100g scaling for energy.
   * Steps:
   *   1. Convert per-serving kcal to per-serving kJ
   *   2. Scale per-serving kJ to per-100g kJ
   *
   * @param kcal - Per-serving energy in kilocalories
   * @returns Per-100g energy in kilojoules as string
   */
  const calculateEnergyPer100gKj = (kcal: number): string => {
    const perServingKj = kcal * KCAL_TO_KJ;
    return ((perServingKj * 100) / servingSize).toFixed(1);
  };

  return (
    <div className="nutrition-label bg-white p-4 border-2 border-black max-w-md font-sans text-sm">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="text-center font-bold border-b-2 border-black pb-2 mb-2">
        <h2 className="text-lg">NUTRITION INFORMATION</h2>
        <p>Servings per package: {data.servingsPerContainer}</p>
        <p>Serving size: {data.servingSize}g</p>
      </div>

      {/* ── Nutrient Table ────────────────────────────────────────────── */}
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-1"></th>
            <th className="text-right py-1">Per Serving</th>
            <th className="text-right py-1">Per 100g</th>
          </tr>
        </thead>
        <tbody>

          {/*
            ── Energy Row ───────────────────────────────────────────────
            FIXED (1.2): data.calories is stored in kcal.
            We convert to kJ before display using the 4.184 factor.
            Previously this row showed kcal values labelled as kJ.
          */}
          <tr className="border-b border-black">
            <td className="py-1 font-medium">Energy</td>
            <td className="text-right">{convertToKj(data.calories)}kJ</td>
            <td className="text-right">{calculateEnergyPer100gKj(data.calories)}kJ</td>
          </tr>

          {/* ── Protein ──────────────────────────────────────────────── */}
          <tr className="border-b border-black">
            <td className="py-1">Protein</td>
            <td className="text-right">{data.protein.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.protein)}g</td>
          </tr>

          {/* ── Total Fat ────────────────────────────────────────────── */}
          <tr className="border-b border-black">
            <td className="py-1">Fat, total</td>
            <td className="text-right">{data.totalFat.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.totalFat)}g</td>
          </tr>

          {/* ── Saturated Fat (indented sub-row per FSANZ format) ────── */}
          <tr className="border-b border-black">
            <td className="py-1 pl-4">- saturated</td>
            <td className="text-right">{data.saturatedFat.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.saturatedFat)}g</td>
          </tr>

          {/* ── Total Carbohydrate ───────────────────────────────────── */}
          <tr className="border-b border-black">
            <td className="py-1">Carbohydrate</td>
            <td className="text-right">{data.totalCarbohydrates.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.totalCarbohydrates)}g</td>
          </tr>

          {/* ── Sugars (indented sub-row per FSANZ format) ───────────── */}
          <tr className="border-b border-black">
            <td className="py-1 pl-4">- sugars</td>
            <td className="text-right">{data.sugars.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.sugars)}g</td>
          </tr>

          {/* ── Dietary Fibre ────────────────────────────────────────── */}
          <tr className="border-b border-black">
            <td className="py-1">Dietary fibre</td>
            <td className="text-right">{data.dietaryFiber.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.dietaryFiber)}g</td>
          </tr>

          {/* ── Sodium ───────────────────────────────────────────────── */}
          <tr className="border-b border-black">
            <td className="py-1">Sodium</td>
            <td className="text-right">{data.sodium.toFixed(1)}mg</td>
            <td className="text-right">{calculatePer100g(data.sodium)}mg</td>
          </tr>

        </tbody>
      </table>

      {/* ── Footer Disclaimer ─────────────────────────────────────────── */}
      <div className="mt-4 text-xs leading-tight text-gray-600">
        <p>* Percentage Daily Intakes are based on an average adult diet of 8700kJ.</p>
        <p>Your daily intakes may be higher or lower depending on your energy needs.</p>
      </div>

    </div>
  );
};
