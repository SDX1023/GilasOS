import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { question, answer } = await req.json();
    if (!answer) return NextResponse.json({ error: "answer required" }, { status: 400 });

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ distractors: generateFallbackDistractors(answer) });
    }

    const prompt = `Generate exactly 3 plausible wrong answers (distractors) for this multiple choice question.

Question: ${question || "N/A"}
Correct Answer: ${answer}

Rules:
- Distractors must be in the SAME CATEGORY as the correct answer (e.g., if answer is a painting name, distractors should be other painting names; if answer is a person, distractors should be other people; if answer is a body part, distractors should be other body parts)
- Distractors should be plausible enough that someone who hasn't studied the material might pick them
- Do NOT use obviously wrong or random answers
- Do NOT include "None of the above" or "All of the above"
- Return ONLY the 3 distractors, one per line, no numbering or bullets`;

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 150,
        temperature: 0.8,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return NextResponse.json({ distractors: generateFallbackDistractors(answer) });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    const lines = text.split("\n").map((l: string) => l.replace(/^\d+[\.\)]\s*/, "").replace(/^[-•]\s*/, "").trim()).filter((l: string) => l.length > 0 && l.toLowerCase() !== answer.toLowerCase());
    const distractors = lines.slice(0, 3);

    while (distractors.length < 3) {
      distractors.push(generateFallbackDistractors(answer)[distractors.length]);
    }

    return NextResponse.json({ distractors });
  } catch {
    const { answer } = await req.json().catch(() => ({ answer: "" }));
    return NextResponse.json({ distractors: generateFallbackDistractors(answer || "") });
  }
}

function generateFallbackDistractors(correct: string): string[] {
  const isNumber = /^\d+$/.test(correct.trim());
  const words = correct.split(/\s+/);
  const isShort = words.length <= 3;

  if (isNumber) {
    const n = parseInt(correct);
    return [String(n + 1), String(Math.max(0, n - 1)), String(n * 2)].filter((d) => d !== correct);
  }
  if (isShort && words.length === 1) {
    const mod = correct.charAt(0).toUpperCase() + correct.slice(1).toLowerCase();
    return [`Not ${mod}`, `The opposite of ${mod}`, `Related to ${mod}`];
  }
  return [
    `Similar concept to ${correct}`,
    `Often confused with ${correct}`,
    `Partially related to ${correct}`,
  ];
}
