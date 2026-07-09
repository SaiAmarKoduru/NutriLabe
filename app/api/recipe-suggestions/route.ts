import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

function buildPrompt(
  productName: string,
  ingredients: Array<{ name: string; quantity: number; unit: string }>,
  nutrition: Record<string, number>,
  score: number
): string {
  const ingredientList = ingredients
    .map((i) => `- ${i.name.slice(0, 40)} (${i.quantity}${i.unit})`)
    .join('\n');

  return [
    'You are a food scientist helping improve a recipe nutrition score.',
    '',
    `Product: ${productName}`,
    `Score: ${score}/100`,
    '',
    'Ingredients:',
    ingredientList,
    '',
    `Calories: ${nutrition.calories ?? 0} kcal, Protein: ${nutrition.protein ?? 0}g`,
    `Sat Fat: ${nutrition.saturatedFat ?? 0}g, Fiber: ${nutrition.dietaryFiber ?? 0}g`,
    `Sodium: ${nutrition.sodium ?? 0}mg, Sugars: ${nutrition.sugars ?? 0}g`,
    '',
    'Give exactly 3 ingredient substitution suggestions.',
    'Use very short names. One sentence per benefit.',
    '',
    'Respond with ONLY a valid JSON array. No markdown. No explanation.',
    'Format: [{"original":"name","substitute":"name","benefit":"sentence","impact":"high|medium|low"}]',
  ].join('\n');
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'AI feature is not configured.' },
      { status: 503 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  const { ingredients, nutritionData, productName, score } = body;

  if (!ingredients?.length || !nutritionData) {
    return NextResponse.json(
      { success: false, error: 'ingredients and nutritionData are required.' },
      { status: 400 }
    );
  }

  try {
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: buildPrompt(productName || 'Recipe', ingredients, nutritionData, score ?? 0),
          }],
        }],
        generationConfig: {
          temperature: 0.3,
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
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: 'Empty response from Gemini.' },
        { status: 502 }
      );
    }

    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!arrayMatch) throw new Error('No JSON array in response.');

    const suggestions = JSON.parse(arrayMatch[0]);
    if (!Array.isArray(suggestions)) throw new Error('Invalid response structure.');

    const validated = suggestions.slice(0, 3).map((s: any) => ({
      original: String(s.original ?? '').slice(0, 50),
      substitute: String(s.substitute ?? '').slice(0, 50),
      benefit: String(s.benefit ?? '').slice(0, 200),
      impact: ['high', 'medium', 'low'].includes(s.impact) ? s.impact : 'medium',
    }));

    return NextResponse.json({ success: true, suggestions: validated });

  } catch (error) {
    console.error('Recipe suggestions error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate suggestions.',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}