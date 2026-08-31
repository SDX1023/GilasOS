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

    const prompt = `You are a LaTeX formula assistant. Given the following text, determine if it is a MATH or SCIENCE problem that requires a specific formula to solve. If it does, return a JSON object with the formula and a short explanation. If no formula applies, return exactly "NONE".

Rules:
- Return a JSON object: {"formula": "...", "explanation": "..."}
- Formula: ONLY the raw LaTeX formula on one line, no $ delimiters, no \\( \\) or \\[ \\] wrappers
- Explanation: 1 short sentence (max 20 words) explaining HOW to solve the problem using this formula, not just what the formula means
- Use standard LaTeX notation with backslashes escaped (e.g., \\\\frac{}{}, \\\\sqrt{}, \\\\sum, \\\\int, \\\\alpha, \\\\beta)
- ONLY return a formula for actual math/science CALCULATION problems:
  * Math: interest, discount, markup, profit, compound amount, area, perimeter, Pythagorean theorem, etc.
  * Physics: force, energy, velocity, momentum, projectile motion, circuits, etc.
  * Chemistry: molarity, pH, gas laws, dilution, reaction balancing, molecular formulas, etc.
- DO NOT return formulas for:
  * General knowledge or trivia questions (who discovered, what is, multiple choice facts)
  * Biology, astronomy, history, or non-calculation questions
  * Questions that just mention a concept name without needing to calculate anything
- For word problems, explain the solution steps briefly (e.g., "Substitute P=15000, r=0.10, t=3 into I=Prt, then add to principal")
- If the text is not a math/science calculation problem, return "NONE"

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
