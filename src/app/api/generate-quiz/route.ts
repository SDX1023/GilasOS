import { NextRequest, NextResponse } from "next/server";

const CHUNK_SIZE = 15000;

function splitIntoChunks(text: string): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";
  for (const p of paragraphs) {
    if (p.length > CHUNK_SIZE) {
      if (current.trim()) chunks.push(current.trim());
      const sentences = p.split(/(?<=[.!?])\s+/);
      current = "";
      for (const s of sentences) {
        if ((current + " " + s).length > CHUNK_SIZE && current) {
          chunks.push(current.trim());
          current = s;
        } else {
          current = current ? current + " " + s : s;
        }
      }
    } else if ((current + "\n\n" + p).length > CHUNK_SIZE && current) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

async function callGemini(apiKey: string, prompt: string, chunk: string, retries = 5): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      const delay = attempt * 5000;
      await new Promise(r => setTimeout(r, delay));
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\n\n--- STUDY MATERIAL ---\n\n${chunk}` }] }],
          generationConfig: { temperature: 0.7 },
        }),
      }
    );

    if (res.status === 429 && attempt < retries) continue;

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gemini API error (${res.status})`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }
  throw new Error("Rate limited — try again later");
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

  const numQuestions = Math.min(500, Math.max(5, Math.ceil(text.length / 200)));
  const chunks = splitIntoChunks(text);

  // Limit to max 8 API calls to stay within rate limits
  // Merge small chunks, split large ones proportionally
  const maxApiCalls = Math.min(8, chunks.length);
  const questionsPerCall = Math.ceil(numQuestions / maxApiCalls);

  // Merge chunks if we have too many
  let apiChunks: string[] = [];
  if (chunks.length <= maxApiCalls) {
    apiChunks = chunks;
  } else {
    const mergeFactor = Math.ceil(chunks.length / maxApiCalls);
    for (let i = 0; i < chunks.length; i += mergeFactor) {
      apiChunks.push(chunks.slice(i, i + mergeFactor).join("\n\n"));
    }
  }

  const allQuestions: any[] = [];

  // Add delay between calls to respect rate limits
  for (let i = 0; i < apiChunks.length; i++) {
    if (i > 0) {
      await new Promise(r => setTimeout(r, 4000));
    }

    const prompt = `You are an expert quiz generator. Given the study material below, generate quiz questions.

Return ONLY a valid JSON array of question objects. Mix these two types:

1. Multiple choice (type: "mc"):
   {"type":"mc","question":"...","options":["A","B","C","D"],"correct":0}

2. Identification (type: "identification"):
   {"type":"identification","question":"...","answer":"the answer"}

Rules:
- Generate ${questionsPerCall} questions from this material
- Mix both types roughly 50/50
- Test real understanding — definitions, key facts, processes, comparisons, names, dates
- For MC: exactly 4 options, "correct" is 0-based index
- For identification: exact expected answer
- Vary difficulty: easy recall to harder analysis
- No markdown, no code blocks, just raw JSON array`;

    try {
      const content = await callGemini(apiKey, prompt, apiChunks[i]);
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const questions = JSON.parse(jsonMatch[0]);
          if (Array.isArray(questions)) allQuestions.push(...questions);
        } catch {}
      }
    } catch (err: any) {
      // If we already have some questions, return them instead of failing
      if (allQuestions.length > 0) {
        return NextResponse.json({ questions: allQuestions.slice(0, numQuestions) });
      }
      return NextResponse.json(
        { error: err.message || `Failed on chunk ${i + 1}` },
        { status: 500 }
      );
    }
  }

  const result = allQuestions.slice(0, numQuestions);

  if (result.length === 0) {
    return NextResponse.json({ error: "No questions found in response" }, { status: 500 });
  }

  return NextResponse.json({ questions: result });
}
