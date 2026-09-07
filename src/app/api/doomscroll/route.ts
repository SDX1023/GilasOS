import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

// Fallback popular YouTube Shorts (no API key needed)
const FALLBACK_VIDEOS = [
  { id: "gqiE1GOYZRo", title: "MrBeast Challenge", channel: "MrBeast" },
  { id: "kS3mM7WEH0E", title: "Satisfying Soap Cutting", channel: "Satisfying" },
  { id: "EIK4dA0d3Qo", title: "Magic Trick", channel: "Zach King" },
  { id: "pSd4CvsPHtQ", title: "Epic Dunk", channel: "Dude Perfect" },
  { id: "sT7vYbMH5Zw", title: "Amazing Stunt", channel: "How Ridiculous" },
  { id: "lp-EO5I60KA", title: "Cute Animal", channel: "Funny" },
  { id: "jNQXAC9IVRw", title: "First YouTube Video", channel: "YouTube" },
  { id: "dQw4w9WgXcQ", title: "Classic Hit", channel: "Music" },
  { id: "kJQP7kiw5Fk", title: "Top Song", channel: "Music" },
  { id: "JGwWNGJdvx8", title: "Trending Short", channel: "Entertainment" },
  { id: "RgKAFK5djSk", title: "Popular Video", channel: "Music" },
  { id: "fJ9rUzIMcZQ", title: "Bohemian Rhapsody", channel: "Queen" },
  { id: "9bZkp7q19f0", title: "Gangnam Style", channel: "PSY" },
  { id: "kJQP7kiw5Fk", title: "Despacito", channel: "Luis Fonsi" },
  { id: "JGwWNGJdvx8", title: "Shape of You", channel: "Ed Sheeran" },
  { id: "09R8_2nJtjg", title: "Sugar", channel: "Maroon 5" },
  { id: "YQHsXMglC9A", title: "Hello", channel: "Adele" },
  { id: "OPf0YbXqDm0", title: "Uptown Funk", channel: "Bruno Mars" },
];

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const count = parseInt(req.nextUrl.searchParams.get("count") || "12");
    const searchQuery = req.nextUrl.searchParams.get("q") || "";

    // If no API key, return fallback videos
    if (!apiKey) {
      const shuffled = [...FALLBACK_VIDEOS].sort(() => Math.random() - 0.5).slice(0, count);
      return NextResponse.json({ videos: shuffled, fallback: true });
    }

    // Build search queries — split by comma if multiple topics
    const defaultQueries = ["shorts funny", "shorts satisfying", "shorts amazing", "shorts trending", "shorts viral"];
    let queries: string[] = [];
    if (searchQuery) {
      queries = searchQuery.split(",").map((q: string) => q.trim()).filter(Boolean).map((q: string) => q.toLowerCase().includes("shorts") ? q : q + " shorts");
    }
    if (queries.length === 0) {
      queries = [defaultQueries[Math.floor(Math.random() * defaultQueries.length)]];
    }

    // Fetch from each query (up to 3 to avoid rate limits)
    const allVideos: any[] = [];
    for (const q of queries.slice(0, 3)) {
      try {
        const searchParams = new URLSearchParams({
          key: apiKey,
          part: "snippet",
          type: "video",
          q,
          order: "viewCount",
          maxResults: String(Math.min(count, 20)),
        });
        const res = await fetch(`${YOUTUBE_API}/search?${searchParams}`);
        if (res.ok) {
          const data = await res.json();
          for (const item of data.items || []) {
            allVideos.push({
              id: item.id.videoId,
              title: item.snippet.title,
              channel: item.snippet.channelTitle,
              thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
              publishedAt: item.snippet.publishedAt,
            });
          }
        }
      } catch {}
    }

    // Deduplicate by video ID
    const seen = new Set<string>();
    const unique = allVideos.filter((v: any) => { if (seen.has(v.id)) return false; seen.add(v.id); return true; });

    if (unique.length === 0) {
      const shuffled = [...FALLBACK_VIDEOS].sort(() => Math.random() - 0.5).slice(0, count);
      return NextResponse.json({ videos: shuffled, fallback: true });
    }

    // Shuffle and return
    const shuffled = unique.sort(() => Math.random() - 0.5).slice(0, count);
    return NextResponse.json({ videos: shuffled });
  } catch (e) {
    console.error("Doomscroll API error:", e);
    const shuffled = [...FALLBACK_VIDEOS].sort(() => Math.random() - 0.5).slice(0, 12);
    return NextResponse.json({ videos: shuffled, fallback: true });
  }
}
