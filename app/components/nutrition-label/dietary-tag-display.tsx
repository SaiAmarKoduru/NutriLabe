/**
 * ============================================================
 * Dietary Tag Display Component
 * ============================================================
 *
 * Renders dietary classification badges for a recipe.
 *
 * Display logic:
 *   - Positive tags (Vegan, GF, Dairy-Free etc.) shown when detected=true
 *   - Warning tags (Contains Meat, Contains Fish) shown when detected=true
 *   - Hovering/expanding a tag shows the reason + triggering ingredients
 *
 * Explainability principle:
 *   Every tag shows WHY it was assigned — which ingredient confirmed
 *   or disqualified the classification.
 *
 * States handled:
 *   - No ingredients → null (generator page, no panel rendered)
 *   - No tags detected → "all clear" summary
 *   - Tags detected → badge grid with expandable details
 * ============================================================
 */

'use client';

import { useState } from 'react';
import { DietaryTagResult, getDetectedTags } from '@/app/lib/dietary-tags';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface DietaryTagDisplayProps {
  tags: DietaryTagResult[];
  hasIngredients: boolean;
}

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

/**
 * TagBadge
 *
 * A single expandable dietary tag badge.
 * Clicking it toggles an explanation panel showing
 * the reason and triggering ingredients.
 */
function TagBadge({ tag }: { tag: DietaryTagResult }) {
  const [expanded, setExpanded] = useState(false);

  const isPositive = tag.style === 'positive';
  const isWarning = tag.style === 'warning';

  return (
    <div className="w-full">
      {/* ── Badge Button ───────────────────────────────────────────── */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          'w-full flex items-center justify-between px-3 py-2 rounded-lg',
          'border transition-all text-left',
          'hover:shadow-sm active:scale-[0.99]',
          isPositive && 'border-green-200 bg-green-50 hover:bg-green-100',
          isWarning && 'border-orange-200 bg-orange-50 hover:bg-orange-100'
        )}
        aria-expanded={expanded}
        aria-label={`${tag.label}: ${tag.reason}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-base" role="img" aria-label={tag.label}>
            {tag.icon}
          </span>
          <span
            className={cn(
              'text-sm font-semibold',
              isPositive && 'text-green-800',
              isWarning && 'text-orange-800'
            )}
          >
            {tag.label}
          </span>
        </div>

        {/* Expand chevron */}
        <span className={cn(
          'flex-shrink-0',
          isPositive ? 'text-green-500' : 'text-orange-500'
        )}>
          {expanded
            ? <ChevronUp className="w-3.5 h-3.5" />
            : <ChevronDown className="w-3.5 h-3.5" />
          }
        </span>
      </button>

      {/* ── Expanded Detail Panel ──────────────────────────────────── */}
      {expanded && (
        <div
          className={cn(
            'mt-1 px-3 py-2 rounded-lg border text-xs space-y-2',
            isPositive && 'border-green-100 bg-green-50/50',
            isWarning && 'border-orange-100 bg-orange-50/50'
          )}
        >
          {/* Reason */}
          <p className="text-gray-700 leading-relaxed">{tag.reason}</p>

          {/* Triggering ingredients — only shown for warning tags or
              when there are specific ingredients to cite */}
          {tag.triggeringIngredients.length > 0 && (
            <div>
              <p className="font-medium text-gray-500 mb-1">
                {isWarning ? 'Found in:' : 'Disqualified by:'}
              </p>
              <div className="flex flex-wrap gap-1">
                {tag.triggeringIngredients.slice(0, 3).map((ing) => (
                  <span
                    key={ing}
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs',
                      isWarning
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-red-100 text-red-700'
                    )}
                  >
                    {ing.length > 35 ? ing.slice(0, 35) + '…' : ing}
                  </span>
                ))}
                {tag.triggeringIngredients.length > 3 && (
                  <span className="px-2 py-0.5 text-gray-400 text-xs">
                    +{tag.triggeringIngredients.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function DietaryTagDisplay({ tags, hasIngredients }: DietaryTagDisplayProps) {

  // Guard: no ingredient list (generator page)
  if (!hasIngredients) return null;

  const detectedTags = getDetectedTags(tags);

  // Separate positive tags from warning tags for visual grouping
  const positiveTags = detectedTags.filter((t) => t.style === 'positive');
  const warningTags = detectedTags.filter((t) => t.style === 'warning');

  return (
    <div className="mt-6 space-y-4">

      {/* ── Section Header ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2">
        <Leaf className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold text-gray-900">
          Dietary Classification
        </h3>
      </div>

      <p className="text-sm text-gray-500">
        Based on ingredient analysis. Click any tag to see why it was assigned.
      </p>

      {detectedTags.length === 0 ? (
        // No tags apply — neutral state
        <Card className="p-4">
          <p className="text-sm text-gray-500">
            No specific dietary classifications could be confirmed from the
            current ingredient list. Add more ingredients for a complete analysis.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">

          {/* ── Positive Tags (Vegan, GF, Dairy-Free etc.) ────────────── */}
          {positiveTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                This recipe is suitable for
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {positiveTags.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </div>
            </div>
          )}

          {/* ── Warning / Informational Tags ──────────────────────────── */}
          {warningTags.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Dietary notes
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {warningTags.map((tag) => (
                  <TagBadge key={tag.id} tag={tag} />
                ))}
              </div>
            </div>
          )}

          {/* ── Summary count ─────────────────────────────────────────── */}
          <p className="text-xs text-gray-400">
            {positiveTags.length} dietary classification{positiveTags.length !== 1 ? 's' : ''} confirmed
            {warningTags.length > 0 && ` · ${warningTags.length} dietary note${warningTags.length !== 1 ? 's' : ''}`}.
            Results are based on ingredient name matching and may not reflect
            processing or cross-contamination.
          </p>
        </div>
      )}
    </div>
  );
}
