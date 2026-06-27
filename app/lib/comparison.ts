/**
 * ============================================================
 * Product Comparison Library
 * ============================================================
 *
 * Pure functions for comparing two NutritionData objects.
 *
 * Determines per-nutrient winners based on whether a nutrient
 * is "lower is better" (sodium, saturated fat, sugars) or
 * "higher is better" (protein, fiber, vitamins).
 *
 * All functions are pure — no side effects, fully testable.
 * ============================================================
 */

import { NutritionData } from '../types/nutrition';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type Winner = 'a' | 'b' | 'tie' | 'neutral';

export interface NutrientComparison {
  key: keyof NutritionData;
  label: string;
  unit: string;
  valueA: number;
  valueB: number;
  winner: Winner;
  /** Direction: true = higher is better, false = lower is better */
  higherIsBetter: boolean;
  difference: number;       // absolute difference
  percentDiff: number;      // % difference relative to higher value
}

export interface ComparisonResult {
  nutrients: NutrientComparison[];
  scoreWinner: Winner;
  overallWinner: Winner;
  productAWins: number;
  productBWins: number;
  ties: number;
}

// ─────────────────────────────────────────────
// Nutrient Metadata
// ─────────────────────────────────────────────

/**
 * NUTRIENT_META
 * Defines display label, unit, and direction for each tracked nutrient.
 * higherIsBetter = true  → green highlight for higher value
 * higherIsBetter = false → green highlight for lower value
 */
const NUTRIENT_META: Array<{
  key: keyof NutritionData;
  label: string;
  unit: string;
  higherIsBetter: boolean;
}> = [
  { key: 'calories',          label: 'Calories',          unit: 'kcal', higherIsBetter: false },
  { key: 'totalFat',          label: 'Total Fat',          unit: 'g',    higherIsBetter: false },
  { key: 'saturatedFat',      label: 'Saturated Fat',      unit: 'g',    higherIsBetter: false },
  { key: 'transFat',          label: 'Trans Fat',          unit: 'g',    higherIsBetter: false },
  { key: 'cholesterol',       label: 'Cholesterol',        unit: 'mg',   higherIsBetter: false },
  { key: 'sodium',            label: 'Sodium',             unit: 'mg',   higherIsBetter: false },
  { key: 'totalCarbohydrates',label: 'Carbohydrates',      unit: 'g',    higherIsBetter: false },
  { key: 'dietaryFiber',      label: 'Dietary Fiber',      unit: 'g',    higherIsBetter: true  },
  { key: 'sugars',            label: 'Sugars',             unit: 'g',    higherIsBetter: false },
  { key: 'protein',           label: 'Protein',            unit: 'g',    higherIsBetter: true  },
  { key: 'vitaminD',          label: 'Vitamin D',          unit: 'mcg',  higherIsBetter: true  },
  { key: 'calcium',           label: 'Calcium',            unit: 'mg',   higherIsBetter: true  },
  { key: 'iron',              label: 'Iron',               unit: 'mg',   higherIsBetter: true  },
  { key: 'potassium',         label: 'Potassium',          unit: 'mg',   higherIsBetter: true  },
];

/** Difference threshold below which we call it a tie (1% of max value) */
const TIE_THRESHOLD_PERCENT = 1;

// ─────────────────────────────────────────────
// Core Functions
// ─────────────────────────────────────────────

/**
 * determineWinner
 *
 * Determines which product wins for a single nutrient.
 * Accounts for direction (higher/lower is better) and tie threshold.
 *
 * @param valueA         - Nutrient value for Product A
 * @param valueB         - Nutrient value for Product B
 * @param higherIsBetter - Whether higher value is nutritionally preferable
 * @returns Winner ('a', 'b', 'tie', or 'neutral' if both zero)
 */
function determineWinner(
  valueA: number,
  valueB: number,
  higherIsBetter: boolean
): Winner {
  // Both zero — no meaningful comparison
  if (valueA === 0 && valueB === 0) return 'neutral';

  const maxValue = Math.max(valueA, valueB);
  const diff = Math.abs(valueA - valueB);
  const percentDiff = maxValue > 0 ? (diff / maxValue) * 100 : 0;

  // Within tie threshold — call it a tie
  if (percentDiff <= TIE_THRESHOLD_PERCENT) return 'tie';

  if (higherIsBetter) {
    return valueA > valueB ? 'a' : 'b';
  } else {
    return valueA < valueB ? 'a' : 'b';
  }
}

/**
 * compareProducts
 *
 * Compares two NutritionData objects across all tracked nutrients.
 * Returns per-nutrient comparisons and an overall winner tally.
 *
 * @param dataA  - Nutrition data for Product A (per serving)
 * @param dataB  - Nutrition data for Product B (per serving)
 * @param scoreA - Nutrition Quality Score for Product A
 * @param scoreB - Nutrition Quality Score for Product B
 */
export function compareProducts(
  dataA: NutritionData,
  dataB: NutritionData,
  scoreA: number,
  scoreB: number
): ComparisonResult {
  const nutrients: NutrientComparison[] = NUTRIENT_META.map(
    ({ key, label, unit, higherIsBetter }) => {
      const valueA = (dataA[key] as number) ?? 0;
      const valueB = (dataB[key] as number) ?? 0;
      const winner = determineWinner(valueA, valueB, higherIsBetter);
      const maxValue = Math.max(valueA, valueB);

      return {
        key,
        label,
        unit,
        valueA,
        valueB,
        winner,
        higherIsBetter,
        difference: Math.abs(valueA - valueB),
        percentDiff: maxValue > 0
          ? Math.round((Math.abs(valueA - valueB) / maxValue) * 100)
          : 0,
      };
    }
  );

  // Tally wins
  const productAWins = nutrients.filter((n) => n.winner === 'a').length;
  const productBWins = nutrients.filter((n) => n.winner === 'b').length;
  const ties = nutrients.filter(
    (n) => n.winner === 'tie' || n.winner === 'neutral'
  ).length;

  // Score winner
  const scoreWinner: Winner =
    scoreA > scoreB + 1 ? 'a' :
    scoreB > scoreA + 1 ? 'b' : 'tie';

  // Overall winner — based on nutrient wins + score
  const totalA = productAWins + (scoreWinner === 'a' ? 2 : 0);
  const totalB = productBWins + (scoreWinner === 'b' ? 2 : 0);
  const overallWinner: Winner =
    totalA > totalB ? 'a' :
    totalB > totalA ? 'b' : 'tie';

  return {
    nutrients,
    scoreWinner,
    overallWinner,
    productAWins,
    productBWins,
    ties,
  };
}

// ─────────────────────────────────────────────
// Session Storage Helpers
// ─────────────────────────────────────────────

const STORAGE_KEY = 'nutrilabe_compare_product';

export interface SavedProduct {
  name: string;
  data: NutritionData;
  savedAt: number;
}

/**
 * saveProductForComparison
 * Saves a product to sessionStorage for the comparison page.
 */
export function saveProductForComparison(
  name: string,
  data: NutritionData
): void {
  if (typeof window === 'undefined') return;
  const payload: SavedProduct = { name, data, savedAt: Date.now() };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

/**
 * loadSavedProduct
 * Loads the saved product from sessionStorage.
 * Returns null if nothing is saved or data is corrupted.
 */
export function loadSavedProduct(): SavedProduct | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedProduct;
  } catch {
    return null;
  }
}

/**
 * clearSavedProduct
 * Removes saved product from sessionStorage.
 */
export function clearSavedProduct(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(STORAGE_KEY);
}