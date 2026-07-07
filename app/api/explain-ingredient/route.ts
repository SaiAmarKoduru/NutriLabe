/**
 * POST /api/explain-ingredient
 *
 * Server-side proxy for Google Gemini ingredient explanation.
 * API key never leaves the server — client receives only the parsed result.
 *
 * Request body: { ingredientName: string }
 * Response:     { success: true, data: IngredientExplanation }
 *            or { success: false, error: string }
 */

import { NextRequest, NextResponse } from 'next/server';

// ─────────────────────────────────────────────
// Types (mirrored from ai-explainer.ts)
// ─────────────────────────────────────────────

interface IngredientExplanation {
  ingredient: string;
  explanation: string;
  healthConsiderations: string;
  naturalOrSynthetic: 'natural' | 'synthetic' | 'semi-synthetic' | 'unknown';
  commonNames: string[];
  safetyRating: 'generally-safe' | 'use-in-moderation' | 'controversial' | 'restricted';
}

// ─────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────

const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const SYSTEM_PROMPT = `You are a food science expert and nutritionist.
Explain food ingredients clearly for everyday consumers.
Always respond with ONLY valid JSON, no markdown, no preamble, no trailing text.
Be accurate, evidence-based, and balanced — neither alarmist nor dismissive.`;

function buildPrompt(ingredientName: string): string {
  return `Explain this food ingredient for a consumer label app: "${ingredientName}"

Respond with ONLY this JSON structure:
{
  "ingredient": "clean display name",
  "explanation": "2-3 sentence plain language explanation of what it is and why it is used in food",
  "healthConsiderations": "1-2 sentences on health impact, safety, and any relevant research",
  "naturalOrSynthetic": "natural" | "synthetic" | "semi-synthetic" | "unknown",
  "commonNames": ["array", "of", "alternative", "names", "max 4"],
  "safetyRating": "generally-safe" | "use-in-moderation" | "controversial" | "restricted"
}`;
}

// ─────────────────────────────────────────────
// Route Handler
// ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // ── Validate API key presence ──────────────────────────────────────
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: 'AI feature is not configured. GEMINI_API_KEY is missing.' },
      { status: 503 }
    );
  }

  // ── Parse and validate request body ───────────────────────────────
  let ingredientName: string;
  try {
    const body = await req.json();
    ingredientName = typeof body.ingredientName === 'string'
      ? body.ingredientName.trim()
      : '';
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request body.' },
      { status: 400 }
    );
  }

  if (!ingredientName || ingredientName.length < 2) {
    return NextResponse.json(
      { success: false, error: 'Ingredient name is required.' },
      { status: 400 }
    );
  }

  if (ingredientName.length > 300) {
    return NextResponse.json(
      { success: false, error: 'Ingredient name is too long.' },
      { status: 400 }
    );
  }

  // ── Call Gemini API ────────────────────────────────────────────────
  try {
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT + '\n\n' + buildPrompt(ingredientName) },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,       // Low temperature for factual, consistent output
          maxOutputTokens: 1024,
          responseMimeType: 'application/json', // Gemini 1.5 supports JSON mode
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

    // Extract text from Gemini response structure
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!rawText) {
      return NextResponse.json(
        { success: false, error: 'Empty response from Gemini.' },
        { status: 502 }
      );
    }

    // Strip accidental markdown fences if present
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned) as IngredientExplanation;

    // Basic shape validation
    if (!parsed.ingredient || !parsed.explanation || !parsed.safetyRating) {
      throw new Error('Incomplete response structure from Gemini.');
    }

    return NextResponse.json({ success: true, data: parsed });

  } catch (error) {
    console.error('Explain ingredient error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error
          ? error.message
          : 'Failed to process ingredient explanation.',
      },
      { status: 500 }
    );
  }
}

// Only POST is supported
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed.' }, { status: 405 });
}