import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q) return NextResponse.json({ items: [] });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.json({ items: [], error: "no credentials" });

  const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials&client_id=" + encodeURIComponent(clientId) + "&client_secret=" + encodeURIComponent(clientSecret),
  });
  if (!tokenRes.ok) return NextResponse.json({ items: [], error: "token failed" });
  const tokenData = await tokenRes.json();

  const searchRes = await fetch("https://api.spotify.com/v1/search?q=" + encodeURIComponent(q) + "&type=track&limit=20", {
    headers: { Authorization: "Bearer " + tokenData.access_token },
  });
  if (!searchRes.ok) {
    const err = await searchRes.text();
    return NextResponse.json({ items: [], error: err });
  }

  const data = await searchRes.json();
  const items = (data.tracks?.items || []).map((item: any) => ({
    id: item.id,
    name: item.name,
    artist: item.artists?.map((a: any) => a.name).join(", ") || "",
    image: item.album?.images?.[0]?.url || "",
    url: item.external_urls?.spotify || "",
    duration_ms: item.duration_ms || 0,
  }));

  return NextResponse.json({ items });
}
