import { NextRequest, NextResponse } from "next/server";

const MAX_CHARS = 30000;
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function parseRetryAfter(message: string): number {
  const match = message.match(/retry in (\d+(?:\.\d+)?)/i);
  return match ? Math.ceil(parseFloat(match[1])) : 30;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const truncatedText = text.slice(0, MAX_CHARS);
  const key = `fc-${simpleHash(truncatedText)}-v2`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ cards: cached.data });
  }

  const prompt = `You are an expert flashcard generator. Your ONLY job is to create as many flashcards as possible from the study material below.

CRITICAL RULES:
- You MUST generate a MINIMUM of 100 flashcards. More is better. Aim for 150-200+.
- Every single question, fact, name, date, definition, concept, comparison, and detail in the material MUST become a flashcard.
- Do NOT summarize or skip anything. Every piece of information = one flashcard.
- If the material has 50 questions, you MUST generate 50+ flashcards (one per question at minimum, plus extras).
- If the material has names, dates, definitions, processes — each one gets its own card.
- Generate MORE cards, not fewer. Err on the side of too many.

Return ONLY a valid JSON array. Each object has "front" (question) and "back" (answer). Optionally "hint".
No markdown. No code blocks. Just raw JSON array.`;

  for (let attempt = 0; attempt <= 3; attempt++) {
    if (attempt > 0) {
      const wait = attempt * 15000;
      await new Promise(r => setTimeout(r, wait));
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\n\n--- STUDY MATERIAL ---\n\n${truncatedText}` }] }],
          generationConfig: { temperature: 0.7 },
        }),
      }
    );

    if (res.status === 429 && attempt < 3) {
      const err = await res.json().catch(() => ({}));
      const retryAfter = parseRetryAfter(err.error?.message || "");
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const retryAfter = parseRetryAfter(err.error?.message || "");
      return NextResponse.json({ error: err.error?.message || "API error", retryAfter }, { status: 500 });
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const cards = JSON.parse(jsonMatch[0]);
      if (Array.isArray(cards) && cards.length > 0) {
        cache.set(key, { data: cards, ts: Date.now() });
        return NextResponse.json({ cards });
      }
    }
    return NextResponse.json({ error: "No flashcards found in response" }, { status: 500 });
  }

  return NextResponse.json({ error: "Rate limited — try again later", retryAfter: 30 }, { status: 500 });
}
