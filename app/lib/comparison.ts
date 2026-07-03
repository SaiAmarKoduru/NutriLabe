/**
 * ============================================================
 * Product Comparison Library — v2
 * ============================================================
 *
 * UPDATED (2.4 fix):
 *   - SavedProduct now includes `source` and optional `ingredients`
 *   - Separate storage keys for Product A and Product B
 *   - saveProductB / loadProductB / clearProductB added
 *   - clearAllProducts helper for "Start Over"
 *
 * All comparison logic (compareProducts, determineWinner etc.)
 * is unchanged — it only needs NutritionData regardless of source.
 * ============================================================
 */

import { NutritionData } from '../types/nutrition';
import { RecipeIngredient } from '../types/recipe';

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
  higherIsBetter: boolean;
  difference: number;
  percentDiff: number;
}

export interface ComparisonResult {
  nutrients: NutrientComparison[];
  scoreWinner: Winner;
  overallWinner: Winner;
  productAWins: number;
  productBWins: number;
  ties: number;
}

/**
 * SavedProduct
 *
 * Stored in sessionStorage for both Product A and Product B.
 * source identifies which workflow produced this product.
 * ingredients is present only when built via ingredient builder.
 * Comparison engine only uses `data` — source and ingredients
 * are used for display context (allergens, dietary tags).
 */
export interface SavedProduct {
  name: string;
  data: NutritionData;
  source: 'generator' | 'ingredient-builder';
  ingredients?: RecipeIngredient[];
  savedAt: number;
}

// ─────────────────────────────────────────────
// Storage Keys
// ─────────────────────────────────────────────

const KEY_PRODUCT_A = 'nutrilabe_product_a';
const KEY_PRODUCT_B = 'nutrilabe_product_b';

// ─────────────────────────────────────────────
// Storage Helpers
// ─────────────────────────────────────────────

function saveToSession(key: string, payload: SavedProduct): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify(payload));
  } catch (e) {
    console.error(`Failed to save ${key} to sessionStorage:`, e);
  }
}

function loadFromSession(key: string): SavedProduct | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as SavedProduct;
  } catch {
    return null;
  }
}

function removeFromSession(key: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(key);
}

// ─────────────────────────────────────────────
// Product A API
// ─────────────────────────────────────────────

/**
 * saveProductA
 * Called from Generator and Ingredient Builder when user
 * clicks "Save & Compare".
 */
export function saveProductA(
  name: string,
  data: NutritionData,
  source: SavedProduct['source'],
  ingredients?: RecipeIngredient[]
): void {
  saveToSession(KEY_PRODUCT_A, { name, data, source, ingredients, savedAt: Date.now() });
}

export function loadProductA(): SavedProduct | null {
  return loadFromSession(KEY_PRODUCT_A);
}

export function clearProductA(): void {
  removeFromSession(KEY_PRODUCT_A);
}

// ─────────────────────────────────────────────
// Product B API
// ─────────────────────────────────────────────

/**
 * saveProductB
 * Called from Generator and Ingredient Builder when they detect
 * ?mode=compare_b in the URL and user clicks "Save as Product B".
 */
export function saveProductB(
  name: string,
  data: NutritionData,
  source: SavedProduct['source'],
  ingredients?: RecipeIngredient[]
): void {
  saveToSession(KEY_PRODUCT_B, { name, data, source, ingredients, savedAt: Date.now() });
}

export function loadProductB(): SavedProduct | null {
  return loadFromSession(KEY_PRODUCT_B);
}

export function clearProductB(): void {
  removeFromSession(KEY_PRODUCT_B);
}

/**
 * clearAllProducts
 * Used by "Start Over" button on compare page.
 */
export function clearAllProducts(): void {
  clearProductA();
  clearProductB();
}

// ─────────────────────────────────────────────
// Legacy compatibility
// ─────────────────────────────────────────────

/**
 * saveProductForComparison
 * Kept for backward compatibility with existing generator
 * and ingredient builder pages that call this.
 * Maps to saveProductA internally.
 */
export function saveProductForComparison(
  name: string,
  data: NutritionData,
  source: SavedProduct['source'] = 'generator',
  ingredients?: RecipeIngredient[]
): void {
  saveProductA(name, data, source, ingredients);
}

// ─────────────────────────────────────────────
// Nutrient Metadata
// ─────────────────────────────────────────────

const NUTRIENT_META: Array<{
  key: keyof NutritionData;
  label: string;
  unit: string;
  higherIsBetter: boolean;
}> = [
  { key: 'calories',           label: 'Calories',       unit: 'kcal', higherIsBetter: false },
  { key: 'totalFat',           label: 'Total Fat',      unit: 'g',    higherIsBetter: false },
  { key: 'saturatedFat',       label: 'Saturated Fat',  unit: 'g',    higherIsBetter: false },
  { key: 'transFat',           label: 'Trans Fat',      unit: 'g',    higherIsBetter: false },
  { key: 'cholesterol',        label: 'Cholesterol',    unit: 'mg',   higherIsBetter: false },
  { key: 'sodium',             label: 'Sodium',         unit: 'mg',   higherIsBetter: false },
  { key: 'totalCarbohydrates', label: 'Carbohydrates',  unit: 'g',    higherIsBetter: false },
  { key: 'dietaryFiber',       label: 'Dietary Fiber',  unit: 'g',    higherIsBetter: true  },
  { key: 'sugars',             label: 'Sugars',         unit: 'g',    higherIsBetter: false },
  { key: 'protein',            label: 'Protein',        unit: 'g',    higherIsBetter: true  },
  { key: 'vitaminD',           label: 'Vitamin D',      unit: 'mcg',  higherIsBetter: true  },
  { key: 'calcium',            label: 'Calcium',        unit: 'mg',   higherIsBetter: true  },
  { key: 'iron',               label: 'Iron',           unit: 'mg',   higherIsBetter: true  },
  { key: 'potassium',          label: 'Potassium',      unit: 'mg',   higherIsBetter: true  },
];

const TIE_THRESHOLD_PERCENT = 1;

// ─────────────────────────────────────────────
// Comparison Engine (unchanged)
// ─────────────────────────────────────────────

function determineWinner(
  valueA: number,
  valueB: number,
  higherIsBetter: boolean
): Winner {
  if (valueA === 0 && valueB === 0) return 'neutral';
  const maxValue = Math.max(valueA, valueB);
  const diff = Math.abs(valueA - valueB);
  const percentDiff = maxValue > 0 ? (diff / maxValue) * 100 : 0;
  if (percentDiff <= TIE_THRESHOLD_PERCENT) return 'tie';
  if (higherIsBetter) return valueA > valueB ? 'a' : 'b';
  return valueA < valueB ? 'a' : 'b';
}

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
        key, label, unit, valueA, valueB, winner, higherIsBetter,
        difference: Math.abs(valueA - valueB),
        percentDiff: maxValue > 0
          ? Math.round((Math.abs(valueA - valueB) / maxValue) * 100)
          : 0,
      };
    }
  );

  const productAWins = nutrients.filter((n) => n.winner === 'a').length;
  const productBWins = nutrients.filter((n) => n.winner === 'b').length;
  const ties = nutrients.filter((n) => n.winner === 'tie' || n.winner === 'neutral').length;
  const scoreWinner: Winner =
    scoreA > scoreB + 1 ? 'a' : scoreB > scoreA + 1 ? 'b' : 'tie';
  const totalA = productAWins + (scoreWinner === 'a' ? 2 : 0);
  const totalB = productBWins + (scoreWinner === 'b' ? 2 : 0);
  const overallWinner: Winner = totalA > totalB ? 'a' : totalB > totalA ? 'b' : 'tie';

  return { nutrients, scoreWinner, overallWinner, productAWins, productBWins, ties };
}