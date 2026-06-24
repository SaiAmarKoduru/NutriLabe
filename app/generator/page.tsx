/**
 * ============================================================
 * Generator Page
 * ============================================================
 *
 * Manual nutrition entry flow.
 *
 * Layout (balanced two-column dashboard):
 *
 *   Left column                Right column
 *   ─────────────────          ─────────────────
 *   NutritionForm              LabelPreview
 *   ─────────────────            └─ Label
 *   NutritionScoreDisplay        └─ Charts
 *     └─ Gauge                   └─ Allergens
 *     └─ Grade                   └─ Dietary Tags
 *     └─ Breakdown
 *     └─ Suggestions
 *
 * ADDED (2.3):
 *   NutritionScoreDisplay rendered in LEFT column below the form.
 *   Receives nutritionData directly — no ingredient dependency.
 *   Only renders after user submits the form.
 * ============================================================
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { NutritionForm } from '../components/nutrition-form';
import LabelPreview from '../components/nutrition-label/label-preview';
import { NutritionScoreDisplay } from '../components/nutrition-score-display';
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ── Left Column ───────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Nutrition entry form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Enter Nutrition Information</h2>
            <NutritionForm onSubmit={setNutritionData} />
          </Card>

          {/*
            Nutrition Quality Score — ADDED (2.3)
            Rendered in left column beneath the form.
            Only appears after user submits nutrition data.
            Balances the tall right-column label preview.
          */}
          {nutritionData && (
            <NutritionScoreDisplay data={nutritionData} />
          )}
        </div>

        {/* ── Right Column ──────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24">
          {nutritionData ? (
            <LabelPreview nutritionData={nutritionData} />
          ) : (
            /* Empty state before form submission */
            <Card className="p-6">
              <div className="space-y-8">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Preview Of Label</h2>
                  <p className="text-gray-500">
                    Fill in the nutrition information to generate your label
                  </p>
                </div>

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
                          <span className="text-xs font-medium text-gray-600">{fmt}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 bg-blue-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">For Best Results</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Use accurate measurements</li>
                      <li>• Double-check serving sizes</li>
                      <li>• Include all required nutrients</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
