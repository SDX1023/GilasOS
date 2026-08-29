import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  const type = req.nextUrl.searchParams.get("type") || "track";
  if (!q) return NextResponse.json({ items: [] });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return NextResponse.json({ items: [] });

  try {
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(clientId + ":" + clientSecret).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });
    if (!tokenRes.ok) return NextResponse.json({ items: [] });
    const { access_token } = await tokenRes.json();

    const params = new URLSearchParams();
    params.append("q", q);
    params.append("type", type);
    params.append("limit", "20");

    const searchRes = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
    if (!searchRes.ok) return NextResponse.json({ items: [] });

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
  } catch {
    return NextResponse.json({ items: [] });
  }
}
