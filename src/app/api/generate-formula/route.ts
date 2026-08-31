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
- ONLY return a formula when the question explicitly asks you to CALCULATE a numerical answer using a formula:
  * "How much interest..." → I=Prt
  * "What is the discount..." → d=(l-n)/l  
  * "Find the force..." → F=ma
  * "What is the pH..." → pH=-log[H+]
- Return "NONE" for ALL of these:
  * "Who discovered / Who formulated / Who proposed..."
  * "What is the name of..."
  * Fill-in-the-blank trivia (e.g., "The scientist who... was ____")
  * Definitions, identifications, multiple choice facts
  * Any question where the answer is a person's name, a term, or a concept — not a number
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
