import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_CHARS = 360000;
const CHUNK_SIZE = 20000;
const CONCURRENCY = 2;
const MAX_RETRIES = 3;
const BASE_DELAY = 1500;
const REQUEST_TIMEOUT_MS = 30000;

const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

let lastRequestTime = 0;
const MIN_INTERVAL = 2000;
let rateLimitChain: Promise<void> = Promise.resolve();

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForRateLimit(): Promise<void> {
  const run = rateLimitChain.then(async () => {
    const wait = Date.now() - lastRequestTime;
    if (wait < MIN_INTERVAL) await sleep(MIN_INTERVAL - wait);
    lastRequestTime = Date.now();
  });
  rateLimitChain = run.catch(() => {});
  return run;
}

function parseRetryAfter(m: string): number {
  const x = m.match(/retry in (\d+(?:\.\d+)?)/i);
  return x ? Math.ceil(parseFloat(x[1])) : 35;
}

function simpleHash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return h.toString(36);
}

async function safeJson(res: Response): Promise<any> {
  try {
    return JSON.parse(await res.text());
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
      const br = text.lastIndexOf("\n\n", end);
      if (br > start + size * 0.3) end = br;
      else {
        const a = Math.max(
          text.lastIndexOf(". ", end),
          text.lastIndexOf("? ", end),
          text.lastIndexOf("! ", end)
        );
        if (a > start + size * 0.3) end = a + 2;
      }
    }
    const c = text.slice(start, end).trim();
    if (c) chunks.push(c);
    start = end;
  }
  return chunks;
}

function cleanText(t: string): string {
  return t
    .replace(/===== Page \d+ =====/g, "")
    .replace(/image\[\[\d+,\s*\d+,\s*\d+,\s*\d+\]\]/g, "")
    .replace(/<\|box_start\|>\d+<\|box_end\|>/g, "")
    .replace(/<\|ref_start\|>.*?<\|ref_end\|>/g, "")
    .replace(/<\|md_start\|>.*?<\|md_end\|>/g, "")
    .replace(/<center>.*?<\/center>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// ============================================================
// SMART FORMAT DETECTION
// ============================================================
function detectFormat(text: string): string {
  if (text.includes("●") || text.includes("•")) return "BULLET_POINTS";
  if (text.includes("ANS:") || text.includes("Q:") || text.includes("Answer:"))
    return "QA_PAIRS";
 const matches = text.match(/[.!?]\s+[A-Z]/g);
if (matches && matches.length > 10) return "PARAGRAPHS";
  return "MIXED";
}

// ============================================================
// SMART PROMPT BUILDER (Supports all formats)
// ============================================================
function buildPrompt(chunkText: string, idx: number, total: number): string {
  const format = detectFormat(chunkText);
  const ctx = total > 1 ? `Section ${idx + 1}/${total}.` : "";

  // ============================================
  // FORMAT 1: BULLET POINTS (●)
  // ============================================
  if (format === "BULLET_POINTS") {
    const bullets = (chunkText.match(/●/g) || []).length;
    const hint = bullets > 0 ? ` This section has ~${bullets} bullet points.` : "";

    return `Generate flashcards from this study material. ${ctx}${hint}

IMPORTANT: This text uses BULLET POINTS (●). Convert each bullet into a Q&A flashcard.

RULES:
- EVERY bullet point (●) becomes at least one flashcard
- For each bullet: extract the key fact and turn it into a question
- If a bullet has multiple facts, create multiple flashcards
- For Q/ANS pairs: Q becomes "front", ANS becomes "back"
- For definitions: "What is [term]?" -> definition
- For historical events: "What happened in [year/event]?" -> event details
- For people: "Who is [name]?" -> their significance
- For dates: "When did [event] happen?" -> the date
- Return ONLY JSON array: [{"front":"...","back":"..."}]

CONTENT:
${chunkText}`;
  }

  // ============================================
  // FORMAT 2: Q&A PAIRS (ANS: or Q:)
  // ============================================
  if (format === "QA_PAIRS") {
    return `Generate flashcards from this study material. ${ctx}

IMPORTANT: This text contains Q&A pairs. Extract each Q&A as a flashcard.

RULES:
- For each "Q: ..." and "ANS: ..." pair: Q becomes "front", ANS becomes "back"
- For each "Question: ..." and "Answer: ..." pair: Question becomes "front", Answer becomes "back"
- For each "___? ... Answer: ___" pattern: The question becomes "front", the answer becomes "back"
- Keep the exact wording of questions and answers
- Return ONLY JSON array: [{"front":"...","back":"..."}]

CONTENT:
${chunkText}`;
  }

  // ============================================
  // FORMAT 3: PLAIN PARAGRAPHS
  // ============================================
  if (format === "PARAGRAPHS") {
    return `Generate STUDY FLASHCARDS from this text. ${ctx}

IMPORTANT: This text is in PARAGRAPH format. Extract key facts as Q&A pairs.

EXTRACTION RULES:
1. For each person: "Who is [NAME]?" -> "Their role/achievement/significance"
2. For each event: "What happened during [EVENT]?" -> "Details of the event"
3. For each date: "When did [EVENT] happen?" -> "The date"
4. For each definition: "What is [TERM]?" -> "The definition"
5. For each work (book/play/zarzuela): "What is [TITLE]?" -> "Brief description/author/year"
6. For relationships: "What is the connection between [PERSON A] and [PERSON B]?" -> "Explanation"
7. For cause/effect: "Why did [EVENT] happen?" -> "The cause" and "What was the result?" -> "The effect"

FORMAT RULES:
- Generate 1 flashcard for every 2-3 sentences of important information
- Don't skip important details (dates, names, relationships)
- Focus on FACTS, not opinions or flowery language
- For each zarzuela: extract Title, Author, Year, Venue, Plot summary, Significance
- For each person: extract Full name, Role, Dates (birth/death), Notable works
- Return ONLY JSON array: [{"front":"...","back":"..."}]

TEXT:
${chunkText}`;
  }

  // ============================================
  // FALLBACK: Generic format
  // ============================================
  return `Generate flashcards from this text. ${ctx}

Rules:
- Extract key facts as Q&A pairs
- Return ONLY JSON array: [{"front":"...","back":"..."}]

TEXT:
${chunkText}`;
}

// ============================================================
// ENHANCED EXTRACTION (Supports multiple formats)
// ============================================================
function tryParseJson(s: string): any[] | null {
  try {
    const p = JSON.parse(s);
    if (Array.isArray(p) && p.length) return p;
    if (p && Array.isArray((p as any).cards) && (p as any).cards.length)
      return (p as any).cards;
    if (p && Array.isArray((p as any).flashcards) && (p as any).flashcards.length)
      return (p as any).flashcards;
    if (p && Array.isArray((p as any).questions) && (p as any).questions.length)
      return (p as any).questions;
  } catch {}
  return null;
}

async function extractCards(content: string): Promise<any[]> {
  // Try standard JSON parsing first
  const d = tryParseJson(content);
  if (d) return d.filter((c: any) => c?.front && c?.back);

  // Try to extract from various formats
  const patterns = [
    /"front"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"back"\s*:\s*"((?:\\.|[^"\\])*)"/g,
    /Q:\s*(.*?)\s*ANS:\s*(.*?)(?=\n|$)/gi,
    /Question:\s*(.*?)\s*Answer:\s*(.*?)(?=\n|$)/gi,
    /(.*?)\?\s*(.*?)(?=\n|$)/g,
  ];

  const out: any[] = [];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      try {
        const front = match[1]?.trim() || "";
        const back = match[2]?.trim() || "";
        if (front && back && front.length > 5 && back.length > 2) {
          out.push({ front, back });
        }
      } catch {}
    }
  }

  // If we found cards, return them (deduplicate)
  if (out.length > 0) {
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const card of out) {
      const key = `${card.front}|${card.back}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(card);
      }
    }
    return unique;
  }

  return [];
}

// ============================================================
// DEEPSEEK API CALL
// ============================================================
async function callDeepSeek(
  apiKey: string,
  prompt: string,
  attempt: number
): Promise<{ content: string; retry: boolean; error?: string }> {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: ac.signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 8192,
      }),
    });

    clearTimeout(t);
    const body = await safeJson(res);

    if (res.status === 429) {
      const wa = parseRetryAfter(body?.error?.message || "");
      if (attempt < MAX_RETRIES) {
        await sleep(wa * 1000);
        lastRequestTime = 0;
        return { content: "", retry: true };
      }
      return {
        content: "",
        retry: false,
        error: `Rate limited: retry in ${wa}s`,
      };
    }

    if (!res.ok) {
      const msg = body?.error?.message || `API error ${res.status}`;
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_DELAY * Math.pow(2, attempt));
        return { content: "", retry: true };
      }
      return { content: "", retry: false, error: msg };
    }

    const content = body?.choices?.[0]?.message?.content ?? "";
    return { content, retry: false };
  } catch (e: any) {
    if (e?.name === "AbortError") {
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
    return { content: "", retry: false, error: e?.message || "Request failed" };
  }
}

async function generateForChunk(
  apiKey: string,
  chunk: string,
  idx: number,
  total: number
): Promise<{ cards: any[]; error?: string }> {
  const format = detectFormat(chunk);
  console.log(`Chunk ${idx + 1}/${total}: Detected format: ${format}`);

  const prompt = buildPrompt(chunk, idx, total);

  for (let attempt = 0; ; attempt++) {
    const { content, retry, error } = await callDeepSeek(
      apiKey,
      prompt,
      attempt
    );
    if (retry) continue;
    if (error) return { cards: [], error };
    const cards = await extractCards(content);
    if (!cards.length) {
      if (attempt < MAX_RETRIES) continue;
      return { cards: [], error: `No cards from chunk ${idx + 1}` };
    }
    return { cards };
  }
}

function dedupe(cards: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const c of cards) {
    const k = `${String(c.front || "")
      .trim()
      .toLowerCase()}|${String(c.back || "").trim().toLowerCase()}`;
    if (c.front && !seen.has(k)) {
      seen.add(k);
      out.push(c);
    }
  }
  return out;
}

async function runPool<T, R>(
  items: T[],
  conc: number,
  fn: (v: T, i: number) => Promise<R>
): Promise<R[]> {
  const res: R[] = new Array(items.length);
  let cur = 0;
  async function next() {
    while (cur < items.length) {
      const i = cur++;
      res[i] = await fn(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(conc, items.length) }, () =>
    next()
  );
  await Promise.all(workers);
  return res;
}

// ============================================================
// MAIN POST HANDLER
// ============================================================
export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey)
      return NextResponse.json(
        { error: "DEEPSEEK_API_KEY not configured" },
        { status: 500 }
      );

    let text: string;
    try {
      text = (await req.json()).text;
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    if (!text?.trim())
      return NextResponse.json({ error: "No text provided" }, { status: 400 });

    const cleaned = cleanText(text).slice(0, MAX_CHARS);
    const key = `fc-${simpleHash(cleaned)}-v13`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL)
      return NextResponse.json({ cards: cached.data });

    const chunks = splitIntoChunks(cleaned, CHUNK_SIZE);
    const results = await runPool(chunks, CONCURRENCY, (c, i) =>
      generateForChunk(apiKey, c, i, chunks.length)
    );

    let all: any[] = [];
    const errors: string[] = [];
    for (const r of results) {
      if (r.error) errors.push(r.error);
      if (r.cards.length) all = all.concat(r.cards);
    }

    all = dedupe(all);
    if (!all.length) {
      const rate = errors.some((e) => e.toLowerCase().includes("rate limited"));
      const m = errors[0]?.match(/retry in (\d+)/i);
      return NextResponse.json(
        {
          error: errors[0] || "Failed to generate",
          retryAfter:
            rate && m ? parseInt(m[1], 10) : rate ? 35 : undefined,
        },
        { status: rate ? 429 : 500 }
      );
    }

    cache.set(key, { data: all, ts: Date.now() });
    return NextResponse.json({
      cards: all,
      totalCards: all.length,
      chunksProcessed: chunks.length,
      formatDetected: detectFormat(cleaned),
      ...(errors.length ? { warnings: errors } : {}),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}