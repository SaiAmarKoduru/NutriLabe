/**
 * ============================================================
 * Dietary Tag Detection Library
 * ============================================================
 *
 * Classifies a recipe's ingredient list into dietary categories.
 *
 * Tags are evaluated using two strategies:
 *
 *   EXCLUSION tags (Vegan, Vegetarian, Gluten-Free, Dairy-Free,
 *   Nut-Free, Soy-Free):
 *     Assumed TRUE until a disqualifying ingredient is found.
 *     Example: Gluten-Free = true unless wheat/rye/barley/oat detected.
 *
 *   PRESENCE tags (Contains Meat, Contains Fish/Seafood):
 *     Assumed FALSE until a qualifying ingredient is found.
 *     Example: Contains Meat = false unless beef/pork/chicken detected.
 *
 *   HIERARCHY rule:
 *     Vegan ⊂ Vegetarian — if not Vegetarian, cannot be Vegan.
 *     Applied after all ingredient checks complete.
 *
 * All functions are pure — no side effects, no React dependencies.
 *
 * References:
 *   Vegan Society definition: no animal products of any kind
 *   Vegetarian Society definition: no meat, poultry, fish, or seafood
 *   FDA gluten-free: <20ppm gluten (we use ingredient-level detection)
 * ============================================================
 */

import { RecipeIngredient } from '../types/recipe';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Visual style for a dietary tag */
export type TagStyle = 'positive' | 'warning' | 'neutral';

/** A single dietary classification result */
export interface DietaryTagResult {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Emoji icon */
  icon: string;
  /** Whether the tag is present/true for this recipe */
  detected: boolean;
  /** Visual style when detected */
  style: TagStyle;
  /** Plain-language reason for why this tag was set */
  reason: string;
  /** Ingredient(s) that triggered or confirmed this tag */
  triggeringIngredients: string[];
}

// ─────────────────────────────────────────────
// Keyword Lists
// ─────────────────────────────────────────────

/**
 * Keywords that disqualify the VEGAN tag.
 * Includes all animal-derived ingredients.
 * Note: this is a superset of vegetarian disqualifiers.
 */
const NON_VEGAN_KEYWORDS = [
  // Meat
  'beef', 'pork', 'lamb', 'veal', 'venison', 'bison', 'mutton',
  'chicken', 'turkey', 'duck', 'goose', 'quail', 'rabbit',
  'meat', 'bacon', 'ham', 'sausage', 'salami', 'pepperoni',
  'prosciutto', 'pancetta', 'lard', 'tallow', 'suet',
  // Fish & seafood
  'fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine',
  'mackerel', 'halibut', 'tilapia', 'herring', 'trout',
  'shrimp', 'prawn', 'crab', 'lobster', 'crayfish',
  'squid', 'octopus', 'mussel', 'oyster', 'scallop', 'clam',
  'calamari', 'abalone',
  // Dairy
  'milk', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt',
  'whey', 'casein', 'lactose', 'ghee', 'dairy', 'paneer',
  'lactalbumin', 'lactoglobulin', 'kefir', 'quark',
  // Eggs
  'egg', 'albumin', 'albumen', 'ovalbumin', 'mayonnaise', 'meringue',
  // Other animal products
  'honey', 'beeswax', 'royal jelly', 'propolis',
  'gelatin', 'gelatine', 'collagen', 'isinglass',
  'carmine', 'cochineal', 'e120',
  'rennet', 'lanolin', 'shellac', 'e904',
  'anchovy paste', 'fish sauce', 'worcestershire',
  'lard', 'tallow', 'suet', 'bone broth', 'stock',
];

/**
 * Keywords that disqualify VEGETARIAN but not always VEGAN.
 * (Meat and fish — no dairy/eggs here since those are vegetarian-ok)
 */
const NON_VEGETARIAN_KEYWORDS = [
  'beef', 'pork', 'lamb', 'veal', 'venison', 'bison', 'mutton',
  'chicken', 'turkey', 'duck', 'goose', 'quail', 'rabbit',
  'meat', 'bacon', 'ham', 'sausage', 'salami', 'pepperoni',
  'prosciutto', 'pancetta', 'lard', 'tallow', 'suet',
  'fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine',
  'mackerel', 'halibut', 'tilapia', 'herring', 'trout',
  'shrimp', 'prawn', 'crab', 'lobster', 'crayfish',
  'squid', 'octopus', 'mussel', 'oyster', 'scallop', 'clam',
  'calamari', 'gelatin', 'gelatine', 'isinglass',
  'fish sauce', 'worcestershire', 'anchovy paste',
  'bone broth', 'lard', 'tallow', 'suet',
];

/**
 * Keywords that disqualify GLUTEN-FREE.
 * Based on FDA gluten-free definition (< 20 ppm threshold,
 * we use ingredient-level detection as a conservative approach).
 */
const GLUTEN_KEYWORDS = [
  'wheat', 'spelt', 'kamut', 'durum', 'semolina', 'farro', 'triticale',
  'rye', 'barley', 'malt', 'oat', 'oats',
  'gluten', 'bread', 'flour', 'pasta', 'noodle',
  'cracker', 'biscuit', 'crouton', 'breadcrumb',
  'seitan', 'bulgur', 'couscous',
];

/**
 * Gluten-free exclusions — ingredients that contain these keywords
 * but are NOT sources of gluten.
 */
const GLUTEN_EXCLUSIONS = [
  'buckwheat',    // not wheat despite the name
  'oat milk',     // check carefully — may or may not contain gluten
  'rice',
  'corn',
];

/**
 * Keywords that disqualify DAIRY-FREE.
 */
const DAIRY_KEYWORDS = [
  'milk', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt',
  'whey', 'casein', 'caseinate', 'lactose', 'ghee', 'dairy',
  'paneer', 'lactalbumin', 'lactoglobulin', 'kefir', 'quark',
];

/** Dairy exclusions — non-dairy items that contain dairy keywords */
const DAIRY_EXCLUSIONS = [
  'coconut milk',
  'coconut cream',
  'coconut butter',
  'almond milk',
  'oat milk',
  'soy milk',
  'rice milk',
  'cashew milk',
  'butternut',
  'buttercup',
  'peanut butter',
  'almond butter',
  'nut butter',
  'shea butter',
  'cocoa butter',
];

/**
 * Keywords that disqualify NUT-FREE.
 * Covers both tree nuts and peanuts (groundnuts).
 */
const NUT_KEYWORDS = [
  'almond', 'cashew', 'walnut', 'pecan', 'pistachio',
  'hazelnut', 'macadamia', 'brazil nut', 'pine nut', 'chestnut',
  'peanut', 'groundnut', 'monkey nut', 'arachis',
  'praline', 'marzipan', 'nougat', 'nut butter',
  'mixed nuts', 'nut oil', 'nut flour',
];

/**
 * Keywords that disqualify SOY-FREE.
 */
const SOY_KEYWORDS = [
  'soy', 'soya', 'soybean', 'tofu', 'tempeh', 'miso',
  'edamame', 'natto', 'soy sauce', 'tamari',
  'soy protein', 'soy lecithin', 'soy milk',
  'textured vegetable protein', 'tvp',
];

/**
 * Keywords indicating MEAT presence (for informational tag).
 */
const MEAT_KEYWORDS = [
  'beef', 'pork', 'lamb', 'veal', 'venison', 'bison', 'mutton',
  'chicken', 'turkey', 'duck', 'goose', 'quail', 'rabbit',
  'bacon', 'ham', 'sausage', 'salami', 'pepperoni',
  'prosciutto', 'pancetta', 'chorizo', 'bologna',
  'meatball', 'ground meat', 'minced meat',
];

/**
 * Keywords indicating FISH/SEAFOOD presence (for informational tag).
 */
const FISH_SEAFOOD_KEYWORDS = [
  'fish', 'salmon', 'tuna', 'cod', 'anchovy', 'sardine',
  'mackerel', 'halibut', 'tilapia', 'herring', 'trout',
  'shrimp', 'prawn', 'crab', 'lobster', 'crayfish',
  'squid', 'octopus', 'mussel', 'oyster', 'scallop', 'clam',
  'calamari', 'abalone', 'fish sauce',
];

// ─────────────────────────────────────────────
// Core Matching Utilities
// ─────────────────────────────────────────────

/**
 * containsKeyword
 *
 * Tests whether an ingredient name contains any keyword from the list,
 * with optional exclusion list to prevent false positives.
 *
 * @param ingredientLower - Lowercased ingredient name
 * @param keywords        - Array of keywords to check
 * @param exclusions      - If ingredient contains any exclusion term, skip match
 * @returns The matching keyword if found, null otherwise
 */
function containsKeyword(
  ingredientLower: string,
  keywords: string[],
  exclusions: string[] = []
): string | null {
  // Check exclusions first — if excluded, this ingredient is not a match
  for (const exclusion of exclusions) {
    if (ingredientLower.includes(exclusion)) return null;
  }

  for (const keyword of keywords) {
    if (ingredientLower.includes(keyword)) return keyword;
  }

  return null;
}

/**
 * findDisqualifyingIngredients
 *
 * Scans all ingredients for any that match the keyword list.
 * Returns the names and matched keywords of disqualifying ingredients.
 *
 * @param ingredients - Recipe ingredient list
 * @param keywords    - Disqualifying keywords
 * @param exclusions  - False-positive exclusions
 */
function findDisqualifyingIngredients(
  ingredients: RecipeIngredient[],
  keywords: string[],
  exclusions: string[] = []
): { names: string[]; keywords: string[] } {
  const names: string[] = [];
  const matchedKeywords: string[] = [];

  for (const ingredient of ingredients) {
    const lower = ingredient.name.toLowerCase();
    const match = containsKeyword(lower, keywords, exclusions);

    if (match) {
      if (!names.includes(ingredient.name)) {
        names.push(ingredient.name);
      }
      if (!matchedKeywords.includes(match)) {
        matchedKeywords.push(match);
      }
    }
  }

  return { names, keywords: matchedKeywords };
}

// ─────────────────────────────────────────────
// Main Detection Function
// ─────────────────────────────────────────────

/**
 * detectDietaryTags
 *
 * Evaluates a recipe's ingredient list against all dietary classifications
 * and returns a complete set of DietaryTagResult objects.
 *
 * Only tags where `detected = true` should be displayed prominently.
 * Tags where `detected = false` can be shown as "does not apply" if needed.
 *
 * @param ingredients - Array of RecipeIngredient from the recipe builder
 * @returns Array of DietaryTagResult for all evaluated tags
 */
export function detectDietaryTags(
  ingredients: RecipeIngredient[]
): DietaryTagResult[] {
  if (!ingredients || ingredients.length === 0) return [];

  // ── Evaluate each category ───────────────────────────────────────────

  // Vegan check
  const nonVeganMatches = findDisqualifyingIngredients(
    ingredients, NON_VEGAN_KEYWORDS
  );
  const isVegan = nonVeganMatches.names.length === 0;

  // Vegetarian check
  const nonVegetarianMatches = findDisqualifyingIngredients(
    ingredients, NON_VEGETARIAN_KEYWORDS
  );
  const isVegetarian = nonVegetarianMatches.names.length === 0;

  // Gluten-Free check
  const glutenMatches = findDisqualifyingIngredients(
    ingredients, GLUTEN_KEYWORDS, GLUTEN_EXCLUSIONS
  );
  const isGlutenFree = glutenMatches.names.length === 0;

  // Dairy-Free check
  const dairyMatches = findDisqualifyingIngredients(
    ingredients, DAIRY_KEYWORDS, DAIRY_EXCLUSIONS
  );
  const isDairyFree = dairyMatches.names.length === 0;

  // Nut-Free check
  const nutMatches = findDisqualifyingIngredients(
    ingredients, NUT_KEYWORDS
  );
  const isNutFree = nutMatches.names.length === 0;

  // Soy-Free check
  const soyMatches = findDisqualifyingIngredients(
    ingredients, SOY_KEYWORDS
  );
  const isSoyFree = soyMatches.names.length === 0;

  // Contains Meat (informational)
  const meatMatches = findDisqualifyingIngredients(
    ingredients, MEAT_KEYWORDS
  );
  const containsMeat = meatMatches.names.length > 0;

  // Contains Fish/Seafood (informational)
  const fishMatches = findDisqualifyingIngredients(
    ingredients, FISH_SEAFOOD_KEYWORDS
  );
  const containsFish = fishMatches.names.length > 0;

  // ── Apply hierarchy rule ─────────────────────────────────────────────
  // Vegan ⊂ Vegetarian: if not vegetarian, cannot be vegan
  const effectivelyVegan = isVegan && isVegetarian;

  // ── Build results ────────────────────────────────────────────────────

  return [
    {
      id: 'vegan',
      label: 'Vegan',
      icon: '🌱',
      detected: effectivelyVegan,
      style: 'positive',
      reason: effectivelyVegan
        ? 'No animal-derived ingredients detected.'
        : `Contains animal products: ${nonVeganMatches.names.slice(0, 2).join(', ')}${nonVeganMatches.names.length > 2 ? ` +${nonVeganMatches.names.length - 2} more` : ''}.`,
      triggeringIngredients: effectivelyVegan ? [] : nonVeganMatches.names,
    },
    {
      id: 'vegetarian',
      label: 'Vegetarian',
      icon: '🥕',
      detected: isVegetarian,
      style: 'positive',
      reason: isVegetarian
        ? 'No meat, poultry, or seafood detected.'
        : `Contains non-vegetarian ingredients: ${nonVegetarianMatches.names.slice(0, 2).join(', ')}.`,
      triggeringIngredients: isVegetarian ? [] : nonVegetarianMatches.names,
    },
    {
      id: 'gluten_free',
      label: 'Gluten-Free',
      icon: '🌾',
      detected: isGlutenFree,
      style: 'positive',
      reason: isGlutenFree
        ? 'No gluten-containing grains detected.'
        : `Contains gluten source: ${glutenMatches.names.slice(0, 2).join(', ')}.`,
      triggeringIngredients: isGlutenFree ? [] : glutenMatches.names,
    },
    {
      id: 'dairy_free',
      label: 'Dairy-Free',
      icon: '🥛',
      detected: isDairyFree,
      style: 'positive',
      reason: isDairyFree
        ? 'No dairy or lactose-containing ingredients detected.'
        : `Contains dairy: ${dairyMatches.names.slice(0, 2).join(', ')}.`,
      triggeringIngredients: isDairyFree ? [] : dairyMatches.names,
    },
    {
      id: 'nut_free',
      label: 'Nut-Free',
      icon: '🥜',
      detected: isNutFree,
      style: 'positive',
      reason: isNutFree
        ? 'No tree nuts or peanuts detected.'
        : `Contains nuts: ${nutMatches.names.slice(0, 2).join(', ')}.`,
      triggeringIngredients: isNutFree ? [] : nutMatches.names,
    },
    {
      id: 'soy_free',
      label: 'Soy-Free',
      icon: '🫘',
      detected: isSoyFree,
      style: 'positive',
      reason: isSoyFree
        ? 'No soy or soy-derived ingredients detected.'
        : `Contains soy: ${soyMatches.names.slice(0, 2).join(', ')}.`,
      triggeringIngredients: isSoyFree ? [] : soyMatches.names,
    },
    {
      id: 'contains_meat',
      label: 'Contains Meat',
      icon: '🥩',
      detected: containsMeat,
      style: 'warning',
      reason: containsMeat
        ? `Meat detected: ${meatMatches.names.slice(0, 2).join(', ')}.`
        : 'No meat or poultry detected.',
      triggeringIngredients: meatMatches.names,
    },
    {
      id: 'contains_fish',
      label: 'Contains Fish/Seafood',
      icon: '🐟',
      detected: containsFish,
      style: 'warning',
      reason: containsFish
        ? `Fish/seafood detected: ${fishMatches.names.slice(0, 2).join(', ')}.`
        : 'No fish or seafood detected.',
      triggeringIngredients: fishMatches.names,
    },
  ];
}

/**
 * getDetectedTags
 *
 * Convenience filter — returns only tags where detected = true.
 * Use this when you only want to display applicable tags.
 *
 * @param tags - Full result from detectDietaryTags()
 * @returns Only the tags that apply to this recipe
 */
export function getDetectedTags(tags: DietaryTagResult[]): DietaryTagResult[] {
  return tags.filter((t) => t.detected);
}