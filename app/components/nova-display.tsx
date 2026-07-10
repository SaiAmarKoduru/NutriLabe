/**
 * NOVA Food Processing Classification Display
 * Shows NOVA group with visual indicator, ingredient breakdown, and research citation.
 * Placed in left column of ingredient builder Step 2.
 */

'use client';

import { useState } from 'react';
import { NovaClassificationResult } from '@/app/lib/nova-classification';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, FlaskConical, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NovaDisplayProps {
  result: NovaClassificationResult;
  className?: string;
}

const GROUP_BG: Record<number, string> = {
  1: 'bg-green-50 border-green-200',
  2: 'bg-lime-50 border-lime-200',
  3: 'bg-amber-50 border-amber-200',
  4: 'bg-red-50 border-red-200',
};

const GROUP_BADGE: Record<number, string> = {
  1: 'bg-green-100 text-green-800 border-green-300',
  2: 'bg-lime-100 text-lime-800 border-lime-300',
  3: 'bg-amber-100 text-amber-800 border-amber-300',
  4: 'bg-red-100 text-red-800 border-red-300',
};

export function NovaDisplay({ result, className }: NovaDisplayProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showCitation, setShowCitation] = useState(false);

  const group4Count = result.group4Triggers.length;
  const group3Count = result.group3Triggers.length;

  return (
    <Card className={cn('p-5', className)}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <FlaskConical className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">NOVA Classification</h3>
        <Badge variant="outline" className="ml-auto text-xs bg-gray-50 text-gray-500">
          WHO/FAO Standard
        </Badge>
      </div>

      {/* Group indicator */}
      <div className={cn('rounded-lg border p-4 mb-3', GROUP_BG[result.group])}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {/* Large group number */}
            <div className="flex items-baseline gap-2 mb-1">
              <span
                className="text-4xl font-black"
                style={{ color: result.gaugeColor }}
              >
                {result.group}
              </span>
              <span className="text-sm text-gray-500 font-medium">/ 4</span>
            </div>
            <p className={cn('text-sm font-semibold', result.color)}>
              {result.label.split('—')[1]?.trim()}
            </p>
          </div>

          {/* Visual group bars */}
          <div className="flex gap-1 items-end flex-shrink-0">
            {[1, 2, 3, 4].map((g) => (
              <div
                key={g}
                className="w-4 rounded-sm transition-all"
                style={{
                  height: `${g * 10 + 8}px`,
                  backgroundColor: g <= result.group
                    ? result.gaugeColor
                    : '#e5e7eb',
                  opacity: g === result.group ? 1 : g < result.group ? 0.5 : 0.2,
                }}
              />
            ))}
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-2 leading-relaxed">
          {result.description}
        </p>
      </div>

      {/* Trigger summary */}
      {(group4Count > 0 || group3Count > 0) && (
        <div className="space-y-2 mb-3">
          {group4Count > 0 && (
            <div>
              <p className="text-xs font-medium text-red-600 mb-1">
                Ultra-processed triggers ({group4Count}):
              </p>
              <div className="flex flex-wrap gap-1">
                {result.group4Triggers.slice(0, 3).map((name) => (
                  <span key={name} className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                    {name}
                  </span>
                ))}
                {group4Count > 3 && (
                  <span className="text-xs text-red-400">+{group4Count - 3} more</span>
                )}
              </div>
            </div>
          )}
          {group3Count > 0 && result.group < 4 && (
            <div>
              <p className="text-xs font-medium text-amber-600 mb-1">
                Processed ingredients ({group3Count}):
              </p>
              <div className="flex flex-wrap gap-1">
                {result.group3Triggers.slice(0, 3).map((name) => (
                  <span key={name} className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Expandable ingredient breakdown */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-gray-500 hover:text-gray-700 h-7"
        onClick={() => setShowDetails((v) => !v)}
      >
        {showDetails ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
        {showDetails ? 'Hide' : 'Show'} ingredient breakdown
      </Button>

      {showDetails && (
        <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
          {result.matchedIngredients.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-2 py-1 border-b border-gray-100 last:border-0">
              <span className="text-xs text-gray-600 truncate flex-1">
                {item.ingredientName.length > 35
                  ? item.ingredientName.slice(0, 35) + '…'
                  : item.ingredientName}
              </span>
              <Badge
                variant="outline"
                className={cn('text-xs flex-shrink-0', GROUP_BADGE[item.group])}
              >
                G{item.group}
              </Badge>
            </div>
          ))}
        </div>
      )}

      {/* Research citation */}
      <button
        onClick={() => setShowCitation((v) => !v)}
        className="flex items-center gap-1.5 mt-3 text-xs text-blue-500 hover:text-blue-700"
      >
        <BookOpen className="w-3 h-3" />
        Research basis
        {showCitation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showCitation && (
        <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs text-blue-700 leading-relaxed">{result.researchNote}</p>
          <p className="text-xs text-blue-400 mt-1.5">
            Monteiro CA et al. (2019). <em>Public Health Nutrition</em>, 22(5), 936–941.
          </p>
        </div>
      )}
    </Card>
  );
}
