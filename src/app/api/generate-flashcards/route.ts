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
  const key = `fc-${simpleHash(truncatedText)}-v3`;
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

  for (let attempt = 0; attempt <= 3; attempt++) {
    if (attempt > 0) {
      const wait = attempt * 15000;
      await new Promise(r => setTimeout(r, wait));
    }

    let res: Response;
    try {
      res = await fetch(
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
    } catch (fetchErr: any) {
      console.error("[generate-flashcards] Fetch error:", fetchErr.message);
      return NextResponse.json({ error: `Network error: ${fetchErr.message}` }, { status: 500 });
    }

    if (res.status === 429 && attempt < 3) {
      let retryAfter = 30;
      try {
        const err = await res.json();
        retryAfter = parseRetryAfter(err.error?.message || "");
      } catch {}
      console.log(`[generate-flashcards] Rate limited, waiting ${retryAfter}s (attempt ${attempt + 1})`);
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      let errorMsg = `Gemini API error (${res.status})`;
      try {
        const err = await res.json();
        errorMsg = err.error?.message || errorMsg;
        const retryAfter = parseRetryAfter(errorMsg);
        return NextResponse.json({ error: errorMsg, retryAfter }, { status: 500 });
      } catch {
        return NextResponse.json({ error: errorMsg }, { status: 500 });
      }
    }

    let data: any;
    try {
      data = await res.json();
    } catch {
      console.error("[generate-flashcards] Failed to parse response");
      return NextResponse.json({ error: "Invalid response from Gemini" }, { status: 500 });
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!content) {
      console.error("[generate-flashcards] Empty response from Gemini:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: "Empty response from Gemini" }, { status: 500 });
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const cards = JSON.parse(jsonMatch[0]);
        if (Array.isArray(cards) && cards.length > 0) {
          cache.set(key, { data: cards, ts: Date.now() });
          console.log(`[generate-flashcards] Generated ${cards.length} cards`);
          return NextResponse.json({ cards });
        }
      } catch (parseErr: any) {
        console.error("[generate-flashcards] JSON parse error:", parseErr.message, "Raw:", jsonMatch[0].slice(0, 200));
      }
    } else {
      console.error("[generate-flashcards] No JSON array found in response:", content.slice(0, 300));
    }

    return NextResponse.json({ error: "Failed to parse flashcards from Gemini response" }, { status: 500 });
  }

  return NextResponse.json({ error: "Rate limited — try again later", retryAfter: 30 }, { status: 500 });
}
