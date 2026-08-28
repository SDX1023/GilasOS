import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const MAX_CHARS = 10000;
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function parseRetryAfter(message: string): number {
  const match = message.match(/retry in (\d+(?:\.\d+)?)/i);
  return match ? Math.ceil(parseFloat(match[1])) : 30;
}

function cacheKey(text: string, type: string) {
  return createHash("md5").update(`${type}:${text}`).digest("hex");
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
  const key = cacheKey(truncatedText, "flashcards");
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ cards: cached.data });
  }

  const prompt = `You are an expert study flashcard generator. Analyze the study material below and generate comprehensive flashcards.

IMPORTANT: You decide how many flashcards the material warrants. Generate as many as needed to thoroughly cover EVERY concept, definition, fact, name, date, process, and detail. Be extremely thorough.

Return ONLY a valid JSON array of objects with "front" (question) and "back" (answer) fields.
Optionally include "hint" for difficult concepts.

Rules:
- Cover everything important — definitions, key facts, processes, comparisons, names, dates
- Mix question types: "what is", "who invented", "when did", "compare X and Y", fill-in-the-blank
- Questions should test knowledge, not just repeat the text
- Answers should be concise but complete
- No markdown, no code blocks, just raw JSON array`;

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
      return NextResponse.json({ error: err.error?.message || `API error`, retryAfter }, { status: 500 });
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
