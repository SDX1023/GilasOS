import { NextRequest, NextResponse } from "next/server";

const MAX_CHARS = 80000;
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function parseRetryAfter(message: string): number {
  const match = message.match(/retry in (\d+(?:\.\d+)?)/i);
  return match ? Math.ceil(parseFloat(match[1])) : 30;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(36);
}

async function safeJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    let text: string;
    try {
      const body = await req.json();
      text = body.text;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    if (!text?.trim()) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const truncatedText = text.slice(0, MAX_CHARS);
    const key = `fc-${simpleHash(truncatedText)}-v6`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json({ cards: cached.data });
    }

    const prompt = `You are an expert flashcard generator. Analyze the study material below and generate flashcards.

RULES:
- Evaluate the content and generate the RIGHT number of flashcards for it — not too few, not too many.
- Short text (a few paragraphs) = 10-20 cards. Medium text (a few pages) = 30-60 cards. Long text (10+ pages) = 80-200+ cards.
- Every important fact, name, date, definition, concept, comparison, and detail MUST become a card.
- Do NOT skip anything important. Do NOT pad with trivial filler.
- Each card tests real knowledge — not just copying text.

Return ONLY a valid JSON array. Each object has "front" (question) and "back" (answer). Optionally "hint".
No markdown. No code blocks. Just raw JSON array.`;

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

    const body = await safeJson(res);

    if (res.status === 429) {
      const retryAfter = parseRetryAfter(body?.error?.message || "");
      return NextResponse.json({ error: `Rate limited. Wait ${retryAfter}s then try again.`, retryAfter }, { status: 429 });
    }

    if (!res.ok) {
      const errorMsg = body?.error?.message || `Gemini API error (${res.status})`;
      const retryAfter = parseRetryAfter(errorMsg);
      return NextResponse.json({ error: errorMsg, retryAfter }, { status: 500 });
    }

    const content = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const cards = JSON.parse(jsonMatch[0]);
      if (Array.isArray(cards) && cards.length > 0) {
        cache.set(key, { data: cards, ts: Date.now() });
        return NextResponse.json({ cards });
      }
    }
    return NextResponse.json({ error: "Failed to parse flashcards from Gemini response" }, { status: 500 });
  } catch (err: any) {
    console.error("[generate-flashcards] Unhandled error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
