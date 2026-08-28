import { NextRequest, NextResponse } from "next/server";

const MAX_CHARS = 360000;
const CHUNK_SIZE = 45000;
const CONCURRENCY = 3;
const MAX_RETRIES = 4;
const BASE_DELAY = 1500;
const REQUEST_TIMEOUT_MS = 120000;

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

type Job = {
  id: string;
  status: "processing" | "done" | "error";
  cards: any[];
  totalChunks: number;
  processedChunks: number;
  error?: string;
  text: string;
  createdAt: number;
};

const jobs = new Map<string, Job>();

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

async function extractCards(content: string): Promise<any[]> {
  let cards: any[] = [];

  const jsonMatch = content.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) cards = parsed;
    } catch (e) { /* ignore */ }
  }

  if (cards.length === 0) {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) cards = parsed;
    } catch (e) { /* ignore */ }
  }

  if (cards.length === 0) {
    const qaPairs = content.match(/"front"\s*:\s*"([^"]*?)"\s*,\s*"back"\s*:\s*"([^"]*?)"/g);
    if (qaPairs) {
      cards = qaPairs.map((pair: string) => {
        const frontMatch = pair.match(/"front"\s*:\s*"([^"]*?)"/);
        const backMatch = pair.match(/"back"\s*:\s*"([^"]*?)"/);
        return {
          front: frontMatch ? frontMatch[1] : '',
          back: backMatch ? backMatch[1] : ''
        };
      }).filter((card: { front: string; back: string }) => card.front && card.back);
    }
  }

  return cards.filter((c: any) => c && c.front && c.back);
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

async function runGeneration(apiKey: string, text: string, job: Job) {
  try {
    const chunks = splitIntoChunks(text, CHUNK_SIZE);
    job.totalChunks = chunks.length;
    console.log(`Job ${job.id}: processing ${chunks.length} chunks`);

    const results = await runPool(chunks, CONCURRENCY, async (chunk, i) => {
      const r = await generateForChunk(apiKey, chunk, i, chunks.length);
      job.processedChunks = (job.processedChunks || 0) + 1;
      if (r.cards.length > 0) job.cards = job.cards.concat(r.cards);
      return r;
    });

    if (job.cards.length > 0) {
      const coverage = await runCoveragePass(apiKey, text, job.cards);
      if (coverage.cards.length > 0) {
        console.log(`Job ${job.id}: coverage pass added ${coverage.cards.length} cards`);
        job.cards = job.cards.concat(coverage.cards);
      }
    }

    job.cards = dedupeCards(job.cards);
    job.status = "done";
    console.log(`Job ${job.id}: done, ${job.cards.length} unique cards`);

    cache.set(`fc-${simpleHash(text)}-v10`, { data: job.cards, ts: Date.now() });
  } catch (err: any) {
    console.error(`Job ${job.id} failed:`, err?.message || err);
    job.status = "error";
    job.error = err?.message || "Generation failed";
  }
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
  return NextResponse.json({
    status: job.status,
    cards: job.status === "done" ? job.cards : job.cards,
    totalCards: job.cards.length,
    totalChunks: job.totalChunks,
    processedChunks: job.processedChunks,
    error: job.error,
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
        id, status: "done", cards: cached.data,
        totalChunks: 0, processedChunks: 0, text: "", createdAt: Date.now(),
      };
      jobs.set(id, job);
      return NextResponse.json({ jobId: id });
    }

    const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const job: Job = {
      id, status: "processing", cards: [],
      totalChunks: 0, processedChunks: 0, text: truncatedText, createdAt: Date.now(),
    };
    jobs.set(id, job);

    runGeneration(apiKey, truncatedText, job).catch((e) => {
      job.status = "error";
      job.error = e?.message || "Generation failed";
    });

    return NextResponse.json({ jobId: id });
  } catch (err: any) {
    console.error("Unhandled error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
