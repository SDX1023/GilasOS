import { NextRequest, NextResponse } from "next/server";

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || "";
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET || "";

async function getToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return null;
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const type = req.nextUrl.searchParams.get("type") || "track";
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const token = await getToken();
  if (!token) return NextResponse.json({ error: "Spotify not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to environment variables." }, { status: 503 });

  const params = new URLSearchParams({ q, type, limit: "12", market: "US" });
  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return NextResponse.json({ error: "Spotify API error" }, { status: 502 });

  const data = await res.json();
  const items = (data.tracks?.items || data.albums?.items || data.playlists?.items || []).map((item: any) => ({
    id: item.id,
    type: item.type,
    name: item.name,
    artist: item.artists?.map((a: any) => a.name).join(", ") || "",
    album: item.album?.name || "",
    image: item.album?.images?.[0]?.url || item.images?.[0]?.url || "",
    url: item.external_urls?.spotify || "",
    duration_ms: item.duration_ms || 0,
  }));

  return NextResponse.json({ items });
}
