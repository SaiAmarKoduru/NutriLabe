"use client";

import { NutritionData } from "../types/nutrition";

export function USNutritionLabel({ data }: { data: NutritionData }) {
  return (
    <div 
      className="w-[400px] bg-white p-8 border-2 border-black font-bold text-black" 
      id="nutrition-label"
      style={{ 
        fontFamily: 'Helvetica, Arial, sans-serif',
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <div className="text-5xl font-black tracking-tighter border-b-8 border-black pb-2 mb-2">
        Nutrition Facts
      </div>
      <div className="text-base border-b border-black pb-2 mb-2">
        {data.servingsPerContainer} servings per container
      </div>
      <div className="flex justify-between border-b-8 border-black pb-2 mb-2">
        <div className="text-base">Serving size</div>
        <div className="text-base">{data.servingSize}</div>
      </div>

      <div className="text-base">Amount per serving</div>
      <div className="flex justify-between text-4xl font-black border-b-4 border-black mb-2">
        <div>Calories</div>
        <div>{Math.round(data.calories)}</div>
      </div>

      <div className="text-right text-base border-b border-black mb-2">% Daily Value*</div>

      {[
        { label: "Total Fat", value: data.totalFat, unit: "g", dv: 78 },
        { label: "Saturated Fat", value: data.saturatedFat, unit: "g", dv: 20, indent: true },
        { label: "Trans Fat", value: data.transFat, unit: "g", indent: true },
        { label: "Cholesterol", value: data.cholesterol, unit: "mg", dv: 300 },
        { label: "Sodium", value: data.sodium, unit: "mg", dv: 2300 },
        { label: "Total Carbohydrates", value: data.totalCarbohydrates, unit: "g", dv: 275 },
        { label: "Dietary Fiber", value: data.dietaryFiber, unit: "g", dv: 28, indent: true },
        { label: "Total Sugars", value: data.sugars, unit: "g", indent: true },
        { label: "Protein", value: data.protein, unit: "g", dv: 50 },
      ].map((item, index) => (
        <div
          key={index}
          className={`flex justify-between text-base border-b border-black py-1 ${
            item.indent ? "pl-6" : "font-bold"
          }`}
        >
          <div>
            {item.label} {item.value.toFixed(1)}{item.unit}
          </div>
          {item.dv && <div>{Math.round((item.value / item.dv) * 100)}%</div>}
        </div>
      ))}

      <div className="mt-4 text-sm leading-tight">
        * The % Daily Value (DV) tells you how much a nutrient in a serving of food
        contributes to a daily diet. 2,000 calories a day is used for general
        nutrition advice.
      </div>
    </div>
  );
}