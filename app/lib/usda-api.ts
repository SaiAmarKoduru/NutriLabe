/**
 * ============================================================
 * USDA FoodData Central API Client
 * ============================================================
 *
 * Responsibilities:
 *   - Search the USDA FoodData Central database for food items
 *   - Fetch detailed nutrition data for a specific food item
 *   - Extract and normalize nutrition data into our NutritionData format
 *   - Convert measurement units to grams for consistent calculations
 *   - Scale ingredient nutrition by quantity
 *
 * FIXED (1.1):
 *   - Removed unused `nutrition` variable declaration in extractNutritionData
 *   - convertToGrams is explicitly exported (required by ingredient-builder/page.tsx)
 *
 * Security note:
 *   The API key is currently hardcoded here for development.
 *   Phase 5 will move this to a Next.js server-side API route.
 * ============================================================
 */

import { UsdaIngredient } from "../types/recipe";
import { NutritionData } from "../types/nutrition";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";

/**
 * TODO (Phase 5): Move this key to a Next.js API route (/api/usda/search)
 * so it is never exposed in the client-side bundle.
 */
const API_KEY = "X3a7fgsQqtsmQ4CJGPzos0RPbqZxg78g67p4ED0N";

/**
 * USDA nutrient ID mapping.
 * These IDs are stable across the USDA FoodData Central API.
 * Reference: https://fdc.nal.usda.gov/food-details/2257045/nutrients
 */
const NUTRIENT_IDS = {
  calories: '208',           // Energy (kcal)
  totalFat: '204',           // Total lipids (fat)
  saturatedFat: '606',       // Fatty acids, total saturated
  transFat: '605',           // Fatty acids, total trans
  cholesterol: '601',        // Cholesterol
  sodium: '307',             // Sodium
  totalCarbohydrates: '205', // Carbohydrate, by difference
  dietaryFiber: '291',       // Fiber, total dietary
  sugars: '269',             // Sugars, total
  protein: '203',            // Protein
  vitaminD: '328',           // Vitamin D (D2 + D3)
  calcium: '301',            // Calcium
  iron: '303',               // Iron
  potassium: '306',          // Potassium
};

// ─────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────

/**
 * searchIngredients
 *
 * Searches the USDA FoodData Central database for food items matching
 * the given query string. Limited to Foundation and SR Legacy data types
 * which provide the most complete nutrient profiles.
 *
 * @param query - Search term (e.g. "whole wheat flour", "chicken breast")
 * @returns Array of matching USDA food items, or empty array on failure
 */
export async function searchIngredients(query: string): Promise<UsdaIngredient[]> {
  try {
    const url = new URL(`${USDA_API_BASE}/foods/search`);
    url.searchParams.set('api_key', API_KEY);
    url.searchParams.set('query', query);
    url.searchParams.set('pageSize', '25');
    url.searchParams.set('dataType', 'Foundation,SR Legacy');

    const response = await fetch(url.toString());

    if (!response.ok) {
      throw new Error(`USDA search failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.foods || [];
  } catch (error) {
    console.error('Error searching USDA ingredients:', error);
    return [];
  }
}

/**
 * getIngredientDetails
 *
 * Fetches full nutrition details for a specific food item by its FDC ID.
 * Only requests the nutrient IDs we actually use to minimize response size.
 *
 * @param fdcId - USDA FoodData Central food ID
 * @returns Full food detail object or null on failure
 */
export async function getIngredientDetails(fdcId: number): Promise<any> {
  try {
    const nutrientList = Object.values(NUTRIENT_IDS).join(',');
    const url = `${USDA_API_BASE}/food/${fdcId}?api_key=${API_KEY}&nutrients=${nutrientList}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`USDA detail fetch failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching USDA ingredient details:', error);
    return null;
  }
}

/**
 * extractNutritionData
 *
 * Transforms raw USDA food detail response into our NutritionData format.
 * All values from USDA are per 100g — this function preserves that basis.
 * Scaling to actual quantity happens in calculateIngredientNutrition().
 *
 * FIXED: Removed unused `nutrition` variable that was previously declared
 * but never populated (was always returning an empty object).
 *
 * @param ingredient - Raw USDA food detail API response
 * @returns Partial<NutritionData> with values per 100g
 */
export function extractNutritionData(ingredient: any): Partial<NutritionData> {
  /**
   * Searches the foodNutrients array for a nutrient by its USDA number.
   * Handles both search result format (n.nutrient.number) and
   * detail format (n.number) since the API returns slightly different shapes.
   */
  const findNutrient = (nutrientNumber: string): number => {
    if (!ingredient.foodNutrients) return 0;

    const nutrient = ingredient.foodNutrients.find(
      (n: any) =>
        n.nutrient?.number === nutrientNumber ||
        n.number === nutrientNumber
    );

    return nutrient ? (nutrient.amount ?? nutrient.value ?? 0) : 0;
  };

  // Map all USDA nutrient IDs to our NutritionData keys
  // All values are per 100g as provided by USDA
  return {
    calories: findNutrient(NUTRIENT_IDS.calories),
    totalFat: findNutrient(NUTRIENT_IDS.totalFat),
    saturatedFat: findNutrient(NUTRIENT_IDS.saturatedFat),
    transFat: findNutrient(NUTRIENT_IDS.transFat),
    cholesterol: findNutrient(NUTRIENT_IDS.cholesterol),
    sodium: findNutrient(NUTRIENT_IDS.sodium),
    totalCarbohydrates: findNutrient(NUTRIENT_IDS.totalCarbohydrates),
    dietaryFiber: findNutrient(NUTRIENT_IDS.dietaryFiber),
    sugars: findNutrient(NUTRIENT_IDS.sugars),
    protein: findNutrient(NUTRIENT_IDS.protein),
    vitaminD: findNutrient(NUTRIENT_IDS.vitaminD),
    calcium: findNutrient(NUTRIENT_IDS.calcium),
    iron: findNutrient(NUTRIENT_IDS.iron),
    potassium: findNutrient(NUTRIENT_IDS.potassium),
  };
}

// ─────────────────────────────────────────────
// Unit Conversion
// ─────────────────────────────────────────────

/**
 * convertToGrams
 *
 * Converts a quantity in any supported unit to grams.
 * Used for two purposes:
 *   1. Scaling nutrition values to actual ingredient quantity
 *   2. Calculating total recipe weight for per-serving math
 *
 * Volume conversions (ml, l, cup, tbsp, tsp) assume water density (1g/ml).
 * This is an approximation — different ingredients have different densities.
 * A future improvement (Phase 5) could accept density as a parameter.
 *
 * @param value    - Numeric quantity
 * @param fromUnit - Unit string matching keys in conversions map
 * @returns Equivalent weight in grams
 */
export function convertToGrams(value: number, fromUnit: string): number {
  const conversions: Record<string, number> = {
    g: 1,           // grams (base unit)
    mg: 0.001,      // milligrams
    kg: 1000,       // kilograms
    oz: 28.3495,    // ounces
    lb: 453.592,    // pounds
    ml: 1,          // millilitres (assumes water density)
    l: 1000,        // litres
    cup: 236.588,   // US cup
    tbsp: 14.7868,  // US tablespoon
    tsp: 4.92892,   // US teaspoon
  };

  // Default to 1 (treat unknown units as grams) to prevent NaN
  return value * (conversions[fromUnit] ?? 1);
}

// ─────────────────────────────────────────────
// Nutrition Scaling
// ─────────────────────────────────────────────

/**
 * calculateIngredientNutrition
 *
 * Scales USDA per-100g nutrition values to the actual quantity used.
 *
 * Formula: nutrientValue = (per100gValue / 100) * weightInGrams
 *
 * Example: 50g of flour with 364 kcal/100g → 182 kcal
 *
 * @param basePer100g - Nutrition values per 100g (from USDA)
 * @param quantity    - Amount of ingredient used
 * @param unit        - Unit of the quantity
 * @returns Partial<NutritionData> scaled to the given quantity
 */
export function calculateIngredientNutrition(
  basePer100g: Partial<NutritionData>,
  quantity: number,
  unit: string
): Partial<NutritionData> {
  const weightGrams = convertToGrams(quantity, unit);

  // Multiplier converts from per-100g to per-actual-quantity
  const multiplier = weightGrams / 100;

  return Object.entries(basePer100g).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: typeof value === 'number'
        ? Math.round(value * multiplier * 100) / 100  // round to 2dp
        : value,
    }),
    {} as Partial<NutritionData>
  );
}