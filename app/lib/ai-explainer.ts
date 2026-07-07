/**
 * AI Ingredient Explanation — Frontend Client
 *
 * Calls the internal Next.js API route (/api/explain-ingredient).
 * Never calls Gemini directly — API key stays server-side only.
 * Caching, error handling, and result shape are unchanged from 3.1.
 */

export interface IngredientExplanation {
  ingredient: string;
  explanation: string;
  healthConsiderations: string;
  naturalOrSynthetic: 'natural' | 'synthetic' | 'semi-synthetic' | 'unknown';
  commonNames: string[];
  safetyRating: 'generally-safe' | 'use-in-moderation' | 'controversial' | 'restricted';
}

export interface ExplainResult {
  success: boolean;
  data?: IngredientExplanation;
  error?: string;
}

/**
 * explainIngredient
 *
 * Sends ingredient name to internal API route.
 * API route proxies to Gemini server-side — key never exposed to client.
 *
 * @param ingredientName - Full USDA ingredient name
 * @returns ExplainResult with parsed explanation or descriptive error
 */
export async function explainIngredient(
  ingredientName: string
): Promise<ExplainResult> {
  try {
    const response = await fetch('/api/explain-ingredient', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredientName }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error ?? `Request failed with status ${response.status}`,
      };
    }

    return { success: true, data: data.data as IngredientExplanation };
  } catch (error) {
    console.error('AI explainer fetch error:', error);
    return {
      success: false,
      error: 'Network error — could not reach explanation service.',
    };
  }
}