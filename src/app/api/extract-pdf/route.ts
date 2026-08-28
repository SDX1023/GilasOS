import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { extractText } = await import("unpdf");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    const pdfMagic = String.fromCharCode(...buffer.slice(0, 5));
    if (pdfMagic !== "%PDF-") {
      return NextResponse.json({ error: "This file is not a valid PDF. Please upload a real PDF file (not a Word doc saved as PDF)." }, { status: 400 });
    }

    const result = await extractText(buffer);

    const text = Array.isArray(result.text)
      ? result.text.join("\n")
      : typeof result.text === "string"
        ? result.text
        : JSON.stringify(result.text);

    const cleaned = text
      .replace(/<[^>]+>/g, "")
      .replace(/&[a-z]+;/g, " ")
      .replace(/^\s*\d{1,4}\s/gm, "")
      .replace(/^#.*$/gm, "")
      .replace(/^(?:from|import)\s+.+$/gm, "")
      .replace(/\s+/g, " ")
      .replace(/ ?\n ?/g, "\n")
      .trim();

    return NextResponse.json({ text: cleaned });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to extract PDF" }, { status: 500 });
  }
}
