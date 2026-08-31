"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SpotifyCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash) { router.replace("/study"); return; }
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get("access_token");
    if (accessToken) {
      localStorage.setItem("spotify_access_token", accessToken);
      localStorage.setItem("spotify_token_expiry", String(Date.now() + 3600000));
    }
    router.replace("/study");
  }, [router]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "var(--os-text-secondary)" }}>
      Connecting to Spotify...
    </div>
  );
}
