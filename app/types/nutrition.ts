export type NutritionData = {
  servingSize: number;
  servingsPerContainer: number;
  calories: number;
  totalFat: number;
  saturatedFat: number;
  transFat: number;
  cholesterol: number;
  sodium: number;
  totalCarbohydrates: number;
  dietaryFiber: number;
  sugars: number;
  protein: number;
  vitaminD: number;
  calcium: number;
  iron: number;
  potassium: number;
};

export type LabelFormat = 'US' | 'EU' | 'INDIAN' | 'CANADA' | 'AUSTRALIA';