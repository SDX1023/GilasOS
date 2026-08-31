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

    const prompt = `You are a math formula detector. ONLY detect formulas for calculation problems. Return "NONE" for everything else.

CRITICAL RULES — read these first:
1. If the question contains "who", "whose", "which scientist", "which researcher", or asks to NAME/FILL IN A PERSON → return "NONE"
2. If the answer choices are names (Galileo, Copernicus, Newton, etc.) → return "NONE"
3. If the question asks "what is", "what are", "define", "identify", "name the" → return "NONE"
4. ONLY return a formula if the question requires you to CALCULATE a number using math

WHEN you DO detect a calculation problem, return JSON: {"formula": "...", "explanation": "..."}
- Formula: raw LaTeX only, no delimiters, no \\( \\) or \\[ \\] wrappers
- Explanation: Show the FULL solution step-by-step, including all arithmetic. Do not just say "solve for x" — actually solve it and show the final answer.
- Example 1: "What is the simple interest on P15,000 at 10% for 3 years?" → {"formula": "I = Prt", "explanation": "I = 15000(0.10)(3) = 4500. Total = 15000 + 4500 = P19,500."}
- Example 2: Age problems → show the full equation, solve for x, then state the final answer clearly.

ONLY these types get formulas:
- Interest/discount/markup/profit calculations
- Area, perimeter, volume calculations
- Physics problems with numbers (force, energy, velocity, etc.)
- Chemistry calculations (molarity, pH, gas laws, dilution)
- Word problems that need a numeric answer

Text: ${text}

JSON:`;

    const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 512,
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
        let formula = (parsed.formula || "")
          .replace(/^\$+|\$+$/g, "")
          .replace(/^\\\(/, "")
          .replace(/\\\)$/, "")
          .replace(/^\\\[/, "")
          .replace(/\\\]$/, "")
          .trim();
        formula = formula.replace(/(\d+)\s*\/\s*(\d+)/g, "\\frac{$1}{$2}");
        const explanation = (parsed.explanation || "").trim();
        if (formula) {
          return NextResponse.json({ formula, explanation, detected: true });
        }
      }
    } catch {}

    return NextResponse.json({ formula: null, detected: false });
  } catch {
    return NextResponse.json({ formula: null, detected: false });
  }
}
