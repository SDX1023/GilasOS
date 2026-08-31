import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get("code");
    const redirectUri = req.nextUrl.searchParams.get("redirect_uri");

    if (!code || !redirectUri) {
      return NextResponse.json({ error: "Missing code or redirect_uri" }, { status: 400 });
    }

    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }).toString(),
    });

    const data = await tokenResponse.json();

    if (!data.access_token) {
      return NextResponse.json({ error: "Failed to exchange code", details: data }, { status: 400 });
    }

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    console.error("Spotify token exchange error:", error);
    return NextResponse.json({ error: "Token exchange failed" }, { status: 500 });
  }
}
