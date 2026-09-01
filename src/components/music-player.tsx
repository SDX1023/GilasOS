"use client";

import { useState, useRef, useEffect } from "react";
import { Music, X, Minus } from "lucide-react";

const SPOTIFY_EMBED_URL = "https://open.spotify.com/embed/playlist/68ZULOlqdmWGGTeEsp5lup?utm_source=generator&si=97daf86b3aa24a05";

export function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => { setOpen(!open); setMinimized(false); }}
        className="nav-link"
        style={{
          display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 12,
          fontSize: 13, fontWeight: 500, background: "transparent", border: "none", cursor: "pointer",
          color: open ? "var(--os-accent)" : "var(--os-text-dim)",
        }}
        title="Music Player"
      >
        <Music size={15} />
      </button>

      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            bottom: minimized ? 80 : "auto",
            right: minimized ? 20 : 20,
            top: minimized ? "auto" : 60,
            width: 380,
            maxHeight: minimized ? 52 : 520,
            background: "rgba(15, 21, 35, 0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
            zIndex: 100,
            overflow: "hidden",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: minimized ? "none" : "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #1db954, #1ed760)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Music size={14} color="#000" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-primary)" }}>Study Playlist</div>
                <div style={{ fontSize: 11, color: "var(--os-text-dim)" }}>Spotify</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setMinimized(!minimized)} style={{ padding: 5, background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Minus size={14} />
              </button>
              <button onClick={() => setOpen(false)} style={{ padding: 5, background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Embed */}
          {!minimized && (
            <div style={{ flex: 1, overflow: "hidden" }}>
              <iframe
                src={SPOTIFY_EMBED_URL}
                width="100%"
                height="460"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ border: "none", borderRadius: "0 0 16px 16px" }}
              />
            </div>
          )}
        </div>
      )}
    </>
  );
}
