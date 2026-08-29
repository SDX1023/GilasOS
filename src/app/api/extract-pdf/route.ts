import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { extractText } = await import("unpdf");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = new Uint8Array(await file.arrayBuffer());
    const result = await extractText(buffer);

    const text = Array.isArray(result.text)
      ? result.text.join("\n")
      : typeof result.text === "string"
        ? result.text
        : JSON.stringify(result.text);

    return NextResponse.json({ text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to extract PDF" }, { status: 500 });
  }
}
