import { NutritionData } from "./nutrition";

export interface UsdaIngredient {
  fdcId: number;
  description: string;
  dataType: string;
  publicationDate: string;
  nutrients: {
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    value: number;
  }[];
}

export interface RecipeIngredient {
  fdcId: number;
  name: string;
  quantity: number;
  unit: string;
  nutritionPer100g: Partial<NutritionData>;
}

export interface Recipe {
  id?: string;
  name: string;
  servingSize: number;
  servingUnit: string;
  servingsPerContainer: number;
  ingredients: RecipeIngredient[];
  totalNutrition: NutritionData;
}

export type MeasurementUnit = 
  | "g"      // grams
  | "mg"     // milligrams
  | "kg"     // kilograms
  | "oz"     // ounces
  | "lb"     // pounds
  | "cup"    // cups
  | "tbsp"   // tablespoons
  | "tsp"    // teaspoons
  | "ml"     // milliliters
  | "l";     // liters

export const commonUnits: MeasurementUnit[] = [
  "g",
  "mg",
  "kg",
  "oz",
  "lb",
  "cup",
  "tbsp",
  "tsp",
  "ml",
  "l"
];
