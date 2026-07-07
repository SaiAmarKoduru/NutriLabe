/**
 * Ingredient Explanation Panel
 * Displays AI-generated explanation for a food ingredient.
 * Used as a modal triggered from the ingredient list.
 */

'use client';

import { useState } from 'react';
import { explainIngredient, IngredientExplanation } from '@/app/lib/ai-explainer';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HelpCircle, X, Loader2, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────
// Config maps
// ─────────────────────────────────────────────

const SAFETY_CONFIG = {
  'generally-safe': {
    label: 'Generally Safe',
    color: 'text-green-700 bg-green-50 border-green-200',
    icon: CheckCircle,
  },
  'use-in-moderation': {
    label: 'Use in Moderation',
    color: 'text-amber-700 bg-amber-50 border-amber-200',
    icon: Info,
  },
  'controversial': {
    label: 'Controversial',
    color: 'text-orange-700 bg-orange-50 border-orange-200',
    icon: AlertTriangle,
  },
  'restricted': {
    label: 'Restricted in Some Regions',
    color: 'text-red-700 bg-red-50 border-red-200',
    icon: AlertTriangle,
  },
} as const;

const ORIGIN_CONFIG = {
  'natural': { label: 'Natural', color: 'bg-green-100 text-green-800' },
  'synthetic': { label: 'Synthetic', color: 'bg-red-100 text-red-700' },
  'semi-synthetic': { label: 'Semi-Synthetic', color: 'bg-amber-100 text-amber-800' },
  'unknown': { label: 'Origin Unknown', color: 'bg-gray-100 text-gray-600' },
} as const;

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

interface IngredientExplanationButtonProps {
  ingredientName: string;
  /** Optional size variant for different contexts */
  size?: 'sm' | 'xs';
}

export function IngredientExplanationButton({
  ingredientName,
  size = 'sm',
}: IngredientExplanationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState<IngredientExplanation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    setIsOpen(true);

    // Use cached result if already fetched for this ingredient
    if (explanation) return;

    setIsLoading(true);
    setError(null);

    const result = await explainIngredient(ingredientName);

    if (result.success && result.data) {
      setExplanation(result.data);
    } else {
      setError(result.error ?? 'Failed to load explanation');
    }

    setIsLoading(false);
  };

  const safetyConfig = explanation
    ? SAFETY_CONFIG[explanation.safetyRating]
    : null;
  const originConfig = explanation
    ? ORIGIN_CONFIG[explanation.naturalOrSynthetic]
    : null;
  const SafetyIcon = safetyConfig?.icon ?? Info;

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'text-gray-400 hover:text-blue-500 hover:bg-blue-50 flex-shrink-0',
            size === 'xs' ? 'h-6 w-6' : 'h-7 w-7'
          )}
          onClick={handleOpen}
          title={`Explain: ${ingredientName}`}
          aria-label={`Get AI explanation for ${ingredientName}`}
        >
          <HelpCircle className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content className={cn(
          'fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%]',
          'w-[95vw] max-w-lg max-h-[85vh]',
          'bg-white rounded-xl shadow-2xl flex flex-col',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[state=closed]:slide-out-to-left-1/2 data-[state=open]:slide-in-from-left-1/2',
          'data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-top-[48%]',
          'duration-200'
        )}>

          {/* Header */}
          <div className="flex items-start justify-between px-5 py-4 border-b flex-shrink-0">
            <div className="flex items-center gap-2 pr-4">
              <Zap className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <Dialog.Title className="text-sm font-semibold text-gray-800 leading-snug">
                {ingredientName.length > 60
                  ? ingredientName.slice(0, 60) + '…'
                  : ingredientName}
              </Dialog.Title>
            </div>
            <Dialog.Close asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">

            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500">Analyzing ingredient…</p>
              </div>
            )}

            {/* Error state */}
            {error && !isLoading && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-700">Could not load explanation</p>
                  <p className="text-xs text-red-600 mt-1">{error}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-red-600 h-7 px-2 text-xs"
                    onClick={() => {
                      setError(null);
                      handleOpen();
                    }}
                  >
                    Try again
                  </Button>
                </div>
              </div>
            )}

            {/* Explanation content */}
            {explanation && !isLoading && (
              <div className="space-y-4">

                {/* Badges row */}
                <div className="flex flex-wrap gap-2">
                  {originConfig && (
                    <Badge className={cn('text-xs border-0', originConfig.color)}>
                      {originConfig.label}
                    </Badge>
                  )}
                  {safetyConfig && (
                    <div className={cn(
                      'flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium',
                      safetyConfig.color
                    )}>
                      <SafetyIcon className="w-3 h-3" />
                      {safetyConfig.label}
                    </div>
                  )}
                </div>

                {/* What it is */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    What it is
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {explanation.explanation}
                  </p>
                </div>

                {/* Health considerations */}
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Health considerations
                  </h3>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {explanation.healthConsiderations}
                  </p>
                </div>

                {/* Common names */}
                {explanation.commonNames.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Also known as
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {explanation.commonNames.map((name) => (
                        <span
                          key={name}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t bg-gray-50 rounded-b-xl flex-shrink-0">
            <p className="text-xs text-gray-400 text-center">
              AI-generated explanation · For educational purposes only
            </p>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
