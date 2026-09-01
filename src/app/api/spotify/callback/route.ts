import { NextRequest, NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.json({ error: "No code provided" }, { status: 400 });
  }

  try {
    const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/spotify/callback`,
        client_id: process.env.SPOTIFY_CLIENT_ID!,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
      }),
    });

    const data = await tokenResponse.json();

    if (!data.access_token) {
      return new NextResponse(`<script>window.opener.postMessage({error:"token_failed"}, "*");window.close();</script>`, {
        headers: { "Content-Type": "text/html" },
      });
    }

    const html = `<script>
      window.opener.postMessage({access_token:"${data.access_token}",refresh_token:"${data.refresh_token || ""}",expires_in:${data.expires_in || 3600}}, "*");
      window.close();
    </script>`;

    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  } catch (error) {
    return new NextResponse(`<script>window.opener.postMessage({error:"token_error"}, "*");window.close();</script>`, {
      headers: { "Content-Type": "text/html" },
    });
  }
}
