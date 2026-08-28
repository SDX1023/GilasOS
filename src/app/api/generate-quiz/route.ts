import { NextRequest, NextResponse } from "next/server";

const CHUNK_SIZE = 8000;

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

async function callGemini(apiKey: string, prompt: string, chunk: string, retries = 3): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, attempt * 3000));
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

  const { text, numQuestions = 5 } = await req.json();
  if (!text?.trim()) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const chunks = splitIntoChunks(text);

  // If text is small enough, generate all questions in one call
  // Otherwise, generate proportionally from each chunk
  const questionsPerChunk = Math.max(2, Math.ceil(numQuestions / chunks.length));
  const allQuestions: any[] = [];

  const systemPrompt = `You are an expert quiz generator for studying. Given the study material below, generate quiz questions.

Return ONLY a valid JSON array of question objects. Mix these two types:

1. Multiple choice (type: "mc"):
   {"type":"mc","question":"...","options":["A option","B option","C option","D option"],"correct":0}

2. Identification (type: "identification"):
   {"type":"identification","question":"...","answer":"the answer"}

Rules:
- Generate ${questionsPerChunk} questions from this chunk
- Mix both types — roughly 50/50 split
- Questions should test real understanding, not trivial facts
- For MC: exactly 4 options, "correct" is the 0-based index of the right answer
- For identification: the "answer" should be the exact expected answer
- Make questions clear and unambiguous
- No markdown, no code blocks, just raw JSON array`;

  for (let i = 0; i < chunks.length; i++) {
    try {
      const content = await callGemini(apiKey, systemPrompt, chunks[i]);
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const questions = JSON.parse(jsonMatch[0]);
          if (Array.isArray(questions)) allQuestions.push(...questions);
        } catch {}
      }
    } catch (err: any) {
      return NextResponse.json(
        { error: err.message || `Failed on chunk ${i + 1}` },
        { status: 500 }
      );
    }
  }

  // Trim to requested number
  const result = allQuestions.slice(0, numQuestions);

  if (result.length === 0) {
    return NextResponse.json({ error: "No questions found in response" }, { status: 500 });
  }

  return NextResponse.json({ questions: result });
}
