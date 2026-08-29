import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CHARS = 360000;
const CHUNK_SIZE = 20000;
const CHUNKS_PER_POLL = 3;
const MAX_RETRIES = 4;
const BASE_DELAY = 1500;
const REQUEST_TIMEOUT_MS = 90000;

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

type Job = {
  id: string;
  status: "processing" | "covering" | "done" | "error";
  cards: any[];
  chunks: string[];
  nextChunk: number;
  totalChunks: number;
  errors: string[];
  error?: string;
  text: string;
  busy: boolean;
};

const jobs = new Map<string, Job>();

let lastRequestTime = 0;
const MIN_INTERVAL = 1500;
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
  const bulletCount = (chunkText.match(/●/g) || []).length;
  const contextNote = totalChunks > 1
    ? `This is section ${chunkIndex + 1} of ${totalChunks}. Be exhaustive for THIS section; other sections are handled separately.`
    : "";
  const countHint = bulletCount > 0 ? ` This section contains ~${bulletCount} bullet items — you MUST produce at least ${bulletCount} flashcards (one per bullet) plus cards for any sub-facts inside bullets.` : "";

  return `Generate a comprehensive set of flashcards from this study material.

${contextNote}${countHint}

Rules:
- Generate a flashcard for EVERY distinct fact, question, or bullet point in the section. Do NOT skip bullets or paragraphs; if you skip, information is lost.
- Every bulleted (●), numbered item, heading, date, name, and event must become at least one flashcard. A 13-page document should yield 130-200+ cards (roughly 10-15 per page).
- Cover: definitions, key facts, names, dates, formulas, processes, causes/effects, comparisons, and core concepts. A bullet or paragraph with multiple facts should become multiple cards.
- For quotes, opening lines, and dialogues: include the FULL exact text in the answer and escape it properly for JSON.
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

async function callGemini(
  apiKey: string,
  prompt: string,
  attempt: number
): Promise<{ content: string; retry: boolean; error?: string }> {
  await waitForRateLimit();

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
      console.log(`Rate limited. Waiting ${waitTime}s...`);
      if (attempt < MAX_RETRIES) {
        await sleep(waitTime * 1000);
        lastRequestTime = 0;
        return { content: "", retry: true };
      }
      return { content: "", retry: false, error: `Rate limited after ${MAX_RETRIES} retries` };
    }

    if (!res.ok) {
      const errorMsg = body?.error?.message || `API error (${res.status})`;
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY * Math.pow(2, attempt));
        return { content: "", retry: true };
      }
      return { content: "", retry: false, error: errorMsg };
    }

    const candidate = body?.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text ?? "";
    return { content, retry: false };
  } catch (error: any) {
    if (error?.name === "AbortError") {
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY * Math.pow(2, attempt));
        return { content: "", retry: true };
      }
      return { content: "", retry: false, error: "Request timed out" };
    }
    if (attempt < MAX_RETRIES) {
      await sleep(BASE_DELAY * Math.pow(2, attempt));
      return { content: "", retry: true };
    }
    return { content: "", retry: false, error: error?.message || "Request failed" };
  }
}

function tryParseJson(s: string): any[] | null {
  try {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch { /* ignore */ }
  return null;
}

async function extractCards(content: string): Promise<any[]> {
  const direct = tryParseJson(content);
  if (direct) return direct.filter((c: any) => c && c.front && c.back);

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    const fromMatch = tryParseJson(jsonMatch[0]);
    if (fromMatch) return fromMatch.filter((c: any) => c && c.front && c.back);
    try {
      const repaired = jsonMatch[0]
        .replace(/,\s*]/g, "]")
        .replace(/,\s*}/g, "}");
      const fromRepaired = tryParseJson(repaired);
      if (fromRepaired) return fromRepaired.filter((c: any) => c && c.front && c.back);
    } catch { /* ignore */ }
  }

  const objPattern = /"front"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"back"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  const cards: any[] = [];
  let m: RegExpExecArray | null;
  while ((m = objPattern.exec(content)) !== null) {
    try {
      const front = JSON.parse(`"${m[1]}"`);
      const back = JSON.parse(`"${m[2]}"`);
      if (front && back) cards.push({ front, back });
    } catch { /* skip */ }
  }
  if (cards.length > 0) return cards;

  return [];
}

async function generateForChunk(
  apiKey: string,
  chunkText: string,
  chunkIndex: number,
  totalChunks: number
): Promise<{ cards: any[]; error?: string }> {
  const prompt = buildPrompt(chunkText, chunkIndex, totalChunks);

  for (let attempt = 0; ; attempt++) {
    const { content, retry, error } = await callGemini(apiKey, prompt, attempt);
    if (retry) continue;
    if (error) return { cards: [], error };
    const cards = await extractCards(content);
    if (cards.length === 0) {
      if (attempt < MAX_RETRIES) continue;
      return { cards: [], error: `No valid flashcards from chunk ${chunkIndex + 1}` };
    }
    console.log(`Chunk ${chunkIndex + 1} generated ${cards.length} cards`);
    return { cards };
  }
}

async function runCoveragePass(
  apiKey: string,
  text: string,
  existingCards: any[]
): Promise<{ cards: any[] }> {
  const prompt = buildCoveragePrompt(text, existingCards);
  for (let attempt = 0; ; attempt++) {
    const { content, retry } = await callGemini(apiKey, prompt, attempt);
    if (retry) continue;
    const cards = await extractCards(content);
    return { cards };
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

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("job");
  if (!jobId) {
    return NextResponse.json({ error: "Missing job id" }, { status: 400 });
  }
  const job = jobs.get(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  try {
    if (job.busy) {
      return NextResponse.json({
        status: job.status,
        cards: job.cards,
        totalCards: job.cards.length,
        totalChunks: job.totalChunks,
        processedChunks: Math.min(job.nextChunk, job.totalChunks),
        error: job.errors.length ? job.errors.join("; ") : undefined,
      });
    }
    job.busy = true;

    if (job.status === "processing" && apiKey) {
      const batch = job.chunks.slice(job.nextChunk, job.nextChunk + CHUNKS_PER_POLL);
      const results = await runPool(batch, batch.length, (chunk, i) =>
        generateForChunk(apiKey, chunk, job.nextChunk + i, job.totalChunks)
      );
      for (const r of results) {
        if (r.cards.length > 0) job.cards = job.cards.concat(r.cards);
        if (r.error) job.errors.push(r.error);
      }
      job.nextChunk += batch.length;

      if (job.nextChunk >= job.totalChunks) {
        job.status = "covering";
      }
    } else if (job.status === "covering" && apiKey) {
      const coverage = await runCoveragePass(apiKey, job.text, job.cards);
      if (coverage.cards.length > 0) {
        console.log(`Coverage pass added ${coverage.cards.length} cards`);
        job.cards = job.cards.concat(coverage.cards);
      }
      job.cards = dedupeCards(job.cards);
      job.status = "done";
      cache.set(`fc-${simpleHash(job.text)}-v10`, { data: job.cards, ts: Date.now() });
    }
  } catch (err: any) {
    console.error(`Job ${job.id} error:`, err?.message || err);
    job.status = "error";
    job.error = err?.message || "Generation failed";
  } finally {
    job.busy = false;
  }

  if (job.status === "error" && job.cards.length === 0) {
    return NextResponse.json({
      status: "error",
      error: job.error || job.errors.join("; ") || "Generation failed",
      cards: [],
    });
  }

  return NextResponse.json({
    status: job.status,
    cards: job.cards,
    totalCards: job.cards.length,
    totalChunks: job.totalChunks,
    processedChunks: Math.min(job.nextChunk, job.totalChunks),
    error: job.errors.length ? job.errors.join("; ") : undefined,
  });
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

    const cacheKey = `fc-${simpleHash(truncatedText)}-v10`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const job: Job = {
        id, status: "done", cards: cached.data, chunks: [], nextChunk: 0,
        totalChunks: 0, errors: [], text: "", busy: false,
      };
      jobs.set(id, job);
      return NextResponse.json({ jobId: id });
    }

    const chunks = splitIntoChunks(truncatedText, CHUNK_SIZE);
    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job: Job = {
      id, status: "processing", cards: [], chunks, nextChunk: 0,
      totalChunks: chunks.length, errors: [], text: truncatedText, busy: false,
    };
    jobs.set(id, job);

    console.log(`Created job ${id} with ${chunks.length} chunks`);
    return NextResponse.json({ jobId: id });
  } catch (err: any) {
    console.error("Unhandled error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
