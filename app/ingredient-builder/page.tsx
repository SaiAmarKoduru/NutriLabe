'use client';

/**
 * ============================================================
 * Ingredient Builder Page
 * ============================================================
 *
 * Two-step wizard:
 *   Step 1 — Search USDA database, add ingredients with quantities
 *   Step 2 — Review per-serving nutrition and preview the label
 *
 * FIXED (1.1): Per-serving nutrition calculation
 * ADDED (1.4): Toast notifications for ingredient actions
 *   - Ingredient removed → info toast
 *   - All ingredients cleared → warning toast
 *   - Quantity edit confirmed → success toast
 * ============================================================
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ArrowRight, Pencil, Check, X } from 'lucide-react';
import { USDAIngredientSearch } from '../components/ingredient-search/usda-ingredient-search';
import LabelPreview from '../components/nutrition-label/label-preview';
import { calculateIngredientNutrition, convertToGrams } from '../lib/usda-api';
import { RecipeIngredient } from '../types/recipe';
import { NutritionData } from '../types/nutrition';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/**
 * Nutrient keys we sum and display.
 * Excludes servingSize and servingsPerContainer which are
 * recipe-level metadata, not per-ingredient nutrient values.
 */
const NUTRIENT_KEYS: (keyof Omit<NutritionData, 'servingSize' | 'servingsPerContainer'>)[] = [
  'calories',
  'totalFat',
  'saturatedFat',
  'transFat',
  'cholesterol',
  'sodium',
  'totalCarbohydrates',
  'dietaryFiber',
  'sugars',
  'protein',
  'vitaminD',
  'calcium',
  'iron',
  'potassium',
];

// ─────────────────────────────────────────────
// Utility — Per-Serving Nutrition Calculator
// ─────────────────────────────────────────────

/**
 * calculatePerServingNutrition
 *
 * Converts the ingredient list into accurate per-serving NutritionData.
 *
 * Algorithm:
 *   1. Sum each ingredient's nutrition contribution (scaled by quantity)
 *   2. Sum total recipe weight in grams
 *   3. Scale total nutrition to one serving:
 *      perServing = (totalNutrition / totalWeight) × servingSize
 *
 * Edge cases:
 *   - No ingredients → returns zero nutrition
 *   - Total weight = 0 → returns zero nutrition
 *   - servingSize = 0 → returns total recipe nutrition with warning flag
 */
function calculatePerServingNutrition(
  ingredients: RecipeIngredient[],
  servingSize: number,
  servingsPerContainer: number
): NutritionData {
  const zero: NutritionData = {
    calories: 0, totalFat: 0, saturatedFat: 0, transFat: 0,
    cholesterol: 0, sodium: 0, totalCarbohydrates: 0, dietaryFiber: 0,
    sugars: 0, protein: 0, vitaminD: 0, calcium: 0, iron: 0, potassium: 0,
    servingSize,
    servingsPerContainer,
  };

  if (ingredients.length === 0) return zero;

  // Step 1 & 2 — accumulate totals
  let totalWeightGrams = 0;
  const totals = { ...zero };

  for (const ingredient of ingredients) {
    const weightGrams = convertToGrams(ingredient.quantity, ingredient.unit);
    totalWeightGrams += weightGrams;

    const contribution = calculateIngredientNutrition(
      ingredient.nutritionPer100g,
      ingredient.quantity,
      ingredient.unit
    );

    for (const key of NUTRIENT_KEYS) {
      totals[key] += (contribution[key] ?? 0);
    }
  }

  if (totalWeightGrams === 0) return zero;

  // Fall back to total recipe nutrition if serving size not set
  if (!servingSize || servingSize <= 0) {
    return { ...totals, servingSize: 0, servingsPerContainer };
  }

  // Step 3 — scale to one serving
  const scaleFactor = servingSize / totalWeightGrams;
  const perServing = { ...zero };

  for (const key of NUTRIENT_KEYS) {
    perServing[key] = Math.round(totals[key] * scaleFactor * 100) / 100;
  }

  return perServing;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function IngredientBuilder() {
  // ── Recipe State ──────────────────────────────────────────────────────
  const [recipe, setRecipe] = useState({
    name: '',
    servingSize: 0,
    servingsPerContainer: 1,
    ingredients: [] as RecipeIngredient[],
  });

  // ── Wizard State ──────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(1);

  // ── Inline Edit State ─────────────────────────────────────────────────
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ quantity: number; unit: string }>({
    quantity: 0,
    unit: 'g',
  });

  // ── Derived Nutrition (never stored, always computed) ─────────────────
  const perServingNutrition = calculatePerServingNutrition(
    recipe.ingredients,
    recipe.servingSize,
    recipe.servingsPerContainer
  );

  // ── Wizard Step Definitions ───────────────────────────────────────────
  const steps = [
    {
      number: 1,
      title: 'Add Recipe & Ingredients',
      description: 'Enter recipe details and add ingredients',
      isComplete:
        recipe.name !== '' &&
        recipe.servingSize > 0 &&
        recipe.ingredients.length > 0,
    },
    {
      number: 2,
      title: 'Review & Generate',
      description: 'Review nutrition facts and generate label',
      isComplete: false,
    },
  ];

  // ── Handlers ──────────────────────────────────────────────────────────

  /**
   * Adds a new ingredient.
   * Toast is handled inside USDAIngredientSearch on successful add.
   */
  const handleAddIngredient = (ingredient: RecipeIngredient) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ingredient],
    }));
  };

  /**
   * Removes an ingredient by index.
   * Shows an info toast confirming which ingredient was removed.
   */
  const handleRemoveIngredient = (index: number) => {
    const name = recipe.ingredients[index]?.name ?? 'Ingredient';

    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));

    if (editingIndex === index) setEditingIndex(null);

    // Short name to keep toast concise
    const shortName = name.length > 30 ? name.slice(0, 30) + '…' : name;
    toast.info(`Removed ${shortName}`);
  };

  /**
   * Clears all ingredients.
   * Shows a warning toast since this is a destructive action.
   */
  const handleClearAll = () => {
    const count = recipe.ingredients.length;
    setRecipe((prev) => ({ ...prev, ingredients: [] }));
    setEditingIndex(null);
    toast.warning(`Cleared all ${count} ingredient${count !== 1 ? 's' : ''}`);
  };

  /**
   * Begins inline editing for a specific ingredient row.
   */
  const handleStartEdit = (index: number) => {
    const ingredient = recipe.ingredients[index];
    setEditingIndex(index);
    setEditValues({ quantity: ingredient.quantity, unit: ingredient.unit });
  };

  /**
   * Commits the edited quantity back to the ingredient list.
   * Shows a success toast confirming the update.
   */
  const handleConfirmEdit = () => {
    if (editingIndex === null) return;
    if (editValues.quantity <= 0) {
      toast.error('Quantity must be greater than 0.');
      return;
    }

    const name = recipe.ingredients[editingIndex]?.name ?? 'Ingredient';

    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === editingIndex
          ? { ...ing, quantity: editValues.quantity, unit: editValues.unit }
          : ing
      ),
    }));

    setEditingIndex(null);
    toast.success(`Updated: ${editValues.quantity}${editValues.unit} of ${name.slice(0, 25)}`);
  };

  /**
   * Cancels inline editing without saving.
   */
  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Ingredient Nutrition Builder</h1>
        <p className="text-gray-600">Create nutrition labels from your ingredients</p>

        {/* Progress Steps */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => setActiveStep(step.number)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                activeStep === step.number
                  ? 'border-blue-500 bg-blue-50'
                  : step.isComplete
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activeStep === step.number
                      ? 'bg-blue-500 text-white'
                      : step.isComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  {step.number}
                </div>
                <div>
                  <div className="font-medium">{step.title}</div>
                  <div className="text-sm text-gray-500">{step.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          STEP 1 — Recipe Details + Ingredient Search
      ══════════════════════════════════════════════════════════════════ */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Left: Recipe Info + Search ─────────────────────────────── */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">

                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input
                    id="name"
                    value={recipe.name}
                    onChange={(e) =>
                      setRecipe((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter product name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="servingSize">Serving Size (g)</Label>
                    <Input
                      id="servingSize"
                      type="number"
                      min="1"
                      value={recipe.servingSize || ''}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          servingSize: parseFloat(e.target.value) || 0,
                        }))
                      }
                      placeholder="e.g. 30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="servingsPerContainer">Servings Per Container</Label>
                    <Input
                      id="servingsPerContainer"
                      type="number"
                      min="1"
                      value={recipe.servingsPerContainer || ''}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          servingsPerContainer: parseFloat(e.target.value) || 1,
                        }))
                      }
                      placeholder="e.g. 8"
                    />
                  </div>
                </div>

                {/* Serving size warning */}
                {recipe.ingredients.length > 0 && recipe.servingSize <= 0 && (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    ⚠ Please enter a serving size so the label shows per-serving values.
                  </p>
                )}
              </div>

              <div className="mt-6">
                <USDAIngredientSearch onIngredientAdd={handleAddIngredient} />
              </div>
            </Card>
          </div>

          {/* ── Right: Ingredient List ─────────────────────────────────── */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Current Ingredients
                    {recipe.ingredients.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-gray-500">
                        ({recipe.ingredients.length})
                      </span>
                    )}
                  </h3>

                  {/* Clear all — only visible when ingredients exist */}
                  {recipe.ingredients.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={handleClearAll}
                    >
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Empty state */}
                {recipe.ingredients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    Search and add ingredients to your recipe
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">
                            {ingredient.name}
                          </div>

                          {/* Inline edit mode */}
                          {editingIndex === index ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Input
                                type="number"
                                min="0.1"
                                step="0.1"
                                value={editValues.quantity}
                                onChange={(e) =>
                                  setEditValues((prev) => ({
                                    ...prev,
                                    quantity: parseFloat(e.target.value) || 0,
                                  }))
                                }
                                className="h-7 w-20 text-sm"
                              />
                              <span className="text-sm text-gray-500">
                                {editValues.unit}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-green-600 hover:bg-green-50"
                                onClick={handleConfirmEdit}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-gray-400 hover:bg-gray-100"
                                onClick={handleCancelEdit}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">
                              {ingredient.quantity} {ingredient.unit}
                            </div>
                          )}
                        </div>

                        {/* Edit + Remove buttons */}
                        {editingIndex !== index && (
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-blue-500"
                              onClick={() => handleStartEdit(index)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-gray-400 hover:text-red-500"
                              onClick={() => handleRemoveIngredient(index)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Proceed button — only shown when all required fields are filled */}
            {recipe.ingredients.length > 0 &&
              recipe.name &&
              recipe.servingSize > 0 &&
              recipe.servingsPerContainer > 0 && (
                <Button
                  variant="default"
                  className="w-full"
                  onClick={() => setActiveStep(2)}
                >
                  Review & Generate
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          STEP 2 — Nutrition Summary + Label Preview
      ══════════════════════════════════════════════════════════════════ */}
      {activeStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ── Left: Recipe Summary ───────────────────────────────────── */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recipe Summary</h2>

              <div className="space-y-4">
                {/* Metadata */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">Product Name</div>
                    <div className="font-medium">{recipe.name}</div>
                    <div className="text-gray-500">Serving Size</div>
                    <div className="font-medium">{recipe.servingSize}g</div>
                    <div className="text-gray-500">Servings Per Container</div>
                    <div className="font-medium">{recipe.servingsPerContainer}</div>
                    <div className="text-gray-500">Total Ingredients</div>
                    <div className="font-medium">{recipe.ingredients.length}</div>
                  </div>
                </div>

                {/* Per-serving nutrient grid */}
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">
                  Nutrition Per Serving ({recipe.servingSize}g)
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {NUTRIENT_KEYS.map((key) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="font-medium text-sm">
                        {perServingNutrition[key].toFixed(1)}
                        {key === 'calories'
                          ? ' kcal'
                          : ['sodium', 'cholesterol', 'calcium', 'iron', 'potassium', 'vitaminD'].includes(key)
                          ? ' mg'
                          : ' g'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setActiveStep(1)}
            >
              Back to Ingredients
            </Button>
          </div>

          {/* ── Right: Label Preview ───────────────────────────────────── */}
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Nutrition Label Preview</h2>
              <LabelPreview
                nutritionData={perServingNutrition}
                compact
                showInfo={false}
              />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
