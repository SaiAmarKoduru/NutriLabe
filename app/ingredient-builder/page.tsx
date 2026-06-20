'use client';

/**
 * ============================================================
 * Ingredient Builder Page
 * ============================================================
 *
 * Two-step wizard that allows users to:
 *   Step 1 — Search USDA database, add ingredients with quantities
 *   Step 2 — Review total nutrition and preview the generated label
 *
 * FIXED (1.1): Per-serving nutrition calculation
 *   Previously: totalNutrition held the sum of ALL ingredient nutrition
 *               regardless of serving size, so the label was always wrong.
 *   Now:        totalNutrition is correctly scaled to reflect ONE serving.
 *
 * Calculation logic:
 *   1. Sum raw nutrition across all ingredients (total recipe nutrition)
 *   2. Calculate total recipe weight in grams
 *   3. Derive nutrition per gram = total nutrition / total weight
 *   4. Multiply by serving size in grams = per-serving nutrition
 *
 * If servingSize is 0 or not set, we fall back to showing total recipe
 * nutrition and display a warning to the user.
 * ============================================================
 */

import { useState } from 'react';
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
// Types
// ─────────────────────────────────────────────

/**
 * The nutrient keys that we sum across ingredients.
 * Excludes servingSize and servingsPerContainer which are
 * recipe-level metadata, not per-ingredient nutrients.
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
 * Converts raw ingredient list into accurate per-serving NutritionData.
 *
 * Algorithm:
 *   1. For each ingredient, compute its total nutrition contribution
 *      based on the quantity + unit the user entered.
 *   2. Sum all contributions → total recipe nutrition.
 *   3. Sum all ingredient weights in grams → total recipe weight.
 *   4. Compute nutrition per gram = total nutrition / total recipe weight.
 *   5. Multiply by servingSize → per-serving nutrition.
 *
 * Edge cases handled:
 *   - servingSize = 0 → returns total recipe nutrition with a warning flag
 *   - totalWeight = 0 → returns zero nutrition (no ingredients)
 *   - Missing nutrient values → treated as 0
 *
 * @param ingredients    - List of recipe ingredients with quantities
 * @param servingSize    - Serving size in grams
 * @param servingsPerContainer - Number of servings in the full recipe
 * @returns NutritionData representing ONE serving
 */
function calculatePerServingNutrition(
  ingredients: RecipeIngredient[],
  servingSize: number,
  servingsPerContainer: number
): NutritionData {
  // Base template with all zeros
  const zeroNutrition: NutritionData = {
    calories: 0,
    totalFat: 0,
    saturatedFat: 0,
    transFat: 0,
    cholesterol: 0,
    sodium: 0,
    totalCarbohydrates: 0,
    dietaryFiber: 0,
    sugars: 0,
    protein: 0,
    vitaminD: 0,
    calcium: 0,
    iron: 0,
    potassium: 0,
    servingSize,
    servingsPerContainer,
  };

  // Guard: no ingredients
  if (ingredients.length === 0) {
    return zeroNutrition;
  }

  // ── Step 1 & 2: Sum all ingredient nutrition + total weight ──────────
  let totalWeightGrams = 0;
  const totalNutrition = { ...zeroNutrition };

  for (const ingredient of ingredients) {
    // Convert ingredient quantity to grams for weight tracking
    const weightGrams = convertToGrams(ingredient.quantity, ingredient.unit);
    totalWeightGrams += weightGrams;

    // Get this ingredient's nutrition contribution for the given quantity
    const contribution = calculateIngredientNutrition(
      ingredient.nutritionPer100g,
      ingredient.quantity,
      ingredient.unit
    );

    // Accumulate each nutrient
    for (const key of NUTRIENT_KEYS) {
      totalNutrition[key] += (contribution[key] ?? 0);
    }
  }

  // Guard: total weight is zero (all quantities were 0)
  if (totalWeightGrams === 0) {
    return zeroNutrition;
  }

  // Guard: servingSize not set — fall back to total recipe nutrition
  // This prevents division by zero and still shows useful data
  if (!servingSize || servingSize <= 0) {
    return {
      ...totalNutrition,
      servingSize: 0,
      servingsPerContainer,
    };
  }

  // ── Step 3 & 4: Scale to per-serving ────────────────────────────────
  // nutritionPerGram = totalNutrition / totalWeightGrams
  // perServingNutrition = nutritionPerGram * servingSize
  const scaleFactor = servingSize / totalWeightGrams;

  const perServingNutrition: NutritionData = {
    ...zeroNutrition,
    servingSize,
    servingsPerContainer,
  };

  for (const key of NUTRIENT_KEYS) {
    // Round to 2 decimal places to avoid floating point noise
    perServingNutrition[key] = Math.round(totalNutrition[key] * scaleFactor * 100) / 100;
  }

  return perServingNutrition;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function IngredientBuilder() {
  // ── Recipe State ─────────────────────────────────────────────────────
  const [recipe, setRecipe] = useState({
    name: '',
    servingSize: 0,
    servingsPerContainer: 1,
    ingredients: [] as RecipeIngredient[],
  });

  // ── Wizard State ──────────────────────────────────────────────────────
  const [activeStep, setActiveStep] = useState(1);

  /**
   * Inline editing state for ingredient quantities.
   * Key: ingredient index, Value: { quantity, unit } being edited.
   */
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ quantity: number; unit: string }>({
    quantity: 0,
    unit: 'g',
  });

  // ── Derived Per-Serving Nutrition ─────────────────────────────────────
  /**
   * This is computed on every render from the current ingredients + serving size.
   * No need to store it in state since it is always derived from those two values.
   *
   * This was the core bug: previously this was stored in state and accumulated
   * incorrectly. Now it is always a pure function of the current recipe.
   */
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
   * Adds a new ingredient to the recipe.
   * The nutrition calculation is always re-derived, never accumulated in state.
   */
  const handleAddIngredient = (ingredient: RecipeIngredient) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ingredient],
    }));
  };

  /**
   * Removes an ingredient by index.
   */
  const handleRemoveIngredient = (index: number) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
    // Clear edit state if we removed the ingredient being edited
    if (editingIndex === index) {
      setEditingIndex(null);
    }
  };

  /**
   * Begins inline editing for a specific ingredient.
   */
  const handleStartEdit = (index: number) => {
    const ingredient = recipe.ingredients[index];
    setEditingIndex(index);
    setEditValues({ quantity: ingredient.quantity, unit: ingredient.unit });
  };

  /**
   * Commits the edited quantity/unit back to the ingredient.
   */
  const handleConfirmEdit = () => {
    if (editingIndex === null) return;
    if (editValues.quantity <= 0) return;

    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === editingIndex
          ? { ...ing, quantity: editValues.quantity, unit: editValues.unit }
          : ing
      ),
    }));
    setEditingIndex(null);
  };

  /**
   * Cancels inline editing without saving.
   */
  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  /**
   * Updates serving size and keeps servingsPerContainer in sync.
   */
  const handleServingSizeChange = (value: string) => {
    const parsed = parseFloat(value) || 0;
    setRecipe((prev) => ({ ...prev, servingSize: parsed }));
  };

  const handleServingsPerContainerChange = (value: string) => {
    const parsed = parseFloat(value) || 1;
    setRecipe((prev) => ({ ...prev, servingsPerContainer: parsed }));
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">

      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Ingredient Nutrition Builder</h1>
            <p className="text-gray-600">Create nutrition labels from your ingredients</p>
          </div>
        </div>

        {/* ── Progress Steps ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 mb-8">
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

                {/* Product Name */}
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

                {/* Serving Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="servingSize">
                      Serving Size (g)
                    </Label>
                    <Input
                      id="servingSize"
                      type="number"
                      min="1"
                      value={recipe.servingSize || ''}
                      onChange={(e) => handleServingSizeChange(e.target.value)}
                      placeholder="e.g. 30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="servingsPerContainer">
                      Servings Per Container
                    </Label>
                    <Input
                      id="servingsPerContainer"
                      type="number"
                      min="1"
                      value={recipe.servingsPerContainer || ''}
                      onChange={(e) => handleServingsPerContainerChange(e.target.value)}
                      placeholder="e.g. 8"
                    />
                  </div>
                </div>

                {/*
                  Serving size warning.
                  If the user has added ingredients but not set a serving size,
                  the label would show total recipe nutrition which is misleading.
                  We show a gentle warning to guide them.
                */}
                {recipe.ingredients.length > 0 && recipe.servingSize <= 0 && (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    ⚠ Please enter a serving size so the label shows per-serving values.
                  </p>
                )}
              </div>

              {/* USDA Ingredient Search */}
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

                  {/* Clear all button */}
                  {recipe.ingredients.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() =>
                        setRecipe((prev) => ({ ...prev, ingredients: [] }))
                      }
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
                          <div className="font-medium truncate">{ingredient.name}</div>

                          {/* ── Inline Edit Mode ───────────────────────── */}
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
                                className="h-7 w-7 text-green-600"
                                onClick={handleConfirmEdit}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7 text-gray-400"
                                onClick={handleCancelEdit}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            /* ── Display Mode ─────────────────────────── */
                            <div className="text-sm text-gray-500">
                              {ingredient.quantity} {ingredient.unit}
                            </div>
                          )}
                        </div>

                        {/* Action buttons (only show when not editing this row) */}
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

            {/* Proceed to Step 2 */}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recipe Summary</h2>
              </div>

              <div className="space-y-4">
                {/* Recipe metadata */}
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

                {/*
                  Per-serving nutrition grid.
                  These values now correctly reflect ONE serving, not the entire recipe.
                  Labels clearly state "Per Serving" to make this explicit.
                */}
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
                        {/* Show appropriate unit per nutrient */}
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
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">Nutrition Label Preview</h2>
              </div>
              {/*
                We pass perServingNutrition — the correctly scaled per-serving values.
                Previously, totalNutrition (entire recipe) was passed here, which was wrong.
              */}
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
