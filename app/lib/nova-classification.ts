/**
 * ============================================================
 * NOVA Food Processing Classification
 * ============================================================
 *
 * Classifies recipes into NOVA groups 1-4 based on ingredient analysis.
 *
 * Reference:
 *   Monteiro CA et al. (2019). Ultra-processed foods: what they are
 *   and how to identify them. Public Health Nutrition, 22(5), 936-941.
 *   DOI: 10.1017/S1368980018003762
 *
 * Classification logic:
 *   The NOVA group of the RECIPE is determined by the highest-group
 *   ingredient present. One Group 4 ingredient = entire recipe is Group 4.
 *
 * Detection method: keyword matching on lowercased ingredient names.
 * All functions are pure — no side effects.
 * ============================================================
 */

import { RecipeIngredient } from '../types/recipe';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type NovaGroup = 1 | 2 | 3 | 4;

export interface NovaIngredientResult {
  ingredientName: string;
  group: NovaGroup;
  reason: string;
}

export interface NovaClassificationResult {
  group: NovaGroup;
  label: string;
  description: string;
  color: string;
  gaugeColor: string;
  matchedIngredients: NovaIngredientResult[];
  group4Triggers: string[];   // ingredients that pushed to group 4
  group3Triggers: string[];
  researchNote: string;
}

// ─────────────────────────────────────────────
// NOVA Group 4 Keywords
// Ultra-processed — additives, preservatives, artificial ingredients
// ─────────────────────────────────────────────

const GROUP4_KEYWORDS = [
  // Emulsifiers
  'lecithin', 'mono-diglycerides', 'monoglycerides', 'diglycerides',
  'carrageenan', 'guar gum', 'xanthan gum', 'locust bean gum',
  'polysorbate', 'sorbitan', 'carboxymethylcellulose', 'methylcellulose',
  // Artificial sweeteners
  'aspartame', 'sucralose', 'saccharin', 'acesulfame', 'stevia extract',
  'neotame', 'advantame',
  // Artificial colors
  'red 40', 'yellow 5', 'yellow 6', 'blue 1', 'blue 2', 'green 3',
  'red 3', 'tartrazine', 'allura red', 'brilliant blue', 'sunset yellow',
  'caramel color', 'artificial color', 'artificial colour',
  // Artificial flavors
  'artificial flavor', 'artificial flavour', 'natural and artificial',
  'flavoring', 'flavouring',
  // Preservatives
  'sodium benzoate', 'potassium sorbate', 'sodium nitrate', 'sodium nitrite',
  'bha', 'bht', 'tbhq', 'propyl gallate', 'calcium propionate',
  'sodium propionate', 'sulfur dioxide', 'sodium metabisulfite',
  // Flavor enhancers
  'monosodium glutamate', 'msg', 'disodium inosinate', 'disodium guanylate',
  'hydrolyzed protein', 'yeast extract', 'autolyzed yeast',
  // Processed protein
  'textured vegetable protein', 'tvp', 'soy protein isolate',
  'whey protein isolate', 'protein concentrate', 'protein isolate',
  'mechanically separated', 'pink slime',
  // Industrial ingredients
  'high fructose corn syrup', 'hfcs', 'corn syrup solids',
  'maltodextrin', 'modified starch', 'modified corn starch',
  'partially hydrogenated', 'interesterified',
  'cellulose powder', 'microcrystalline cellulose',
  // E-numbers (common ultra-processed markers)
  'e102', 'e110', 'e120', 'e124', 'e129', 'e133',
  'e211', 'e212', 'e220', 'e250', 'e251',
  'e320', 'e321', 'e322', 'e407', 'e412', 'e415',
  'e471', 'e472', 'e476', 'e481', 'e492',
  'e621', 'e627', 'e631',
];

// ─────────────────────────────────────────────
// NOVA Group 3 Keywords
// Processed foods — preserved, cured, fermented with added salt/sugar/oil
// ─────────────────────────────────────────────

const GROUP3_KEYWORDS = [
  // Cured/preserved meats
  'bacon', 'ham', 'salami', 'pepperoni', 'prosciutto', 'pancetta',
  'smoked salmon', 'cured', 'salted fish', 'corned beef',
  // Canned with additives
  'canned tomato', 'canned beans', 'canned tuna', 'canned sardine',
  // Cheese (processed)
  'cheese', 'cream cheese', 'cottage cheese',
  // Fermented/preserved
  'sauerkraut', 'kimchi', 'pickl', 'brine',
  // Smoked
  'smoked', 'liquid smoke',
  // Simple baked goods (just flour, water, salt, yeast)
  'sourdough bread', 'whole grain bread', 'rye bread',
  // Tomato paste, concentrates
  'tomato paste', 'tomato concentrate', 'fruit concentrate',
];

// ─────────────────────────────────────────────
// NOVA Group 2 Keywords
// Processed culinary ingredients — used in cooking, not eaten alone
// ─────────────────────────────────────────────

const GROUP2_KEYWORDS = [
  'sugar', 'brown sugar', 'powdered sugar', 'confectioners sugar',
  'honey', 'maple syrup', 'molasses', 'agave',
  'salt', 'sea salt', 'kosher salt', 'table salt',
  'butter', 'ghee', 'lard', 'tallow',
  'olive oil', 'vegetable oil', 'canola oil', 'sunflower oil',
  'coconut oil', 'palm oil', 'sesame oil', 'corn oil',
  'vinegar', 'apple cider vinegar', 'balsamic vinegar',
  'flour', 'wheat flour', 'corn flour', 'rice flour', 'almond flour',
  'starch', 'corn starch', 'arrowroot',
  'baking powder', 'baking soda', 'yeast', 'cream of tartar',
  'cocoa powder', 'dark chocolate', 'vanilla extract',
];

// ─────────────────────────────────────────────
// NOVA Group 1 — Everything else is Group 1
// Fresh, dried, frozen whole foods
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Exclusions — prevent false positives
// ─────────────────────────────────────────────

// These contain group 4 keywords but are actually group 1 or 2
const GROUP4_EXCLUSIONS = [
  'sunflower seed',   // contains "sunflower" but not sunflower oil
  'soy sauce',        // group 3, not group 4 (fermented)
  'natural flavor',   // ambiguous — not definitively group 4
];

// ─────────────────────────────────────────────
// Core Classification Logic
// ─────────────────────────────────────────────

function classifyIngredient(ingredientName: string): NovaIngredientResult {
  const lower = ingredientName.toLowerCase();

  // Check Group 4 first (highest priority)
  for (const keyword of GROUP4_KEYWORDS) {
    if (lower.includes(keyword)) {
      // Check exclusions
      const excluded = GROUP4_EXCLUSIONS.some((ex) => lower.includes(ex));
      if (!excluded) {
        return {
          ingredientName,
          group: 4,
          reason: `Contains "${keyword}" — characteristic of ultra-processed foods`,
        };
      }
    }
  }

  // Check Group 3
  for (const keyword of GROUP3_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        ingredientName,
        group: 3,
        reason: `Contains "${keyword}" — processed food ingredient`,
      };
    }
  }

  // Check Group 2
  for (const keyword of GROUP2_KEYWORDS) {
    if (lower.includes(keyword)) {
      return {
        ingredientName,
        group: 2,
        reason: `Contains "${keyword}" — culinary ingredient`,
      };
    }
  }

  // Default: Group 1
  return {
    ingredientName,
    group: 1,
    reason: 'Unprocessed or minimally processed food',
  };
}

// ─────────────────────────────────────────────
// NOVA Group Metadata
// ─────────────────────────────────────────────

const NOVA_META: Record<NovaGroup, {
  label: string;
  description: string;
  color: string;
  gaugeColor: string;
  researchNote: string;
}> = {
  1: {
    label: 'Group 1 — Unprocessed / Minimally Processed',
    description: 'Foods in their natural state or minimally altered. Examples: fresh fruits, vegetables, eggs, fresh meat, plain yogurt, dried legumes.',
    color: 'text-green-700',
    gaugeColor: '#16a34a',
    researchNote: 'NOVA Group 1 foods are associated with reduced risk of obesity, type 2 diabetes, and cardiovascular disease (Monteiro et al., 2019).',
  },
  2: {
    label: 'Group 2 — Processed Culinary Ingredients',
    description: 'Substances derived from Group 1 foods or from nature, used in cooking. Examples: oils, butter, sugar, salt, flour, vinegar.',
    color: 'text-lime-700',
    gaugeColor: '#65a30d',
    researchNote: 'NOVA Group 2 ingredients are not consumed alone but used in preparation of Group 1 foods. They are not classified as problematic when used in moderation.',
  },
  3: {
    label: 'Group 3 — Processed Foods',
    description: 'Products made by adding salt, sugar, or oil to Group 1 foods. Examples: canned vegetables, cheese, cured meats, smoked fish, bread.',
    color: 'text-amber-700',
    gaugeColor: '#d97706',
    researchNote: 'NOVA Group 3 foods are generally recognized as acceptable when consumed as part of a balanced diet, though processing reduces some nutritional quality.',
  },
  4: {
    label: 'Group 4 — Ultra-Processed Food Products',
    description: 'Industrial formulations with five or more ingredients including additives, preservatives, emulsifiers, and artificial flavors. Examples: soft drinks, packaged snacks, instant noodles, reconstituted meat.',
    color: 'text-red-700',
    gaugeColor: '#dc2626',
    researchNote: 'NOVA Group 4 consumption is independently associated with increased all-cause mortality, obesity, depression, and multiple chronic diseases (Monteiro et al., 2019; Fiolet et al., 2018).',
  },
};

// ─────────────────────────────────────────────
// Main Export
// ─────────────────────────────────────────────

/**
 * classifyRecipeNova
 *
 * Classifies an entire recipe into a NOVA group.
 * The recipe's group = the highest group of any single ingredient.
 *
 * @param ingredients - Recipe ingredient list
 * @returns NovaClassificationResult with full context
 */
export function classifyRecipeNova(
  ingredients: RecipeIngredient[]
): NovaClassificationResult | null {
  if (!ingredients || ingredients.length === 0) return null;

  const results = ingredients.map((ing) => classifyIngredient(ing.name));

  // Highest group determines recipe classification
  const recipeGroup = Math.max(...results.map((r) => r.group)) as NovaGroup;
  const meta = NOVA_META[recipeGroup];

  const group4Triggers = results
    .filter((r) => r.group === 4)
    .map((r) => r.ingredientName.length > 40 ? r.ingredientName.slice(0, 40) + '…' : r.ingredientName);

  const group3Triggers = results
    .filter((r) => r.group === 3)
    .map((r) => r.ingredientName.length > 40 ? r.ingredientName.slice(0, 40) + '…' : r.ingredientName);

  return {
    group: recipeGroup,
    ...meta,
    matchedIngredients: results,
    group4Triggers,
    group3Triggers,
  };
}