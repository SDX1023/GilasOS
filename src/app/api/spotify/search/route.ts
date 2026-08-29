import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const type = req.nextUrl.searchParams.get("type") || "track";
  if (!q) return NextResponse.json({ error: "Missing query" }, { status: 400 });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    console.log("[Spotify] Missing env vars");
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(clientId + ":" + clientSecret).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.log("[Spotify] Token failed:", tokenRes.status, err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }
  const { access_token } = await tokenRes.json();

  const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=${type}&limit=12`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!searchRes.ok) {
    const err = await searchRes.text();
    console.log("[Spotify] Search failed:", searchRes.status, err);
    return NextResponse.json({ items: [] }, { status: 200 });
  }

  const data = await searchRes.json();
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
