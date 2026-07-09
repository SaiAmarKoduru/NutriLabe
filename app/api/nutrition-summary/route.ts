/**
 * POST /api/nutrition-summary
 * Server-side Gemini proxy for AI nutrition summary.
 * Request: { nutritionData: NutritionData, productName: string, dietaryTags?: string[], allergens?: string[] }
 * Response: { success: true, summary: string } or { success: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

function buildPrompt(
  productName: string,
  nutrition: Record<string, number>,
  dietaryTags: string[],
  allergens: string[]
): string {
  return `You are a registered dietitian writing a brief nutrition summary for a food label app.

Product: "${productName}"

Per-serving nutrition:
- Calories: ${nutrition.calories ?? 0} kcal
- Protein: ${nutrition.protein ?? 0}g
- Total Fat: ${nutrition.totalFat ?? 0}g (Saturated: ${nutrition.saturatedFat ?? 0}g, Trans: ${nutrition.transFat ?? 0}g)
- Carbohydrates: ${nutrition.totalCarbohydrates ?? 0}g (Fiber: ${nutrition.dietaryFiber ?? 0}g, Sugars: ${nutrition.sugars ?? 0}g)
- Sodium: ${nutrition.sodium ?? 0}mg
- Cholesterol: ${nutrition.cholesterol ?? 0}mg
- Calcium: ${nutrition.calcium ?? 0}mg
- Iron: ${nutrition.iron ?? 0}mg
- Potassium: ${nutrition.potassium ?? 0}mg
${dietaryTags.length > 0 ? `\nDietary classifications: ${dietaryTags.join(', ')}` : ''}
${allergens.length > 0 ? `\nAllergens present: ${allergens.join(', ')}` : ''}

Write a 3-4 sentence nutrition summary for consumers. Cover:
1. Overall nutritional character (e.g. high-protein, low-fiber, calorie-dense)
2. One specific strength and one concern if applicable
3. Who this product is suitable or unsuitable for

Be specific, factual, and balanced. No marketing language. No bullet points. Plain paragraph only.
Keep it under 80 words.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'AI feature is not configured. Add GEMINI_API_KEY to .env.local' },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const { nutritionData, productName, dietaryTags = [], allergens = [] } = body;

  if (!nutritionData || typeof nutritionData !== 'object') {
    return NextResponse.json({ success: false, error: 'nutritionData is required.' }, { status: 400 });
  }

  try {
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: buildPrompt(
              productName || 'This product',
              nutritionData,
              dietaryTags,
              allergens
            )
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errText);
      return NextResponse.json(
        { success: false, error: `Gemini API returned ${geminiResponse.status}.` },
        { status: 502 }
      );
    }

    const geminiData = await geminiResponse.json();
    const summary: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (!summary) {
      return NextResponse.json({ success: false, error: 'Empty response from Gemini.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, summary });

  } catch (error) {
    console.error('Nutrition summary error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate summary.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}