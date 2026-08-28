import { NextRequest, NextResponse } from "next/server";

const CHUNK_SIZE = 12000;

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
  const allCards: { front: string; back: string; hint?: string }[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const systemPrompt = `You are a flashcard generator. Given text content, generate flashcards for studying.
Return ONLY a JSON array of objects with "front" (question) and "back" (answer) fields.
Optionally include a "hint" field for difficult concepts.
Generate as many flashcards as possible to thoroughly cover ALL key concepts, facts, definitions, and details in the text.
Aim for 20-40 flashcards per chunk. Be thorough — every important concept should become a flashcard.
Make questions clear and concise. Answers should be informative but brief.
Do not include any markdown formatting or code blocks, just the raw JSON array.`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.7-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${chunk}` }] }],
          generationConfig: { temperature: 0.7 },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error?.message || `Gemini API error on chunk ${i + 1} (${res.status})` },
        { status: 500 }
      );
    }

    const data = await res.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const cards = JSON.parse(jsonMatch[0]);
        if (Array.isArray(cards)) allCards.push(...cards);
      } catch {}
    }
  }

  if (allCards.length === 0) {
    return NextResponse.json({ error: "No flashcards found in response" }, { status: 500 });
  }

  return NextResponse.json({ cards: allCards });
}
