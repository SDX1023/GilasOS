import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

// Popular shorts-friendly channels
const SHORTS_CHANNELS = [
  "UCq-F1-OHl39Ydv4yqDmfd0g", // MrBeast
  "UCaWd1-zx2Eh-3uoQ3MGq6XA", // Dude Perfect
  "UC6nSFh2tBYHqwoKIl6Mf8Kg", // Zach King
  "UCg6o6sTblzmNnO071nirAgg", // Wassabi
  "UCuHwh7WAngWjN1o4LeF1qLQ", // How Ridiculous
  "UCcC5bShJuQ9NPiF9it0Lxhw", // Satisfying
  "UCgC0p9Ln3Y4c0yUG_YKb0dA", // F ela
];

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "YouTube API key not configured" }, { status: 500 });
    }

    const count = parseInt(req.nextUrl.searchParams.get("count") || "12");
    const channelId = req.nextUrl.searchParams.get("channelId");

    // Fetch videos from YouTube
    const searchParams = new URLSearchParams({
      key: apiKey,
      part: "snippet",
      type: "video",
      videoDuration: "short",
      order: "viewCount",
      maxResults: String(Math.min(count, 50)),
      regionCode: "PH",
      ...(channelId ? { channelId } : {}),
    });

    // If no specific channel, pick random ones
    if (!channelId) {
      const shuffled = [...SHORTS_CHANNELS].sort(() => Math.random() - 0.5).slice(0, 3);
      // YouTube search doesn't support multiple channelIds, so we pick one
      searchParams.set("channelId", shuffled[0]);
    }

    const res = await fetch(`${YOUTUBE_API}/search?${searchParams}`);
    if (!res.ok) {
      const err = await res.text();
      console.error("YouTube API error:", err);
      return NextResponse.json({ error: "Failed to fetch videos" }, { status: 502 });
    }

    const data = await res.json();
    const videos = (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
    }));

    return NextResponse.json({ videos });
  } catch (e) {
    console.error("Doomscroll API error:", e);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
