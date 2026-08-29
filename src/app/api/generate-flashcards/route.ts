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
  for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h.toString(36);
}

async function safeJson(res: Response): Promise<any> {
  try { return JSON.parse(await res.text()); } catch { return null; }
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
        const a = Math.max(text.lastIndexOf(". ", end), text.lastIndexOf("? ", end), text.lastIndexOf("! ", end));
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
  return t.replace(/===== Page \d+ =====/g, "").replace(/image\[\[\d+,\s*\d+,\s*\d+,\s*\d+\]\]/g, "").replace(/<\|box_start\|>\d+<\|box_end\|>/g, "").replace(/<\|ref_start\|>.*?<\|ref_end\|>/g, "").replace(/<\|md_start\|>.*?<\|md_end\|>/g, "").replace(/<center>.*?<\/center>/g, "").replace(/\s+/g, " ").trim();
}

function buildPrompt(chunkText: string, idx: number, total: number): string {
  const bullets = (chunkText.match(/●/g) || []).length;
  const hint = bullets > 0 ? ` This section has ~${bullets} bullets — produce at least ${bullets} cards.` : "";
  const ctx = total > 1 ? `Section ${idx + 1}/${total}.${hint}` : hint;
  return `Generate flashcards from this study material. ${ctx}

Rules:
- Every bullet (●), Q/ANS pair, heading, date, name must become at least one card. A 13-page doc should yield 130-200+ cards (10-15/page).
- Each Q/ANS with "ANS:" becomes one card (Q -> front, ANS -> back). Easy/Average/Difficult sections each have multiple Q/ANS — cover all.
- Cover definitions, dates, formulas, processes, causes/effects, comparisons.
- For quotes/dialogues include FULL exact text, escaped for JSON.
- Return ONLY JSON array: [{"front":"...","back":"..."}]

Content:
${chunkText}`;
}

function tryParseJson(s: string): any[] | null {
  try { const p = JSON.parse(s); if (Array.isArray(p) && p.length) return p; } catch {}
  return null;
}

async function extractCards(content: string): Promise<any[]> {
  const d = tryParseJson(content);
  if (d) return d.filter((c: any) => c?.front && c?.back);
  const m = content.match(/\[[\s\S]*\]/);
  if (m) {
    const p = tryParseJson(m[0]);
    if (p) return p.filter((c: any) => c?.front && c?.back);
    try {
      const r = tryParseJson(m[0].replace(/,\s*]/g, "]").replace(/,\s*}/g, "}"));
      if (r) return r.filter((c: any) => c?.front && c?.back);
    } catch {}
  }
  const pat = /"front"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"back"\s*:\s*"((?:\\.|[^"\\])*)"/g;
  const out: any[] = [];
  let x: RegExpExecArray | null;
  while ((x = pat.exec(content)) !== null) {
    try { const f = JSON.parse(`"${x[1]}"`); const b = JSON.parse(`"${x[2]}"`); if (f && b) out.push({ front: f, back: b }); } catch {}
  }
  return out;
}

async function callGroq(prompt: string): Promise<{ content: string } | null> {
  const k = process.env.GROQ_API_KEY;
  if (!k) return null;
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 20000);
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${k}` },
      signal: ac.signal,
      body: JSON.stringify({ model: "qwen/qwen3-32b", messages: [{ role: "user", content: prompt }], temperature: 0.4, max_tokens: 8192, response_format: { type: "json_object" } }),
    });
    clearTimeout(t);
    if (!r.ok) return null;
    const b = await safeJson(r);
    const c = b?.choices?.[0]?.message?.content;
    if (c) return { content: c };
    return null;
  } catch { return null; }
}

async function callGemini(apiKey: string, prompt: string, attempt: number): Promise<{ content: string; retry: boolean; error?: string }> {
  const groq = await callGroq(prompt);
  if (groq) return { content: groq.content, retry: false };
  await waitForRateLimit();
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: ac.signal,
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.4, maxOutputTokens: 8192, responseMimeType: "application/json" } }),
    });
    clearTimeout(t);
    const body = await safeJson(res);
    if (res.status === 429) {
      const wa = parseRetryAfter(body?.error?.message || "");
      if (attempt < MAX_RETRIES) { await sleep(wa * 1000); lastRequestTime = 0; return { content: "", retry: true }; }
      return { content: "", retry: false, error: `Rate limited: retry in ${wa}s` };
    }
    if (!res.ok) {
      const msg = body?.error?.message || `API error ${res.status}`;
      if (attempt < MAX_RETRIES) { await sleep(BASE_DELAY * Math.pow(2, attempt)); return { content: "", retry: true }; }
      return { content: "", retry: false, error: msg };
    }
    const content = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { content, retry: false };
  } catch (e: any) {
    if (e?.name === "AbortError") {
      if (attempt < MAX_RETRIES) { await sleep(BASE_DELAY * Math.pow(2, attempt)); return { content: "", retry: true }; }
      return { content: "", retry: false, error: "Request timed out" };
    }
    if (attempt < MAX_RETRIES) { await sleep(BASE_DELAY * Math.pow(2, attempt)); return { content: "", retry: true }; }
    return { content: "", retry: false, error: e?.message || "Request failed" };
  }
}

async function generateForChunk(apiKey: string, chunk: string, idx: number, total: number): Promise<{ cards: any[]; error?: string }> {
  const prompt = buildPrompt(chunk, idx, total);
  for (let attempt = 0; ; attempt++) {
    const { content, retry, error } = await callGemini(apiKey, prompt, attempt);
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
    const k = `${String(c.front || "").trim().toLowerCase()}|${String(c.back || "").trim().toLowerCase()}`;
    if (c.front && !seen.has(k)) { seen.add(k); out.push(c); }
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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    let text: string;
    try { text = (await req.json()).text; } catch { return NextResponse.json({ error: "Invalid request body" }, { status: 400 }); }
    if (!text?.trim()) return NextResponse.json({ error: "No text provided" }, { status: 400 });
    const cleaned = cleanText(text).slice(0, MAX_CHARS);
    const key = `fc-${simpleHash(cleaned)}-v12`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return NextResponse.json({ cards: cached.data });

    const chunks = splitIntoChunks(cleaned, CHUNK_SIZE);
    const results = await runPool(chunks, CONCURRENCY, (c, i) => generateForChunk(apiKey, c, i, chunks.length));

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
      return NextResponse.json({ error: errors[0] || "Failed to generate", retryAfter: rate && m ? parseInt(m[1], 10) : rate ? 35 : undefined }, { status: rate ? 429 : 500 });
    }

    cache.set(key, { data: all, ts: Date.now() });
    return NextResponse.json({ cards: all, totalCards: all.length, chunksProcessed: chunks.length, ...(errors.length ? { warnings: errors } : {}) });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
