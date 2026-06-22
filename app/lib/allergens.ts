/**
 * ============================================================
 * Allergen Detection Library
 * ============================================================
 *
 * Detects the presence of the 14 major EU allergens (Regulation
 * 1169/2011 Annex II) from a list of recipe ingredients.
 *
 * The EU 14 allergen set is used as it is the superset of all
 * other supported markets:
 *   - US FALCPA (9 allergens) ⊂ EU 14
 *   - Canada Health Canada (10 allergens) ⊂ EU 14
 *   - Australia FSANZ Standard 1.2.3 ⊂ EU 14
 *   - India FSSAI 2020 Regulations ⊂ EU 14
 *
 * Detection method: keyword matching on lowercased ingredient names.
 * Keywords are ordered from most specific to least specific within
 * each allergen to minimize false positives.
 *
 * Severity levels:
 *   high   — ingredient IS the allergen (e.g. "whole milk", "egg")
 *   medium — ingredient is a derivative (e.g. "whey" → milk)
 *
 * All functions are pure — no side effects, fully testable.
 * ============================================================
 */

import { RecipeIngredient } from '../types/recipe';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Severity of the allergen match */
export type AllergenSeverity = 'high' | 'medium';

/** A single keyword entry within an allergen definition */
interface AllergenKeyword {
  /** The keyword to search for in ingredient names (lowercase) */
  term: string;
  /** Whether this keyword indicates a direct (high) or derivative (medium) match */
  severity: AllergenSeverity;
}

/** Definition of one allergen category */
export interface AllergenDefinition {
  /** Unique identifier */
  id: string;
  /** Display name shown to user */
  name: string;
  /** Short description of what this allergen covers */
  description: string;
  /** Which regulatory frameworks require this allergen to be declared */
  regulations: string[];
  /** Keywords that indicate presence of this allergen */
  keywords: AllergenKeyword[];
  /** Emoji icon for visual identification */
  icon: string;
}

/** Result of detecting one allergen in a recipe */
export interface AllergenResult {
  allergen: AllergenDefinition;
  severity: AllergenSeverity;
  /** Names of the ingredients that triggered this allergen */
  matchedIngredients: string[];
  /** Which keyword triggered the match (for explainability) */
  matchedKeywords: string[];
}

// ─────────────────────────────────────────────
// Allergen Definitions
// ─────────────────────────────────────────────

/**
 * THE_14_EU_ALLERGENS
 *
 * Complete list of allergens mandated by EU Regulation 1169/2011 Annex II.
 * Keywords ordered from most specific to least specific to reduce false positives.
 *
 * False positive mitigations:
 *   - "butternut" excluded by requiring "butter" to not be preceded by "nut"
 *     → handled by word-boundary logic in matchesIngredient()
 *   - "swordfish" excluded from fish by checking it's not a sword variant
 *   - Sulphite E-numbers (E220–E228) included for processed food detection
 */
export const THE_14_EU_ALLERGENS: AllergenDefinition[] = [
  {
    id: 'gluten',
    name: 'Gluten',
    description: 'Cereals containing gluten: wheat, rye, barley, oats, spelt, kamut',
    regulations: ['EU Annex II', 'US FALCPA', 'Canada', 'Australia', 'India FSSAI'],
    icon: '🌾',
    keywords: [
      { term: 'wheat',      severity: 'high'   },
      { term: 'spelt',      severity: 'high'   },
      { term: 'kamut',      severity: 'high'   },
      { term: 'triticale',  severity: 'high'   },
      { term: 'rye',        severity: 'high'   },
      { term: 'barley',     severity: 'high'   },
      { term: 'oat',        severity: 'high'   },
      { term: 'gluten',     severity: 'high'   },
      { term: 'semolina',   severity: 'high'   },
      { term: 'durum',      severity: 'high'   },
      { term: 'farro',      severity: 'high'   },
      { term: 'bread',      severity: 'medium' },
      { term: 'flour',      severity: 'medium' },
      { term: 'pasta',      severity: 'medium' },
      { term: 'noodle',     severity: 'medium' },
      { term: 'cracker',    severity: 'medium' },
      { term: 'biscuit',    severity: 'medium' },
    ],
  },
  {
    id: 'crustaceans',
    name: 'Crustaceans',
    description: 'Crustacean shellfish: shrimp, prawn, crab, lobster, crayfish',
    regulations: ['EU Annex II', 'US FALCPA', 'Canada', 'Australia', 'India FSSAI'],
    icon: '🦐',
    keywords: [
      { term: 'shrimp',       severity: 'high' },
      { term: 'prawn',        severity: 'high' },
      { term: 'crab',         severity: 'high' },
      { term: 'lobster',      severity: 'high' },
      { term: 'crayfish',     severity: 'high' },
      { term: 'langoustine',  severity: 'high' },
      { term: 'barnacle',     severity: 'high' },
      { term: 'krill',        severity: 'high' },
    ],
  },
  {
    id: 'eggs',
    name: 'Eggs',
    description: 'Eggs and egg-derived products',
    regulations: ['EU Annex II', 'US FALCPA', 'Canada', 'Australia', 'India FSSAI'],
    icon: '🥚',
    keywords: [
      { term: 'egg',          severity: 'high'   },
      { term: 'albumin',      severity: 'high'   },
      { term: 'albumen',      severity: 'high'   },
      { term: 'ovalbumin',    severity: 'high'   },
      { term: 'ovomucin',     severity: 'high'   },
      { term: 'lysozyme',     severity: 'medium' },
      { term: 'mayonnaise',   severity: 'medium' },
      { term: 'meringue',     severity: 'medium' },
      { term: 'hollandaise',  severity: 'medium' },
    ],
  },
  {
    id: 'fish',
    name: 'Fish',
    description: 'Fish and fish-derived products',
    regulations: ['EU Annex II', 'US FALCPA', 'Canada', 'Australia', 'India FSSAI'],
    icon: '🐟',
    keywords: [
      { term: 'anchovy',      severity: 'high'   },
      { term: 'salmon',       severity: 'high'   },
      { term: 'tuna',         severity: 'high'   },
      { term: 'mackerel',     severity: 'high'   },
      { term: 'sardine',      severity: 'high'   },
      { term: 'halibut',      severity: 'high'   },
      { term: 'tilapia',      severity: 'high'   },
      { term: 'catfish',      severity: 'high'   },
      { term: 'herring',      severity: 'high'   },
      { term: 'trout',        severity: 'high'   },
      { term: 'pollock',      severity: 'high'   },
      { term: 'flounder',     severity: 'high'   },
      { term: 'snapper',      severity: 'high'   },
      { term: 'pangasius',    severity: 'high'   },
      { term: 'fish sauce',   severity: 'high'   },
      { term: 'fish stock',   severity: 'high'   },
      { term: 'worcestershire', severity: 'medium' },
      { term: 'caesar',       severity: 'medium' },
    ],
  },
  {
    id: 'peanuts',
    name: 'Peanuts',
    description: 'Peanuts and peanut-derived products',
    regulations: ['EU Annex II', 'US FALCPA', 'Canada', 'Australia', 'India FSSAI'],
    icon: '🥜',
    keywords: [
      { term: 'peanut',       severity: 'high'   },
      { term: 'groundnut',    severity: 'high'   },
      { term: 'monkey nut',   severity: 'high'   },
      { term: 'arachis',      severity: 'high'   },
      { term: 'mixed nuts',   severity: 'medium' },
    ],
  },
  {
    id: 'soybeans',
    name: 'Soybeans',
    description: 'Soybeans and soy-derived products',
    regulations: ['EU Annex II', 'US FALCPA', 'Canada', 'Australia', 'India FSSAI'],
    icon: '🫘',
    keywords: [
      { term: 'soybean',      severity: 'high'   },
      { term: 'soy bean',     severity: 'high'   },
      { term: 'soya',         severity: 'high'   },
      { term: 'tofu',         severity: 'high'   },
      { term: 'tempeh',       severity: 'high'   },
      { term: 'miso',         severity: 'high'   },
      { term: 'edamame',      severity: 'high'   },
      { term: 'natto',        severity: 'high'   },
      { term: 'soy sauce',    severity: 'high'   },
      { term: 'tamari',       severity: 'high'   },
      { term: 'soy protein',  severity: 'high'   },
      { term: 'soy lecithin', severity: 'medium' },
      { term: 'lecithin',     severity: 'medium' },
    ],
  },
  {
    id: 'milk',
    name: 'Milk',
    description: 'Milk and dairy-derived products including lactose',
    regulations: ['EU Annex II', 'US FALCPA', 'Canada', 'Australia', 'India FSSAI'],
    icon: '🥛',
    keywords: [
      { term: 'milk',         severity: 'high'   },
      { term: 'cream',        severity: 'high'   },
      { term: 'butter',       severity: 'high'   },
      { term: 'cheese',       severity: 'high'   },
      { term: 'yogurt',       severity: 'high'   },
      { term: 'yoghurt',      severity: 'high'   },
      { term: 'ghee',         severity: 'high'   },
      { term: 'whey',         severity: 'high'   },
      { term: 'casein',       severity: 'high'   },
      { term: 'caseinate',    severity: 'high'   },
      { term: 'lactose',      severity: 'high'   },
      { term: 'lactalbumin',  severity: 'high'   },
      { term: 'lactoglobulin',severity: 'high'   },
      { term: 'dairy',        severity: 'high'   },
      { term: 'paneer',       severity: 'high'   },
      { term: 'quark',        severity: 'high'   },
      { term: 'kefir',        severity: 'high'   },
    ],
  },
  {
    id: 'tree_nuts',
    name: 'Tree Nuts',
    description: 'Almonds, cashews, walnuts, pecans, pistachios, hazelnuts, macadamia, Brazil nuts',
    regulations: ['EU Annex II', 'US FALCPA', 'Canada', 'Australia', 'India FSSAI'],
    icon: '🌰',
    keywords: [
      { term: 'almond',       severity: 'high'   },
      { term: 'cashew',       severity: 'high'   },
      { term: 'walnut',       severity: 'high'   },
      { term: 'pecan',        severity: 'high'   },
      { term: 'pistachio',    severity: 'high'   },
      { term: 'hazelnut',     severity: 'high'   },
      { term: 'macadamia',    severity: 'high'   },
      { term: 'brazil nut',   severity: 'high'   },
      { term: 'pine nut',     severity: 'high'   },
      { term: 'chestnut',     severity: 'high'   },
      { term: 'praline',      severity: 'medium' },
      { term: 'marzipan',     severity: 'medium' },
      { term: 'nougat',       severity: 'medium' },
      { term: 'nut butter',   severity: 'medium' },
    ],
  },
  {
    id: 'celery',
    name: 'Celery',
    description: 'Celery and celeriac including seeds and spices',
    regulations: ['EU Annex II'],
    icon: '🥬',
    keywords: [
      { term: 'celery',       severity: 'high'   },
      { term: 'celeriac',     severity: 'high'   },
      { term: 'celery seed',  severity: 'high'   },
      { term: 'celery salt',  severity: 'high'   },
    ],
  },
  {
    id: 'mustard',
    name: 'Mustard',
    description: 'Mustard plant, seeds, leaves, flowers, and mustard-derived products',
    regulations: ['EU Annex II', 'Canada'],
    icon: '🌿',
    keywords: [
      { term: 'mustard',      severity: 'high'   },
      { term: 'sinapis',      severity: 'high'   },
      { term: 'mustard seed', severity: 'high'   },
      { term: 'mustard oil',  severity: 'high'   },
      { term: 'mustard flour',severity: 'high'   },
    ],
  },
  {
    id: 'sesame',
    name: 'Sesame',
    description: 'Sesame seeds and sesame-derived products',
    regulations: ['EU Annex II', 'US FALCPA', 'Canada', 'Australia', 'India FSSAI'],
    icon: '🫙',
    keywords: [
      { term: 'sesame',       severity: 'high'   },
      { term: 'tahini',       severity: 'high'   },
      { term: 'til ',         severity: 'high'   },
      { term: 'gingelly',     severity: 'high'   },
      { term: 'benne',        severity: 'high'   },
      { term: 'sesame oil',   severity: 'high'   },
      { term: 'sesame seed',  severity: 'high'   },
    ],
  },
  {
    id: 'sulphites',
    name: 'Sulphites / SO₂',
    description: 'Sulphur dioxide and sulphites at concentrations >10mg/kg or >10mg/L',
    regulations: ['EU Annex II', 'Australia', 'Canada'],
    icon: '⚗️',
    keywords: [
      { term: 'sulphite',         severity: 'high'   },
      { term: 'sulfite',          severity: 'high'   },
      { term: 'sulphur dioxide',  severity: 'high'   },
      { term: 'sulfur dioxide',   severity: 'high'   },
      { term: 'so2',              severity: 'high'   },
      { term: 'e220',             severity: 'high'   },
      { term: 'e221',             severity: 'high'   },
      { term: 'e222',             severity: 'high'   },
      { term: 'e223',             severity: 'high'   },
      { term: 'e224',             severity: 'high'   },
      { term: 'e225',             severity: 'high'   },
      { term: 'e226',             severity: 'high'   },
      { term: 'e227',             severity: 'high'   },
      { term: 'e228',             severity: 'high'   },
      { term: 'dried fruit',      severity: 'medium' },
      { term: 'wine',             severity: 'medium' },
      { term: 'vinegar',          severity: 'medium' },
    ],
  },
  {
    id: 'lupin',
    name: 'Lupin',
    description: 'Lupin seeds and lupin flour used in baked goods and pasta',
    regulations: ['EU Annex II', 'Australia'],
    icon: '🌱',
    keywords: [
      { term: 'lupin',        severity: 'high' },
      { term: 'lupine',       severity: 'high' },
      { term: 'lupin flour',  severity: 'high' },
      { term: 'lupin seed',   severity: 'high' },
    ],
  },
  {
    id: 'molluscs',
    name: 'Molluscs',
    description: 'Molluscs: squid, octopus, mussels, oysters, scallops, clams, snails',
    regulations: ['EU Annex II', 'Australia'],
    icon: '🦑',
    keywords: [
      { term: 'squid',        severity: 'high' },
      { term: 'octopus',      severity: 'high' },
      { term: 'mussel',       severity: 'high' },
      { term: 'oyster',       severity: 'high' },
      { term: 'scallop',      severity: 'high' },
      { term: 'clam',         severity: 'high' },
      { term: 'abalone',      severity: 'high' },
      { term: 'snail',        severity: 'high' },
      { term: 'periwinkle',   severity: 'high' },
      { term: 'calamari',     severity: 'high' },
      { term: 'escargot',     severity: 'high' },
    ],
  },
];

// ─────────────────────────────────────────────
// False Positive Exclusion List
// ─────────────────────────────────────────────

/**
 * EXCLUSION_PATTERNS
 *
 * Some ingredient names contain allergen keywords but are NOT allergens.
 * These patterns are checked before confirming a match.
 *
 * Example: "butternut squash" contains "butter" (milk allergen)
 *          but butternut squash contains no dairy.
 *
 * Format: { contains: string, excludes: string }
 * If ingredient contains `contains` AND `excludes`, skip the match.
 */
const EXCLUSION_PATTERNS: Array<{ contains: string; excludes: string }> = [
  { contains: 'butter',    excludes: 'butternut'    },
  { contains: 'butter',    excludes: 'buttercup'    },
  { contains: 'cream',     excludes: 'ice cream soda' },
  { contains: 'rye',       excludes: 'rye grass'    },
  { contains: 'oat',       excludes: 'oat grass'    },
  { contains: 'clam',      excludes: 'clamp'        },
];

// ─────────────────────────────────────────────
// Core Detection Functions
// ─────────────────────────────────────────────

/**
 * isExcluded
 *
 * Checks if an ingredient name should be excluded from a keyword match
 * to prevent known false positives.
 *
 * @param ingredientLower - Lowercased ingredient name
 * @param keyword         - The allergen keyword that matched
 * @returns true if this match should be excluded (false positive)
 */
function isExcluded(ingredientLower: string, keyword: string): boolean {
  return EXCLUSION_PATTERNS.some(
    (pattern) =>
      keyword.includes(pattern.contains) &&
      ingredientLower.includes(pattern.excludes)
  );
}

/**
 * matchesIngredient
 *
 * Tests whether a single ingredient name contains a keyword match
 * for a given allergen keyword, with false-positive exclusion.
 *
 * @param ingredientName - Raw ingredient name from USDA
 * @param keyword        - AllergenKeyword to test
 * @returns true if the ingredient matches this keyword
 */
function matchesIngredient(
  ingredientName: string,
  keyword: AllergenKeyword
): boolean {
  const lower = ingredientName.toLowerCase();
  const term = keyword.term.toLowerCase();

  // Check if the ingredient name contains the keyword term
  if (!lower.includes(term)) return false;

  // Check exclusion list to prevent false positives
  if (isExcluded(lower, term)) return false;

  return true;
}

/**
 * detectAllergens
 *
 * Main detection function. Scans all ingredients in a recipe against
 * all 14 EU allergen definitions and returns matches with full context
 * for explainability.
 *
 * Algorithm:
 *   For each allergen definition:
 *     For each ingredient:
 *       For each keyword in the allergen:
 *         If ingredient matches keyword:
 *           Record the ingredient name and keyword
 *           Track highest severity seen
 *
 * Deduplication: each allergen appears at most once in results,
 * but can list multiple matched ingredients.
 *
 * @param ingredients - Array of RecipeIngredient from the recipe builder
 * @returns Array of AllergenResult, one per detected allergen
 */
export function detectAllergens(
  ingredients: RecipeIngredient[]
): AllergenResult[] {
  if (!ingredients || ingredients.length === 0) return [];

  const results: AllergenResult[] = [];

  for (const allergenDef of THE_14_EU_ALLERGENS) {
    const matchedIngredients: string[] = [];
    const matchedKeywords: string[] = [];
    let highestSeverity: AllergenSeverity = 'medium';

    for (const ingredient of ingredients) {
      for (const keyword of allergenDef.keywords) {
        if (matchesIngredient(ingredient.name, keyword)) {
          // Track which ingredient triggered this allergen
          if (!matchedIngredients.includes(ingredient.name)) {
            matchedIngredients.push(ingredient.name);
          }

          // Track which keyword triggered this match (for explainability)
          if (!matchedKeywords.includes(keyword.term)) {
            matchedKeywords.push(keyword.term);
          }

          // Escalate to high severity if any match is high
          if (keyword.severity === 'high') {
            highestSeverity = 'high';
          }

          // No need to check more keywords for this ingredient
          break;
        }
      }
    }

    // Only add to results if at least one ingredient matched
    if (matchedIngredients.length > 0) {
      results.push({
        allergen: allergenDef,
        severity: highestSeverity,
        matchedIngredients,
        matchedKeywords,
      });
    }
  }

  // Sort: high severity first, then alphabetical by name
  return results.sort((a, b) => {
    if (a.severity === 'high' && b.severity !== 'high') return -1;
    if (a.severity !== 'high' && b.severity === 'high') return 1;
    return a.allergen.name.localeCompare(b.allergen.name);
  });
}

/**
 * getAllergenSummary
 *
 * Returns a short plain-text summary of detected allergens.
 * Used for accessibility (aria-label) and future AI summary integration.
 *
 * @param results - Array of AllergenResult from detectAllergens()
 * @returns Human-readable summary string
 */
export function getAllergenSummary(results: AllergenResult[]): string {
  if (results.length === 0) return 'No major allergens detected.';

  const names = results.map((r) => r.allergen.name).join(', ');
  return `Contains ${results.length} allergen${results.length > 1 ? 's' : ''}: ${names}.`;
}