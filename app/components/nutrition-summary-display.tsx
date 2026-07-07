/**
 * AI Nutrition Summary Component
 * Generates and displays a Gemini-powered plain-language nutrition summary.
 * Placed in the LEFT column below NutritionScoreDisplay on both pages.
 */

'use client';

import { useState, useEffect } from 'react';
import { NutritionData } from '@/app/types/nutrition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NutritionSummaryProps {
  data: NutritionData;
  productName?: string;
  /** Detected dietary tag labels e.g. ['Vegan', 'Gluten-Free'] */
  dietaryTags?: string[];
  /** Detected allergen names e.g. ['Gluten', 'Milk'] */
  allergens?: string[];
  className?: string;
}

export function NutritionSummaryDisplay({
  data,
  productName = 'This product',
  dietaryTags = [],
  allergens = [],
  className,
}: NutritionSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  /**
   * Reset when nutrition data changes significantly.
   * Uses calories as a proxy — if the product changes, regenerate.
   */
  useEffect(() => {
    setSummary(null);
    setHasGenerated(false);
    setError(null);
  }, [data.calories, data.protein, data.sodium, productName]);

  const generateSummary = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/nutrition-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nutritionData: data,
          productName,
          dietaryTags,
          allergens,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error ?? 'Failed to generate summary.');
      } else {
        setSummary(result.summary);
        setHasGenerated(true);
      }
    } catch {
      setError('Network error — could not reach summary service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn('p-5', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-500" />
          <h3 className="text-sm font-semibold text-gray-900">AI Nutrition Summary</h3>
        </div>
        {hasGenerated && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSummary}
            className="h-7 px-2 text-xs text-gray-400 hover:text-gray-600"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Regenerate
          </Button>
        )}
      </div>

      {/* Initial state — not yet generated */}
      {!hasGenerated && !isLoading && !error && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 leading-relaxed">
            Get an AI-generated plain-language summary of this product's
            nutritional profile, strengths, concerns, and suitability.
          </p>
          <Button
            onClick={generateSummary}
            variant="outline"
            size="sm"
            className="w-full gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Nutrition Summary
          </Button>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-6 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
          <p className="text-sm text-gray-500">Analyzing nutrition profile…</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="space-y-2">
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSummary}
            className="w-full text-xs text-gray-500"
          >
            Try again
          </Button>
        </div>
      )}

      {/* Summary result */}
      {summary && !isLoading && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
          <p className="text-xs text-gray-400">
            AI-generated · For educational purposes only · Not medical advice
          </p>
        </div>
      )}
    </Card>
  );
}
