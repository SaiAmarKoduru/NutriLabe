/**
 * ============================================================
 * Product Comparison Page — /compare
 * ============================================================
 *
 * Full-width page showing two products side by side.
 *
 * Layout:
 *   Header — product names + overall winner banner
 *   Top row — Nutrition Quality Scores side by side
 *   Nutrient table — all nutrients with winner highlights
 *   Bottom row — Allergens + Dietary Tags comparison
 *
 * Data flow:
 *   Product A — loaded from sessionStorage (saved from
 *               generator or ingredient builder)
 *   Product B — entered via NutritionForm on this page
 *
 * States:
 *   1. No product A saved → empty state with navigation links
 *   2. Product A loaded, Product B not entered → form shown
 *   3. Both products entered → full comparison rendered
 * ============================================================
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadSavedProduct,
  clearSavedProduct,
  compareProducts,
  SavedProduct,
  Winner,
} from '@/app/lib/comparison';
import { calculateNutritionScore } from '@/app/lib/nutrition-score';
import { NutritionData } from '@/app/types/nutrition';
import { NutritionForm } from '@/app/components/nutrition-form';
import { NutritionScoreDisplay } from '@/app/components/nutrition-score-display';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Trophy,
  ArrowLeft,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Helper — Winner color utilities
// ─────────────────────────────────────────────

function getWinnerBg(winner: Winner, side: 'a' | 'b'): string {
  if (winner === side) return 'bg-green-50 border-l-2 border-green-400';
  if (winner === 'tie') return 'bg-blue-50';
  if (winner === 'neutral') return '';
  return 'bg-red-50';
}

function getWinnerText(winner: Winner, side: 'a' | 'b'): string {
  if (winner === side) return 'text-green-700 font-semibold';
  if (winner === 'tie') return 'text-blue-600';
  return 'text-red-600';
}

// ─────────────────────────────────────────────
// Sub-component — Nutrient Comparison Row
// ─────────────────────────────────────────────

function NutrientRow({
  label,
  unit,
  valueA,
  valueB,
  winner,
  higherIsBetter,
}: {
  label: string;
  unit: string;
  valueA: number;
  valueB: number;
  winner: Winner;
  higherIsBetter: boolean;
}) {
  const Icon =
    winner === 'tie' || winner === 'neutral'
      ? Minus
      : higherIsBetter
      ? TrendingUp
      : TrendingDown;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      {/* Product A value */}
      <div
        className={cn(
          'text-right px-3 py-1.5 rounded text-sm',
          getWinnerBg(winner, 'a')
        )}
      >
        <span className={cn(getWinnerText(winner, 'a'))}>
          {valueA.toFixed(1)}{unit}
        </span>
      </div>

      {/* Nutrient label + icon */}
      <div className="flex flex-col items-center gap-0.5 min-w-[110px]">
        <span className="text-xs font-medium text-gray-600 text-center">
          {label}
        </span>
        <Icon
          className={cn(
            'w-3.5 h-3.5',
            winner === 'a' ? 'text-green-500' :
            winner === 'b' ? 'text-green-500' :
            winner === 'tie' ? 'text-blue-400' : 'text-gray-300'
          )}
        />
      </div>

      {/* Product B value */}
      <div
        className={cn(
          'text-left px-3 py-1.5 rounded text-sm',
          getWinnerBg(winner, 'b')
        )}
      >
        <span className={cn(getWinnerText(winner, 'b'))}>
          {valueB.toFixed(1)}{unit}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page Component
// ─────────────────────────────────────────────

export default function ComparePage() {
  const router = useRouter();

  // ── State ─────────────────────────────────────────────────────────────
  const [productA, setProductA] = useState<SavedProduct | null>(null);
  const [productBData, setProductBData] = useState<NutritionData | null>(null);
  const [productBName, setProductBName] = useState('Product B');

  // Load Product A from sessionStorage on mount
  useEffect(() => {
    const saved = loadSavedProduct();
    setProductA(saved);
  }, []);

  // ── Derived comparison ────────────────────────────────────────────────
  const comparison = useMemo(() => {
    if (!productA || !productBData) return null;
    const scoreA = calculateNutritionScore(productA.data).score;
    const scoreB = calculateNutritionScore(productBData).score;
    return compareProducts(productA.data, productBData, scoreA, scoreB);
  }, [productA, productBData]);

  const scoreA = useMemo(
    () => (productA ? calculateNutritionScore(productA.data).score : 0),
    [productA]
  );
  const scoreB = useMemo(
    () => (productBData ? calculateNutritionScore(productBData).score : 0),
    [productBData]
  );

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleReset = () => {
    clearSavedProduct();
    setProductA(null);
    setProductBData(null);
  };

  // ── Empty state — no Product A ─────────────────────────────────────────
  if (!productA) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          No Product Saved
        </h1>
        <p className="text-gray-500 mb-8">
          To compare products, first generate a label in the Generator or
          Ingredient Builder, then click "Save & Compare".
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push('/generator')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Generator
          </Button>
          <Button onClick={() => router.push('/ingredient-builder')}>
            Go to Ingredient Builder
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Product Comparison</h1>
          <p className="text-gray-500 mt-1">
            Compare two products side by side across all nutrition metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* ── Overall Winner Banner (shown after comparison) ────────────── */}
      {comparison && (
        <div
          className={cn(
            'rounded-xl p-4 mb-8 flex items-center justify-between',
            comparison.overallWinner === 'a'
              ? 'bg-green-50 border border-green-200'
              : comparison.overallWinner === 'b'
              ? 'bg-blue-50 border border-blue-200'
              : 'bg-gray-50 border border-gray-200'
          )}
        >
          <div className="flex items-center gap-3">
            <Trophy
              className={cn(
                'w-6 h-6',
                comparison.overallWinner === 'a' ? 'text-green-500' :
                comparison.overallWinner === 'b' ? 'text-blue-500' :
                'text-gray-400'
              )}
            />
            <div>
              <p className="font-semibold text-gray-800">
                {comparison.overallWinner === 'tie'
                  ? 'These products are nutritionally similar'
                  : `${comparison.overallWinner === 'a' ? productA.name : productBName} wins overall`
                }
              </p>
              <p className="text-sm text-gray-500">
                {productA.name}: {comparison.productAWins} wins ·{' '}
                {productBName}: {comparison.productBWins} wins ·{' '}
                {comparison.ties} ties
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge
              variant="outline"
              className={cn(
                comparison.scoreWinner === 'a'
                  ? 'border-green-400 text-green-700 bg-green-50'
                  : 'border-gray-300 text-gray-600'
              )}
            >
              Score A: {scoreA}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                comparison.scoreWinner === 'b'
                  ? 'border-blue-400 text-blue-700 bg-blue-50'
                  : 'border-gray-300 text-gray-600'
              )}
            >
              Score B: {scoreB}
            </Badge>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ══════════════════════════════════════════════════════════════
            LEFT — Product A (saved)
        ══════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* Product A header */}
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-green-100 text-green-800 border-green-300 mb-2">
                Product A
              </Badge>
              <h2 className="text-xl font-bold text-gray-900">
                {productA.name}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Saved {new Date(productA.savedAt).toLocaleTimeString()}
              </p>
            </div>
          </div>

          {/* Product A Nutrition Score */}
          <NutritionScoreDisplay data={productA.data} />

          {/* Product A key nutrients summary */}
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
              Key Nutrients Per Serving
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Calories', value: productA.data.calories, unit: 'kcal' },
                { label: 'Protein', value: productA.data.protein, unit: 'g' },
                { label: 'Total Fat', value: productA.data.totalFat, unit: 'g' },
                { label: 'Sat. Fat', value: productA.data.saturatedFat, unit: 'g' },
                { label: 'Carbs', value: productA.data.totalCarbohydrates, unit: 'g' },
                { label: 'Fiber', value: productA.data.dietaryFiber, unit: 'g' },
                { label: 'Sugars', value: productA.data.sugars, unit: 'g' },
                { label: 'Sodium', value: productA.data.sodium, unit: 'mg' },
              ].map(({ label, value, unit }) => (
                <div key={label} className="p-2.5 bg-gray-50 rounded-lg">
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="font-semibold text-sm text-gray-800">
                    {value.toFixed(1)}{unit}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            RIGHT — Product B (user entry or comparison)
        ══════════════════════════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* Product B header */}
          <div className="flex items-center justify-between">
            <div>
              <Badge className="bg-blue-100 text-blue-800 border-blue-300 mb-2">
                Product B
              </Badge>
              <h2 className="text-xl font-bold text-gray-900">
                {productBData ? productBName : 'Enter Product B'}
              </h2>
            </div>
            {productBData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setProductBData(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                Re-enter
              </Button>
            )}
          </div>

          {!productBData ? (
            /* Product B entry form */
            <Card className="p-6">
              <div className="mb-4">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Product B Name
                </label>
                <input
                  type="text"
                  value={productBName}
                  onChange={(e) => setProductBName(e.target.value || 'Product B')}
                  placeholder="Enter product name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3">
                Enter Nutrition Information
              </h3>
              <NutritionForm onSubmit={setProductBData} />
            </Card>
          ) : (
            <>
              {/* Product B Nutrition Score */}
              <NutritionScoreDisplay data={productBData} />

              {/* Product B key nutrients */}
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Key Nutrients Per Serving
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Calories', value: productBData.calories, unit: 'kcal' },
                    { label: 'Protein', value: productBData.protein, unit: 'g' },
                    { label: 'Total Fat', value: productBData.totalFat, unit: 'g' },
                    { label: 'Sat. Fat', value: productBData.saturatedFat, unit: 'g' },
                    { label: 'Carbs', value: productBData.totalCarbohydrates, unit: 'g' },
                    { label: 'Fiber', value: productBData.dietaryFiber, unit: 'g' },
                    { label: 'Sugars', value: productBData.sugars, unit: 'g' },
                    { label: 'Sodium', value: productBData.sodium, unit: 'mg' },
                  ].map(({ label, value, unit }) => (
                    <div key={label} className="p-2.5 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500">{label}</div>
                      <div className="font-semibold text-sm text-gray-800">
                        {value.toFixed(1)}{unit}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* ── Full Nutrient Comparison Table (shown after both entered) ─── */}
      {comparison && (
        <Card className="p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Full Nutrient Comparison
            </h3>
            {/* Column headers */}
            <div className="flex items-center gap-4 text-sm font-semibold">
              <span className="text-green-700">{productA.name}</span>
              <span className="text-gray-400">vs</span>
              <span className="text-blue-700">{productBName}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pb-3 border-b">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-100 border-l-2 border-green-400" />
              <span>Winner</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-50" />
              <span>Lower ranking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-blue-50" />
              <span>Tie</span>
            </div>
          </div>

          {/* Nutrient rows */}
          <div>
            {comparison.nutrients.map((nutrient) => (
              <NutrientRow
                key={nutrient.key as string}
                label={nutrient.label}
                unit={nutrient.unit}
                valueA={nutrient.valueA}
                valueB={nutrient.valueB}
                winner={nutrient.winner}
                higherIsBetter={nutrient.higherIsBetter}
              />
            ))}
          </div>

          {/* Summary row */}
          <div className="mt-4 pt-4 border-t grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className={cn(
              'text-center py-2 rounded-lg text-sm font-semibold',
              comparison.overallWinner === 'a'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            )}>
              {comparison.productAWins} wins
            </div>
            <div className="text-center text-xs text-gray-400 min-w-[110px]">
              {comparison.ties} ties
            </div>
            <div className={cn(
              'text-center py-2 rounded-lg text-sm font-semibold',
              comparison.overallWinner === 'b'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-gray-100 text-gray-600'
            )}>
              {comparison.productBWins} wins
            </div>
          </div>
        </Card>
      )}

      {/* ── Disclaimer ────────────────────────────────────────────────── */}
      <p className="text-xs text-gray-400 text-center mt-6">
        Comparison is based on per-serving values. Serving sizes may differ
        between products. This tool is for educational purposes only and does
        not constitute nutritional or medical advice.
      </p>
    </div>
  );
}
