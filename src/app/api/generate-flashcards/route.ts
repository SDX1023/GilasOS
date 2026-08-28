import { NextRequest, NextResponse } from "next/server";

const MAX_CHARS_PER_CALL = 28000;

async function callGemini(apiKey: string, prompt: string, chunk: string, retries = 5): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, attempt * 8000));
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
  throw new Error("Rate limited — try again in a minute");
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
  const truncatedText = text.slice(0, MAX_CHARS_PER_CALL);
  const prompt = `You are an expert study flashcard generator. Analyze the study material below and generate comprehensive flashcards.

IMPORTANT: You decide how many flashcards the material warrants. Generate as many as needed to thoroughly cover EVERY concept, definition, fact, name, date, process, and detail. Be extremely thorough.

Return ONLY a valid JSON array of objects with "front" (question) and "back" (answer) fields.
Optionally include "hint" for difficult concepts.

Rules:
- Cover everything important — definitions, key facts, processes, comparisons, names, dates
- Mix question types: "what is", "who invented", "when did", "compare X and Y", fill-in-the-blank
- Questions should test knowledge, not just repeat the text
- Answers should be concise but complete
- No markdown, no code blocks, just raw JSON array`;
  try {
    const content = await callGemini(apiKey, prompt, truncatedText);
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const cards = JSON.parse(jsonMatch[0]);
      if (Array.isArray(cards) && cards.length > 0) {
        return NextResponse.json({ cards });
      }
    }
    return NextResponse.json({ error: "No flashcards found in response" }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
