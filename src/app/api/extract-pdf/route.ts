import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { extractText } = await import("unpdf");
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
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
