/**
 * AI Recipe Improvement Suggestions Component
 * Suggests specific ingredient substitutions to improve nutrition score.
 * Only shown in Ingredient Builder (requires ingredient list).
 * Placed in left column below NutritionSummaryDisplay.
 */

'use client';

import { useState, useEffect } from 'react';
import { NutritionData } from '@/app/types/nutrition';
import { RecipeIngredient } from '@/app/types/recipe';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wand2, Loader2, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Suggestion {
  original: string;
  substitute: string;
  benefit: string;
  impact: 'high' | 'medium' | 'low';
}

interface RecipeSuggestionsProps {
  data: NutritionData;
  ingredients: RecipeIngredient[];
  productName?: string;
  score: number;
  className?: string;
}

// ─────────────────────────────────────────────
// Impact badge config
// ─────────────────────────────────────────────

const IMPACT_CONFIG = {
  high:   { label: 'High Impact',   color: 'bg-green-100 text-green-800 border-green-200' },
  medium: { label: 'Medium Impact', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  low:    { label: 'Low Impact',    color: 'bg-gray-100 text-gray-600 border-gray-200' },
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function RecipeSuggestionsDisplay({
  data,
  ingredients,
  productName = 'This recipe',
  score,
  className,
}: RecipeSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Reset when ingredients change
  useEffect(() => {
    setSuggestions([]);
    setHasGenerated(false);
    setError(null);
  }, [ingredients.length, data.calories, productName]);

  const generateSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/recipe-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredients: ingredients.map((i) => ({
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
          })),
          nutritionData: data,
          productName,
          score,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? 'Failed to generate suggestions.');
      } else {
        setSuggestions(result.suggestions);
        setHasGenerated(true);
      }
    } catch {
      setError('Network error — could not reach suggestions service.');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if no ingredients — generator page
  if (!ingredients || ingredients.length === 0) return null;

  return (
    <Card className={cn('p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-semibold text-gray-900">AI Recipe Improvements</h3>
        </div>
        {hasGenerated && !isLoading && (
          <Button variant="ghost" size="sm" onClick={generateSuggestions} className="h-7 px-2 text-xs text-gray-400 hover:text-gray-600">
            <RefreshCw className="w-3 h-3 mr-1" />Regenerate
          </Button>
        )}
      </div>

      {/* Initial state */}
      {!hasGenerated && !isLoading && !error && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Get AI-powered ingredient substitution suggestions to improve
            your recipe's Nutrition Quality Score from {score}/100.
          </p>
          <Button
            onClick={generateSuggestions}
            variant="outline"
            size="sm"
            className="w-full gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Suggest Improvements
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-6 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
          <p className="text-sm text-gray-500">Analyzing recipe…</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={generateSuggestions} className="w-full text-xs text-gray-500">
            Try again
          </Button>
        </div>
      )}

      {/* Suggestions list */}
      {suggestions.length > 0 && !isLoading && (
        <div className="space-y-3">
          {suggestions.map((suggestion, index) => (
            <div key={index} className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg space-y-2">
              {/* Original → Substitute */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-gray-600 bg-white border border-gray-200 px-2 py-0.5 rounded-full truncate max-w-[140px]">
                  {suggestion.original.length > 25
                    ? suggestion.original.slice(0, 25) + '…'
                    : suggestion.original}
                </span>
                <ArrowRight className="w-3 h-3 text-indigo-400 flex-shrink-0" />
                <span className="text-xs font-semibold text-indigo-800 bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-full">
                  {suggestion.substitute}
                </span>
                <Badge
                  variant="outline"
                  className={cn('text-xs ml-auto flex-shrink-0', IMPACT_CONFIG[suggestion.impact]?.color ?? IMPACT_CONFIG.low.color)}
                >
                  {IMPACT_CONFIG[suggestion.impact]?.label ?? 'Low Impact'}
                </Badge>
              </div>

              {/* Benefit explanation */}
              <p className="text-xs text-gray-600 leading-relaxed">{suggestion.benefit}</p>
            </div>
          ))}

          <p className="text-xs text-gray-400">
            AI-generated suggestions · Verify substitutions for your specific recipe
          </p>
        </div>
      )}
    </Card>
  );
}
