"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function SpotifyCallback() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      window.opener?.postMessage({ error }, "*");
      window.close();
      return;
    }

    if (!code) {
      window.close();
      return;
    }

    const verifier = sessionStorage.getItem("spotify_pkce_verifier");
    if (!verifier) {
      window.close();
      return;
    }

    const redirectUri = `${window.location.origin}/spotify-callback`;

    fetch("/api/spotify/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, verifier, redirect_uri: redirectUri }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.access_token) {
          window.opener?.postMessage(
            { access_token: data.access_token, refresh_token: data.refresh_token, expires_in: data.expires_in },
            "*"
          );
        } else {
          window.opener?.postMessage({ error: "token_failed" }, "*");
        }
        window.close();
      })
      .catch(() => {
        window.opener?.postMessage({ error: "token_error" }, "*");
        window.close();
      });
  }, [searchParams]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#0a0a14", color: "#888", fontFamily: "system-ui" }}>
      Connecting to Spotify...
    </div>
  );
}
