import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const CHUNK_SIZE = 5000;

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

async function callGemini(apiKey: string, prompt: string, chunk: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 5000));
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\n\n${chunk}` }] }],
          generationConfig: { temperature: 0.7 },
        }),
        signal: AbortSignal.timeout(60000),
      }
    );

    if (res.status === 429 && attempt < 4) continue;

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let errMsg = `Gemini API error (${res.status})`;
      try { errMsg = JSON.parse(errText).error?.message || errMsg; } catch {}
      throw new Error(errMsg);
    }

    const data = await res.json().catch(() => null);
    if (!data) throw new Error("Empty response from Gemini");
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }
  throw new Error("Rate limited — try again later");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GEMINI_API_KEY not configured" }), { status: 500 });
  }

  const { text } = await req.json();
  if (!text?.trim()) {
    return new Response(JSON.stringify({ error: "No text provided" }), { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const chunks = splitIntoChunks(text);

      const systemPrompt = `You are a flashcard generator. Given text content, generate flashcards for studying.
Return ONLY a JSON array of objects with "front" (question) and "back" (answer) fields.
Optionally include a "hint" field for difficult concepts.
Generate as many flashcards as possible to thoroughly cover ALL key concepts, facts, definitions, and details in the text.
Aim for 10-20 flashcards per chunk. Be thorough.
Make questions clear and concise. Answers should be informative but brief.
Do not include any markdown formatting or code blocks, just the raw JSON array.`;

      let totalCards = 0;

      for (let i = 0; i < chunks.length; i++) {
        try {
          const content = await callGemini(apiKey, systemPrompt, chunks[i]);
          let jsonStr = "";
          const fencedMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (fencedMatch) {
            jsonStr = fencedMatch[1];
          } else {
            const arrMatch = content.match(/\[[\s\S]*\]/);
            if (arrMatch) jsonStr = arrMatch[0];
          }
          if (jsonStr) {
            try {
              const cards = JSON.parse(jsonStr);
              if (Array.isArray(cards) && cards.length > 0) {
                totalCards += cards.length;
                controller.enqueue(encoder.encode(JSON.stringify({ cards, done: false, progress: `Chunk ${i + 1}/${chunks.length} complete` }) + "\n"));
              }
            } catch {}
          }
        } catch (err: any) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: err.message, done: true }) + "\n"));
          controller.close();
          return;
        }
      }

      controller.enqueue(encoder.encode(JSON.stringify({ cards: [], done: true, totalCards }) + "\n"));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain",
      "Transfer-Encoding": "chunked",
    },
  });
}
