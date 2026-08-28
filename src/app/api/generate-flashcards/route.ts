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
      await new Promise(r => setTimeout(r, attempt * 5000));
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

  const chunks = splitIntoChunks(text);

  // Limit to max 8 API calls
  const maxApiCalls = Math.min(8, chunks.length);
  let apiChunks: string[] = [];
  if (chunks.length <= maxApiCalls) {
    apiChunks = chunks;
  } else {
    const mergeFactor = Math.ceil(chunks.length / maxApiCalls);
    for (let i = 0; i < chunks.length; i += mergeFactor) {
      apiChunks.push(chunks.slice(i, i + mergeFactor).join("\n\n"));
    }
  }

  const allCards: { front: string; back: string; hint?: string }[] = [];

  const systemPrompt = `You are an expert study flashcard generator. Given the study material below, generate comprehensive flashcards covering EVERY concept, definition, fact, name, date, process, and detail.

Rules:
- Return ONLY a valid JSON array of objects
- Each object must have "front" (the question/prompt) and "back" (the answer)
- Optionally include "hint" for difficult concepts
- Generate 30-50 flashcards per chunk — be EXTREMELY thorough, miss nothing important
- Mix question types: definitions, "what is", "who invented", "when did", "compare X and Y", fill-in-the-blank
- Questions should test knowledge, not just repeat the text
- Answers should be concise but complete
- No markdown, no code blocks, just raw JSON array`;

  for (let i = 0; i < apiChunks.length; i++) {
    if (i > 0) {
      await new Promise(r => setTimeout(r, 4000));
    }
    try {
      const content = await callGemini(apiKey, systemPrompt, apiChunks[i]);
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          const cards = JSON.parse(jsonMatch[0]);
          if (Array.isArray(cards)) allCards.push(...cards);
        } catch {}
      }
    } catch (err: any) {
      if (allCards.length > 0) {
        return NextResponse.json({ cards: allCards });
      }
      return NextResponse.json(
        { error: err.message || `Failed on chunk ${i + 1}` },
        { status: 500 }
      );
    }
  }

  if (allCards.length === 0) {
    return NextResponse.json({ error: "No flashcards found in response" }, { status: 500 });
  }

  return NextResponse.json({ cards: allCards });
}
