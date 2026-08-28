import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const result = await pdf(buffer);

    return NextResponse.json({ text: result.text });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to extract PDF" }, { status: 500 });
  }
}
