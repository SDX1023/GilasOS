import { NextRequest, NextResponse } from "next/server";

const MAX_CHARS = 30000;
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function parseRetryAfter(message: string): number {
  const match = message.match(/retry in (\d+(?:\.\d+)?)/i);
  return match ? Math.ceil(parseFloat(match[1])) : 30;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
  }

  const { text } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const truncatedText = text.slice(0, MAX_CHARS);
  const key = `quiz-${simpleHash(truncatedText)}-v2`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json({ questions: cached.data });
  }

  const prompt = `You are an expert quiz generator. Analyze the study material below and generate quiz questions.

RULES:
- Evaluate the content and generate the RIGHT number of questions — not too few, not too many.
- Short text = 5-15 questions. Medium text = 20-40 questions. Long text = 50-150+ questions.
- Every important fact, name, date, definition, concept, comparison, and detail MUST become a question.
- Do NOT skip anything important. Do NOT pad with trivial filler.
- Mix types 50/50: multiple choice and identification.

Return ONLY a valid JSON array. Each object:
- MC: {"type":"mc","question":"...","options":["A","B","C","D"],"correct":0}
- ID: {"type":"identification","question":"...","answer":"the answer"}

No markdown. No code blocks. Just raw JSON array.`;

  for (let attempt = 0; attempt <= 3; attempt++) {
    if (attempt > 0) {
      const wait = attempt * 15000;
      await new Promise(r => setTimeout(r, wait));
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\n\n--- STUDY MATERIAL ---\n\n${truncatedText}` }] }],
          generationConfig: { temperature: 0.7 },
        }),
      }
    );

    if (res.status === 429 && attempt < 3) {
      const err = await res.json().catch(() => ({}));
      const retryAfter = parseRetryAfter(err.error?.message || "");
      await new Promise(r => setTimeout(r, retryAfter * 1000));
      continue;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const retryAfter = parseRetryAfter(err.error?.message || "");
      return NextResponse.json({ error: err.error?.message || "API error", retryAfter }, { status: 500 });
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      if (Array.isArray(questions) && questions.length > 0) {
        cache.set(key, { data: questions, ts: Date.now() });
        return NextResponse.json({ questions });
      }
    }
    return NextResponse.json({ error: "No questions found in response" }, { status: 500 });
  }

  return NextResponse.json({ error: "Rate limited — try again later", retryAfter: 30 }, { status: 500 });
}
