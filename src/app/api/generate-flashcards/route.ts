import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CHARS = 360000;
const CHUNK_SIZE = 45000;
const CONCURRENCY = 3;
const MAX_RETRIES = 4;
const BASE_DELAY = 1500;
const REQUEST_TIMEOUT_MS = 120000;

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

let lastRequestTime = 0;
const MIN_INTERVAL = 3000;
let rateLimitChain: Promise<void> = Promise.resolve();

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForRateLimit(): Promise<void> {
  const run = rateLimitChain.then(async () => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_INTERVAL) {
      await sleep(MIN_INTERVAL - timeSinceLastRequest);
    }
    lastRequestTime = Date.now();
  });
  rateLimitChain = run.catch(() => {});
  return run;
}

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

function splitIntoChunks(text: string, size: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = Math.min(start + size, text.length);

    if (end < text.length) {
      const lastBreak = text.lastIndexOf("\n\n", end);
      if (lastBreak > start + size * 0.3) {
        end = lastBreak;
      } else {
        const lastPeriod = text.lastIndexOf(". ", end);
        const lastQuestion = text.lastIndexOf("? ", end);
        const lastExclamation = text.lastIndexOf("! ", end);
        const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
        if (lastSentenceEnd > start + size * 0.3) {
          end = lastSentenceEnd + 2;
        }
      }
    }

    const chunk = text.slice(start, end).trim();
    if (chunk.length > 0) {
      chunks.push(chunk);
    }
    start = end;
  }

  return chunks;
}

function cleanText(text: string): string {
  return text
    .replace(/===== Page \d+ =====/g, '')
    .replace(/image\[\[\d+,\s*\d+,\s*\d+,\s*\d+\]\]/g, '')
    .replace(/<\|box_start\|>\d+<\|box_end\|>/g, '')
    .replace(/<\|ref_start\|>.*?<\|ref_end\|>/g, '')
    .replace(/<\|md_start\|>.*?<\|md_end\|>/g, '')
    .replace(/<center>.*?<\/center>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildPrompt(chunkText: string, chunkIndex: number, totalChunks: number): string {
  const contextNote = totalChunks > 1
    ? `This is section ${chunkIndex + 1} of ${totalChunks}. Be exhaustive for THIS section; other sections are handled separately.`
    : "";

  return `Generate a comprehensive set of flashcards from this study material.

${contextNote}

Rules:
- Generate as many flashcards as the content warrants. Aim for 40-60 per section, but include ALL important information.
- Cover: definitions, key facts, names, dates, formulas, processes, causes/effects, comparisons, and core concepts.
- Each flashcard: one question (front) and one answer (back).
- Make questions specific and answers self-contained.
- Do NOT include trivial or duplicate cards.
- Return ONLY a valid JSON array: [{"front": "question?", "back": "answer"}]

Content:
${chunkText}`;
}

function buildCoveragePrompt(text: string, existingCards: any[]): string {
  const existing = existingCards
    .map((c, i) => `${i + 1}. Q: ${c.front} | A: ${c.back}`)
    .join("\n");

  return `You are reviewing a flashcard set for completeness.

Below is the ORIGINAL study material followed by the EXISTING flashcards.

Your job: identify important topics, facts, or concepts from the material that are MISSING or under-covered in the existing cards. Generate additional flashcards to fill those gaps. Do NOT repeat what is already covered.

Rules:
- Generate only NEW, non-duplicate flashcards (aim for 20-40 if many gaps exist, fewer if coverage is already strong).
- Each: {"front": "question?", "back": "answer"}.
- Return ONLY a valid JSON array: [{"front": "...", "back": "..."}]

EXISTING CARDS:
${existing}

ORIGINAL MATERIAL:
${text}`;
}

async function generateForChunk(
  apiKey: string,
  chunkText: string,
  chunkIndex: number,
  totalChunks: number,
  attempt: number = 0
): Promise<{ cards: any[]; error?: string }> {
  await waitForRateLimit();

  const prompt = buildPrompt(chunkText, chunkIndex, totalChunks);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    clearTimeout(timeout);

    const body = await safeJson(res);

    if (res.status === 429) {
      const retryAfter = parseRetryAfter(body?.error?.message || "");
      const waitTime = Math.max(retryAfter, 30 + attempt * 15);
      console.log(`Rate limited on chunk ${chunkIndex + 1}. Waiting ${waitTime}s...`);

      if (attempt < MAX_RETRIES) {
        await sleep(waitTime * 1000);
        lastRequestTime = 0;
        return generateForChunk(apiKey, chunkText, chunkIndex, totalChunks, attempt + 1);
      }
      return { cards: [], error: `Rate limited after ${MAX_RETRIES} retries` };
    }

    if (!res.ok) {
      const errorMsg = body?.error?.message || `API error (${res.status})`;
      console.error(`Chunk ${chunkIndex + 1} error:`, errorMsg);

      if (attempt < MAX_RETRIES) {
        const waitTime = BASE_DELAY * Math.pow(2, attempt);
        await sleep(waitTime);
        return generateForChunk(apiKey, chunkText, chunkIndex, totalChunks, attempt + 1);
      }
      return { cards: [], error: errorMsg };
    }

    const candidate = body?.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text ?? "";

    let cards: any[] = [];

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cards = parsed;
        }
      } catch (e) {
        console.log(`JSON parse failed for chunk ${chunkIndex + 1}, trying alternative...`);
      }
    }

    if (cards.length === 0) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0) {
          cards = parsed;
        }
      } catch (e) {
        // Ignore
      }
    }

    if (cards.length === 0) {
      const objPattern = /"front"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"back"\s*:\s*"((?:\\.|[^"\\])*)"/g;
      let m: RegExpExecArray | null;
      const tmp: any[] = [];
      while ((m = objPattern.exec(content)) !== null) {
        try {
          const front = JSON.parse(`"${m[1]}"`);
          const back = JSON.parse(`"${m[2]}"`);
          if (front && back) tmp.push({ front, back });
        } catch { /* skip */ }
      }
      if (tmp.length > 0) cards = tmp;
    }

    if (cards.length === 0) {
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY * Math.pow(2, attempt));
        return generateForChunk(apiKey, chunkText, chunkIndex, totalChunks, attempt + 1);
      }
      return { cards: [], error: `No valid flashcards generated from chunk ${chunkIndex + 1}` };
    }

    console.log(`Chunk ${chunkIndex + 1} generated ${cards.length} cards`);
    return { cards };

  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.error(`Chunk ${chunkIndex + 1} timed out`);
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY * Math.pow(2, attempt));
        return generateForChunk(apiKey, chunkText, chunkIndex, totalChunks, attempt + 1);
      }
      return { cards: [], error: `Chunk ${chunkIndex + 1} timed out` };
    }

    console.error(`Chunk ${chunkIndex + 1} error:`, error?.message);

    if (attempt < MAX_RETRIES) {
      const waitTime = BASE_DELAY * Math.pow(2, attempt);
      await sleep(waitTime);
      return generateForChunk(apiKey, chunkText, chunkIndex, totalChunks, attempt + 1);
    }
    return { cards: [], error: error?.message || `Chunk ${chunkIndex + 1} failed` };
  }
}

async function runCoveragePass(
  apiKey: string,
  text: string,
  existingCards: any[]
): Promise<{ cards: any[]; error?: string }> {
  await waitForRateLimit();

  const prompt = buildCoveragePrompt(text, existingCards);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 8192,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    clearTimeout(timeout);
    const body = await safeJson(res);

    if (res.status === 429) {
      const retryAfter = parseRetryAfter(body?.error?.message || "");
      const waitTime = Math.max(retryAfter, 30);
      console.log(`Coverage pass rate limited. Waiting ${waitTime}s...`);
      await sleep(waitTime * 1000);
      lastRequestTime = 0;
      return runCoveragePass(apiKey, text, existingCards);
    }

    if (!res.ok) {
      return { cards: [] };
    }

    const candidate = body?.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text ?? "";
    let cards: any[] = [];

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) cards = parsed;
      } catch (e) { /* ignore */ }
    }
    if (cards.length === 0) {
      try {
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) cards = parsed;
      } catch (e) { /* ignore */ }
    }

    return { cards };
  } catch (error: any) {
    console.error("Coverage pass error:", error?.message);
    return { cards: [] };
  }
}

function dedupeCards(cards: any[]): any[] {
  const seen = new Set<string>();
  const result: any[] = [];
  for (const card of cards) {
    const front = String(card.front || "").trim().toLowerCase();
    const back = String(card.back || "").trim().toLowerCase();
    const key = `${front}|${back}`;
    if (front && !seen.has(key)) {
      seen.add(key);
      result.push(card);
    }
  }
  return result;
}

async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;

  async function next() {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  }

  const runners = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    runners.push(next());
  }
  await Promise.all(runners);
  return results;
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

    const cleanedText = cleanText(text);
    const truncatedText = cleanedText.slice(0, MAX_CHARS);

    const key = `fc-${simpleHash(truncatedText)}-v10`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      console.log(`Cache hit for ${key}`);
      return NextResponse.json({ cards: cached.data });
    }

    const chunks = splitIntoChunks(truncatedText, CHUNK_SIZE);
    console.log(`Processing ${chunks.length} chunks`);

    const results = await runPool(
      chunks,
      CONCURRENCY,
      (chunk, i) => generateForChunk(apiKey, chunk, i, chunks.length)
    );

    let allCards: any[] = [];
    const errors: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const { cards, error } = results[i];
      if (error) {
        errors.push(error);
        console.error(`Chunk ${i + 1} error:`, error);
      }
      if (cards.length > 0) {
        allCards = allCards.concat(cards);
      }
    }

    if (allCards.length > 0) {
      const coverage = await runCoveragePass(apiKey, truncatedText, allCards);
      if (coverage.cards.length > 0) {
        console.log(`Coverage pass added ${coverage.cards.length} cards`);
        allCards = allCards.concat(coverage.cards);
      }
    }

    allCards = dedupeCards(allCards);
    console.log(`Total unique cards: ${allCards.length}`);

    if (allCards.length === 0) {
      return NextResponse.json(
        { error: errors[0] || "Failed to generate any flashcards" },
        { status: 500 }
      );
    }

    cache.set(key, { data: allCards, ts: Date.now() });

    return NextResponse.json({
      cards: allCards,
      totalCards: allCards.length,
      chunksProcessed: chunks.length,
      ...(errors.length > 0 ? { warnings: errors } : {}),
    });

  } catch (err: any) {
    console.error("Unhandled error:", err?.message || err);
    return NextResponse.json(
      { error: err?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
