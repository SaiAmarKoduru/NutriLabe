/**
 * ============================================================
 * Product Comparison Page — /compare
 * ============================================================
 *
 * State machine with 3 states:
 *
 *   waiting_for_a  → no Product A in sessionStorage
 *   waiting_for_b  → Product A loaded, Product B not yet created
 *   comparing      → both products loaded, full comparison shown
 *
 * Product B creation flow:
 *   User selects a method (Generator or Ingredient Builder)
 *   → navigates to existing page with ?mode=compare_b
 *   → existing page runs its full normal workflow
 *   → user clicks "Save as Product B & Return"
 *   → saveProductB() called, navigate back to /compare
 *   → compare page re-reads sessionStorage, enters comparing state
 *
 * This page never duplicates Generator or Ingredient Builder UI.
 * It only orchestrates navigation and renders comparison results.
 * ============================================================
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  loadProductA,
  loadProductB,
  clearProductA,
  clearProductB,
  clearAllProducts,
  compareProducts,
  SavedProduct,
  Winner,
} from '@/app/lib/comparison';
import { calculateNutritionScore } from '@/app/lib/nutrition-score';
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
  FlaskConical,
  ClipboardList,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { NutritionData } from '@/app/types/nutrition';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type CompareState = 'waiting_for_a' | 'waiting_for_b' | 'comparing';

// ─────────────────────────────────────────────
// Helper — Winner styling
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
// Sub-component — Nutrient Row
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
    winner === 'tie' || winner === 'neutral' ? Minus
    : higherIsBetter ? TrendingUp
    : TrendingDown;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2 border-b border-gray-100 last:border-0">
      <div className={cn('text-right px-3 py-1.5 rounded text-sm', getWinnerBg(winner, 'a'))}>
        <span className={cn(getWinnerText(winner, 'a'))}>
          {valueA.toFixed(1)}{unit}
        </span>
      </div>
      <div className="flex flex-col items-center gap-0.5 min-w-[110px]">
        <span className="text-xs font-medium text-gray-600 text-center">{label}</span>
        <Icon className={cn(
          'w-3.5 h-3.5',
          winner === 'a' || winner === 'b' ? 'text-green-500' :
          winner === 'tie' ? 'text-blue-400' : 'text-gray-300'
        )} />
      </div>
      <div className={cn('text-left px-3 py-1.5 rounded text-sm', getWinnerBg(winner, 'b'))}>
        <span className={cn(getWinnerText(winner, 'b'))}>
          {valueB.toFixed(1)}{unit}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Sub-component — Product Summary Card
// ─────────────────────────────────────────────

function ProductSummaryCard({
  product,
  side,
  score,
}: {
  product: SavedProduct;
  side: 'a' | 'b';
  score: number;
}) {
  const isA = side === 'a';
  const data = product.data;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <Badge className={cn(
          'mb-2',
          isA ? 'bg-green-100 text-green-800 border-green-300'
               : 'bg-blue-100 text-blue-800 border-blue-300'
        )}>
          Product {side.toUpperCase()}
        </Badge>
        <h2 className="text-xl font-bold text-gray-900">{product.name}</h2>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline" className="text-xs">
            {product.source === 'ingredient-builder' ? '🧪 Ingredient Builder' : '📋 Generator'}
          </Badge>
          <span className="text-xs text-gray-400">
            Saved {new Date(product.savedAt).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Quality Score */}
      <NutritionScoreDisplay data={data} />

      {/* Key nutrients */}
      <Card className="p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Key Nutrients Per Serving
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {([
            { label: 'Calories',   value: data.calories,           unit: 'kcal' },
            { label: 'Protein',    value: data.protein,            unit: 'g'    },
            { label: 'Total Fat',  value: data.totalFat,           unit: 'g'    },
            { label: 'Sat. Fat',   value: data.saturatedFat,       unit: 'g'    },
            { label: 'Carbs',      value: data.totalCarbohydrates, unit: 'g'    },
            { label: 'Fiber',      value: data.dietaryFiber,       unit: 'g'    },
            { label: 'Sugars',     value: data.sugars,             unit: 'g'    },
            { label: 'Sodium',     value: data.sodium,             unit: 'mg'   },
          ] as Array<{ label: string; value: number; unit: string }>).map(({ label, value, unit }) => (
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
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

export default function ComparePage() {
  const router = useRouter();

  const [productA, setProductA] = useState<SavedProduct | null>(null);
  const [productB, setProductB] = useState<SavedProduct | null>(null);
  const [state, setState] = useState<CompareState>('waiting_for_a');

  // ── Load products from sessionStorage on mount ────────────────────────
  useEffect(() => {
    const a = loadProductA();
    const b = loadProductB();
    setProductA(a);
    setProductB(b);

    if (!a) {
      setState('waiting_for_a');
    } else if (!b) {
      setState('waiting_for_b');
    } else {
      setState('comparing');
    }
  }, []);

  // ── Derived comparison ────────────────────────────────────────────────
  const scoreA = useMemo(
    () => (productA ? calculateNutritionScore(productA.data).score : 0),
    [productA]
  );
  const scoreB = useMemo(
    () => (productB ? calculateNutritionScore(productB.data).score : 0),
    [productB]
  );
  const comparison = useMemo(() => {
    if (!productA || !productB) return null;
    return compareProducts(productA.data, productB.data, scoreA, scoreB);
  }, [productA, productB, scoreA, scoreB]);

  // ── Handlers ──────────────────────────────────────────────────────────

  /**
   * Navigate to Generator in compare_b mode.
   * The generator page detects ?mode=compare_b and shows
   * "Save as Product B & Return" instead of "Save & Compare".
   */
  const handleSelectGenerator = () => {
    router.push('/generator?mode=compare_b');
  };

  /**
   * Navigate to Ingredient Builder in compare_b mode.
   */
  const handleSelectIngredientBuilder = () => {
    router.push('/ingredient-builder?mode=compare_b');
  };

  /**
   * Replace Product B — clears B and returns to method selector.
   */
  const handleReplaceB = () => {
    clearProductB();
    setProductB(null);
    setState('waiting_for_b');
  };

  /**
   * Replace Product A — clears A and returns to empty state.
   * User should go back to generator/builder to create a new Product A.
   */
  const handleReplaceA = () => {
    clearProductA();
    setProductA(null);
    setState('waiting_for_a');
  };

  /**
   * Start Over — clears everything.
   */
  const handleStartOver = () => {
    clearAllProducts();
    setProductA(null);
    setProductB(null);
    setState('waiting_for_a');
  };

  // ── STATE: waiting_for_a ─────────────────────────────────────────────
  if (state === 'waiting_for_a') {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl text-center">
        <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          No Product Saved Yet
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          To compare products, first generate a label using either the
          Nutrition Generator or Ingredient Builder, then click{' '}
          <span className="font-medium text-gray-700">"Save & Compare"</span>.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Button variant="outline" onClick={() => router.push('/generator')}>
            <ClipboardList className="w-4 h-4 mr-2" />
            Nutrition Generator
          </Button>
          <Button onClick={() => router.push('/ingredient-builder')}>
            <FlaskConical className="w-4 h-4 mr-2" />
            Ingredient Builder
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // ── STATE: waiting_for_b ─────────────────────────────────────────────
  if (state === 'waiting_for_b' && productA) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Product Comparison</h1>
            <p className="text-gray-500 mt-1">
              Product A is ready. Now create Product B to compare.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Product A summary */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-700">Product A (Saved)</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReplaceA}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Replace
              </Button>
            </div>
            <ProductSummaryCard product={productA} side="a" score={scoreA} />
          </div>

          {/* Product B method selector */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-700">
              Create Product B
            </h2>
            <p className="text-sm text-gray-500">
              Choose how you want to create Product B. You will be taken to
              the full workflow — all features are available.
            </p>

            <div className="grid grid-cols-1 gap-4">

              {/* Generator option */}
              <button
                onClick={handleSelectGenerator}
                className="text-left p-5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                    <ClipboardList className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">
                      Nutrition Generator
                    </div>
                    <div className="text-sm text-gray-500 leading-relaxed">
                      Manually enter nutrition values. Best for products with
                      a known nutrition facts panel.
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-400 flex-shrink-0 mt-2 transition-colors" />
                </div>
              </button>

              {/* Ingredient Builder option */}
              <button
                onClick={handleSelectIngredientBuilder}
                className="text-left p-5 rounded-xl border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
                    <FlaskConical className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-800 mb-1">
                      Ingredient Builder
                    </div>
                    <div className="text-sm text-gray-500 leading-relaxed">
                      Build from ingredients using the USDA database. Includes
                      allergen detection, dietary tags, charts, and quality score.
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-green-400 flex-shrink-0 mt-2 transition-colors" />
                </div>
              </button>
            </div>

            <p className="text-xs text-gray-400 text-center pt-2">
              After creating Product B, you will be automatically returned here
              to view the comparison.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── STATE: comparing ─────────────────────────────────────────────────
  if (state === 'comparing' && productA && productB && comparison) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Product Comparison</h1>
            <p className="text-gray-500 mt-1">
              Side-by-side nutritional analysis
            </p>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Button variant="outline" size="sm" onClick={handleReplaceB}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Replace Product B
            </Button>
            <Button variant="outline" size="sm" onClick={handleStartOver}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        </div>

        {/* Overall Winner Banner */}
        <div className={cn(
          'rounded-xl p-4 mb-8 flex items-center justify-between flex-wrap gap-3',
          comparison.overallWinner === 'a' ? 'bg-green-50 border border-green-200' :
          comparison.overallWinner === 'b' ? 'bg-blue-50 border border-blue-200' :
          'bg-gray-50 border border-gray-200'
        )}>
          <div className="flex items-center gap-3">
            <Trophy className={cn(
              'w-6 h-6',
              comparison.overallWinner === 'a' ? 'text-green-500' :
              comparison.overallWinner === 'b' ? 'text-blue-500' :
              'text-gray-400'
            )} />
            <div>
              <p className="font-semibold text-gray-800">
                {comparison.overallWinner === 'tie'
                  ? 'These products are nutritionally similar'
                  : `${comparison.overallWinner === 'a' ? productA.name : productB.name} wins overall`
                }
              </p>
              <p className="text-sm text-gray-500">
                {productA.name}: {comparison.productAWins} wins ·{' '}
                {productB.name}: {comparison.productBWins} wins ·{' '}
                {comparison.ties} ties
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className={cn(
              comparison.scoreWinner === 'a'
                ? 'border-green-400 text-green-700 bg-green-50'
                : 'border-gray-300 text-gray-600'
            )}>
              Score A: {scoreA}
            </Badge>
            <Badge variant="outline" className={cn(
              comparison.scoreWinner === 'b'
                ? 'border-blue-400 text-blue-700 bg-blue-50'
                : 'border-gray-300 text-gray-600'
            )}>
              Score B: {scoreB}
            </Badge>
          </div>
        </div>

        {/* Side-by-side product summaries */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-8">
          <ProductSummaryCard product={productA} side="a" score={scoreA} />
          <ProductSummaryCard product={productB} side="b" score={scoreB} />
        </div>

        {/* Full Nutrient Comparison Table */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Full Nutrient Comparison
            </h3>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <span className="text-green-700">{productA.name}</span>
              <span className="text-gray-400">vs</span>
              <span className="text-blue-700">{productB.name}</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-4 pb-3 border-b flex-wrap">
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

          {/* Win tally */}
          <div className="mt-4 pt-4 border-t grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className={cn(
              'text-center py-2 rounded-lg text-sm font-semibold',
              comparison.overallWinner === 'a' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            )}>
              {comparison.productAWins} wins
            </div>
            <div className="text-center text-xs text-gray-400 min-w-[110px]">
              {comparison.ties} ties
            </div>
            <div className={cn(
              'text-center py-2 rounded-lg text-sm font-semibold',
              comparison.overallWinner === 'b' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
            )}>
              {comparison.productBWins} wins
            </div>
          </div>
        </Card>

        <p className="text-xs text-gray-400 text-center mt-6">
          Comparison is based on per-serving values. Serving sizes may differ
          between products. This tool is for educational purposes only.
        </p>
      </div>
    );
  }

  return null;
}
