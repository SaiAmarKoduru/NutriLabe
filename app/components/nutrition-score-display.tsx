/**
 * ============================================================
 * Nutrition Quality Score Display
 * ============================================================
 *
 * Visual panel showing the Nutrition Quality Score with:
 *   - Animated SVG circular gauge (0–100)
 *   - Grade label + color-coded badge
 *   - Scored factor breakdown (positive/negative)
 *   - Actionable improvement suggestions
 *   - Educational disclaimer
 *
 * Layout: designed for the LEFT column of the dashboard.
 * Placed beneath NutritionForm (generator) or Recipe Summary
 * (ingredient builder Step 2) to balance the right-side preview.
 *
 * Animation:
 *   SVG arc animates from 0 to final score on mount using
 *   CSS animation on strokeDashoffset. No JS animation library needed.
 *
 * Scoring logic is fully separate in app/lib/nutrition-score.ts.
 * ============================================================
 */

'use client';

import { useMemo } from 'react';
import { NutritionData } from '@/app/types/nutrition';
import { calculateNutritionScore, ScoreFactor } from '@/app/lib/nutrition-score';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, Lightbulb, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface NutritionScoreDisplayProps {
  data: NutritionData;
  className?: string;
}

// ─────────────────────────────────────────────
// SVG Gauge Constants
// ─────────────────────────────────────────────

const GAUGE_SIZE = 180;
const GAUGE_STROKE = 14;
const GAUGE_RADIUS = (GAUGE_SIZE / 2) - (GAUGE_STROKE / 2);
const GAUGE_CIRCUMFERENCE = 2 * Math.PI * GAUGE_RADIUS;

/**
 * CircularGauge
 *
 * SVG-based animated circular progress gauge.
 * Uses strokeDashoffset technique for the progress arc.
 * CSS keyframe animation runs once on mount.
 *
 * Arc spans 270° (from 135° to 45° clockwise) — standard gauge shape.
 */
function CircularGauge({
  score,
  gaugeColor,
  grade,
}: {
  score: number;
  gaugeColor: string;
  grade: string;
}) {
  // 270° arc = 75% of full circumference
  const arcLength = GAUGE_CIRCUMFERENCE * 0.75;
  const filledLength = (score / 100) * arcLength;
  const dashOffset = arcLength - filledLength;

  // Rotation to start arc at bottom-left (135°)
  const rotation = 135;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={GAUGE_SIZE}
        height={GAUGE_SIZE}
        className="transform -rotate-0"
        role="img"
        aria-label={`Nutrition Quality Score: ${score} out of 100 — ${grade}`}
      >
        {/* ── Background track arc ───────────────────────────────────── */}
        <circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={GAUGE_RADIUS}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={GAUGE_STROKE}
          strokeDasharray={`${arcLength} ${GAUGE_CIRCUMFERENCE}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
        />

        {/* ── Filled progress arc ────────────────────────────────────── */}
        <circle
          cx={GAUGE_SIZE / 2}
          cy={GAUGE_SIZE / 2}
          r={GAUGE_RADIUS}
          fill="none"
          stroke={gaugeColor}
          strokeWidth={GAUGE_STROKE}
          strokeDasharray={`${arcLength} ${GAUGE_CIRCUMFERENCE}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform={`rotate(${rotation} ${GAUGE_SIZE / 2} ${GAUGE_SIZE / 2})`}
          style={{
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </svg>

      {/* ── Center text overlay ───────────────────────────────────────── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-black tabular-nums"
          style={{ color: gaugeColor }}
        >
          {score}
        </span>
        <span className="text-xs text-gray-400 font-medium tracking-wide">
          / 100
        </span>
        <span
          className="text-xs font-semibold mt-1"
          style={{ color: gaugeColor }}
        >
          {grade}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Factor Row
// ─────────────────────────────────────────────

/**
 * FactorRow
 * Renders a single scoring factor with impact indicator.
 */
function FactorRow({ factor }: { factor: ScoreFactor }) {
  const isPositive = factor.direction === 'positive';
  const isNegative = factor.direction === 'negative';
  const isNeutral = factor.direction === 'neutral';

  return (
    <div className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-0">
      {/* Direction icon */}
      <div className="flex-shrink-0 mt-0.5">
        {isPositive && <TrendingUp className="w-4 h-4 text-green-500" />}
        {isNegative && <TrendingDown className="w-4 h-4 text-red-500" />}
        {isNeutral && <Minus className="w-4 h-4 text-gray-400" />}
      </div>

      {/* Factor details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-gray-800">
            {factor.label}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Nutrient value */}
            <span className="text-xs text-gray-500">
              {factor.value.toFixed(1)}{factor.unit}
            </span>
            {/* Impact badge */}
            {factor.impact !== 0 && (
              <Badge
                variant="outline"
                className={cn(
                  'text-xs px-1.5 py-0',
                  isPositive && 'border-green-300 text-green-700 bg-green-50',
                  isNegative && 'border-red-300 text-red-700 bg-red-50'
                )}
              >
                {isPositive ? '+' : ''}{factor.impact}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
          {factor.message}
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function NutritionScoreDisplay({
  data,
  className,
}: NutritionScoreDisplayProps) {

  // Memoized — only recalculates when nutrition data changes
  const result = useMemo(() => calculateNutritionScore(data), [data]);

  const { score, grade, factors, suggestions, hasInsufficientData } = result;

  // Split factors for display
  const negativeFactors = factors.filter((f) => f.direction === 'negative');
  const positiveFactors = factors.filter((f) => f.direction === 'positive');
  const neutralFactors = factors.filter((f) => f.direction === 'neutral');

  return (
    <Card className={cn('p-5 space-y-5', className)}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-gray-900">
          Nutrition Quality Score
        </h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Based on FSA Nutrient Profiling Model · Per serving analysis
        </p>
      </div>

      {hasInsufficientData ? (
        /* ── Insufficient data state ──────────────────────────────────── */
        <div className="flex items-start gap-3 bg-gray-50 rounded-lg p-4">
          <Info className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-500">
            Enter nutrition information to calculate a quality score.
          </p>
        </div>
      ) : (
        <>
          {/* ── Gauge + Grade ──────────────────────────────────────────── */}
          <div className="flex flex-col items-center gap-3">
            <CircularGauge
              score={score}
              gaugeColor={grade.gaugeColor}
              grade={grade.label}
            />

            {/* Score breakdown pills */}
            <div className="flex items-center gap-3 text-xs">
              {result.totalDeductions > 0 && (
                <span className="flex items-center gap-1 text-red-600 font-medium">
                  <TrendingDown className="w-3 h-3" />
                  -{result.totalDeductions} pts
                </span>
              )}
              {result.totalAdditions > 0 && (
                <span className="flex items-center gap-1 text-green-600 font-medium">
                  <TrendingUp className="w-3 h-3" />
                  +{result.totalAdditions} pts
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 text-center">
              {grade.description}
            </p>
          </div>

          {/* ── Score Breakdown ────────────────────────────────────────── */}
          {factors.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Score Breakdown
              </h4>

              <div className="space-y-0">
                {negativeFactors.map((f) => (
                  <FactorRow key={f.label} factor={f} />
                ))}
                {positiveFactors.map((f) => (
                  <FactorRow key={f.label} factor={f} />
                ))}
                {neutralFactors.map((f) => (
                  <FactorRow key={f.label} factor={f} />
                ))}
              </div>
            </div>
          )}

          {/* ── Improvement Suggestions ────────────────────────────────── */}
          {suggestions.length > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wide">
                  How to improve
                </h4>
              </div>
              <ul className="space-y-1.5">
                {suggestions.map((suggestion, i) => (
                  <li key={i} className="text-xs text-blue-700 flex items-start gap-1.5">
                    <span className="text-blue-400 flex-shrink-0 mt-0.5">•</span>
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* ── Educational Disclaimer ─────────────────────────────────────── */}
      <div className="flex items-start gap-2 pt-2 border-t border-gray-100">
        <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">
          This is an educational nutrition assessment based on the FSA Nutrient
          Profiling Model and is not a substitute for medical or dietary advice.
          Individual nutritional needs vary. Consult a registered dietitian for
          personalised guidance.
        </p>
      </div>
    </Card>
  );
}
