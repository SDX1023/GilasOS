"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SpotifyCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const err = params.get("error");

    if (err) {
      setError(`Spotify auth denied: ${err}`);
      return;
    }

    if (!code) {
      router.replace("/study");
      return;
    }

    const redirectUri = `${window.location.origin}/spotify-callback`;

    fetch(`/api/spotify/token?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirectUri)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.access_token) {
          localStorage.setItem("spotify_access_token", data.access_token);
          localStorage.setItem("spotify_refresh_token", data.refresh_token || "");
          localStorage.setItem("spotify_token_expiry", String(Date.now() + data.expires_in * 1000));
          router.replace("/study");
        } else {
          setError("Failed to get Spotify token");
        }
      })
      .catch(() => setError("Connection failed"));
  }, [router]);

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", color: "#ef4444", gap: 16 }}>
        <p>{error}</p>
        <button onClick={() => router.replace("/study")} style={{ padding: "8px 20px", borderRadius: 8, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", cursor: "pointer" }}>Go back</button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--os-text-secondary)" }}>
      Connecting to Spotify...
    </div>
  );
}
