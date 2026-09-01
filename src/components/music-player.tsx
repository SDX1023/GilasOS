"use client";

import { useState, useRef, useEffect } from "react";
import { Music, X, Minus } from "lucide-react";

const SPOTIFY_EMBED_URL = "https://open.spotify.com/embed/playlist/68ZULOlqdmWGGTeEsp5lup?utm_source=generator&si=97daf86b3aa24a05";

export function MusicPlayer() {
  const [open, setOpen] = useState(false);
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
      {/* Floating bubble button */}
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed",
          bottom: 90,
          right: 20,
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #1db954, #1ed760)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 20px rgba(29,185,84,0.4), 0 0 0 3px rgba(29,185,84,0.15)",
          zIndex: 1000,
          transition: "all 0.2s",
          transform: open ? "scale(0.9)" : "scale(1)",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = open ? "scale(0.9)" : "scale(1)"; }}
        title="Music Player"
      >
        {open ? <X size={20} color="#000" /> : <Music size={20} color="#000" />}
      </button>

      {/* Popup panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            bottom: 148,
            right: 20,
            width: 360,
            height: 480,
            background: "rgba(15, 21, 35, 0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
            zIndex: 999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <style>{`
            @keyframes slideUp {
              from { opacity: 0; transform: translateY(20px) scale(0.95); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "linear-gradient(135deg, #1db954, #1ed760)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Music size={14} color="#000" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-primary)" }}>Study Playlist</div>
                <div style={{ fontSize: 11, color: "var(--os-text-dim)" }}>Spotify</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{ padding: 5, background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 6, color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} />
            </button>
          </div>

          {/* Embed */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            <iframe
              src={SPOTIFY_EMBED_URL}
              width="100%"
              height="430"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ border: "none" }}
            />
          </div>
        </div>
      )}
    </>
  );
}
