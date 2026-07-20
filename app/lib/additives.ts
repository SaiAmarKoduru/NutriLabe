/**
 * ============================================================
 * Additive & Preservative Risk Scoring
 * ============================================================
 *
 * Detects food additives, preservatives, and E-numbers in
 * ingredient names and classifies them by risk level.
 *
 * Risk levels:
 *   safe    — Generally recognized as safe by EFSA/FDA
 *   caution — Some studies suggest concern; regulatory debate ongoing
 *   avoid   — Restricted in some regions or linked to adverse effects
 *
 * Reference:
 *   European Food Safety Authority (EFSA). Food additives database.
 *   https://www.efsa.europa.eu/en/applications/food-additives
 *
 *   Center for Science in the Public Interest (CSPI).
 *   Chemical Cuisine: CSPI's Guide to Food Additives.
 *   https://www.cspinet.org/eating-healthy/chemical-cuisine
 *
 * All functions are pure — no side effects.
 * ============================================================
 */

import { RecipeIngredient } from '../types/recipe';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type AdditiveRisk = 'safe' | 'caution' | 'avoid';

export interface AdditiveEntry {
  name: string;
  eNumber?: string;
  category: string;
  risk: AdditiveRisk;
  notes: string;
  keywords: string[];   // what to match in ingredient names
}

export interface DetectedAdditive {
  additive: AdditiveEntry;
  foundIn: string;      // ingredient name where detected
  keyword: string;      // keyword that triggered detection
}

export interface AdditiveRiskResult {
  detected: DetectedAdditive[];
  riskCounts: { safe: number; caution: number; avoid: number };
  overallRisk: AdditiveRisk | 'none';
  hasAdditives: boolean;
}

// ─────────────────────────────────────────────
// Additive Database
// ─────────────────────────────────────────────

const ADDITIVE_DATABASE: AdditiveEntry[] = [
  // ── Artificial Colors ────────────────────────────────────────────────
  {
    name: 'Tartrazine (Yellow 5)',
    eNumber: 'E102',
    category: 'Artificial Color',
    risk: 'caution',
    notes: 'Linked to hyperactivity in children. Requires warning label in EU.',
    keywords: ['tartrazine', 'yellow 5', 'e102', 'fd&c yellow 5'],
  },
  {
    name: 'Sunset Yellow (Yellow 6)',
    eNumber: 'E110',
    category: 'Artificial Color',
    risk: 'caution',
    notes: 'Associated with hyperactivity in children. Banned in Norway and Finland.',
    keywords: ['sunset yellow', 'yellow 6', 'e110', 'fd&c yellow 6'],
  },
  {
    name: 'Allura Red (Red 40)',
    eNumber: 'E129',
    category: 'Artificial Color',
    risk: 'caution',
    notes: 'Most widely used red dye. Linked to hyperactivity in children.',
    keywords: ['allura red', 'red 40', 'e129', 'fd&c red 40'],
  },
  {
    name: 'Erythrosine (Red 3)',
    eNumber: 'E127',
    category: 'Artificial Color',
    risk: 'avoid',
    notes: 'Banned in cosmetics in the US. Linked to thyroid tumors in animal studies.',
    keywords: ['erythrosine', 'red 3', 'e127', 'fd&c red 3'],
  },
  {
    name: 'Brilliant Blue (Blue 1)',
    eNumber: 'E133',
    category: 'Artificial Color',
    risk: 'caution',
    notes: 'Banned in several European countries. May cause allergic reactions.',
    keywords: ['brilliant blue', 'blue 1', 'e133', 'fd&c blue 1'],
  },
  {
    name: 'Indigo Carmine (Blue 2)',
    eNumber: 'E132',
    category: 'Artificial Color',
    risk: 'caution',
    notes: 'May cause nausea, hypertension, and allergic reactions in sensitive individuals.',
    keywords: ['indigo carmine', 'blue 2', 'e132', 'fd&c blue 2'],
  },
  {
    name: 'Caramel Color',
    eNumber: 'E150',
    category: 'Artificial Color',
    risk: 'caution',
    notes: 'Class IV caramel (E150d) contains 4-MEI, a possible carcinogen.',
    keywords: ['caramel color', 'caramel colour', 'e150'],
  },
  {
    name: 'Artificial Colors (general)',
    category: 'Artificial Color',
    risk: 'caution',
    notes: 'Unspecified artificial colors may include dyes linked to hyperactivity.',
    keywords: ['artificial color', 'artificial colour', 'fd&c'],
  },

  // ── Preservatives ────────────────────────────────────────────────────
  {
    name: 'Sodium Benzoate',
    eNumber: 'E211',
    category: 'Preservative',
    risk: 'caution',
    notes: 'Can form benzene (a carcinogen) when combined with vitamin C. Linked to hyperactivity.',
    keywords: ['sodium benzoate', 'e211'],
  },
  {
    name: 'Potassium Sorbate',
    eNumber: 'E202',
    category: 'Preservative',
    risk: 'safe',
    notes: 'Generally recognized as safe. One of the most common food preservatives.',
    keywords: ['potassium sorbate', 'e202'],
  },
  {
    name: 'Sodium Nitrate / Nitrite',
    eNumber: 'E250/E251',
    category: 'Preservative',
    risk: 'avoid',
    notes: 'Can form nitrosamines (carcinogens) during cooking. Linked to colorectal cancer.',
    keywords: ['sodium nitrate', 'sodium nitrite', 'potassium nitrate', 'potassium nitrite', 'e249', 'e250', 'e251', 'e252'],
  },
  {
    name: 'BHA (Butylated Hydroxyanisole)',
    eNumber: 'E320',
    category: 'Antioxidant Preservative',
    risk: 'avoid',
    notes: 'Listed as a possible human carcinogen by IARC. Banned in Japan.',
    keywords: ['bha', 'butylated hydroxyanisole', 'e320'],
  },
  {
    name: 'BHT (Butylated Hydroxytoluene)',
    eNumber: 'E321',
    category: 'Antioxidant Preservative',
    risk: 'caution',
    notes: 'Some animal studies show tumor promotion. Under ongoing regulatory review.',
    keywords: ['bht', 'butylated hydroxytoluene', 'e321'],
  },
  {
    name: 'TBHQ',
    eNumber: 'E319',
    category: 'Antioxidant Preservative',
    risk: 'caution',
    notes: 'High doses linked to vision disturbance and liver enlargement in animal studies.',
    keywords: ['tbhq', 'tertiary butylhydroquinone', 'tert-butylhydroquinone', 'e319'],
  },
  {
    name: 'Sulfur Dioxide / Sulfites',
    eNumber: 'E220',
    category: 'Preservative',
    risk: 'caution',
    notes: 'Can trigger asthma attacks in sensitive individuals. Restricted in some countries.',
    keywords: ['sulfur dioxide', 'sodium sulfite', 'sodium bisulfite', 'sodium metabisulfite', 'potassium metabisulfite', 'e220', 'e221', 'e222', 'e223', 'e224'],
  },
  {
    name: 'Calcium Propionate',
    eNumber: 'E282',
    category: 'Preservative',
    risk: 'safe',
    notes: 'Generally recognized as safe. Commonly used in bread to prevent mold.',
    keywords: ['calcium propionate', 'sodium propionate', 'e282', 'e281'],
  },

  // ── Emulsifiers ───────────────────────────────────────────────────────
  {
    name: 'Carrageenan',
    eNumber: 'E407',
    category: 'Emulsifier / Thickener',
    risk: 'caution',
    notes: 'Degraded form (poligeenan) is carcinogenic. Whole carrageenan linked to gut inflammation.',
    keywords: ['carrageenan', 'e407'],
  },
  {
    name: 'Mono and Diglycerides',
    eNumber: 'E471',
    category: 'Emulsifier',
    risk: 'caution',
    notes: 'May contain trans fats. Not required to be listed under trans fat on nutrition labels.',
    keywords: ['mono-diglycerides', 'monoglycerides', 'diglycerides', 'mono and diglycerides', 'e471', 'e472'],
  },
  {
    name: 'Polysorbate 80',
    eNumber: 'E433',
    category: 'Emulsifier',
    risk: 'caution',
    notes: 'Animal studies suggest disruption of gut microbiome and promotion of colitis.',
    keywords: ['polysorbate 80', 'polysorbate 60', 'polysorbate 20', 'e433', 'e435', 'e432'],
  },
  {
    name: 'Carboxymethylcellulose (CMC)',
    eNumber: 'E466',
    category: 'Emulsifier / Thickener',
    risk: 'caution',
    notes: 'Animal studies link CMC to gut inflammation and metabolic syndrome.',
    keywords: ['carboxymethylcellulose', 'cmc', 'cellulose gum', 'e466'],
  },
  {
    name: 'Soy Lecithin',
    eNumber: 'E322',
    category: 'Emulsifier',
    risk: 'safe',
    notes: 'Widely used, generally recognized as safe. Derived from soybean oil processing.',
    keywords: ['soy lecithin', 'sunflower lecithin', 'lecithin', 'e322'],
  },

  // ── Flavor Enhancers ─────────────────────────────────────────────────
  {
    name: 'Monosodium Glutamate (MSG)',
    eNumber: 'E621',
    category: 'Flavor Enhancer',
    risk: 'safe',
    notes: 'FDA classifies as generally safe. Symptoms attributed to MSG not confirmed in controlled studies.',
    keywords: ['monosodium glutamate', 'msg', 'e621'],
  },
  {
    name: 'Disodium Inosinate / Guanylate',
    eNumber: 'E627/E631',
    category: 'Flavor Enhancer',
    risk: 'caution',
    notes: 'Often used with MSG. Not suitable for gout sufferers. May cause reactions in asthma patients.',
    keywords: ['disodium inosinate', 'disodium guanylate', 'e627', 'e631', 'e635'],
  },
  {
    name: 'Yeast Extract / Autolyzed Yeast',
    category: 'Flavor Enhancer',
    risk: 'caution',
    notes: 'Contains free glutamates similar to MSG. Not labeled as MSG but has similar effects.',
    keywords: ['yeast extract', 'autolyzed yeast', 'hydrolyzed yeast'],
  },

  // ── Artificial Sweeteners ─────────────────────────────────────────────
  {
    name: 'Aspartame',
    eNumber: 'E951',
    category: 'Artificial Sweetener',
    risk: 'caution',
    notes: 'IARC classified as possibly carcinogenic (Group 2B) in 2023. Under ongoing review.',
    keywords: ['aspartame', 'e951', 'nutrasweet', 'equal'],
  },
  {
    name: 'Sucralose',
    eNumber: 'E955',
    category: 'Artificial Sweetener',
    risk: 'caution',
    notes: 'Recent studies suggest gut microbiome disruption. FDA approved but under review.',
    keywords: ['sucralose', 'e955', 'splenda'],
  },
  {
    name: 'Saccharin',
    eNumber: 'E954',
    category: 'Artificial Sweetener',
    risk: 'caution',
    notes: 'Previously linked to bladder cancer in animals. Warning labels removed in 2000.',
    keywords: ['saccharin', 'e954', 'sweet n low'],
  },
  {
    name: 'Acesulfame Potassium',
    eNumber: 'E950',
    category: 'Artificial Sweetener',
    risk: 'caution',
    notes: 'Limited long-term human studies. Some animal data suggests potential carcinogenicity.',
    keywords: ['acesulfame', 'acesulfame k', 'acesulfame potassium', 'e950', 'ace-k'],
  },

  // ── Industrial Ingredients ────────────────────────────────────────────
  {
    name: 'High Fructose Corn Syrup',
    category: 'Sweetener',
    risk: 'avoid',
    notes: 'Strongly linked to obesity, insulin resistance, and non-alcoholic fatty liver disease.',
    keywords: ['high fructose corn syrup', 'hfcs', 'corn syrup solids'],
  },
  {
    name: 'Partially Hydrogenated Oils',
    category: 'Trans Fat Source',
    risk: 'avoid',
    notes: 'Primary source of industrial trans fats. Banned in many countries. No safe level of consumption.',
    keywords: ['partially hydrogenated', 'hydrogenated vegetable oil', 'shortening'],
  },
  {
    name: 'Modified Starch',
    eNumber: 'E1404-E1452',
    category: 'Thickener',
    risk: 'safe',
    notes: 'Chemically or physically modified starches. Generally recognized as safe by EFSA.',
    keywords: ['modified starch', 'modified corn starch', 'modified food starch', 'modified tapioca starch'],
  },
  {
    name: 'Maltodextrin',
    category: 'Bulking Agent',
    risk: 'caution',
    notes: 'High glycemic index. May disrupt gut microbiome. Found in many ultra-processed foods.',
    keywords: ['maltodextrin'],
  },
];

// ─────────────────────────────────────────────
// Detection Engine
// ─────────────────────────────────────────────

/**
 * detectAdditives
 *
 * Scans ingredient names for known additives using keyword matching.
 * Returns deduplicated results — each additive reported once even if
 * found in multiple ingredients.
 *
 * @param ingredients - Recipe ingredient list
 */
export function detectAdditives(ingredients: RecipeIngredient[]): AdditiveRiskResult {
  if (!ingredients || ingredients.length === 0) {
    return {
      detected: [],
      riskCounts: { safe: 0, caution: 0, avoid: 0 },
      overallRisk: 'none',
      hasAdditives: false,
    };
  }

  const detected: DetectedAdditive[] = [];
  const seenAdditives = new Set<string>(); // prevent duplicate additive entries

  for (const ingredient of ingredients) {
    const lower = ingredient.name.toLowerCase();

    for (const additive of ADDITIVE_DATABASE) {
      if (seenAdditives.has(additive.name)) continue;

      for (const keyword of additive.keywords) {
        if (lower.includes(keyword)) {
          detected.push({
            additive,
            foundIn: ingredient.name,
            keyword,
          });
          seenAdditives.add(additive.name);
          break; // one match per additive per ingredient
        }
      }
    }
  }

  const riskCounts = {
    safe: detected.filter((d) => d.additive.risk === 'safe').length,
    caution: detected.filter((d) => d.additive.risk === 'caution').length,
    avoid: detected.filter((d) => d.additive.risk === 'avoid').length,
  };

  const overallRisk: AdditiveRisk | 'none' =
    riskCounts.avoid > 0 ? 'avoid'
    : riskCounts.caution > 0 ? 'caution'
    : riskCounts.safe > 0 ? 'safe'
    : 'none';

  return {
    detected,
    riskCounts,
    overallRisk,
    hasAdditives: detected.length > 0,
  };
}