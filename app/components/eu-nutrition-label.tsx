"use client";

import { NutritionData } from "../types/nutrition";

export function EUNutritionLabel({ data }: { data: NutritionData }) {
  return (
    <div 
      className="w-[400px] bg-white p-8 border border-black text-black" 
      id="nutrition-label"
      style={{ 
        fontFamily: 'Helvetica, Arial, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div className="text-3xl font-bold mb-6 text-center">
        Nutrition Declaration
      </div>
      <div className="text-base mb-4">
        Serving size: {data.servingSize}
      </div>

      <table className="w-full text-base">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2 font-bold">Nutrition</th>
            <th className="text-right py-2 font-bold">Per 100g</th>
          </tr>
        </thead>
        <tbody>
          {[
            { label: "Energy", value: data.calories, unit: "kcal" },
            { label: "Fat", value: data.totalFat, unit: "g" },
            { label: "of which saturates", value: data.saturatedFat, unit: "g", indent: true },
            { label: "Carbohydrate", value: data.totalCarbohydrates, unit: "g" },
            { label: "of which sugars", value: data.sugars, unit: "g", indent: true },
            { label: "Fibre", value: data.dietaryFiber, unit: "g" },
            { label: "Protein", value: data.protein, unit: "g" },
            { label: "Salt", value: data.sodium / 1000, unit: "g" },
          ].map((item, index) => (
            <tr key={index} className="border-b border-gray-300">
              <td className={`py-2 ${item.indent ? "pl-6" : "font-semibold"}`}>
                {item.label}
              </td>
              <td className="text-right py-2">
                {item.value.toFixed(1)}{item.unit}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 text-sm leading-tight">
        Reference intake of an average adult (8400kJ/2000kcal)
      </div>
    </div>
  );
}