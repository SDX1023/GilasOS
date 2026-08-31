import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!DEEPSEEK_KEY) {
      return NextResponse.json({ formula: null, detected: false });
    }

    const prompt = `You are a LaTeX formula assistant. Given the following text, determine if it describes or implies a mathematical formula, equation, or scientific expression. If it does, return a valid LaTeX formula that represents the concept. If no formula applies, return exactly "NONE".

Rules:
- Return ONLY the LaTeX formula (no explanation, no markdown, no $ delimiters)
- Use standard LaTeX notation (e.g., \\frac{}{}, \\sqrt{}, \\sum, \\int, \\alpha, \\beta, etc.)
- For simple concept mappings, be accurate (e.g., "speed equals distance divided by time" → "v = \\frac{d}{t}")
- If the text is not related to math/science, return "NONE"

Text: ${text}

Formula:`;

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 256,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ formula: null, detected: false });
    }

    const data = await res.json();
    const raw = (data.choices?.[0]?.message?.content || "").trim();

    if (!raw || raw === "NONE" || raw.toLowerCase() === "none") {
      return NextResponse.json({ formula: null, detected: false });
    }

    const cleaned = raw.replace(/^\$+|\$+$/g, "").replace(/^```latex\n?|```$/g, "").trim();
    return NextResponse.json({ formula: cleaned, detected: true });
  } catch {
    return NextResponse.json({ formula: null, detected: false });
  }
}
