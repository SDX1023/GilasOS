import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const trackId = searchParams.get("id");

    if (!trackId) {
      return NextResponse.json({ error: "Track ID required" }, { status: 400 });
    }

    console.log("Fetching preview for track:", trackId);

    const embedUrl = `https://open.spotify.com/embed/track/${trackId}`;
    const response = await fetch(embedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = await response.text();
    const previewMatch = html.match(/https:\/\/p\.scdn\.co\/mp3-preview\/[a-f0-9]+/);

    if (previewMatch) {
      const previewUrl = previewMatch[0];
      console.log("Preview found:", previewUrl);
      return NextResponse.json({ success: true, previewUrl, trackId });
    }

    return NextResponse.json({
      success: false,
      error: "No preview available for this track",
      trackId
    });

  } catch (error) {
    console.error("Preview fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch preview" }, { status: 500 });
  }
}