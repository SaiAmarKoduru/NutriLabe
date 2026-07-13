/**
 * Nutrient Density Score Display Component
 * Shows NDS score, band, nutrient breakdown, and research citation.
 * Works from NutritionData alone — shown in both generator and builder.
 */

'use client';

import { useState } from 'react';
import { NutritionData } from '@/app/types/nutrition';
import { calculateNutrientDensity } from '@/app/lib/nutrient-density';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Zap, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NutrientDensityDisplayProps {
  data: NutritionData;
  className?: string;
}

export function NutrientDensityDisplay({ data, className }: NutrientDensityDisplayProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showCitation, setShowCitation] = useState(false);

  const result = calculateNutrientDensity(data);

  if (result.hasInsufficientData) return null;

  const beneficial = result.nutrients.filter((n) => n.isBeneficial);
  const limits = result.nutrients.filter((n) => !n.isBeneficial);

  return (
    <Card className={cn('p-5', className)}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-900">Nutrient Density Score</h3>
        <Badge variant="outline" className="ml-auto text-xs bg-gray-50 text-gray-500">
          per 100 kcal
        </Badge>
      </div>

      {/* Score + gauge */}
      <div className="flex items-center gap-4 mb-3">
        {/* Circular score */}
        <div className="relative flex-shrink-0">
          <svg width="72" height="72" viewBox="0 0 72 72">
            <circle cx="36" cy="36" r="30" fill="none" stroke="#f3f4f6" strokeWidth="7" />
            <circle
              cx="36" cy="36" r="30"
              fill="none"
              stroke={result.gaugeColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={`${(result.score / 100) * 188.5} 188.5`}
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dasharray 0.6s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-black" style={{ color: result.gaugeColor }}>
              {result.score}
            </span>
          </div>
        </div>

        <div className="flex-1">
          <p className={cn('text-sm font-semibold', result.color)}>{result.label}</p>
          <p className="text-xs text-gray-500 mt-1 leading-relaxed">{result.interpretation}</p>
          <div className="flex gap-3 mt-2">
            <span className="text-xs text-green-600 font-medium">+{result.beneficialScore} beneficial</span>
            <span className="text-xs text-red-500 font-medium">−{result.penaltyScore} penalty</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-gray-100 rounded-full mb-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${result.score}%`, backgroundColor: result.gaugeColor }}
        />
      </div>

      {/* Expandable breakdown */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-gray-500 hover:text-gray-700 h-7"
        onClick={() => setShowBreakdown((v) => !v)}
      >
        {showBreakdown ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
        {showBreakdown ? 'Hide' : 'Show'} nutrient breakdown
      </Button>

      {showBreakdown && (
        <div className="mt-2 space-y-3">
          {/* Beneficial */}
          <div>
            <p className="text-xs font-semibold text-green-700 mb-1.5">Beneficial nutrients (per 100 kcal)</p>
            <div className="space-y-1.5">
              {beneficial.map((n) => (
                <div key={n.nutrient} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-24 flex-shrink-0">{n.nutrient}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-400 rounded-full"
                      style={{ width: `${Math.min(n.dvPercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right flex-shrink-0">
                    {n.dvPercent}% DV
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Limits */}
          <div>
            <p className="text-xs font-semibold text-red-600 mb-1.5">Nutrients to limit (per 100 kcal)</p>
            <div className="space-y-1.5">
              {limits.map((n) => (
                <div key={n.nutrient} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 w-24 flex-shrink-0">{n.nutrient}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${Math.min(n.dvPercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right flex-shrink-0">
                    {n.dvPercent}% DV
                  </span>
                </div>
              ))}
            </div>
          </div>
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
          <p className="text-xs text-blue-700 leading-relaxed">
            Nutrient density measures beneficial nutrients per 100 kcal, adjusted for nutrients to limit.
            Higher scores indicate foods that deliver more nutrition per calorie consumed.
          </p>
          <p className="text-xs text-blue-400 mt-1.5">
            {result.researchNote}
          </p>
        </div>
      )}
    </Card>
  );
}
