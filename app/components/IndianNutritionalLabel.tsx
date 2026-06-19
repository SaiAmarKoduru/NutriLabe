import { NutritionData } from "../types/nutrition";

export function IndianNutritionalLabel({ data }: { data: NutritionData }) {
  return (
    <div 
      className="w-[300px] bg-white p-4 border border-black text-black" 
      id="nutrition-label"
      style={{ 
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
      }}
    >
      <h2 className="text-center font-bold text-lg mb-2">Nutrition Information</h2>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">Nutrients</th>
            <th className="text-right py-1">Per 100g</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-gray-300">
            <td>Energy</td>
            <td className="text-right">{Math.round(data.calories)} kcal</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td>Protein</td>
            <td className="text-right">{data.protein.toFixed(1)} g</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td>Carbohydrate</td>
            <td className="text-right">{data.totalCarbohydrates.toFixed(1)} g</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td>Total Sugars</td>
            <td className="text-right">{data.sugars.toFixed(1)} g</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td>Total Fat</td>
            <td className="text-right">{data.totalFat.toFixed(1)} g</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td>Saturated Fat</td>
            <td className="text-right">{data.saturatedFat.toFixed(1)} g</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td>Trans Fat</td>
            <td className="text-right">{data.transFat.toFixed(1)} g</td>
          </tr>
          <tr className="border-b border-gray-300">
            <td>Cholesterol</td>
            <td className="text-right">{data.cholesterol.toFixed(1)} mg</td>
          </tr>
          <tr>
            <td>Sodium</td>
            <td className="text-right">{data.sodium.toFixed(1)} mg</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
} 