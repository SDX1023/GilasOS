import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  console.log("[Spotify] q:", q);
  if (!q) return NextResponse.json({ items: [] });

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  console.log("[Spotify] clientId present:", !!clientId, "clientSecret present:", !!clientSecret);

  if (!clientId || !clientSecret) {
    console.log("[Spotify] Missing env vars — add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET in Render Environment");
    return NextResponse.json({ items: [] });
  }

  try {
    const authString = Buffer.from(clientId + ":" + clientSecret).toString("base64");
    console.log("[Spotify] Requesting token...");
    const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${authString}`,
      },
      body: "grant_type=client_credentials",
    });
    const tokenBody = await tokenRes.text();
    console.log("[Spotify] Token status:", tokenRes.status);
    if (!tokenRes.ok) {
      console.log("[Spotify] Token error:", tokenBody);
      return NextResponse.json({ items: [] });
    }
    const { access_token } = JSON.parse(tokenBody);

    const searchUrl = "https://api.spotify.com/v1/search?q=" + encodeURIComponent(q) + "&type=track&limit=20";
    console.log("[Spotify] Search URL:", searchUrl);
    const searchRes = await fetch(searchUrl, {
      headers: { Authorization: "Bearer " + access_token },
    });
    const searchBody = await searchRes.text();
    console.log("[Spotify] Search status:", searchRes.status);
    if (!searchRes.ok) {
      console.log("[Spotify] Search error:", searchBody);
      return NextResponse.json({ items: [] });
    }

    const data = JSON.parse(searchBody);
    const items = (data.tracks?.items || []).map((item: any) => ({
      id: item.id,
      type: item.type,
      name: item.name,
      artist: item.artists?.map((a: any) => a.name).join(", ") || "",
      album: item.album?.name || "",
      image: item.album?.images?.[0]?.url || "",
      url: item.external_urls?.spotify || "",
      duration_ms: item.duration_ms || 0,
    }));

    console.log("[Spotify] Results:", items.length);
    return NextResponse.json({ items });
  } catch (err: any) {
    console.log("[Spotify] Caught error:", err?.message || err);
    return NextResponse.json({ items: [] });
  }
}
