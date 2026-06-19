import { UsdaIngredient } from "../types/recipe";
import { NutritionData } from "../types/nutrition";

const USDA_API_BASE = "https://api.nal.usda.gov/fdc/v1";
//const API_KEY = process.env.NEXT_PUBLIC_USDA_FOOD_DATA_API_KEY;
const API_KEY = "X3a7fgsQqtsmQ4CJGPzos0RPbqZxg78g67p4ED0N";


// Nutrient IDs from USDA database
const NUTRIENT_IDS = {
  calories: '208',        // Energy (kcal)
  totalFat: '204',        // Total lipids (fat)
  saturatedFat: '606',    // Fatty acids, total saturated
  transFat: '605',        // Fatty acids, total trans
  cholesterol: '601',     // Cholesterol
  sodium: '307',          // Sodium
  totalCarbohydrates: '205', // Carbohydrate, by difference
  dietaryFiber: '291',    // Fiber, total dietary
  sugars: '269',          // Sugars, total
  protein: '203',         // Protein
  vitaminD: '328',        // Vitamin D (D2 + D3)
  calcium: '301',         // Calcium
  iron: '303',            // Iron
  potassium: '306',       // Potassium
};

export async function searchIngredients(query: string): Promise<UsdaIngredient[]> {
  try {
    const response = await fetch(`${USDA_API_BASE}/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(query)}&pageSize=25&dataType=Foundation,SR Legacy`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch ingredients');
    }

    const data = await response.json();
    return data.foods || [];
  } catch (error) {
    console.error('Error searching ingredients:', error);
    return [];
  }
}

export async function getIngredientDetails(fdcId: number): Promise<any> {
  try {
    const response = await fetch(`${USDA_API_BASE}/food/${fdcId}?api_key=${API_KEY}&nutrients=${Object.values(NUTRIENT_IDS).join(',')}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch ingredient details');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching ingredient details:', error);
    return null;
  }
}

export function extractNutritionData(ingredient: any): Partial<NutritionData> {
  const nutrition: Partial<NutritionData> = {};
  
  // Helper function to find nutrient value
  const findNutrient = (nutrientNumber: string) => {
    if (!ingredient.foodNutrients) return 0;
    
    const nutrient = ingredient.foodNutrients.find(
      (n: any) => n.nutrient?.number === nutrientNumber || n.number === nutrientNumber
    );
    
    return nutrient ? (nutrient.amount || nutrient.value || 0) : 0;
  };

  // Map USDA nutrients to our NutritionData format
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

// Convert measurements to grams for consistent calculations
export function convertToGrams(value: number, fromUnit: string): number {
  const conversions: Record<string, number> = {
    g: 1,
    mg: 0.001,
    kg: 1000,
    oz: 28.3495,
    lb: 453.592,
    // Approximate conversions for volume to mass (assuming water density)
    ml: 1,
    l: 1000,
    // Common cooking measurements (approximate)
    cup: 236.588,
    tbsp: 14.7868,
    tsp: 4.92892,
  };

  return value * (conversions[fromUnit] || 1);
}

// Calculate nutrition for a specific quantity of an ingredient
export function calculateIngredientNutrition(
  basePer100g: Partial<NutritionData>,
  quantity: number,
  unit: string
): Partial<NutritionData> {
  const grams = convertToGrams(quantity, unit);
  const multiplier = grams / 100; // Convert to 100g basis

  return Object.entries(basePer100g).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: typeof value === 'number' ? Number((value * multiplier).toFixed(2)) : value,
  }), {} as Partial<NutritionData>);
}
