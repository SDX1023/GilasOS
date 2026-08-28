import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

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

async function callGroq(apiKey: string, prompt: string, chunk: string): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
    }

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: chunk },
        ],
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (res.status === 429 && attempt < 2) continue;

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let errMsg = `Groq API error (${res.status})`;
      try { errMsg = JSON.parse(errText).error?.message || errMsg; } catch {}
      throw new Error(errMsg);
    }

    const data = await res.json().catch(() => null);
    if (!data) throw new Error("Empty response from Groq");
    return data.choices?.[0]?.message?.content ?? "";
  }
  throw new Error("Rate limited — try again later");
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "GROQ_API_KEY not configured" }), { status: 500 });
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
Aim for 10-20 flashcards per chunk. Be thorough — every important concept should become a flashcard.
Make questions clear and concise. Answers should be informative but brief.
Do not include any markdown formatting or code blocks, just the raw JSON array.`;

      let totalCards = 0;

      for (let i = 0; i < chunks.length; i++) {
        try {
          const content = await callGroq(apiKey, systemPrompt, chunks[i]);
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            try {
              const cards = JSON.parse(jsonMatch[0]);
              if (Array.isArray(cards) && cards.length > 0) {
                totalCards += cards.length;
                controller.enqueue(encoder.encode(JSON.stringify({ cards, done: false, progress: Math.round(((i + 1) / chunks.length) * 100) }) + "\n"));
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
