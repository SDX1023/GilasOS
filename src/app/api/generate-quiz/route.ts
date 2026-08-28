import { NextRequest, NextResponse } from "next/server";

const MAX_CHARS = 80000;
const cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 10 * 60 * 1000;

function parseRetryAfter(message: string): number {
  const match = message.match(/retry in (\d+(?:\.\d+)?)/i);
  return match ? Math.ceil(parseFloat(match[1])) : 30;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
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

    const truncatedText = text.slice(0, MAX_CHARS);
    const key = `quiz-${simpleHash(truncatedText)}-v6`;
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

    const body = await safeJson(res);

    if (res.status === 429) {
      const retryAfter = parseRetryAfter(body?.error?.message || "");
      return NextResponse.json({ error: `Rate limited. Wait ${retryAfter}s then try again.`, retryAfter }, { status: 429 });
    }

    if (!res.ok) {
      const errorMsg = body?.error?.message || `Gemini API error (${res.status})`;
      const retryAfter = parseRetryAfter(errorMsg);
      return NextResponse.json({ error: errorMsg, retryAfter }, { status: 500 });
    }

    const content = body?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      if (Array.isArray(questions) && questions.length > 0) {
        cache.set(key, { data: questions, ts: Date.now() });
        return NextResponse.json({ questions });
      }
    }
    return NextResponse.json({ error: "Failed to parse questions from Gemini response" }, { status: 500 });
  } catch (err: any) {
    console.error("[generate-quiz] Unhandled error:", err?.message || err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
