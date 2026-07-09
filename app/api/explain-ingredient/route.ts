/**
 * POST /api/explain-ingredient
 * Server-side Gemini proxy — API key never exposed to client.
 */

import { NextRequest, NextResponse } from 'next/server';

interface IngredientExplanation {
  ingredient: string;
  explanation: string;
  healthConsiderations: string;
  naturalOrSynthetic: 'natural' | 'synthetic' | 'semi-synthetic' | 'unknown';
  commonNames: string[];
  safetyRating: 'generally-safe' | 'use-in-moderation' | 'controversial' | 'restricted';
}

// Updated to gemini-1.5-flash — current stable free-tier model as of 2025
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

function buildPrompt(ingredientName: string): string {
  return `You are a food science expert. Explain this food ingredient for a consumer nutrition label app: "${ingredientName}"

Respond with ONLY this JSON, no markdown, no extra text:
{
  "ingredient": "clean display name",
  "explanation": "2-3 sentence plain language explanation of what it is and why it is used in food",
  "healthConsiderations": "1-2 sentences on health impact, safety, and any relevant research",
  "naturalOrSynthetic": "natural",
  "commonNames": ["alternative", "names", "max 4"],
  "safetyRating": "generally-safe"
}

For naturalOrSynthetic use only: natural | synthetic | semi-synthetic | unknown
For safetyRating use only: generally-safe | use-in-moderation | controversial | restricted`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'AI feature is not configured. Add GEMINI_API_KEY to .env.local' },
      { status: 503 }
    );
  }

  let ingredientName: string;
  try {
    const body = await req.json();
    ingredientName = typeof body.ingredientName === 'string' ? body.ingredientName.trim() : '';
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request body.' }, { status: 400 });
  }

  if (!ingredientName || ingredientName.length < 2) {
    return NextResponse.json({ success: false, error: 'Ingredient name is required.' }, { status: 400 });
  }

  try {
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(ingredientName) }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1024,
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
    const rawText: string = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!rawText) {
      return NextResponse.json({ success: false, error: 'Empty response from Gemini.' }, { status: 502 });
    }

    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as IngredientExplanation;

    if (!parsed.ingredient || !parsed.explanation || !parsed.safetyRating) {
      throw new Error('Incomplete response from Gemini.');
    }

    return NextResponse.json({ success: true, data: parsed });

  } catch (error) {
    console.error('Explain ingredient error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to process explanation.' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}