import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MAX_CHARS = 200000;
const CHUNK_SIZE = 15000;
const MAX_RETRIES = 2;
const REQUEST_TIMEOUT_MS = 45000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
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

function buildScrimsPrompt(chunkText: string, idx: number, total: number): string {
  const ctx = total > 1 ? `Section ${idx + 1}/${total}.` : "";

  return `Generate type-in quiz questions from this study material. ${ctx}

Each question must have a difficulty rating that determines the time limit:
- "easy" = 10 seconds (simple recall, definitions, names)
- "medium" = 30 seconds (math problems, short calculations, multi-step recall)
- "hard" = 60 seconds (complex math, physics, derivations, proofs)

RULES:
- Generate 8-12 questions per section
- All questions are type-in (NO multiple choice)
- Answers must be SHORT: a number, word, or short phrase (max 15 words)
- For math: ask for the final numerical answer
- For definitions: ask for the key term
- For facts: ask for the specific detail
- Vary difficulty: roughly 40% easy, 35% medium, 25% hard
- Each question must have exactly ONE clear correct answer

Return ONLY a JSON array:
[
  {"question": "What is the powerhouse of the cell?", "answer": "mitochondria", "difficulty": "easy"},
  {"question": "Solve: 3x + 7 = 22", "answer": "5", "difficulty": "medium"},
  {"question": "Calculate the kinetic energy of a 2kg object moving at 6 m/s", "answer": "36 J", "difficulty": "hard"}
]

CONTENT:
${chunkText}`;
}

function tryParseJson(s: string): any[] | null {
  let cleaned = s.trim();
  const mdMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (mdMatch) cleaned = mdMatch[1].trim();
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrMatch) cleaned = arrMatch[0];
  try {
    const p = JSON.parse(cleaned);
    if (Array.isArray(p) && p.length) return p;
  } catch {}
  return null;
}

function normalizeQuestion(q: any): any | null {
  if (!q?.question || !q?.answer) return null;
  const difficulty = ["easy", "medium", "hard"].includes(q.difficulty) ? q.difficulty : "easy";
  return {
    question: String(q.question).trim(),
    answer: String(q.answer).trim(),
    difficulty,
  };
}

async function callDeepSeek(apiKey: string, prompt: string): Promise<{ content: string; error?: string }> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      signal: ac.signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 16384,
      }),
    });
    clearTimeout(t);
    const text = await res.text();
    let body: any;
    try { body = JSON.parse(text); } catch { body = null; }
    if (res.status === 429) {
      const retryMatch = (body?.error?.message || "").match(/retry in (\d+)/i);
      const waitSec = retryMatch ? Math.ceil(parseInt(retryMatch[1])) : 30;
      return { content: "", error: `Rate limited. Retry in ${waitSec}s.` };
    }
    if (!res.ok) return { content: "", error: body?.error?.message || `DeepSeek API error ${res.status}` };
    const content = body?.choices?.[0]?.message?.content ?? "";
    if (!content) return { content: "", error: "DeepSeek returned empty response" };
    return { content };
  } catch (e: any) {
    clearTimeout(t);
    if (e?.name === "AbortError") return { content: "", error: "Request timed out after 45s" };
    return { content: "", error: e?.message || "Request failed" };
  }
}

function dedupeQuestions(questions: any[]): any[] {
  const seen = new Set<string>();
  return questions.filter((q) => {
    const key = q.question.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "DEEPSEEK_API_KEY not configured" }, { status: 500 });

    let text: string;
    try {
      const body = await req.json();
      text = body.text;
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (!text?.trim()) return NextResponse.json({ error: "No text provided" }, { status: 400 });

    const cleaned = cleanText(text).slice(0, MAX_CHARS);
    const chunks = splitIntoChunks(cleaned, CHUNK_SIZE);

    let all: any[] = [];
    const allErrors: string[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const prompt = buildScrimsPrompt(chunks[i], i, chunks.length);
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const { content, error } = await callDeepSeek(apiKey, prompt);
        if (error) {
          allErrors.push(error);
          if (attempt < MAX_RETRIES) await sleep(2000 * Math.pow(2, attempt));
          continue;
        }
        const parsed = tryParseJson(content);
        if (parsed) {
          const normalized = parsed.map(normalizeQuestion).filter(Boolean);
          all = all.concat(normalized);
          break;
        }
        if (attempt < MAX_RETRIES) await sleep(2000 * Math.pow(2, attempt));
      }
    }

    all = dedupeQuestions(all);
    if (!all.length) {
      return NextResponse.json({ error: allErrors[0] || "Failed to generate questions" }, { status: 500 });
    }

    return NextResponse.json({ questions: all, total: all.length });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
