/**
 * ============================================================
 * Generator Page — Compare Mode Aware
 * ============================================================
 *
 * ADDED (2.4 fix): Detects ?mode=compare_b in URL.
 *
 * Normal mode (no query param):
 *   - "Save & Compare" button saves as Product A → /compare
 *
 * Compare mode (?mode=compare_b):
 *   - Banner shown: "You are creating Product B for comparison"
 *   - "Save as Product B & Return" button saves as Product B → /compare
 *   - All other functionality identical — zero UI changes
 *
 * PRESERVED (2.3): NutritionScoreDisplay in left column
 * PRESERVED (all): All existing functionality
 * ============================================================
 */

'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NutritionForm } from '../components/nutrition-form';
import LabelPreview from '../components/nutrition-label/label-preview';
import { NutritionScoreDisplay } from '../components/nutrition-score-display';
import { saveProductA, saveProductB } from '../lib/comparison';
import { NutritionData } from '../types/nutrition';
import { FileSpreadsheet, FileText, Image, GitCompare, ArrowLeft } from 'lucide-react';

export default function Generator() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /**
   * compareMode — true when navigated from /compare to create Product B.
   * Detected via ?mode=compare_b query parameter.
   */
  const compareMode = searchParams.get('mode') === 'compare_b';

  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [productName, setProductName] = useState(
    compareMode ? 'Product B' : 'My Product'
  );

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

  /**
   * handleSaveAsProductA
   * Normal mode: save as Product A and navigate to /compare.
   */
  const handleSaveAsProductA = () => {
    if (!nutritionData) return;
    saveProductA(productName, nutritionData, 'generator');
    router.push('/compare');
  };

  /**
   * handleSaveAsProductB
   * Compare mode: save as Product B and return to /compare.
   */
  const handleSaveAsProductB = () => {
    if (!nutritionData) return;
    saveProductB(productName, nutritionData, 'generator');
    router.push('/compare');
  };

  return (
    <div className="container mx-auto px-4 py-8">

      {/*
        ── Compare Mode Banner ──────────────────────────────────────────
        Shown only when ?mode=compare_b is in the URL.
        Reminds user they are creating Product B for comparison.
      */}
      {compareMode && (
        <div className="mb-6 flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">
                Creating Product B for Comparison
              </p>
              <p className="text-xs text-blue-600">
                Fill in the nutrition values below, then click "Save as Product B & Return".
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/compare')}
            className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Compare
          </Button>
        </div>
      )}

      <h1 className="text-3xl font-bold mb-8">
        {compareMode
          ? 'Nutrition Generator — Product B'
          : 'Ingredient Based Nutrition Label Generator'
        }
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* ── Left Column ───────────────────────────────────────────────── */}
        <div className="space-y-6">

          {/* Product name field */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Product Name {compareMode ? '(Product B)' : '(optional)'}
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value || (compareMode ? 'Product B' : 'My Product'))}
              placeholder={compareMode ? 'e.g. Whole Grain Bread' : 'e.g. My Product'}
              className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Nutrition form */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Enter Nutrition Information</h2>
            <NutritionForm onSubmit={setNutritionData} />
          </Card>

          {/* Score + action buttons — shown after label generated */}
          {nutritionData && (
            <>
              <NutritionScoreDisplay data={nutritionData} />

              {compareMode ? (
                /*
                  Compare mode: single action — save as Product B and return.
                  Button is prominent since this is the primary CTA.
                */
                <Button
                  className="w-full gap-2"
                  onClick={handleSaveAsProductB}
                >
                  <GitCompare className="w-4 h-4" />
                  Save as Product B & Return to Comparison
                </Button>
              ) : (
                /*
                  Normal mode: save as Product A for comparison.
                */
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={handleSaveAsProductA}
                >
                  <GitCompare className="w-4 h-4" />
                  Save & Compare with Another Product
                </Button>
              )}
            </>
          )}
        </div>

        {/* ── Right Column ──────────────────────────────────────────────── */}
        <div className="lg:sticky lg:top-24">
          {nutritionData ? (
            <LabelPreview nutritionData={nutritionData} />
          ) : (
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
