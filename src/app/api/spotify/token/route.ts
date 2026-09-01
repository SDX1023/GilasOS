import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { code, verifier, redirect_uri } = await req.json();
    if (!code || !verifier) {
      return NextResponse.json({ error: "Missing code or verifier" }, { status: 400 });
    }

    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirect_uri || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/spotify/callback`,
        client_id: process.env.SPOTIFY_CLIENT_ID!,
        code_verifier: verifier,
      }),
    });

    const data = await response.json();

    if (!data.access_token) {
      return NextResponse.json({ error: "Token exchange failed", details: data }, { status: 400 });
    }

    return NextResponse.json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });
  } catch (error) {
    return NextResponse.json({ error: "Token exchange error" }, { status: 500 });
  }
}
