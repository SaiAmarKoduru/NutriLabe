/**
 * ============================================================
 * Nutrition Charts Component
 * ============================================================
 *
 * Renders two interactive charts summarizing the nutrition data:
 *
 *   1. Macro Pie Chart
 *      Shows caloric contribution from Fat, Protein, Carbohydrates.
 *      Uses calorie equivalents: Fat=9 kcal/g, Protein=4 kcal/g, Carbs=4 kcal/g
 *      (Atwater general factors — standard FDA methodology)
 *
 *   2. Daily Value Bar Chart
 *      Shows key nutrients as % of FDA recommended Daily Values (2000 kcal diet).
 *      Reference DVs sourced from FDA 21 CFR 101.9 (2020 update).
 *      Bars turn amber at >75% DV and red at >100% DV to signal excess.
 *
 *   3. Calorie Summary Card
 *      Quick-read panel showing total calories and gram breakdown per macro.
 *
 * Dependencies: recharts (already installed)
 *
 * Design decisions:
 *   - ResponsiveContainer used throughout so charts resize with their parent
 *   - CustomTooltip components for consistent styling across both charts
 *   - Colors chosen for accessibility (distinguishable without color alone)
 *   - All calculations are pure functions for testability
 * ============================================================
 */

'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { NutritionData } from '@/app/types/nutrition';
import { Card } from '@/components/ui/card';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/**
 * Atwater general calorie conversion factors.
 * Source: FDA 21 CFR 101.9(c)(1)
 * Fat: 9 kcal/g, Protein: 4 kcal/g, Carbohydrate: 4 kcal/g
 */
const KCAL_PER_GRAM = {
  fat: 9,
  protein: 4,
  carbs: 4,
} as const;

/**
 * FDA Reference Daily Values for a 2000 kcal diet.
 * Source: FDA 21 CFR 101.9(c)(9) — 2020 Nutrition Facts label update.
 * Used to calculate % Daily Value for the bar chart.
 */
const DAILY_VALUES = {
  totalFat: 78,          // g
  saturatedFat: 20,      // g
  cholesterol: 300,      // mg
  sodium: 2300,          // mg
  totalCarbohydrates: 275, // g
  dietaryFiber: 28,      // g
  protein: 50,           // g
  vitaminD: 20,          // mcg
  calcium: 1300,         // mg
  iron: 18,              // mg
  potassium: 4700,       // mg
} as const;

/**
 * Color palette for macro pie chart.
 * Chosen to be visually distinct and accessible.
 */
const MACRO_COLORS = {
  fat: '#f97316',        // orange
  protein: '#3b82f6',    // blue
  carbs: '#22c55e',      // green
} as const;

/**
 * Color thresholds for the Daily Value bar chart.
 * Signals nutritional concern at high % DV levels.
 */
const DV_COLOR = {
  normal: '#3b82f6',     // blue  — 0–75% DV
  high: '#f59e0b',       // amber — 75–100% DV
  excess: '#ef4444',     // red   — >100% DV
} as const;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface NutritionChartsProps {
  data: NutritionData;
}

interface MacroSlice {
  name: string;
  value: number;   // calories from this macro
  grams: number;   // grams of this macro
  color: string;
}

interface DvBar {
  name: string;
  percent: number; // % of Daily Value, capped display at 150 for readability
  raw: number;     // actual % DV (uncapped) for tooltip
  unit: string;
  value: number;   // actual nutrient amount
  color: string;
}

// ─────────────────────────────────────────────
// Pure Calculation Functions
// ─────────────────────────────────────────────

/**
 * buildMacroData
 *
 * Calculates caloric contribution from each macronutrient.
 * Filters out zero-value macros so the pie chart stays clean.
 *
 * @param data - NutritionData for one serving
 * @returns Array of MacroSlice objects for recharts PieChart
 */
function buildMacroData(data: NutritionData): MacroSlice[] {
  const slices: MacroSlice[] = [
    {
      name: 'Fat',
      value: Math.round(data.totalFat * KCAL_PER_GRAM.fat),
      grams: data.totalFat,
      color: MACRO_COLORS.fat,
    },
    {
      name: 'Protein',
      value: Math.round(data.protein * KCAL_PER_GRAM.protein),
      grams: data.protein,
      color: MACRO_COLORS.protein,
    },
    {
      name: 'Carbs',
      value: Math.round(data.totalCarbohydrates * KCAL_PER_GRAM.carbs),
      grams: data.totalCarbohydrates,
      color: MACRO_COLORS.carbs,
    },
  ];

  // Remove macros with zero calories to avoid empty pie slices
  return slices.filter((s) => s.value > 0);
}

/**
 * getDvColor
 *
 * Returns the appropriate bar color based on % Daily Value.
 * >100% DV → red (excess), >75% → amber (approaching limit), else blue.
 *
 * @param percent - % Daily Value (uncapped)
 * @returns Hex color string
 */
function getDvColor(percent: number): string {
  if (percent > 100) return DV_COLOR.excess;
  if (percent > 75) return DV_COLOR.high;
  return DV_COLOR.normal;
}

/**
 * buildDvData
 *
 * Calculates % Daily Value for each tracked nutrient.
 * Display value is capped at 150% so extreme values
 * do not compress the rest of the chart.
 *
 * @param data - NutritionData for one serving
 * @returns Array of DvBar objects for recharts BarChart
 */
function buildDvData(data: NutritionData): DvBar[] {
  const entries: Array<{
    key: keyof typeof DAILY_VALUES;
    label: string;
    unit: string;
    value: number;
  }> = [
    { key: 'totalFat',          label: 'Total Fat',    unit: 'g',  value: data.totalFat },
    { key: 'saturatedFat',      label: 'Sat. Fat',     unit: 'g',  value: data.saturatedFat },
    { key: 'cholesterol',       label: 'Cholesterol',  unit: 'mg', value: data.cholesterol },
    { key: 'sodium',            label: 'Sodium',       unit: 'mg', value: data.sodium },
    { key: 'totalCarbohydrates',label: 'Carbs',        unit: 'g',  value: data.totalCarbohydrates },
    { key: 'dietaryFiber',      label: 'Fiber',        unit: 'g',  value: data.dietaryFiber },
    { key: 'protein',           label: 'Protein',      unit: 'g',  value: data.protein },
    { key: 'calcium',           label: 'Calcium',      unit: 'mg', value: data.calcium },
    { key: 'iron',              label: 'Iron',         unit: 'mg', value: data.iron },
    { key: 'potassium',         label: 'Potassium',    unit: 'mg', value: data.potassium },
  ];

  return entries.map(({ key, label, unit, value }) => {
    const dv = DAILY_VALUES[key];
    const rawPercent = Math.round((value / dv) * 100);

    return {
      name: label,
      // Cap display at 150% so the chart scale stays readable
      percent: Math.min(rawPercent, 150),
      raw: rawPercent,       // actual % for tooltip
      unit,
      value,
      color: getDvColor(rawPercent),
    };
  });
}

// ─────────────────────────────────────────────
// Custom Tooltip Components
// ─────────────────────────────────────────────

/**
 * MacroTooltip
 *
 * Custom tooltip for the pie chart.
 * Shows macro name, calories from that macro, and grams.
 */
const MacroTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item: MacroSlice = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="font-semibold" style={{ color: item.color }}>
        {item.name}
      </p>
      <p className="text-gray-700">{item.value} kcal</p>
      <p className="text-gray-500">{item.grams.toFixed(1)}g</p>
    </div>
  );
};

/**
 * DvTooltip
 *
 * Custom tooltip for the bar chart.
 * Shows nutrient name, actual value with unit, and true % DV
 * (uncapped — so if a nutrient is 200% DV, tooltip shows 200% not 150%).
 */
const DvTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const item: DvBar = payload[0].payload;

  return (
    <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-md text-sm">
      <p className="font-semibold text-gray-800">{item.name}</p>
      <p className="text-gray-700">
        {item.value.toFixed(1)}{item.unit}
      </p>
      <p
        className="font-medium"
        style={{ color: getDvColor(item.raw) }}
      >
        {item.raw}% Daily Value
      </p>
    </div>
  );
};

/**
 * MacroLegend
 *
 * Custom legend for the pie chart showing color + name + grams.
 * Placed below the chart for readability on small screens.
 */
const MacroLegend = ({ macroData }: { macroData: MacroSlice[] }) => (
  <div className="flex justify-center gap-4 flex-wrap mt-2">
    {macroData.map((item) => (
      <div key={item.name} className="flex items-center gap-1.5 text-sm">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: item.color }}
        />
        <span className="text-gray-700">
          {item.name} ({item.grams.toFixed(1)}g)
        </span>
      </div>
    ))}
  </div>
);

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function NutritionCharts({ data }: NutritionChartsProps) {
  const macroData = buildMacroData(data);
  const dvData = buildDvData(data);

  /**
   * Total calories from macros (calculated).
   * May differ slightly from data.calories due to rounding
   * and fiber (partially fermented, ~2 kcal/g in some systems).
   * We show data.calories as the authoritative value.
   */
  const totalMacroCalories = macroData.reduce((sum, m) => sum + m.value, 0);

  return (
    <div className="space-y-6 mt-6">

      {/* ── Section Header ────────────────────────────────────────────── */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Nutrition Analysis</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Per serving · Based on a 2,000 kcal daily diet
        </p>
      </div>

      {/* ── Top Row: Calorie Summary + Macro Pie ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Calorie Summary Card */}
        <Card className="p-5">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-4">
            Calories Per Serving
          </h4>

          {/* Large calorie number */}
          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-5xl font-black text-gray-900">
              {Math.round(data.calories)}
            </span>
            <span className="text-lg text-gray-500 font-medium">kcal</span>
          </div>

          {/* Macro breakdown rows */}
          <div className="space-y-3">
            {[
              {
                label: 'Fat',
                grams: data.totalFat,
                kcal: Math.round(data.totalFat * KCAL_PER_GRAM.fat),
                color: MACRO_COLORS.fat,
              },
              {
                label: 'Protein',
                grams: data.protein,
                kcal: Math.round(data.protein * KCAL_PER_GRAM.protein),
                color: MACRO_COLORS.protein,
              },
              {
                label: 'Carbs',
                grams: data.totalCarbohydrates,
                kcal: Math.round(data.totalCarbohydrates * KCAL_PER_GRAM.carbs),
                color: MACRO_COLORS.carbs,
              },
            ].map((macro) => {
              // Width of the progress bar as % of total macro calories
              const barWidth = totalMacroCalories > 0
                ? (macro.kcal / totalMacroCalories) * 100
                : 0;

              return (
                <div key={macro.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{macro.label}</span>
                    <span className="text-gray-500">
                      {macro.grams.toFixed(1)}g · {macro.kcal} kcal
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${barWidth}%`,
                        backgroundColor: macro.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Macro Pie Chart Card */}
        <Card className="p-5">
          <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Calorie Distribution
          </h4>

          {macroData.length === 0 ? (
            // Empty state when all macros are zero
            <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
              No macro data available
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={macroData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}   // donut style
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {macroData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<MacroTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <MacroLegend macroData={macroData} />
            </>
          )}
        </Card>
      </div>

      {/* ── Daily Value Bar Chart ──────────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
              % Daily Value
            </h4>
            <p className="text-xs text-gray-400 mt-0.5">
              Based on FDA reference values for a 2,000 kcal diet
            </p>
          </div>

          {/* Color legend for the bar chart */}
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
              <span>&gt;75%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
              <span>&gt;100%</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart
            data={dvData}
            margin={{ top: 4, right: 8, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />

            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              angle={-40}
              textAnchor="end"
              interval={0}
              height={60}
            />

            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={(v) => `${v}%`}
              domain={[0, 150]}
              ticks={[0, 25, 50, 75, 100, 125, 150]}
              width={40}
            />

            {/*
              Reference line at 100% DV.
              Rendered as a CartesianGrid background element
              via the domain max — actual reference line would
              need ReferenceLine import, keeping deps minimal.
            */}
            <Tooltip content={<DvTooltip />} />

            <Bar dataKey="percent" radius={[3, 3, 0, 0]} maxBarSize={36}>
              {dvData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* 100% DV reference note */}
        <p className="text-xs text-gray-400 text-center mt-1">
          Bars exceeding 100% are capped at 150% for display. Hover for exact values.
        </p>
      </Card>

    </div>
  );
}
