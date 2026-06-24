/**
 * ============================================================
 * Nutrition Quality Score — Scoring Engine
 * ============================================================
 *
 * Calculates a 0–100 Nutrition Quality Score for a recipe's
 * per-serving nutrition profile.
 *
 * Methodology:
 *   Adapted from the UK FSA Nutrient Profiling Model (2004/2011)
 *   which forms the scientific basis of the EU Nutri-Score system.
 *   Reference: Rayner et al., Public Health Nutrition, 2005.
 *
 * Design principles:
 *   - Scoring rules are fully separate from UI logic (this file)
 *   - All thresholds are named constants — easy to adjust
 *   - Every factor produces an explanation string for the UI
 *   - Pure functions only — no side effects, fully testable
 *   - Score is clamped to [0, 100]
 *
 * Score interpretation:
 *   80–100  Excellent  🟢
 *   60–79   Good       🟡
 *   40–59   Fair       🟠
 *   20–39   Poor       🔴
 *   0–19    Very Poor  ⛔
 * ============================================================
 */

import { NutritionData } from '../types/nutrition';

// ─────────────────────────────────────────────
// Configurable Scoring Rules
// ─────────────────────────────────────────────
// All thresholds and weights are defined here as named constants.
// To adjust the scoring model, only change values in this section.

/**
 * NEGATIVE_RULES
 * Nutrients where high amounts reduce the score.
 * Each rule defines thresholds for graduated deductions.
 */
const NEGATIVE_RULES = {
  calories: {
    label: 'Calories',
    unit: 'kcal',
    tiers: [
      { threshold: 500, deduction: 15, message: 'Very high calorie content per serving' },
      { threshold: 400, deduction: 12, message: 'High calorie content per serving' },
      { threshold: 300, deduction: 8,  message: 'Moderate-high calorie content per serving' },
      { threshold: 200, deduction: 4,  message: 'Moderate calorie content per serving' },
    ],
  },
  saturatedFat: {
    label: 'Saturated Fat',
    unit: 'g',
    tiers: [
      { threshold: 10, deduction: 15, message: 'Very high saturated fat — increases cardiovascular risk' },
      { threshold: 7,  deduction: 12, message: 'High saturated fat content' },
      { threshold: 5,  deduction: 8,  message: 'Moderate-high saturated fat' },
      { threshold: 3,  deduction: 4,  message: 'Moderate saturated fat' },
    ],
  },
  sodium: {
    label: 'Sodium',
    unit: 'mg',
    tiers: [
      { threshold: 1500, deduction: 15, message: 'Very high sodium — significantly above recommended limits' },
      { threshold: 900,  deduction: 12, message: 'High sodium content' },
      { threshold: 600,  deduction: 8,  message: 'Moderate-high sodium' },
      { threshold: 300,  deduction: 4,  message: 'Moderate sodium' },
    ],
  },
  sugars: {
    label: 'Total Sugars',
    unit: 'g',
    tiers: [
      { threshold: 24, deduction: 15, message: 'Very high sugar content per serving' },
      { threshold: 18, deduction: 12, message: 'High sugar content' },
      { threshold: 12, deduction: 8,  message: 'Moderate-high sugar content' },
      { threshold: 6,  deduction: 4,  message: 'Moderate sugar content' },
    ],
  },
  transFat: {
    label: 'Trans Fat',
    unit: 'g',
    tiers: [
      { threshold: 2,   deduction: 15, message: 'High trans fat — strongly linked to cardiovascular disease' },
      { threshold: 1,   deduction: 10, message: 'Moderate trans fat detected' },
      { threshold: 0.5, deduction: 5,  message: 'Small amount of trans fat detected' },
    ],
  },
} as const;

/**
 * POSITIVE_RULES
 * Nutrients where adequate amounts increase the score.
 */
const POSITIVE_RULES = {
  protein: {
    label: 'Protein',
    unit: 'g',
    tiers: [
      { threshold: 20, addition: 10, message: 'Excellent protein source per serving' },
      { threshold: 10, addition: 7,  message: 'Good protein content' },
      { threshold: 5,  addition: 4,  message: 'Moderate protein content' },
    ],
  },
  dietaryFiber: {
    label: 'Dietary Fiber',
    unit: 'g',
    tiers: [
      { threshold: 8,  addition: 10, message: 'Excellent fiber content — supports digestive health' },
      { threshold: 5,  addition: 7,  message: 'Good fiber content' },
      { threshold: 3,  addition: 4,  message: 'Moderate fiber content' },
    ],
  },
  potassium: {
    label: 'Potassium',
    unit: 'mg',
    tiers: [
      { threshold: 700, addition: 5, message: 'High potassium — supports heart and muscle health' },
      { threshold: 350, addition: 3, message: 'Moderate potassium content' },
    ],
  },
  calcium: {
    label: 'Calcium',
    unit: 'mg',
    tiers: [
      { threshold: 300, addition: 5, message: 'High calcium — supports bone health' },
      { threshold: 150, addition: 3, message: 'Moderate calcium content' },
    ],
  },
  iron: {
    label: 'Iron',
    unit: 'mg',
    tiers: [
      { threshold: 4,   addition: 5, message: 'Good iron content — supports blood health' },
      { threshold: 2,   addition: 3, message: 'Moderate iron content' },
    ],
  },
} as const;

/** Maximum possible score before clamping */
const BASE_SCORE = 100;

/** Maximum total positive additions allowed */
const MAX_POSITIVE_ADDITIONS = 35;

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Impact direction of a scoring factor */
export type FactorDirection = 'positive' | 'negative' | 'neutral';

/** A single factor that contributed to the score */
export interface ScoreFactor {
  label: string;
  value: number;
  unit: string;
  impact: number;          // positive = good, negative = bad, 0 = neutral
  direction: FactorDirection;
  message: string;
  suggestion?: string;     // actionable improvement tip
}

/** Grade band based on score */
export interface ScoreGrade {
  label: string;
  color: string;           // Tailwind color class
  gaugeColor: string;      // Hex color for SVG gauge
  emoji: string;
  description: string;
}

/** Complete scoring result */
export interface NutritionScoreResult {
  score: number;           // 0–100
  grade: ScoreGrade;
  factors: ScoreFactor[];
  totalDeductions: number;
  totalAdditions: number;
  suggestions: string[];   // top actionable improvement tips
  hasInsufficientData: boolean;
}

// ─────────────────────────────────────────────
// Grade Bands
// ─────────────────────────────────────────────

/**
 * getGrade
 * Maps a numeric score to a grade band with color and label.
 */
function getGrade(score: number): ScoreGrade {
  if (score >= 80) return {
    label: 'Excellent',
    color: 'text-green-600',
    gaugeColor: '#16a34a',
    emoji: '🟢',
    description: 'Outstanding nutritional profile',
  };
  if (score >= 60) return {
    label: 'Good',
    color: 'text-lime-600',
    gaugeColor: '#65a30d',
    emoji: '🟡',
    description: 'Good nutritional balance with minor concerns',
  };
  if (score >= 40) return {
    label: 'Fair',
    color: 'text-amber-600',
    gaugeColor: '#d97706',
    emoji: '🟠',
    description: 'Moderate quality — room for improvement',
  };
  if (score >= 20) return {
    label: 'Poor',
    color: 'text-orange-600',
    gaugeColor: '#ea580c',
    emoji: '🔴',
    description: 'Below average nutritional quality',
  };
  return {
    label: 'Very Poor',
    color: 'text-red-600',
    gaugeColor: '#dc2626',
    emoji: '⛔',
    description: 'Significant nutritional concerns',
  };
}

// ─────────────────────────────────────────────
// Improvement Suggestions
// ─────────────────────────────────────────────

/**
 * IMPROVEMENT_SUGGESTIONS
 * Maps each negative factor to a practical improvement tip.
 */
const IMPROVEMENT_SUGGESTIONS: Record<string, string> = {
  calories:     'Consider reducing portion size or substituting high-calorie ingredients with lower-calorie alternatives.',
  saturatedFat: 'Replace saturated fats (butter, coconut oil) with unsaturated fats (olive oil, avocado oil).',
  sodium:       'Reduce added salt and avoid high-sodium ingredients like soy sauce, canned goods, or processed meats.',
  sugars:       'Reduce added sugars by substituting with natural sweeteners or reducing the amount used.',
  transFat:     'Eliminate trans fats by avoiding partially hydrogenated oils and processed snack foods.',
};

// ─────────────────────────────────────────────
// Core Scoring Function
// ─────────────────────────────────────────────

/**
 * calculateNutritionScore
 *
 * Computes a 0–100 Nutrition Quality Score from per-serving nutrition data.
 *
 * Algorithm:
 *   1. Start at BASE_SCORE (100)
 *   2. Apply graduated deductions for negative nutrients
 *   3. Apply graduated additions for positive nutrients (capped)
 *   4. Clamp final score to [0, 100]
 *   5. Build factor list for explainability
 *   6. Generate top improvement suggestions
 *
 * @param data - Per-serving NutritionData (must be per-serving, not total recipe)
 * @returns Complete NutritionScoreResult with score, grade, factors, suggestions
 */
export function calculateNutritionScore(
  data: NutritionData
): NutritionScoreResult {
  // ── Detect insufficient data ─────────────────────────────────────────
  // If all major nutrients are 0, we cannot compute a meaningful score
  const hasInsufficientData =
    data.calories === 0 &&
    data.protein === 0 &&
    data.totalFat === 0 &&
    data.totalCarbohydrates === 0;

  if (hasInsufficientData) {
    return {
      score: 0,
      grade: getGrade(0),
      factors: [],
      totalDeductions: 0,
      totalAdditions: 0,
      suggestions: ['Enter complete nutrition information to receive a quality score.'],
      hasInsufficientData: true,
    };
  }

  const factors: ScoreFactor[] = [];
  let totalDeductions = 0;
  let totalAdditions = 0;
  const suggestions: string[] = [];

  // ── Step 1: Apply negative factor deductions ─────────────────────────
  for (const [key, rule] of Object.entries(NEGATIVE_RULES)) {
    const value = data[key as keyof NutritionData] as number;
    let deduction = 0;
    let message = '';

    // Find highest matching tier (tiers are ordered high→low)
    for (const tier of rule.tiers) {
      if (value >= tier.threshold) {
        deduction = tier.deduction;
        message = tier.message;
        break;
      }
    }

    if (deduction > 0) {
      totalDeductions += deduction;
      suggestions.push(IMPROVEMENT_SUGGESTIONS[key]);
      factors.push({
        label: rule.label,
        value,
        unit: rule.unit,
        impact: -deduction,
        direction: 'negative',
        message,
        suggestion: IMPROVEMENT_SUGGESTIONS[key],
      });
    } else if (value > 0) {
      // Nutrient is present but within acceptable range — neutral positive note
      factors.push({
        label: rule.label,
        value,
        unit: rule.unit,
        impact: 0,
        direction: 'neutral',
        message: `${rule.label} is within acceptable limits`,
      });
    }
  }

  // ── Step 2: Apply positive factor additions ───────────────────────────
  for (const [key, rule] of Object.entries(POSITIVE_RULES)) {
    const value = data[key as keyof NutritionData] as number;
    let addition = 0;
    let message = '';

    for (const tier of rule.tiers) {
      if (value >= tier.threshold) {
        addition = tier.addition;
        message = tier.message;
        break;
      }
    }

    if (addition > 0) {
      totalAdditions += addition;
      factors.push({
        label: rule.label,
        value,
        unit: rule.unit,
        impact: addition,
        direction: 'positive',
        message,
      });
    }
  }

  // Cap total additions to prevent inflation
  const cappedAdditions = Math.min(totalAdditions, MAX_POSITIVE_ADDITIONS);

  // ── Step 3: Calculate final score ────────────────────────────────────
  const rawScore = BASE_SCORE - totalDeductions + cappedAdditions;
  const score = Math.max(0, Math.min(100, Math.round(rawScore)));

  // Sort factors: negatives first (most impactful), then positives
  factors.sort((a, b) => {
    if (a.direction === 'negative' && b.direction !== 'negative') return -1;
    if (a.direction !== 'negative' && b.direction === 'negative') return 1;
    return Math.abs(b.impact) - Math.abs(a.impact);
  });

  return {
    score,
    grade: getGrade(score),
    factors,
    totalDeductions,
    totalAdditions: cappedAdditions,
    // Return top 3 most impactful suggestions
    suggestions: suggestions.slice(0, 3),
    hasInsufficientData: false,
  };
}