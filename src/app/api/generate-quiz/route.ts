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
// FORMAT DETECTION
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
// QUIZ PROMPT BUILDER (Supports all formats)
// ============================================================
function buildQuizPrompt(chunkText: string, idx: number, total: number): string {
  const format = detectFormat(chunkText);
  const ctx = total > 1 ? `Section ${idx + 1}/${total}.` : "";

  // ============================================
  // FORMAT 1: BULLET POINTS
  // ============================================
  if (format === "BULLET_POINTS") {
    const bullets = (chunkText.match(/●/g) || []).length;
    const hint =
      bullets > 0
        ? ` This section has ~${bullets} bullet points.`
        : "";

    return `Generate a multiple-choice QUIZ from this study material. ${ctx}${hint}

IMPORTANT: This text uses BULLET POINTS (●). Create quiz questions from the key facts.

RULES:
- Create 1 quiz question for every 2-3 bullet points
- Each question must have 4 options (A, B, C, D)
- Include the correct answer
- Questions should cover definitions, dates, people, and events
- Return ONLY JSON array: [{"question":"...", "options":["A. ...", "B. ...", "C. ...", "D. ..."], "correct":"A"}]

CONTENT:
${chunkText}`;
  }

  // ============================================
  // FORMAT 2: Q&A PAIRS
  // ============================================
  if (format === "QA_PAIRS") {
    return `Generate a multiple-choice QUIZ from this study material. ${ctx}

IMPORTANT: This text contains Q&A pairs. Convert them into quiz questions.

RULES:
- For each Q&A pair, create a quiz question using the Q as the stem
- The correct answer should be based on the provided answer
- Add 3 wrong options that are plausible but incorrect
- Return ONLY JSON array: [{"question":"...", "options":["A. ...", "B. ...", "C. ...", "D. ..."], "correct":"A"}]

CONTENT:
${chunkText}`;
  }

  // ============================================
  // FORMAT 3: PLAIN PARAGRAPHS
  // ============================================
  if (format === "PARAGRAPHS") {
    return `Generate a multiple-choice QUIZ from this text. ${ctx}

IMPORTANT: This text is in PARAGRAPH format. Extract key facts as quiz questions.

EXTRACTION RULES:
1. For each person: "Who is [NAME]?" with 4 options
2. For each event: "What happened during [EVENT]?" with 4 options
3. For each date: "When did [EVENT] happen?" with 4 options
4. For each definition: "What is [TERM]?" with 4 options
5. For each work: "What is [TITLE]?" with 4 options

FORMAT RULES:
- Create 1 quiz question for every 3-4 sentences of important information
- Each question must have 4 options (A, B, C, D)
- Include the correct answer
- Return ONLY JSON array: [{"question":"...", "options":["A. ...", "B. ...", "C. ...", "D. ..."], "correct":"A"}]

TEXT:
${chunkText}`;
  }

  // ============================================
  // FALLBACK
  // ============================================
  return `Generate a multiple-choice QUIZ from this text. ${ctx}

Rules:
- Create 5 quiz questions with 4 options each
- Include correct answers
- Return ONLY JSON array: [{"question":"...", "options":["A. ...", "B. ...", "C. ...", "D. ..."], "correct":"A"}]

TEXT:
${chunkText}`;
}

// ============================================================
// ENHANCED EXTRACTION
// ============================================================
function tryParseJson(s: string): any[] | null {
  try {
    const p = JSON.parse(s);
    if (Array.isArray(p) && p.length) return p;
    if (p && Array.isArray((p as any).questions) && (p as any).questions.length)
      return (p as any).questions;
    if (p && Array.isArray((p as any).quiz) && (p as any).quiz.length)
      return (p as any).quiz;
  } catch {}
  return null;
}

async function extractQuiz(content: string): Promise<any[]> {
  const d = tryParseJson(content);
  if (d) return d.filter((q: any) => q?.question && q?.options && q?.correct);

  const m = content.match(/\[[\s\S]*\]/);
  if (m) {
    const p = tryParseJson(m[0]);
    if (p) return p.filter((q: any) => q?.question && q?.options && q?.correct);
  }

  // Try to extract from Q&A pattern
  const patterns = [
    /"question"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"options"\s*:\s*\[((?:\\.|[^\]\\])*)\]\s*,\s*"correct"\s*:\s*"([^"]*)"/g,
  ];

  const out: any[] = [];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(content)) !== null) {
      try {
        const question = match[1]?.trim() || "";
        const optionsStr = match[2] || "";
        const correct = match[3]?.trim() || "";
        const options = optionsStr
          .split(",")
          .map((o: string) => o.trim().replace(/^"|"$/g, ""));
        if (question && options.length === 4 && correct) {
          out.push({ question, options, correct });
        }
      } catch {}
    }
  }

  return out;
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

async function generateQuizChunk(
  apiKey: string,
  chunk: string,
  idx: number,
  total: number
): Promise<{ questions: any[]; error?: string }> {
  const format = detectFormat(chunk);
  console.log(`Chunk ${idx + 1}/${total}: Detected format: ${format}`);

  const prompt = buildQuizPrompt(chunk, idx, total);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { content, retry, error } = await callDeepSeek(
      apiKey,
      prompt,
      attempt
    );
    if (retry) continue;
    if (error) return { questions: [], error };
    const questions = await extractQuiz(content);
    if (questions.length) return { questions };
  }
  return { questions: [], error: "Failed to generate quiz" };
}

function dedupeQuestions(questions: any[]): any[] {
  const seen = new Set<string>();
  const out: any[] = [];
  for (const q of questions) {
    const key = String(q.question || "")
      .trim()
      .toLowerCase();
    if (q.question && !seen.has(key)) {
      seen.add(key);
      out.push(q);
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
    const key = `quiz-${simpleHash(cleaned)}-v13`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL)
      return NextResponse.json({ questions: cached.data });

    const chunks = splitIntoChunks(cleaned, 30000);
    const results = await runPool(chunks, CONCURRENCY, (c, i) =>
      generateQuizChunk(apiKey, c, i, chunks.length)
    );

    let all: any[] = [];
    const errors: string[] = [];
    for (const r of results) {
      if (r.error) errors.push(r.error);
      if (r.questions.length) all = all.concat(r.questions);
    }

    all = dedupeQuestions(all);
    if (!all.length) {
      return NextResponse.json(
        { error: errors[0] || "Failed to generate quiz" },
        { status: 500 }
      );
    }

    cache.set(key, { data: all, ts: Date.now() });
    return NextResponse.json({
      questions: all,
      totalQuestions: all.length,
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