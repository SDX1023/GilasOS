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

async function safeJson(res: Response): Promise<any> {
  try { return JSON.parse(await res.text()); } catch { return null; }
}

function cleanText(t: string): string {
  return t.replace(/===== Page \d+ =====/g, "").replace(/image\[\[\d+,\s*\d+,\s*\d+,\s*\d+\]\]/g, "").replace(/<\|box_start\|>\d+<\|box_end\|>/g, "").replace(/<\|ref_start\|>.*?<\|ref_end\|>/g, "").replace(/<\|md_start\|>.*?<\|md_end\|>/g, "").replace(/<center>.*?<\/center>/g, "").replace(/\s+/g, " ").trim();
}

function buildQuizPrompt(chunkText: string, idx: number, total: number): string {
  const ctx = total > 1 ? `Section ${idx + 1}/${total}.` : "";
  return `Generate a multiple-choice quiz from this study material. ${ctx}

Rules:
- Create 5 multiple-choice questions with 4 options each (A, B, C, D)
- Questions should cover key concepts, definitions, dates, and important facts
- Include the correct answer for each question
- Return ONLY JSON array: [{"question":"...", "options":["A. ...", "B. ...", "C. ...", "D. ..."], "correct":"A"}]

Content:
${chunkText}`;
}

function tryParseJson(s: string): any[] | null {
  try {
    const p = JSON.parse(s);
    if (Array.isArray(p) && p.length) return p;
    if (p && Array.isArray((p as any).questions) && (p as any).questions.length) return (p as any).questions;
    if (p && Array.isArray((p as any).quiz) && (p as any).quiz.length) return (p as any).quiz;
  } catch {}
  return null;
}

async function extractQuiz(content: string): Promise<any[]> {
  const d = tryParseJson(content);
  if (d) return d.filter((q: any) => q?.question && q?.options);
  const m = content.match(/\[[\s\S]*\]/);
  if (m) {
    const p = tryParseJson(m[0]);
    if (p) return p.filter((q: any) => q?.question && q?.options);
  }
  return [];
}

// ============ DEEPSEEK API CALL ============
async function callDeepSeek(apiKey: string, prompt: string, attempt: number): Promise<{ content: string; retry: boolean; error?: string }> {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
    
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      signal: ac.signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 8192
      }),
    });
    
    clearTimeout(t);
    const body = await safeJson(res);
    
    if (res.status === 429) {
      if (attempt < MAX_RETRIES) {
        await sleep(30000);
        return { content: "", retry: true };
      }
      return { content: "", retry: false, error: "Rate limited" };
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
    if (attempt < MAX_RETRIES) {
      await sleep(BASE_DELAY * Math.pow(2, attempt));
      return { content: "", retry: true };
    }
    return { content: "", retry: false, error: e?.message || "Request failed" };
  }
}
// ============ END DEEPSEEK ============

async function generateQuizChunk(apiKey: string, chunk: string, idx: number, total: number): Promise<{ questions: any[]; error?: string }> {
  const prompt = buildQuizPrompt(chunk, idx, total);
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const { content, retry, error } = await callDeepSeek(apiKey, prompt, attempt);
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
    const key = String(q.question || "").trim().toLowerCase();
    if (q.question && !seen.has(key)) {
      seen.add(key);
      out.push(q);
    }
  }
  return out;
}

async function runPool<T, R>(items: T[], conc: number, fn: (v: T, i: number) => Promise<R>): Promise<R[]> {
  const res: R[] = new Array(items.length);
  let cur = 0;
  async function next() { while (cur < items.length) { const i = cur++; res[i] = await fn(items[i], i); } }
  const workers = Array.from({ length: Math.min(conc, items.length) }, () => next());
  await Promise.all(workers);
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "DEEPSEEK_API_KEY not configured" }, { status: 500 });
    
    let text: string;
    try { text = (await req.json()).text; } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
    if (!text?.trim()) return NextResponse.json({ error: "No text provided" }, { status: 400 });
    const cleaned = cleanText(text).slice(0, MAX_CHARS);
    const key = `quiz-${cleaned.slice(0, 100)}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return NextResponse.json({ questions: cached.data });

    const chunks = splitIntoChunks(cleaned, 30000);
    const results = await runPool(chunks, CONCURRENCY, (c, i) => generateQuizChunk(apiKey, c, i, chunks.length));

    let all: any[] = [];
    const errors: string[] = [];
    for (const r of results) {
      if (r.error) errors.push(r.error);
      if (r.questions.length) all = all.concat(r.questions);
    }

    all = dedupeQuestions(all);
    if (!all.length) {
      return NextResponse.json({ error: errors[0] || "Failed to generate quiz" }, { status: 500 });
    }

    cache.set(key, { data: all, ts: Date.now() });
    return NextResponse.json({ questions: all, totalQuestions: all.length, chunksProcessed: chunks.length, ...(errors.length ? { warnings: errors } : {}) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
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
    }
    const c = text.slice(start, end).trim();
    if (c) chunks.push(c);
    start = end;
  }
  return chunks;
}