import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_CHARS = 200000;
const CHUNK_SIZE = 40000;
const CONCURRENCY = 2;
const MAX_RETRIES = 1;
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
function buildQuizPrompt(chunkText: string, idx: number, total: number, questionType: string): string {
  const format = detectFormat(chunkText);
  const ctx = total > 1 ? `Section ${idx + 1}/${total}.` : "";

  const typeInstructions = questionType === "identification"
    ? `Generate IDENTIFICATION (fill-in-the-blank) quiz questions. Each question has NO options — just the question and a correct answer string.`
    : questionType === "mc"
    ? `Generate MULTIPLE CHOICE quiz questions with 4 options each.`
    : `Generate a MIX of MULTIPLE CHOICE (4 options) and IDENTIFICATION (fill-in-the-blank) questions. Roughly half and half.`;

  // ============================================
  // FORMAT 1: BULLET POINTS
  // ============================================
  if (format === "BULLET_POINTS") {
    const bullets = (chunkText.match(/●/g) || []).length;
    const hint =
      bullets > 0
        ? ` This section has ~${bullets} bullet points.`
        : "";

    if (questionType === "identification") {
      return `Generate identification quiz questions from this study material. ${ctx}${hint}

IMPORTANT: This text uses BULLET POINTS. Create fill-in-the-blank questions.

CRITICAL RULES:
- You MUST generate at least ${Math.ceil(bullets / 2)} questions from these ${bullets} bullet points
- Create 1 question for every 1-2 bullet points — do NOT skip bullet points
- Use underscores or blanks where the answer goes
- Include the correct answer
- Return ONLY JSON array: [{"question":"The ___ is responsible for...","type":"identification","answer":"nucleus"}]

CONTENT:
${chunkText}`;
    }

    if (questionType === "mc") {
      return `Generate multiple-choice quiz questions from this study material. ${ctx}${hint}

IMPORTANT: This text uses BULLET POINTS. Create quiz questions from the key facts.

CRITICAL RULES:
- You MUST generate at least ${Math.ceil(bullets / 2)} questions from these ${bullets} bullet points
- Create 1 question for every 1-2 bullet points — do NOT skip bullet points
- Each question must have 4 options (A, B, C, D)
- "correct" must be the LETTER (A, B, C, or D) matching the correct option — vary answers across questions

CONTENT:
${chunkText}`;
    }

    // mixed
    return `Generate a mix of multiple-choice and identification quiz questions. ${ctx}${hint}

IMPORTANT: This text uses BULLET POINTS. Create a MIX of question types.

CRITICAL RULES:
- You MUST generate at least ${Math.ceil(bullets / 2)} questions from these ${bullets} bullet points
- Create 1 question for every 1-2 bullet points — do NOT skip bullet points
- Half should be multiple-choice with 4 options, half should be identification (fill-in-the-blank)
- Return ONLY JSON array with mixed types:
  MC: [{"question":"...", "options":["A. ...", "B. ...", "C. ...", "D. ..."], "type":"mc", "correct":"B"}]
  ID: [{"question":"The ___ is responsible for...", "type":"identification", "answer":"nucleus"}]

CONTENT:
${chunkText}`;
  }

  // ============================================
  // FORMAT 2: Q&A PAIRS
  // ============================================
  if (format === "QA_PAIRS") {
    if (questionType === "identification") {
      return `Generate identification quiz questions from this Q&A material. ${ctx}

CRITICAL RULES:
- You MUST generate at least 1 question for EVERY Q&A pair — do NOT skip any
- Convert each Q&A pair into a fill-in-the-blank question
- The blank should be where the answer goes
- Return ONLY JSON array: [{"question":"The process of ___ is...","type":"identification","answer":"photosynthesis"}]

CONTENT:
${chunkText}`;
    }
    if (questionType === "mc") {
      return `Generate multiple-choice quiz questions from this Q&A material. ${ctx}

CRITICAL RULES:
- You MUST generate at least 1 question for EVERY Q&A pair — do NOT skip any
- For each Q&A pair, create a question using the Q as the stem
- Add 3 wrong options that are plausible but incorrect
- "correct" must be the LETTER (A, B, C, or D) — vary answers across questions

CONTENT:
${chunkText}`;
    }
    return `Generate a mix of MC and identification questions from this Q&A material. ${ctx}

CRITICAL RULES:
- You MUST generate at least 1 question for EVERY Q&A pair — do NOT skip any
- Half MC with 4 options, half identification fill-in-the-blank
- Return ONLY JSON array:
  MC: [{"question":"...", "options":["A. ...", "B. ...", "C. ...", "D. ..."], "type":"mc", "correct":"B"}]
  ID: [{"question":"The ___ is responsible for...", "type":"identification", "answer":"nucleus"}]

CONTENT:
${chunkText}`;
  }

  // ============================================
  // FORMAT 3: PLAIN PARAGRAPHS
  // ============================================
  if (format === "PARAGRAPHS") {
    if (questionType === "identification") {
      return `Generate identification quiz questions from this text. ${ctx}

EXTRACTION RULES:
1. For each person: "The person who ___ was ___" (fill in name)
2. For each event: "___ happened during ___" (fill in event)
3. For each date: "___ happened in ___" (fill in year)
4. For each definition: "___ is defined as ___" (fill in term)

CRITICAL RULES:
- Create 1 question for every 1-2 sentences of important information — do NOT skip facts
- Return ONLY JSON array: [{"question":"The ___ is responsible for...","type":"identification","answer":"nucleus"}]

TEXT:
${chunkText}`;
    }
    if (questionType === "mc") {
      return `Generate multiple-choice quiz questions from this text. ${ctx}

EXTRACTION RULES:
1. For each person: "Who is [NAME]?" with 4 options
2. For each event: "What happened during [EVENT]?" with 4 options
3. For each date: "When did [EVENT] happen?" with 4 options
4. For each definition: "What is [TERM]?" with 4 options

CRITICAL RULES:
- Create 1 question for every 1-2 sentences of important information — do NOT skip facts
- Each question must have 4 options (A, B, C, D)
- "correct" must be the LETTER (A, B, C, or D) — vary answers across questions

TEXT:
${chunkText}`;
    }
    return `Generate a mix of MC and identification questions from this text. ${ctx}

CRITICAL RULES:
- Create 1 question for every 1-2 sentences of important information — do NOT skip facts
- Half MC with 4 options, half identification fill-in-the-blank
- Return ONLY JSON array:
  MC: [{"question":"...", "options":["A. ...", "B. ...", "C. ...", "D. ..."], "type":"mc", "correct":"B"}]
  ID: [{"question":"The ___ is responsible for...", "type":"identification", "answer":"nucleus"}]

TEXT:
${chunkText}`;
  }

  // ============================================
  // FALLBACK
  // ============================================
  if (questionType === "identification") {
    return `Generate identification quiz questions from this text. ${ctx}

Rules:
- Create 5 fill-in-the-blank questions
- Return ONLY JSON array: [{"question":"The ___ is responsible for...","type":"identification","answer":"nucleus"}]

TEXT:
${chunkText}`;
  }
  if (questionType === "mc") {
    return `Generate multiple-choice quiz questions from this text. ${ctx}

Rules:
- Create 5 quiz questions with 4 options each
- "correct" must be the LETTER (A, B, C, or D) — vary answers across questions

TEXT:
${chunkText}`;
  }
  return `Generate a mix of MC and identification quiz questions from this text. ${ctx}

Rules:
- Create 5 questions, mix of MC (4 options) and identification (fill-in-the-blank)
- Return ONLY JSON array:
  MC: [{"question":"...", "options":["A. ...", "B. ...", "C. ...", "D. ..."], "type":"mc", "correct":"B"}]
  ID: [{"question":"The ___ is responsible for...", "type":"identification", "answer":"nucleus"}]

TEXT:
${chunkText}`;
}

// ============================================================
// ENHANCED EXTRACTION
// ============================================================
function tryParseJson(s: string): any[] | null {
  let cleaned = s.trim();

  const mdMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (mdMatch) cleaned = mdMatch[1].trim();

  try {
    const p = JSON.parse(cleaned);
    if (Array.isArray(p) && p.length) return p;
    if (p && Array.isArray((p as any).questions) && (p as any).questions.length)
      return (p as any).questions;
    if (p && Array.isArray((p as any).quiz) && (p as any).quiz.length)
      return (p as any).quiz;
  } catch {}
  return null;
}

function normalizeQuestion(q: any): any {
  try {
    if (!q || !q.question) return q;

    if (q.type === "identification" || (!q.type && !q.options)) {
      q.type = "identification";
      if (!q.answer && q.correct) {
        q.answer = String(q.correct).replace(/^\s*[A-Da-d]\.\s*/, "").trim();
      }
      return q;
    }

    if (q.type !== "mc" || !q.options || !q.correct || !Array.isArray(q.options)) return q;
    const c = String(q.correct).trim();
    if (/^[0-3]$/.test(c)) {
      const idx = parseInt(c);
      q.correct = String.fromCharCode(65 + idx);
      return q;
    }
    if (c.length === 1 && c.toUpperCase().charCodeAt(0) >= 65 && c.toUpperCase().charCodeAt(0) <= 68) return q;
    const stripped = c.replace(/^\s*[A-Da-d]\.\s*/, "").trim().toLowerCase();
    for (let i = 0; i < q.options.length; i++) {
      const optText = String(q.options[i]).replace(/^\s*[A-Da-d]\.\s*/, "").trim().toLowerCase();
      if (optText === stripped || optText.includes(stripped) || stripped.includes(optText)) {
        q.correct = String.fromCharCode(65 + i);
        return q;
      }
    }
    return q;
  } catch (e) {
    console.error("normalizeQuestion error:", e, q);
    return q;
  }
}

async function extractQuiz(content: string): Promise<any[]> {
  const d = tryParseJson(content);
  if (d) return d.filter((q: any) => q?.question && ((q?.options?.length === 4 && q?.correct) || (q?.type === "identification" && q?.answer))).map(normalizeQuestion);

  const m = content.match(/\[[\s\S]*\]/);
  if (m) {
    const p = tryParseJson(m[0]);
    if (p) return p.filter((q: any) => q?.question && ((q?.options?.length === 4 && q?.correct) || (q?.type === "identification" && q?.answer))).map(normalizeQuestion);
  }

  // Try to extract from Q&A pattern
  const mcPattern = /"question"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"options"\s*:\s*\[((?:\\.|[^\]\\])*)\]\s*,\s*"correct"\s*:\s*"([^"]*)"/g;
  const idPattern = /"question"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"type"\s*:\s*"identification"\s*,\s*"answer"\s*:\s*"((?:\\.|[^"\\])*)"/g;

  const out: any[] = [];

  let match: RegExpExecArray | null;
  while ((match = mcPattern.exec(content)) !== null) {
    try {
      const question = match[1]?.trim() || "";
      const optionsStr = match[2] || "";
      const correct = match[3]?.trim() || "";
      const options = optionsStr.split(",").map((o: string) => o.trim().replace(/^"|"$/g, ""));
      if (question && options.length === 4 && correct) {
        out.push({ question, options, correct, type: "mc" });
      }
    } catch {}
  }

  while ((match = idPattern.exec(content)) !== null) {
    try {
      const question = match[1]?.trim() || "";
      const answer = match[2]?.trim() || "";
      if (question && answer) {
        out.push({ question, type: "identification", answer });
      }
    } catch {}
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
        max_tokens: 16384,
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
  total: number,
  questionType: string
): Promise<{ questions: any[]; error?: string }> {
  const format = detectFormat(chunk);
  console.log(`Chunk ${idx + 1}/${total}: Detected format: ${format}, Type: ${questionType}`);

  const prompt = buildQuizPrompt(chunk, idx, total, questionType);

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const { content, retry, error } = await callDeepSeek(
      apiKey,
      prompt,
      attempt
    );
    if (retry) continue;
    if (error) {
      console.error(`Chunk ${idx + 1} attempt ${attempt} error:`, error);
      if (attempt === MAX_RETRIES) return { questions: [], error };
      continue;
    }
    console.log(`Chunk ${idx + 1} attempt ${attempt}: got ${content.length} chars`);
    const questions = await extractQuiz(content);
    console.log(`Chunk ${idx + 1} attempt ${attempt}: extracted ${questions.length} questions`);
    if (questions.length) return { questions };
    console.log(`Chunk ${idx + 1} attempt ${attempt}: no questions extracted, retrying...`);
  }
  return { questions: [], error: "Failed to generate quiz after retries" };
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
    let questionType: string;
    try {
      const body = await req.json();
      text = body.text;
      questionType = body.type || "mc";
    } catch {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }
    if (!text?.trim())
      return NextResponse.json({ error: "No text provided" }, { status: 400 });

    const cleaned = cleanText(text).slice(0, MAX_CHARS);
    const key = `quiz-${simpleHash(cleaned)}-${questionType}-v1`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.ts < CACHE_TTL)
      return NextResponse.json({ questions: cached.data });

    const chunks = splitIntoChunks(cleaned, 30000);
    const results = await runPool(chunks, CONCURRENCY, (c, i) =>
      generateQuizChunk(apiKey, c, i, chunks.length, questionType)
    );

    let all: any[] = [];
    const errors: string[] = [];
    for (const r of results) {
      if (r.error) {
        console.error("Chunk error:", r.error);
        errors.push(r.error);
      }
      if (r.questions.length) all = all.concat(r.questions);
    }

    all = dedupeQuestions(all);
    console.log(`Total questions generated: ${all.length}, errors: ${errors.length}`);
    if (!all.length) {
      return NextResponse.json(
        { error: errors[0] || "Failed to generate quiz", details: errors },
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