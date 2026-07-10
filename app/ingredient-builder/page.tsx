/**
 * Ingredient Builder Page — with AI Nutrition Summary (3.2)
 * Added: NutritionSummaryDisplay in Step 2 left column below NutritionScoreDisplay.
 * Passes dietaryTags and allergens derived from ingredients for richer summary context.
 */

'use client';

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ArrowRight, Pencil, Check, X, GitCompare, ArrowLeft } from 'lucide-react';
import { USDAIngredientSearch } from '../components/ingredient-search/usda-ingredient-search';
import LabelPreview from '../components/nutrition-label/label-preview';
import { NutritionScoreDisplay } from '../components/nutrition-score-display';
import { NutritionSummaryDisplay } from '../components/nutrition-summary-display';
import { NovaDisplay } from '../components/nova-display';
import { classifyRecipeNova } from '../lib/nova-classification';
import { RecipeSuggestionsDisplay } from '../components/recipe-suggestions-display';
import { IngredientExplanationButton } from '../components/ingredient-explanation';
import { saveProductA, saveProductB } from '../lib/comparison';
import { calculateIngredientNutrition, convertToGrams } from '../lib/usda-api';
import { detectAllergens } from '../lib/allergens';
import { detectDietaryTags, getDetectedTags } from '../lib/dietary-tags';
import { calculateNutritionScore } from '../lib/nutrition-score';
import { RecipeIngredient } from '../types/recipe';
import { NutritionData } from '../types/nutrition';

const NUTRIENT_KEYS: (keyof Omit<NutritionData, 'servingSize' | 'servingsPerContainer'>)[] = [
  'calories', 'totalFat', 'saturatedFat', 'transFat', 'cholesterol',
  'sodium', 'totalCarbohydrates', 'dietaryFiber', 'sugars', 'protein',
  'vitaminD', 'calcium', 'iron', 'potassium',
];

function calculatePerServingNutrition(
  ingredients: RecipeIngredient[],
  servingSize: number,
  servingsPerContainer: number
): NutritionData {
  const zero: NutritionData = {
    calories: 0, totalFat: 0, saturatedFat: 0, transFat: 0,
    cholesterol: 0, sodium: 0, totalCarbohydrates: 0, dietaryFiber: 0,
    sugars: 0, protein: 0, vitaminD: 0, calcium: 0, iron: 0, potassium: 0,
    servingSize, servingsPerContainer,
  };
  if (ingredients.length === 0) return zero;
  let totalWeightGrams = 0;
  const totals = { ...zero };
  for (const ingredient of ingredients) {
    const weightGrams = convertToGrams(ingredient.quantity, ingredient.unit);
    totalWeightGrams += weightGrams;
    const contribution = calculateIngredientNutrition(ingredient.nutritionPer100g, ingredient.quantity, ingredient.unit);
    for (const key of NUTRIENT_KEYS) totals[key] += (contribution[key] ?? 0);
  }
  if (totalWeightGrams === 0) return zero;
  if (!servingSize || servingSize <= 0) return { ...totals, servingSize: 0, servingsPerContainer };
  const scaleFactor = servingSize / totalWeightGrams;
  const perServing = { ...zero };
  for (const key of NUTRIENT_KEYS) {
    perServing[key] = Math.round(totals[key] * scaleFactor * 100) / 100;
  }
  return perServing;
}

export default function IngredientBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const compareMode = searchParams.get('mode') === 'compare_b';

  const [recipe, setRecipe] = useState({
    name: compareMode ? 'Product B Recipe' : '',
    servingSize: 0,
    servingsPerContainer: 1,
    ingredients: [] as RecipeIngredient[],
  });
  const [activeStep, setActiveStep] = useState(1);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ quantity: number; unit: string }>({ quantity: 0, unit: 'g' });

  const perServingNutrition = calculatePerServingNutrition(
    recipe.ingredients, recipe.servingSize, recipe.servingsPerContainer
  );

  // Derive tag/allergen labels for AI summary context
  const detectedAllergenNames = useMemo(
    () => detectAllergens(recipe.ingredients).map((r) => r.allergen.name),
    [recipe.ingredients]
  );
  const detectedTagLabels = useMemo(
    () => getDetectedTags(detectDietaryTags(recipe.ingredients)).map((t) => t.label),
    [recipe.ingredients]
  );

  const steps = [
    { number: 1, title: 'Add Recipe & Ingredients', description: 'Enter recipe details and add ingredients', isComplete: recipe.name !== '' && recipe.servingSize > 0 && recipe.ingredients.length > 0 },
    { number: 2, title: 'Review & Generate', description: 'Review nutrition facts and generate label', isComplete: false },
  ];

  const handleAddIngredient = (ingredient: RecipeIngredient) => {
    setRecipe((prev) => ({ ...prev, ingredients: [...prev.ingredients, ingredient] }));
  };

  const handleRemoveIngredient = (index: number) => {
    const name = recipe.ingredients[index]?.name ?? 'Ingredient';
    setRecipe((prev) => ({ ...prev, ingredients: prev.ingredients.filter((_, i) => i !== index) }));
    if (editingIndex === index) setEditingIndex(null);
    toast.info(`Removed ${name.length > 30 ? name.slice(0, 30) + '…' : name}`);
  };

  const handleClearAll = () => {
    const count = recipe.ingredients.length;
    setRecipe((prev) => ({ ...prev, ingredients: [] }));
    setEditingIndex(null);
    toast.warning(`Cleared all ${count} ingredient${count !== 1 ? 's' : ''}`);
  };

  const handleStartEdit = (index: number) => {
    const ingredient = recipe.ingredients[index];
    setEditingIndex(index);
    setEditValues({ quantity: ingredient.quantity, unit: ingredient.unit });
  };

  const handleConfirmEdit = () => {
    if (editingIndex === null) return;
    if (editValues.quantity <= 0) { toast.error('Quantity must be greater than 0.'); return; }
    const name = recipe.ingredients[editingIndex]?.name ?? 'Ingredient';
    setRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === editingIndex ? { ...ing, quantity: editValues.quantity, unit: editValues.unit } : ing
      ),
    }));
    setEditingIndex(null);
    toast.success(`Updated: ${editValues.quantity}${editValues.unit} of ${name.slice(0, 25)}`);
  };

  const handleCancelEdit = () => setEditingIndex(null);

  const handleSaveAsProductA = () => {
    saveProductA(recipe.name || 'My Recipe', perServingNutrition, 'ingredient-builder', recipe.ingredients);
    router.push('/compare');
  };

  const handleSaveAsProductB = () => {
    saveProductB(recipe.name || 'Product B Recipe', perServingNutrition, 'ingredient-builder', recipe.ingredients);
    router.push('/compare');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">

      {compareMode && (
        <div className="mb-6 flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-5 py-3">
          <div className="flex items-center gap-3">
            <GitCompare className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-green-800">Creating Product B for Comparison</p>
              <p className="text-xs text-green-600">Build your recipe below, then click "Save as Product B & Return" in Step 2.</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => router.push('/compare')} className="text-green-700 hover:bg-green-100 flex-shrink-0">
            <ArrowLeft className="w-4 h-4 mr-1.5" />Back to Compare
          </Button>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold">
          {compareMode ? 'Ingredient Builder — Product B' : 'Ingredient Nutrition Builder'}
        </h1>
        <p className="text-gray-600">
          {compareMode ? 'Build a recipe from USDA ingredients to use as Product B' : 'Create nutrition labels from your ingredients'}
        </p>
        <div className="grid grid-cols-2 gap-4 mt-6">
          {steps.map((step) => (
            <button key={step.number} onClick={() => setActiveStep(step.number)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                activeStep === step.number ? 'border-blue-500 bg-blue-50'
                : step.isComplete ? 'border-green-200 bg-green-50' : 'border-gray-200'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  activeStep === step.number ? 'bg-blue-500 text-white'
                  : step.isComplete ? 'bg-green-500 text-white' : 'bg-gray-200'
                }`}>{step.number}</div>
                <div>
                  <div className="font-medium">{step.title}</div>
                  <div className="text-sm text-gray-500">{step.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">{compareMode ? 'Product B Name' : 'Product Name'}</Label>
                  <Input id="name" value={recipe.name}
                    onChange={(e) => setRecipe((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={compareMode ? 'e.g. Whole Grain Bread' : 'Enter product name'} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="servingSize">Serving Size (g)</Label>
                    <Input id="servingSize" type="number" min="1" value={recipe.servingSize || ''}
                      onChange={(e) => setRecipe((prev) => ({ ...prev, servingSize: parseFloat(e.target.value) || 0 }))}
                      placeholder="e.g. 30" />
                  </div>
                  <div>
                    <Label htmlFor="servingsPerContainer">Servings Per Container</Label>
                    <Input id="servingsPerContainer" type="number" min="1" value={recipe.servingsPerContainer || ''}
                      onChange={(e) => setRecipe((prev) => ({ ...prev, servingsPerContainer: parseFloat(e.target.value) || 1 }))}
                      placeholder="e.g. 8" />
                  </div>
                </div>
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

          <div className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">
                    Current Ingredients
                    {recipe.ingredients.length > 0 && (
                      <span className="ml-2 text-sm font-normal text-gray-500">({recipe.ingredients.length})</span>
                    )}
                  </h3>
                  {recipe.ingredients.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleClearAll}>
                      Clear All
                    </Button>
                  )}
                </div>

                {recipe.ingredients.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">Search and add ingredients to your recipe</div>
                ) : (
                  <div className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">{ingredient.name}</div>
                          {editingIndex === index ? (
                            <div className="flex items-center gap-2 mt-1">
                              <Input type="number" min="0.1" step="0.1" value={editValues.quantity}
                                onChange={(e) => setEditValues((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                                className="h-7 w-20 text-sm" />
                              <span className="text-sm text-gray-500">{editValues.unit}</span>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={handleConfirmEdit}>
                                <Check className="w-3 h-3" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-400" onClick={handleCancelEdit}>
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="text-sm text-gray-500">{ingredient.quantity} {ingredient.unit}</div>
                          )}
                        </div>
                        {editingIndex !== index && (
                          <div className="flex items-center gap-1 ml-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-500" onClick={() => handleStartEdit(index)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <IngredientExplanationButton ingredientName={ingredient.name} size="xs" />
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => handleRemoveIngredient(index)}>
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

            {recipe.ingredients.length > 0 && recipe.name && recipe.servingSize > 0 && recipe.servingsPerContainer > 0 && (
              <Button variant="default" className="w-full" onClick={() => setActiveStep(2)}>
                Review & Generate <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {activeStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recipe Summary</h2>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">Product Name</div><div className="font-medium">{recipe.name}</div>
                    <div className="text-gray-500">Serving Size</div><div className="font-medium">{recipe.servingSize}g</div>
                    <div className="text-gray-500">Servings Per Container</div><div className="font-medium">{recipe.servingsPerContainer}</div>
                    <div className="text-gray-500">Total Ingredients</div><div className="font-medium">{recipe.ingredients.length}</div>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Nutrition Per Serving ({recipe.servingSize}g)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {NUTRIENT_KEYS.map((key) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="font-medium text-sm">
                        {perServingNutrition[key].toFixed(1)}
                        {key === 'calories' ? ' kcal' : ['sodium', 'cholesterol', 'calcium', 'iron', 'potassium', 'vitaminD'].includes(key) ? ' mg' : ' g'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>

            {/* NOVA Classification — ADDED (4.1) */}
            {(() => { const nova = classifyRecipeNova(recipe.ingredients); return nova ? <NovaDisplay result={nova} /> : null; })()}

            <NutritionScoreDisplay data={perServingNutrition} />

            {/* AI Nutrition Summary — ADDED (3.2) */}
            {/* AI Recipe Suggestions — ADDED (3.3) */}
            <RecipeSuggestionsDisplay
              data={perServingNutrition}
              ingredients={recipe.ingredients}
              productName={recipe.name}
              score={calculateNutritionScore(perServingNutrition).score}
            />

            <NutritionSummaryDisplay
              data={perServingNutrition}
              productName={recipe.name}
              dietaryTags={detectedTagLabels}
              allergens={detectedAllergenNames}
            />

            {compareMode ? (
              <Button className="w-full gap-2" onClick={handleSaveAsProductB}>
                <GitCompare className="w-4 h-4" />Save as Product B & Return to Comparison
              </Button>
            ) : (
              <Button variant="outline" className="w-full gap-2" onClick={handleSaveAsProductA}>
                <GitCompare className="w-4 h-4" />Save & Compare with Another Product
              </Button>
            )}

            <Button variant="outline" className="w-full" onClick={() => setActiveStep(1)}>Back to Ingredients</Button>
          </div>

          <div className="lg:sticky lg:top-24">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Nutrition Label Preview</h2>
              <LabelPreview nutritionData={perServingNutrition} compact showInfo={false} ingredients={recipe.ingredients} />
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
