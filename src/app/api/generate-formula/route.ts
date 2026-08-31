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
- Return ONLY the LaTeX formula (no explanation, no markdown, no $ delimiters, no \\( \\) or \\[ \\] wrappers)
- Use standard LaTeX notation (e.g., \\frac{}{}, \\sqrt{}, \\sum, \\int, \\alpha, \\beta, etc.)
- Cover math, physics, chemistry, and molecular formulas:
  * Math: simple interest I=Prt, compound amount A=P(1+r)^n, discount d=(l-n)/l, etc.
  * Physics: F=ma, E=mc^2, v=d/t, KE=1/2mv^2, V=IR, projectile motion (x=v_0cos(theta)t, y=v_0sin(theta)t-1/2gt^2, R=v_0^2sin(2theta)/g, H=v_0^2sin^2(theta)/(2g)), work W=Fd, power P=W/t, momentum p=mv, etc.
  * Chemistry: pH=-log[H+], PV=nRT, M=n/V, M1V1=M2V2, etc.
  * Molecular: render molecular formulas in LaTeX (e.g., H_2O, CO_2, H_2SO_4, C_6H_{12}O_6, NaCl, CH_3COOH, Ca(OH)_2)
- For word problems, extract the underlying formula (e.g., "simple interest" -> I=Prt, "discount rate" -> d=\\frac{l-n}{l})
- For molecular formulas, always use underscores for subscripts (e.g., H_2O not H2O)
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

    const cleaned = raw
      .replace(/^\$+|\$+$/g, "")
      .replace(/^```latex\n?|```$/g, "")
      .replace(/^\\?\(/, "")
      .replace(/\\?\)$/, "")
      .replace(/^\\?\[/, "")
      .replace(/\\?\]$/, "")
      .trim();
    return NextResponse.json({ formula: cleaned, detected: true });
  } catch {
    return NextResponse.json({ formula: null, detected: false });
  }
}
