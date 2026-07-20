/**
 * Additive & Preservative Risk Display
 * Shows detected additives grouped by risk level.
 * Placed in left column of ingredient builder below NDS.
 */

'use client';

import { useState } from 'react';
import { AdditiveRiskResult } from '@/app/lib/additives';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, ShieldAlert, ShieldCheck, ShieldX, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdditiveDisplayProps {
  result: AdditiveRiskResult;
  hasIngredients: boolean;
  className?: string;
}

const RISK_CONFIG = {
  safe: {
    label: 'Safe',
    color: 'text-green-700',
    bg: 'bg-green-50 border-green-200',
    badge: 'bg-green-100 text-green-800 border-green-300',
    icon: ShieldCheck,
  },
  caution: {
    label: 'Caution',
    color: 'text-amber-700',
    bg: 'bg-amber-50 border-amber-200',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: ShieldAlert,
  },
  avoid: {
    label: 'Avoid',
    color: 'text-red-700',
    bg: 'bg-red-50 border-red-200',
    badge: 'bg-red-100 text-red-800 border-red-300',
    icon: ShieldX,
  },
};

export function AdditiveRiskDisplay({ result, hasIngredients, className }: AdditiveDisplayProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!hasIngredients) return null;

  const OverallIcon =
    result.overallRisk === 'avoid' ? ShieldX
    : result.overallRisk === 'caution' ? ShieldAlert
    : result.overallRisk === 'safe' ? ShieldCheck
    : Shield;

  const overallColor =
    result.overallRisk === 'avoid' ? 'text-red-600'
    : result.overallRisk === 'caution' ? 'text-amber-600'
    : result.overallRisk === 'safe' ? 'text-green-600'
    : 'text-gray-400';

  return (
    <Card className={cn('p-5', className)}>

      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <OverallIcon className={cn('w-4 h-4', overallColor)} />
        <h3 className="text-sm font-semibold text-gray-900">Additive Risk Analysis</h3>
        <Badge variant="outline" className="ml-auto text-xs bg-gray-50 text-gray-500">
          EFSA / CSPI
        </Badge>
      </div>

      {/* No additives found */}
      {!result.hasAdditives && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
          <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">
            No known additives or preservatives detected in this recipe.
          </p>
        </div>
      )}

      {/* Summary counts */}
      {result.hasAdditives && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {(['avoid', 'caution', 'safe'] as const).map((risk) => (
              <div
                key={risk}
                className={cn('text-center p-2 rounded-lg border', RISK_CONFIG[risk].bg)}
              >
                <div className={cn('text-lg font-black', RISK_CONFIG[risk].color)}>
                  {result.riskCounts[risk]}
                </div>
                <div className={cn('text-xs font-medium', RISK_CONFIG[risk].color)}>
                  {RISK_CONFIG[risk].label}
                </div>
              </div>
            ))}
          </div>

          {/* Additive list grouped by risk */}
          <div className="space-y-2">
            {(['avoid', 'caution', 'safe'] as const).map((risk) => {
              const items = result.detected.filter((d) => d.additive.risk === risk);
              if (items.length === 0) return null;
              const config = RISK_CONFIG[risk];
              const RiskIcon = config.icon;

              return (
                <div key={risk}>
                  {items.map((item) => {
                    const key = item.additive.name;
                    const isOpen = expanded === key;

                    return (
                      <div key={key} className={cn('rounded-lg border mb-1.5', config.bg)}>
                        <button
                          className="w-full flex items-center justify-between px-3 py-2 text-left"
                          onClick={() => setExpanded(isOpen ? null : key)}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <RiskIcon className={cn('w-3.5 h-3.5 flex-shrink-0', config.color)} />
                            <span className={cn('text-xs font-semibold truncate', config.color)}>
                              {item.additive.name}
                            </span>
                            {item.additive.eNumber && (
                              <span className="text-xs text-gray-400 flex-shrink-0">
                                {item.additive.eNumber}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                            <Badge variant="outline" className={cn('text-xs', config.badge)}>
                              {item.additive.category}
                            </Badge>
                            {isOpen
                              ? <ChevronUp className="w-3 h-3 text-gray-400" />
                              : <ChevronDown className="w-3 h-3 text-gray-400" />
                            }
                          </div>
                        </button>

                        {isOpen && (
                          <div className="px-3 pb-3 space-y-1">
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {item.additive.notes}
                            </p>
                            <p className="text-xs text-gray-400">
                              Found in: <span className="italic">
                                {item.foundIn.length > 50
                                  ? item.foundIn.slice(0, 50) + '…'
                                  : item.foundIn}
                              </span>
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            Based on EFSA opinions and CSPI Chemical Cuisine database.
            For educational purposes only.
          </p>
        </>
      )}
    </Card>
  );
}
