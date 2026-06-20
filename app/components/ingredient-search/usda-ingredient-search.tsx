/**
 * ============================================================
 * USDA Ingredient Search Component
 * ============================================================
 *
 * Provides a search interface into the USDA FoodData Central database.
 *
 * User flow:
 *   1. User types a food name and clicks Search (or presses Enter)
 *   2. Results appear in a scrollable list
 *   3. User clicks a result → detail fetch runs → ingredient form appears
 *   4. User enters quantity + unit → clicks "Add to Recipe"
 *   5. Parent receives the ingredient via onIngredientAdd callback
 *
 * ADDED (1.4): Toast notifications for all async events:
 *   - Search loading indicator (toast.loading → dismissed on complete)
 *   - Empty results warning toast
 *   - Search error toast
 *   - Ingredient detail fetch error toast
 *   - Success toast when ingredient is added to recipe
 *
 * All toasts use sonner which is already installed as a dependency.
 * ============================================================
 */

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RecipeIngredient, commonUnits } from '@/app/types/recipe';
import {
  searchIngredients,
  getIngredientDetails,
  extractNutritionData,
} from '@/app/lib/usda-api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Beaker, ListPlus, Search, AlertCircle, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface USDAIngredientSearchProps {
  /** Called when user confirms adding an ingredient to the recipe */
  onIngredientAdd: (ingredient: RecipeIngredient) => void;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export function USDAIngredientSearch({ onIngredientAdd }: USDAIngredientSearchProps) {
  // ── Local State ───────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedIngredient, setSelectedIngredient] = useState<RecipeIngredient | null>(null);
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState<string>('g');

  /**
   * Separate loading states for search vs detail fetch.
   * This lets us show the right spinner in the right place
   * without blocking the entire UI.
   */
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingDetail, setIsFetchingDetail] = useState(false);

  /** Inline error message for quantity validation only.
   *  API errors use toasts instead of inline alerts. */
  const [quantityError, setQuantityError] = useState<string | null>(null);

  // ── Handlers ──────────────────────────────────────────────────────────

  /**
   * handleSearch
   *
   * Queries the USDA API for the current search term.
   * Shows a loading toast while the request is in flight,
   * then replaces it with success/error feedback.
   */
  const handleSearch = async () => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      toast.warning('Please enter an ingredient name to search.');
      return;
    }

    setIsSearching(true);
    setSearchResults([]);
    setSelectedIngredient(null);

    // Show a persistent loading toast — we dismiss it manually when done
    const loadingToastId = toast.loading(`Searching USDA database for "${trimmed}"…`);

    try {
      const results = await searchIngredients(trimmed);

      // Always dismiss the loading toast before showing result feedback
      toast.dismiss(loadingToastId);

      if (results.length === 0) {
        toast.warning(`No results found for "${trimmed}". Try different keywords.`);
      } else {
        toast.success(`Found ${results.length} results for "${trimmed}"`);
        setSearchResults(results);
      }
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error('USDA search failed. Please check your connection and try again.');
      console.error('USDA search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * handleKeyDown
   *
   * Allows pressing Enter in the search field to trigger search.
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  /**
   * handleIngredientSelect
   *
   * Fetches full nutrition details for the selected search result.
   * Shows a loading state on the results list while fetching.
   */
  const handleIngredientSelect = async (ingredient: any) => {
    setIsFetchingDetail(true);
    setSearchResults([]);

    const loadingToastId = toast.loading(`Loading nutrition data for "${ingredient.description}"…`);

    try {
      const details = await getIngredientDetails(ingredient.fdcId);

      toast.dismiss(loadingToastId);

      if (!details) {
        toast.error('Could not load ingredient details. Please try selecting again.');
        return;
      }

      const nutritionData = extractNutritionData(details);

      setSelectedIngredient({
        fdcId: details.fdcId,
        name: details.description,
        quantity: 0,
        unit: 'g',
        nutritionPer100g: nutritionData,
      });

      // Reset quantity for the new selection
      setQuantity(0);
      setUnit('g');
      setQuantityError(null);
    } catch (error) {
      toast.dismiss(loadingToastId);
      toast.error('Failed to load ingredient details. Please try again.');
      console.error('USDA detail fetch error:', error);
    } finally {
      setIsFetchingDetail(false);
    }
  };

  /**
   * handleAddIngredient
   *
   * Validates the quantity and calls the parent callback.
   * Shows a success toast confirming the ingredient was added.
   */
  const handleAddIngredient = () => {
    if (!selectedIngredient) return;

    // Quantity validation — use inline error for this since it's form feedback
    if (!quantity || quantity <= 0) {
      setQuantityError('Please enter a quantity greater than 0.');
      return;
    }

    setQuantityError(null);

    const newIngredient: RecipeIngredient = {
      ...selectedIngredient,
      quantity,
      unit,
    };

    // Call parent handler first
    onIngredientAdd(newIngredient);

    // Show success toast with ingredient details for confirmation
    toast.success(`Added ${quantity}${unit} of ${selectedIngredient.name}`);

    // Reset form for next ingredient
    setSelectedIngredient(null);
    setQuantity(0);
    setUnit('g');
    setSearchQuery('');
    setSearchResults([]);
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Search Input Section ──────────────────────────────────────── */}
      <Card className="p-2 border-none">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-blue-500" />
          <h2 className="text-xl font-semibold">Search Ingredients</h2>
        </div>

        <div className="space-y-4">

          {/* Search field + button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search USDA food database…"
                className="text-base pr-10"
                disabled={isSearching || isFetchingDetail}
              />
              {/* Inline spinner inside input when searching */}
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>

            <Button
              onClick={handleSearch}
              disabled={isSearching || isFetchingDetail}
              variant="secondary"
              size="lg"
              className="min-w-[100px]"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </>
              )}
            </Button>
          </div>

          {/* ── Search Results List ─────────────────────────────────── */}
          {isFetchingDetail && (
            <div className="flex items-center justify-center py-6 text-gray-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Loading nutrition data…</span>
            </div>
          )}

          {searchResults.length > 0 && !isFetchingDetail && (
            <Card className="p-2">
              <ScrollArea className="h-60">
                <div className="space-y-1">
                  {searchResults.map((result) => (
                    <button
                      key={result.fdcId}
                      onClick={() => handleIngredientSelect(result)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 rounded-lg transition-colors text-sm"
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

      {/* ── Selected Ingredient Form ──────────────────────────────────── */}
      {selectedIngredient && (
        <Card className="p-4 border-none">
          <div className="space-y-4">

            {/* Selected ingredient name */}
            <div className="flex items-center gap-2">
              <Beaker className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <h3 className="text-base font-medium text-blue-900 truncate">
                {selectedIngredient.name}
              </h3>
            </div>

            {/* Quantity + unit inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <Input
                  type="number"
                  value={quantity || ''}
                  onChange={(e) => {
                    setQuantity(Number(e.target.value));
                    setQuantityError(null);
                  }}
                  min="0"
                  step="0.1"
                  placeholder="e.g. 100"
                  className="text-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Unit</label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger className="text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {commonUnits.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Inline quantity validation error */}
            {quantityError && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{quantityError}</AlertDescription>
              </Alert>
            )}

            {/* Add button */}
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
