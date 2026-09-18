import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Polyfill Uint8Array.toHex if missing (needed by pdfjs-dist v6)
if (typeof Uint8Array.prototype.toHex !== "function") {
  (Uint8Array.prototype as any).toHex = function () {
    return Array.from(this).map((b: number) => b.toString(16).padStart(2, "0")).join("");
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    if (!text.trim()) {
      return NextResponse.json({ error: "PDF appears to be image-based (scanned). Convert to text first." }, { status: 400 });
    }
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to parse PDF" }, { status: 500 });
  }
}
