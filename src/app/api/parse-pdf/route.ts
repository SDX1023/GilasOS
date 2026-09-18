import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse/lib/pdf-parse.js");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);
    const text = data.text || "";
    if (!text.trim()) {
      return NextResponse.json({ error: "PDF appears to be image-based (scanned). Convert to text first." }, { status: 400 });
    }
    return NextResponse.json({ text });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to parse PDF" }, { status: 500 });
  }
}
