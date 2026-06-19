import { NutritionData } from "../types/nutrition";

export function CanadaNutritionLabel({ data }: { data: NutritionData }) {
  return (
    <div 
      className="w-[350px] bg-white p-4 border-2 border-black text-black" 
      id="nutrition-label"
      style={{ 
        fontFamily: 'Helvetica, Arial, sans-serif',
        fontSize: '13px',
      }}
    >
      <div className="text-2xl font-bold border-b-2 border-black pb-1 mb-2">
        Nutrition Facts<br />
        Valeur nutritive
      </div>
      <div className="text-sm mb-2">
        Per {data.servingSize} / pour {data.servingSize}<br />
        Serving Size / portion {data.servingSize} ({data.servingsPerContainer} {Number(data.servingsPerContainer) === 1 ? "serving" : "servings"} per container / {data.servingsPerContainer} {Number(data.servingsPerContainer) === 1 ? "portion" : "portions"} par contenant)
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-t-[8px] border-b border-black">
            <th className="text-left py-1 font-normal">
              <span className="font-bold">Calories</span> / Calories {Math.round(data.calories)}
            </th>
            <th className="text-right py-1 font-normal">% Daily Value*<br />% valeur quotidienne*</th>
          </tr>
        </thead>
        <tbody>
          {[
            { en: "Fat / Lipides", fr: "Lipides", value: data.totalFat, unit: "g", dv: 75 },
            { en: "Saturated / saturés", fr: "saturés", value: data.saturatedFat, unit: "g", dv: 20, indent: true },
            { en: "+ Trans / trans", fr: "trans", value: data.transFat, unit: "g", indent: true },
            { en: "Carbohydrate / Glucides", fr: "Glucides", value: data.totalCarbohydrates, unit: "g" },
            { en: "Fibre / Fibres", fr: "Fibres", value: data.dietaryFiber, unit: "g", dv: 28, indent: true },
            { en: "Sugars / Sucres", fr: "Sucres", value: data.sugars, unit: "g", dv: 100, indent: true },
            { en: "Protein / Protéines", fr: "Protéines", value: data.protein, unit: "g" },
            { en: "Cholesterol / Cholestérol", fr: "Cholestérol", value: data.cholesterol, unit: "mg" },
            { en: "Sodium / Sodium", fr: "Sodium", value: data.sodium, unit: "mg", dv: 2300 },
          ].map((item, index) => (
            <tr key={index} className={`border-t border-black ${item.indent ? "text-sm" : "font-bold"}`}>
              <td className={`py-1 ${item.indent ? "pl-4" : ""}`}>
                {item.en} {item.value.toFixed(1)}{item.unit}
              </td>
              {item.dv && (
                <td className="text-right py-1">
                  {Math.round((item.value / item.dv) * 100)}%
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      <div className="text-xs mt-2 leading-tight">
        *5% or less is a little / 5% ou moins c&apos;est peu<br />
        15% or more is a lot / 15% ou plus c&apos;est beaucoup
      </div>
    </div>
  );
}