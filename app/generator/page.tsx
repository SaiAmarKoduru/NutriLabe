/**
 * ============================================================
 * Generator Page
 * ============================================================
 *
 * Manual nutrition entry flow:
 *   Left column  — NutritionForm (react-hook-form + zod)
 *   Right column — LabelPreview (format selector + download + charts)
 *
 * FIX (1.7):
 *   Previously LabelPreview was called with compact and showInfo={false}
 *   which suppressed the nutrition charts.
 *   Now called without those props so charts render correctly.
 *   showCharts defaults to true inside LabelPreview.
 * ============================================================
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { NutritionForm } from '../components/nutrition-form';
import LabelPreview from '../components/nutrition-label/label-preview';
import { NutritionData } from '../types/nutrition';
import { FileSpreadsheet, FileText, Image } from 'lucide-react';

export default function Generator() {
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);

  const steps = [
    {
      icon: FileSpreadsheet,
      title: 'Enter Nutrition Data',
      description: "Fill in your product's nutrition information in the form",
    },
    {
      icon: FileText,
      title: 'Choose Format',
      description: 'Select from US FDA, EU, Indian, Canadian, or Australian formats',
    },
    {
      icon: Image,
      title: 'Download Label',
      description: 'Get your high-resolution nutrition label ready for packaging',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        Ingredient Based Nutrition Label Generator
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Left: Nutrition Form ──────────────────────────────────── */}
        <div>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Enter Nutrition Information</h2>
            <NutritionForm onSubmit={setNutritionData} />
          </Card>
        </div>

        {/* ── Right: Label Preview + Charts ────────────────────────── */}
        <div>
          {nutritionData ? (
            <div className="sticky top-24">
              {/*
                FIX (1.7): Removed compact and showInfo={false} props.
                - showInfo defaults to true  → label info panel shows
                - showCharts defaults to true → nutrition charts show
                - compact defaults to false  → no compact mode restrictions
                className kept for layout consistency.
              */}
              <LabelPreview
                nutritionData={nutritionData}
                className="max-w-xl mx-auto"
              />
            </div>
          ) : (
            /* ── Empty state before form submission ───────────────── */
            <div className="sticky top-24">
              <Card className="p-6">
                <div className="space-y-8">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold mb-2">Preview Of Label</h2>
                    <p className="text-gray-500">
                      Fill in the nutrition information to generate your label
                    </p>
                  </div>

                  {/* Step indicators */}
                  <div className="relative">
                    <div className="space-y-6">
                      {steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <step.icon className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="flex-grow min-w-0">
                            <h3 className="text-base font-medium">{step.title}</h3>
                            <p className="text-sm text-gray-500">{step.description}</p>
                          </div>
                          {index < steps.length - 1 && (
                            <div className="absolute left-5 ml-[-0.5px] mt-10 w-[1px] h-10 bg-gray-200" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Sample label placeholders */}
                    <div className="mt-8 grid grid-cols-3 gap-4">
                      {['US', 'EU', 'INDIA'].map((fmt) => (
                        <div
                          key={fmt}
                          className="aspect-[3/4] rounded-lg bg-gray-100 p-2 flex items-center justify-center"
                        >
                          <div className="text-center">
                            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white shadow-sm flex items-center justify-center">
                              <FileText className="w-6 h-6 text-gray-400" />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {fmt}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tips */}
                    <div className="mt-8 bg-blue-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-800 mb-2">
                        For Best Results
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Use accurate measurements</li>
                        <li>• Double-check serving sizes</li>
                        <li>• Include all required nutrients</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
