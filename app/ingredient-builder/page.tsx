'use client'
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, ArrowRight } from 'lucide-react';
import { USDAIngredientSearch } from '../components/ingredient-search/usda-ingredient-search';
import LabelPreview from '../components/nutrition-label/label-preview';
import { calculateIngredientNutrition } from '../lib/usda-api';
import { RecipeIngredient } from '../types/recipe';
import { NutritionData } from '../types/nutrition';

export default function IngredientBuilder() {
  const [recipe, setRecipe] = useState({
    name: '',
    servingSize: 0,
    servingsPerContainer: 1,
    ingredients: [] as RecipeIngredient[],
    totalNutrition: {
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
      servingSize: 0,
      servingsPerContainer: 1
    } as NutritionData,
  });

  const [activeStep, setActiveStep] = useState(1);
  const [showPreview, setShowPreview] = useState(true);

  const steps = [
    {
      number: 1,
      title: 'Add Recipe & Ingredients',
      description: 'Enter recipe details and add ingredients',
      isComplete: recipe.name !== '' && recipe.servingSize > 0 && recipe.ingredients.length > 0,
    },
    {
      number: 2,
      title: 'Review & Generate',
      description: 'Review nutrition facts and generate label',
      isComplete: false,
    },
  ];

  const handleAddIngredient = (ingredient: RecipeIngredient) => {
    setRecipe((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, ingredient],
      totalNutrition: calculateTotalNutrition([...prev.ingredients, ingredient]),
    }));
  };

  const handleRemoveIngredient = (index: number) => {
    setRecipe((prev) => {
      const newIngredients = prev.ingredients.filter((_, i) => i !== index);
      return {
        ...prev,
        ingredients: newIngredients,
        totalNutrition: calculateTotalNutrition(newIngredients),
      };
    });
  };

  const calculateTotalNutrition = (ingredients: RecipeIngredient[]): NutritionData => {
    return ingredients.reduce((total, ingredient) => {
      const nutrition = calculateIngredientNutrition(
        ingredient.nutritionPer100g,
        ingredient.quantity,
        ingredient.unit
      );

      return {
        calories: (total.calories || 0) + (nutrition.calories || 0),
        totalFat: (total.totalFat || 0) + (nutrition.totalFat || 0),
        saturatedFat: (total.saturatedFat || 0) + (nutrition.saturatedFat || 0),
        transFat: (total.transFat || 0) + (nutrition.transFat || 0),
        cholesterol: (total.cholesterol || 0) + (nutrition.cholesterol || 0),
        sodium: (total.sodium || 0) + (nutrition.sodium || 0),
        totalCarbohydrates: (total.totalCarbohydrates || 0) + (nutrition.totalCarbohydrates || 0),
        dietaryFiber: (total.dietaryFiber || 0) + (nutrition.dietaryFiber || 0),
        sugars: (total.sugars || 0) + (nutrition.sugars || 0),
        protein: (total.protein || 0) + (nutrition.protein || 0),
        vitaminD: (total.vitaminD || 0) + (nutrition.vitaminD || 0),
        calcium: (total.calcium || 0) + (nutrition.calcium || 0),
        iron: (total.iron || 0) + (nutrition.iron || 0),
        potassium: (total.potassium || 0) + (nutrition.potassium || 0),
        servingSize: recipe.servingSize,
        servingsPerContainer: recipe.servingsPerContainer
      };
    }, {
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
      servingSize: recipe.servingSize,
      servingsPerContainer: recipe.servingsPerContainer
    });
  };

  return (
    (<div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header with Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Ingredient Nutrition Builder</h1>
            <p className="text-gray-600">Create nutrition labels from your ingredients</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {steps.map((step) => (
            <button
              key={step.number}
              onClick={() => setActiveStep(step.number)}
              className={`p-4 rounded-lg border-2 transition-all ${
                activeStep === step.number
                  ? 'border-blue-500 bg-blue-50'
                  : step.isComplete
                  ? 'border-green-200 bg-green-50'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activeStep === step.number
                      ? 'bg-blue-500 text-white'
                      : step.isComplete
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  {step.number}
                </div>
                <div className="text-left">
                  <div className="font-medium">{step.title}</div>
                  <div className="text-sm text-gray-500">{step.description}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* Step Content */}
      {activeStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                      value={recipe.servingSize || ''}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          servingSize: parseFloat(e.target.value) || 0,
                          totalNutrition: {
                            ...prev.totalNutrition,
                            servingSize: parseFloat(e.target.value) || 0
                          }
                        }))
                      }
                      placeholder="Enter serving size"
                    />
                  </div>
                  <div>
                    <Label htmlFor="servingsPerContainer">
                      Servings Per Container
                    </Label>
                    <Input
                      id="servingsPerContainer"
                      type="number"
                      value={recipe.servingsPerContainer || ''}
                      onChange={(e) =>
                        setRecipe((prev) => ({
                          ...prev,
                          servingsPerContainer: parseFloat(e.target.value) || 1,
                          totalNutrition: {
                            ...prev.totalNutrition,
                            servingsPerContainer: parseFloat(e.target.value) || 1
                          }
                        }))
                      }
                      placeholder="Enter servings per container"
                    />
                  </div>
                </div>
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
                  <h3 className="text-lg font-medium">Current Ingredients</h3>
                </div>
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
                        <div>
                          <div className="font-medium">{ingredient.name}</div>
                          <div className="text-sm text-gray-500">
                            {ingredient.quantity} {ingredient.unit}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveIngredient(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {recipe.ingredients.length > 0 && recipe.name && recipe.servingSize > 0 && recipe.servingsPerContainer > 0 && (
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
      {activeStep === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Recipe Summary</h2>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="text-gray-500">Product Name</div>
                    <div className="font-medium">{recipe.name}</div>
                    <div className="text-gray-500">Serving Size</div>
                    <div className="font-medium">{recipe.servingSize}g</div>
                    <div className="text-gray-500">Servings Per Container</div>
                    <div className="font-medium">{recipe.servingsPerContainer}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(recipe.totalNutrition).map(([key, value]) => (
                    <div key={key} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-500 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="font-medium">
                        {typeof value === 'number'
                          ? `${value.toFixed(1)}${key === 'calories' ? ' kcal' : 'g'}`
                          : String(value)}
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

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">Nutrition Label Preview</h2>
              </div>
              <LabelPreview
                nutritionData={recipe.totalNutrition}
                compact
                showInfo={false}
              />
            </Card>
          </div>
        </div>
      )}
    </div>)
  );
}
