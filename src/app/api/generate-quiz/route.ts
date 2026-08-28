import { NextRequest, NextResponse } from "next/server";

// Gemini 3.6 Flash can handle ~30k chars per call
const MAX_CHARS_PER_CALL = 10000;

async function callGemini(apiKey: string, prompt: string, chunk: string, retries = 5): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, attempt * 8000));
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

  // Use as much text as fits in one call — Gemini decides question count
  const truncatedText = text.slice(0, MAX_CHARS_PER_CALL);

  const prompt = `You are an expert quiz generator. Analyze the study material below and generate quiz questions.

IMPORTANT: You decide how many questions the material warrants. Generate as many questions as needed to thoroughly cover ALL important concepts, facts, definitions, names, dates, processes, and details. Be comprehensive — do not hold back.

Return ONLY a valid JSON array of question objects. Mix these two types:

1. Multiple choice (type: "mc"):
   {"type":"mc","question":"...","options":["A","B","C","D"],"correct":0}

2. Identification (type: "identification"):
   {"type":"identification","question":"...","answer":"the answer"}

Rules:
- You determine the count — cover everything important
- Mix both types roughly 50/50
- Test real understanding — definitions, key facts, processes, comparisons, names, dates
- For MC: exactly 4 options, "correct" is 0-based index
- For identification: exact expected answer
- Vary difficulty: easy recall to harder analysis
- No markdown, no code blocks, just raw JSON array`;

  try {
    const content = await callGemini(apiKey, prompt, truncatedText);
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const questions = JSON.parse(jsonMatch[0]);
      if (Array.isArray(questions) && questions.length > 0) {
        return NextResponse.json({ questions });
      }
    }
    return NextResponse.json({ error: "No questions found in response" }, { status: 500 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
