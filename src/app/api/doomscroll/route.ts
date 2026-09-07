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

    // Use user's search query or default random queries
    const defaultQueries = ["shorts funny", "shorts satisfying", "shorts amazing", "shorts trending", "shorts viral"];
    const randomQuery = searchQuery || defaultQueries[Math.floor(Math.random() * defaultQueries.length)];

    const searchParams = new URLSearchParams({
      key: apiKey,
      part: "snippet",
      type: "video",
      q: randomQuery,
      order: "viewCount",
      maxResults: String(Math.min(count, 50)),
    });

    const res = await fetch(`${YOUTUBE_API}/search?${searchParams}`);
    if (!res.ok) {
      const shuffled = [...FALLBACK_VIDEOS].sort(() => Math.random() - 0.5).slice(0, count);
      return NextResponse.json({ videos: shuffled, fallback: true });
    }

    const data = await res.json();
    const videos = (data.items || []).map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
      publishedAt: item.snippet.publishedAt,
    }));

    if (videos.length === 0) {
      const shuffled = [...FALLBACK_VIDEOS].sort(() => Math.random() - 0.5).slice(0, count);
      return NextResponse.json({ videos: shuffled, fallback: true });
    }

    return NextResponse.json({ videos });
  } catch (e) {
    console.error("Doomscroll API error:", e);
    const shuffled = [...FALLBACK_VIDEOS].sort(() => Math.random() - 0.5).slice(0, 12);
    return NextResponse.json({ videos: shuffled, fallback: true });
  }
}
