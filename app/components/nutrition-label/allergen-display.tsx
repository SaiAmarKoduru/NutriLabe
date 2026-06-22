/**
 * ============================================================
 * Allergen Display Component
 * ============================================================
 *
 * Renders a panel showing all detected allergens for a recipe.
 *
 * Each allergen card shows:
 *   - Icon + name + severity badge
 *   - Which ingredients triggered the detection (explainability)
 *   - Which regulations require declaration of this allergen
 *   - Plain-language description of what the allergen covers
 *
 * Explainability principle:
 *   Every allergen result must explain WHY it was flagged.
 *   Never show a badge without showing the source ingredient.
 *
 * Severity colors:
 *   high   → red  (direct allergen: "whole milk", "egg")
 *   medium → amber (derivative: "whey" → milk, "lecithin" → soy)
 *
 * If no allergens are detected, shows a clean "no allergens" state.
 * If no ingredients provided, renders nothing (generator page).
 * ============================================================
 */

'use client';

import { AllergenResult, getAllergenSummary } from '@/app/lib/allergens';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface AllergenDisplayProps {
  /** Results from detectAllergens() — empty array means no allergens detected */
  results: AllergenResult[];
  /** Whether we have an ingredient list at all (false on generator page) */
  hasIngredients: boolean;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/**
 * AllergenCard
 *
 * Renders a single allergen detection result with full explainability context.
 * Color-coded by severity for immediate visual recognition.
 */
function AllergenCard({ result }: { result: AllergenResult }) {
  const isHigh = result.severity === 'high';

  return (
    <div
      className={cn(
        'rounded-lg border p-4 transition-colors',
        isHigh
          ? 'border-red-200 bg-red-50'
          : 'border-amber-200 bg-amber-50'
      )}
      role="alert"
      aria-label={`${result.allergen.name} allergen detected`}
    >
      {/* ── Header row: icon + name + severity badge ─────────────────── */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          {/* Allergen emoji icon */}
          <span className="text-xl" role="img" aria-label={result.allergen.name}>
            {result.allergen.icon}
          </span>

          <div>
            <span className="font-semibold text-gray-900 text-sm">
              {result.allergen.name}
            </span>
          </div>
        </div>

        {/* Severity badge */}
        <Badge
          className={cn(
            'text-xs flex-shrink-0',
            isHigh
              ? 'bg-red-100 text-red-700 border-red-300'
              : 'bg-amber-100 text-amber-700 border-amber-300'
          )}
          variant="outline"
        >
          {isHigh ? '⚠ High' : '△ Medium'}
        </Badge>
      </div>

      {/* ── Description ──────────────────────────────────────────────── */}
      <p className="text-xs text-gray-600 mb-3 leading-relaxed">
        {result.allergen.description}
      </p>

      {/* ── Explainability: which ingredients triggered this ──────────── */}
      <div className="mb-3">
        <p className="text-xs font-medium text-gray-500 mb-1">
          Detected in:
        </p>
        <div className="flex flex-wrap gap-1">
          {result.matchedIngredients.map((ing) => (
            <span
              key={ing}
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                isHigh
                  ? 'bg-red-100 text-red-800'
                  : 'bg-amber-100 text-amber-800'
              )}
            >
              {/* Truncate very long USDA ingredient names */}
              {ing.length > 40 ? ing.slice(0, 40) + '…' : ing}
            </span>
          ))}
        </div>
      </div>

      {/* ── Regulatory requirement ────────────────────────────────────── */}
      <div>
        <p className="text-xs font-medium text-gray-500 mb-1">
          Required declaration:
        </p>
        <div className="flex flex-wrap gap-1">
          {result.allergen.regulations.map((reg) => (
            <span
              key={reg}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
            >
              {reg}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function AllergenDisplay({ results, hasIngredients }: AllergenDisplayProps) {

  // ── Guard: no ingredient list (generator page) ────────────────────────
  // On the generator page, users enter nutrition values manually without
  // an ingredient list, so allergen detection is not possible.
  if (!hasIngredients) {
    return (
      <Card className="p-5 mt-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Allergen Detection
            </h3>
            <p className="text-sm text-gray-500">
              Allergen detection is available when using the{' '}
              <span className="font-medium text-blue-600">
                Ingredient Builder
              </span>
              . It automatically identifies the 14 major EU allergens
              from your ingredient list.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // ── No allergens detected ─────────────────────────────────────────────
  if (results.length === 0) {
    return (
      <Card className="p-5 mt-6">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-1">
              Allergen Information
            </h3>
            <p className="text-sm text-gray-500">
              No major allergens detected in this recipe based on the 14 EU
              regulated allergens. Always verify ingredient labels independently
              for cross-contamination risks.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // ── Allergens detected ────────────────────────────────────────────────
  const highCount = results.filter((r) => r.severity === 'high').length;
  const summary = getAllergenSummary(results);

  return (
    <div className="mt-6 space-y-4">

      {/* ── Section Header ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Allergen Information
            </h3>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            Based on EU Regulation 1169/2011 — 14 major allergens
          </p>
        </div>

        {/* Summary badge */}
        <Badge
          className="bg-red-100 text-red-700 border-red-300 flex-shrink-0"
          variant="outline"
        >
          {results.length} allergen{results.length > 1 ? 's' : ''} found
        </Badge>
      </div>

      {/* ── Warning banner ────────────────────────────────────────────── */}
      <div
        className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3"
        role="alert"
        aria-live="polite"
        aria-label={summary}
      >
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-red-700">
          <span className="font-semibold">
            {highCount > 0
              ? `${highCount} high-severity allergen${highCount > 1 ? 's' : ''} detected.`
              : 'Allergen derivatives detected.'}{' '}
          </span>
          This product must declare the following allergens on its label
          in all supported markets.
        </p>
      </div>

      {/* ── Allergen Cards Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {results.map((result) => (
          <AllergenCard key={result.allergen.id} result={result} />
        ))}
      </div>

      {/* ── Disclaimer ───────────────────────────────────────────────── */}
      <p className="text-xs text-gray-400 leading-relaxed">
        Detection is based on ingredient name matching and may not capture
        all allergen-containing derivatives. Always consult a food safety
        professional for regulatory compliance. Cross-contamination risks
        are not assessed by this tool.
      </p>

    </div>
  );
}
