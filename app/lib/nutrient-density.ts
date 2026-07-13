/**
 * ============================================================
 * Nutrient Density Score (NDS)
 * ============================================================
 *
 * Measures nutritional value per calorie — how "nutrient-dense"
 * a food is relative to its energy content.
 *
 * Methodology:
 *   Adapted from Drewnowski A. (2005). Concept of a nutritious food:
 *   toward a nutrient density score. Nutrition Reviews, 63(2), 51-59.
 *   DOI: 10.1111/j.1753-4887.2005.tb00124.x
 *
 * Algorithm:
 *   1. Score beneficial nutrients as % of Daily Value per 100 kcal
 *   2. Apply penalty for nutrients to limit (sat fat, sodium, sugars)
 *   3. Normalize to 0-100 scale
 *
 * Differs from Nutrition Quality Score (FSA model) in that:
 *   - NDS is calorie-normalized (favors low-calorie nutrient-rich foods)
 *   - NQS is absolute per-serving (favors reasonable portion sizes)
 *   Both together give a complete nutritional picture.
 *
 * All functions are pure — no side effects.
 * ============================================================
 */

import { NutritionData } from '../types/nutrition';

// ─────────────────────────────────────────────
// FDA Daily Values (2020) — per 2000 kcal diet
// ─────────────────────────────────────────────

const DAILY_VALUES = {
  protein: 50,          // g
  dietaryFiber: 28,     // g
  calcium: 1300,        // mg
  iron: 18,             // mg
  potassium: 4700,      // mg
  vitaminD: 20,         // mcg
  // Nutrients to limit
  saturatedFat: 20,     // g
  sodium: 2300,         // mg
  sugars: 50,           // g (added sugars DV)
} as const;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type NdsBand = 'excellent' | 'good' | 'moderate' | 'low' | 'poor';

export interface NdsNutrientScore {
  nutrient: string;
  value: number;
  unit: string;
  dvPercent: number;      // % of daily value per 100 kcal
  contribution: number;   // weighted contribution to final score
  isBeneficial: boolean;
}

export interface NutrientDensityResult {
  score: number;          // 0-100
  band: NdsBand;
  label: string;
  color: string;
  gaugeColor: string;
  beneficialScore: number;   // sum of beneficial nutrient contributions
  penaltyScore: number;      // sum of nutrient-to-limit penalties
  nutrients: NdsNutrientScore[];
  interpretation: string;
  researchNote: string;
  hasInsufficientData: boolean;
}

// ─────────────────────────────────────────────
// Band Config
// ─────────────────────────────────────────────

const BAND_CONFIG: Record<NdsBand, {
  label: string; color: string; gaugeColor: string; interpretation: string;
}> = {
  excellent: {
    label: 'Excellent Density',
    color: 'text-green-700',
    gaugeColor: '#16a34a',
    interpretation: 'Provides exceptional nutritional value per calorie. High in beneficial nutrients relative to energy content.',
  },
  good: {
    label: 'Good Density',
    color: 'text-lime-700',
    gaugeColor: '#65a30d',
    interpretation: 'Provides good nutritional value per calorie. A solid choice for meeting daily nutrient needs.',
  },
  moderate: {
    label: 'Moderate Density',
    color: 'text-amber-700',
    gaugeColor: '#d97706',
    interpretation: 'Moderate nutritional value per calorie. Can fit into a balanced diet when portion-controlled.',
  },
  low: {
    label: 'Low Density',
    color: 'text-orange-700',
    gaugeColor: '#ea580c',
    interpretation: 'Provides limited nutritional value relative to its calorie content. Consider more nutrient-dense alternatives.',
  },
  poor: {
    label: 'Poor Density',
    color: 'text-red-700',
    gaugeColor: '#dc2626',
    interpretation: 'Provides minimal beneficial nutrients per calorie. High in energy-dense nutrients to limit.',
  },
};

function getBand(score: number): NdsBand {
  if (score >= 75) return 'excellent';
  if (score >= 55) return 'good';
  if (score >= 35) return 'moderate';
  if (score >= 15) return 'low';
  return 'poor';
}

// ─────────────────────────────────────────────
// Main Calculation
// ─────────────────────────────────────────────

/**
 * calculateNutrientDensity
 *
 * Computes NDS from per-serving NutritionData.
 *
 * Steps:
 *   1. Normalize all nutrients to per-100-kcal basis
 *   2. Calculate % DV for each nutrient per 100 kcal
 *   3. Sum beneficial nutrients (capped at 100% DV each to prevent gaming)
 *   4. Calculate penalty from nutrients-to-limit
 *   5. Final score = (beneficial - penalty) normalized to 0-100
 *
 * @param data - Per-serving NutritionData
 */
export function calculateNutrientDensity(
  data: NutritionData
): NutrientDensityResult {
  // Guard: insufficient data
  if (!data.calories || data.calories < 1) {
    return {
      score: 0,
      band: 'poor',
      ...BAND_CONFIG.poor,
      beneficialScore: 0,
      penaltyScore: 0,
      nutrients: [],
      researchNote: 'Drewnowski A. (2005). Nutrition Reviews, 63(2), 51–59.',
      hasInsufficientData: true,
    };
  }

  const per100kcal = 100 / data.calories;

  // ── Beneficial nutrients ─────────────────────────────────────────────
  const beneficialDefs: Array<{
    key: keyof NutritionData;
    label: string;
    unit: string;
    dv: number;
    weight: number;   // relative importance weight
  }> = [
    { key: 'protein',       label: 'Protein',       unit: 'g',   dv: DAILY_VALUES.protein,       weight: 1.5 },
    { key: 'dietaryFiber',  label: 'Dietary Fiber',  unit: 'g',   dv: DAILY_VALUES.dietaryFiber,  weight: 1.5 },
    { key: 'calcium',       label: 'Calcium',        unit: 'mg',  dv: DAILY_VALUES.calcium,       weight: 1.0 },
    { key: 'iron',          label: 'Iron',            unit: 'mg',  dv: DAILY_VALUES.iron,          weight: 1.0 },
    { key: 'potassium',     label: 'Potassium',       unit: 'mg',  dv: DAILY_VALUES.potassium,     weight: 1.0 },
    { key: 'vitaminD',      label: 'Vitamin D',       unit: 'mcg', dv: DAILY_VALUES.vitaminD,      weight: 0.8 },
  ];

  const nutrientScores: NdsNutrientScore[] = [];
  let rawBeneficial = 0;
  const totalBeneficialWeight = beneficialDefs.reduce((sum, d) => sum + d.weight, 0);

  for (const def of beneficialDefs) {
    const value = (data[def.key] as number) ?? 0;
    const valuePer100kcal = value * per100kcal;
    const dvPercent = (valuePer100kcal / def.dv) * 100;
    // Cap at 100% DV to prevent a single nutrient from dominating
    const capped = Math.min(dvPercent, 100);
    const contribution = (capped * def.weight) / totalBeneficialWeight;
    rawBeneficial += contribution;

    nutrientScores.push({
      nutrient: def.label,
      value: Math.round(valuePer100kcal * 10) / 10,
      unit: def.unit,
      dvPercent: Math.round(dvPercent),
      contribution: Math.round(contribution * 10) / 10,
      isBeneficial: true,
    });
  }

  // ── Nutrients to limit ───────────────────────────────────────────────
  const limitDefs: Array<{
    key: keyof NutritionData;
    label: string;
    unit: string;
    dv: number;
    weight: number;
  }> = [
    { key: 'saturatedFat',  label: 'Saturated Fat', unit: 'g',  dv: DAILY_VALUES.saturatedFat, weight: 1.2 },
    { key: 'sodium',        label: 'Sodium',         unit: 'mg', dv: DAILY_VALUES.sodium,       weight: 1.0 },
    { key: 'sugars',        label: 'Sugars',          unit: 'g',  dv: DAILY_VALUES.sugars,       weight: 0.8 },
  ];

  let rawPenalty = 0;
  const totalPenaltyWeight = limitDefs.reduce((sum, d) => sum + d.weight, 0);

  for (const def of limitDefs) {
    const value = (data[def.key] as number) ?? 0;
    const valuePer100kcal = value * per100kcal;
    const dvPercent = (valuePer100kcal / def.dv) * 100;
    const capped = Math.min(dvPercent, 100);
    const contribution = (capped * def.weight) / totalPenaltyWeight;
    rawPenalty += contribution;

    nutrientScores.push({
      nutrient: def.label,
      value: Math.round(valuePer100kcal * 10) / 10,
      unit: def.unit,
      dvPercent: Math.round(dvPercent),
      contribution: Math.round(contribution * 10) / 10,
      isBeneficial: false,
    });
  }

  // ── Final score ──────────────────────────────────────────────────────
  // rawBeneficial and rawPenalty are both 0-100
  // Score = beneficial - (penalty * 0.5) to avoid over-penalization
  const raw = rawBeneficial - rawPenalty * 0.5;
  const score = Math.max(0, Math.min(100, Math.round(raw)));
  const band = getBand(score);
  const config = BAND_CONFIG[band];

  return {
    score,
    band,
    ...config,
    beneficialScore: Math.round(rawBeneficial),
    penaltyScore: Math.round(rawPenalty),
    nutrients: nutrientScores,
    researchNote: 'Drewnowski A. (2005). Concept of a nutritious food: toward a nutrient density score. Nutrition Reviews, 63(2), 51–59.',
    hasInsufficientData: false,
  };
}