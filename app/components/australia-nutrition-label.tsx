import React from 'react';
import { NutritionData } from '../types/nutrition';

interface AustraliaNutritionLabelProps {
  data: NutritionData;
}

export const AustraliaNutritionLabel: React.FC<AustraliaNutritionLabelProps> = ({ data }) => {
  const servingSize: number = Number(data.servingSize) || 100;

  const calculatePer100g = (value: number) => {
    return ((value * 100) / servingSize).toFixed(1);
  };

  return (
    <div className="nutrition-label bg-white p-4 border-2 border-black max-w-md font-sans text-sm">
      <div className="text-center font-bold border-b-2 border-black pb-2 mb-2">
        <h2 className="text-lg">NUTRITION INFORMATION</h2>
        <p>Servings per package: {data.servingsPerContainer}</p>
        <p>Serving size: {data.servingSize}g</p>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-1"></th>
            <th className="text-right py-1">Per Serving</th>
            <th className="text-right py-1">Per 100g</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black">
            <td className="py-1">Energy</td>
            <td className="text-right">{data.calories.toFixed(1)}kJ</td>
            <td className="text-right">{calculatePer100g(data.calories)}kJ</td>
          </tr>
          <tr className="border-b border-black">
            <td className="py-1">Protein</td>
            <td className="text-right">{data.protein.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.protein)}g</td>
          </tr>
          <tr className="border-b border-black">
            <td className="py-1">Fat, total</td>
            <td className="text-right">{data.totalFat.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.totalFat)}g</td>
          </tr>
          <tr className="border-b border-black pl-4">
            <td className="py-1 pl-4">- saturated</td>
            <td className="text-right">{data.saturatedFat.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.saturatedFat)}g</td>
          </tr>
          <tr className="border-b border-black">
            <td className="py-1">Carbohydrate</td>
            <td className="text-right">{data.totalCarbohydrates.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.totalCarbohydrates)}g</td>
          </tr>
          <tr className="border-b border-black pl-4">
            <td className="py-1 pl-4">- sugars</td>
            <td className="text-right">{data.sugars.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.sugars)}g</td>
          </tr>
          <tr className="border-b border-black">
            <td className="py-1">Dietary fibre</td>
            <td className="text-right">{data.dietaryFiber.toFixed(1)}g</td>
            <td className="text-right">{calculatePer100g(data.dietaryFiber)}g</td>
          </tr>
          <tr className="border-b border-black">
            <td className="py-1">Sodium</td>
            <td className="text-right">{data.sodium.toFixed(1)}mg</td>
            <td className="text-right">{calculatePer100g(data.sodium)}mg</td>
          </tr>
        </tbody>
      </table>

      <div className="mt-4 text-xs">
        <p>* Percentage Daily Intakes are based on an average adult diet of 8700kJ.</p>
        <p>Your daily intakes may be higher or lower depending on your energy needs.</p>
      </div>
    </div>
  );
};
