'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecipeIngredient, commonUnits } from '@/app/types/recipe';
import { searchIngredients, getIngredientDetails, extractNutritionData } from '@/app/lib/usda-api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Beaker, ListPlus, Search, AlertCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

interface USDAIngredientSearchProps {
  onIngredientAdd: (ingredient: RecipeIngredient) => void;
}

export function USDAIngredientSearch({ onIngredientAdd }: USDAIngredientSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<RecipeIngredient | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState<string>('g');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a search term');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const results = await searchIngredients(searchQuery);
      if (results.length === 0) {
        setError('No ingredients found. Try different search terms.');
      }
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching ingredients:', error);
      setError('Failed to search ingredients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleIngredientSelect = async (ingredient: any) => {
    setLoading(true);
    setError(null);
    try {
      const details = await getIngredientDetails(ingredient.fdcId);
      if (details) {
        const nutritionData = extractNutritionData(details);
        setSelectedIngredient({
          fdcId: details.fdcId,
          name: details.description,
          quantity: 0,
          unit: 'g',
          nutritionPer100g: nutritionData,
        });
      }
      setSearchResults([])
    } catch (error) {
      console.error('Error fetching ingredient details:', error);
      setError('Failed to load ingredient details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient || !quantity || quantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    const newIngredient: RecipeIngredient = {
      ...selectedIngredient,
      quantity,
      unit,
    };

    onIngredientAdd(newIngredient);

    // Reset form
    setSelectedIngredient(null);
    setQuantity(0);
    setUnit('g');
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <Card className="p-2 border-none">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold">Search Ingredients</h2>
        </div>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search USDA food database..."
                className="text-lg pr-10"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
                </div>
              )}
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={loading}
              variant="secondary"
              size="lg"
              className="min-w-[100px]"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="p-2">
              <ScrollArea className="h-60">
                <div className="space-y-1">
                  {searchResults.map((result) => (
                    <button
                      key={result.fdcId}
                      onClick={() => handleIngredientSelect(result)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {result.description}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}
        </div>
      </Card>

      {/* Selected Ingredient Form */}
      {selectedIngredient && (
        <Card className="p-2 border-none">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Beaker className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-medium text-blue-900">
                {selectedIngredient.name}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min="0"
                  step="0.1"
                  className="text-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Unit</label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="text-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commonUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              onClick={handleAddIngredient} 
              className="w-full"
              variant="secondary"
              size="lg"
            >
              <ListPlus className="w-4 h-4 mr-2" />
              Add to Recipe
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
