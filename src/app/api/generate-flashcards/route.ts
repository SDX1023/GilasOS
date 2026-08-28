import { NextRequest, NextResponse } from "next/server";

const MAX_CHARS = 80000;
const CHUNK_SIZE = 12000; // chars per chunk sent to Gemini
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function parseRetryAfter(message: string): number {
  const match = message.match(/retry in (\d+(?:\.\d+)?)/i);
  return match ? Math.ceil(parseFloat(match[1])) : 30;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
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

// Split text into chunks on paragraph boundaries where possible,
// so we don't cut a sentence/fact in half between two chunks.
function splitIntoChunks(text: string, size: number): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(start + size, text.length);
    if (end < text.length) {
      const lastBreak = text.lastIndexOf("\n\n", end);
      if (lastBreak > start + size * 0.5) {
        end = lastBreak;
      }
    }
    chunks.push(text.slice(start, end).trim());
    start = end;
  }
  return chunks.filter((c) => c.length > 0);
}

function buildPrompt(chunkText: string, chunkIndex: number, totalChunks: number): string {
  const contextNote =
    totalChunks > 1
      ? `This is section ${chunkIndex + 1} of ${totalChunks} from a larger document. Generate flashcards ONLY from this section's content.`
      : "";

  return `You are an expert flashcard generator. Analyze the study material below and generate flashcards.

${contextNote}

RULES:
- Evaluate the content and generate the RIGHT number of flashcards for it — not too few, not too many.
- Short text (a few paragraphs) = 10-20 cards. A full page of dense content = 15-30 cards.
- Every important fact, name, date, definition, concept, comparison, and detail MUST become a card.
- Do NOT skip anything important. Do NOT pad with trivial filler.
- Each card tests real knowledge — not just copying text.

Return ONLY a valid JSON array. Each object has "front" (question) and "back" (answer). Optionally "hint".
No markdown. No code blocks. Just raw JSON array.

--- STUDY MATERIAL ---

${chunkText}`;
}

async function generateForChunk(
  apiKey: string,
  chunkText: string,
  chunkIndex: number,
  totalChunks: number,
  retries = 2
): Promise<{ cards: any[]; error?: string }> {
  const prompt = buildPrompt(chunkText, chunkIndex, totalChunks);

  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 65536,
            thinkingLevel: "low",
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const body = await safeJson(res);

    if (res.status === 429) {
      const retryAfter = parseRetryAfter(body?.error?.message || "");
      // bubble up immediately — no point retrying a rate limit inside a chunk loop
      throw Object.assign(new Error("rate_limited"), { retryAfter });
    }

    if (!res.ok) {
      const errorMsg = body?.error?.message || `Gemini API error (${res.status})`;
      if (attempt < retries) continue;
      return { cards: [], error: errorMsg };
    }

    const candidate = body?.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text ?? "";
    const finishReason = candidate?.finishReason;

    if (finishReason === "MAX_TOKENS") {
      console.warn(
        `[generate-flashcards] Chunk ${chunkIndex + 1}/${totalChunks} truncated by token limit (attempt ${attempt + 1})`
      );
      // Retry the same chunk — it's small enough now that this is rare,
      // but if it happens again, just accept whatever parses below.
      if (attempt < retries) continue;
    }

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const cards = JSON.parse(jsonMatch[0]);
        if (Array.isArray(cards) && cards.length > 0) {
          return { cards };
        }
      } catch {
        // fall through to retry/error below
      }
    }

    if (attempt < retries) continue;
    return { cards: [], error: `Could not parse flashcards from chunk ${chunkIndex + 1}` };
  }

  return { cards: [], error: `Chunk ${chunkIndex + 1} failed after retries` };
}

function dedupeCards(cards: any[]): any[] {
  const seen = new Set<string>();
  const result: any[] = [];
  for (const card of cards) {
    const key = String(card.front || "").trim().toLowerCase();
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(card);
    }
  }
  return result;
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
    const key = `fc-${simpleHash(truncatedText)}-v7`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json({ cards: cached.data });
    }

    const chunks = splitIntoChunks(truncatedText, CHUNK_SIZE);

    let allCards: any[] = [];
    const errors: string[] = [];

    try {
      // Sequential to stay friendly with free-tier rate limits.
      // Switch to Promise.all(chunks.map(...)) if your quota allows parallel calls.
      for (let i = 0; i < chunks.length; i++) {
        const { cards, error } = await generateForChunk(apiKey, chunks[i], i, chunks.length);
        if (error) errors.push(error);
        allCards = allCards.concat(cards);
      }
    } catch (err: any) {
      if (err?.message === "rate_limited") {
        return NextResponse.json(
          { error: `Rate limited. Wait ${err.retryAfter}s then try again.`, retryAfter: err.retryAfter },
          { status: 429 }
        );
      }
      throw err;
    }

    allCards = dedupeCards(allCards);

    if (allCards.length === 0) {
      return NextResponse.json(
        { error: errors[0] || "Failed to generate any flashcards" },
        { status: 500 }
      );
    }

    cache.set(key, { data: allCards, ts: Date.now() });
    return NextResponse.json({
      cards: allCards,
      ...(errors.length > 0 ? { warnings: errors } : {}),
    });
  } catch (err: any) {
    console.error("[generate-flashcards] Unhandled error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}