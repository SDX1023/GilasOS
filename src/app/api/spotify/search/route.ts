import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json({ error: "No search query provided" }, { status: 400 });
    }

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      return NextResponse.json({ error: "Failed to get Spotify access token", details: tokenData }, { status: 500 });
    }

    const offset = searchParams.get("offset") || "0";
    const searchResponse = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20&offset=${offset}`,
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    const data = await searchResponse.json();

    if (!data.tracks || data.tracks.items.length === 0) {
      return NextResponse.json({ tracks: [], message: "No results found" });
    }

    const tracks = data.tracks.items.map((track: any) => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map((a: any) => a.name).join(", "),
      album: track.album.name,
      albumArt: track.album.images[0]?.url || null,
      url: track.external_urls.spotify,
      preview: track.preview_url,
      uri: track.uri,
      duration_ms: track.duration_ms,
    }));

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error("Spotify search error:", error);
    return NextResponse.json({ error: "Failed to search Spotify" }, { status: 500 });
  }
}
