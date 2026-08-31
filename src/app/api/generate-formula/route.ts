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

    const prompt = `You are a LaTeX formula assistant. Given the following text, determine if it describes or implies a mathematical formula, equation, or scientific expression. If it does, return a JSON object with the formula and a short explanation. If no formula applies, return exactly "NONE".

Rules:
- Return a JSON object: {"formula": "...", "explanation": "..."}
- Formula: ONLY the raw LaTeX formula on one line, no $ delimiters, no \\( \\) or \\[ \\] wrappers
- Explanation: 1 short sentence (max 15 words) explaining what the formula represents
- Use standard LaTeX notation with backslashes escaped (e.g., \\\\frac{}{}, \\\\sqrt{}, \\\\sum, \\\\int, \\\\alpha, \\\\beta)
- Cover math, physics, chemistry, molecular, and projectile motion formulas:
  * Math: simple interest I=Prt, compound amount A=P(1+r)^n, discount d=(l-n)/l, markup, profit/loss, etc.
  * Physics: F=ma, E=mc^2, v=d/t, KE=1/2mv^2, V=IR, projectile motion, work, power, momentum, etc.
  * Chemistry: pH=-log[H+], PV=nRT, M=n/V, M1V1=M2V2, molecular formulas (H_2O, CO_2, H_2SO_4), etc.
- For word problems, always extract the underlying formula
- If the text is not related to math/science, return "NONE"

Text: ${text}

Return JSON:`;

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

    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const formula = (parsed.formula || "")
          .replace(/^\$+|\$+$/g, "")
          .replace(/^\\?\(/, "")
          .replace(/\\?\)$/, "")
          .replace(/^\\?\[/, "")
          .replace(/\\?\]$/, "")
          .trim();
        const explanation = (parsed.explanation || "").trim();
        if (formula) {
          return NextResponse.json({ formula, explanation, detected: true });
        }
      }
    } catch {}

    const cleaned = raw
      .replace(/^\$+|\$+$/g, "")
      .replace(/^```json\n?|```$/g, "")
      .replace(/^\\?\(/, "")
      .replace(/\\?\)$/, "")
      .replace(/^\\?\[/, "")
      .replace(/\\?\]$/, "")
      .trim();
    if (cleaned) {
      return NextResponse.json({ formula: cleaned, explanation: "", detected: true });
    }

    return NextResponse.json({ formula: null, detected: false });
  } catch {
    return NextResponse.json({ formula: null, detected: false });
  }
}
