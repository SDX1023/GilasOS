"use client";

import { useState, useRef, useEffect } from "react";
import { Music, X, ChevronUp, ChevronDown } from "lucide-react";

const SPOTIFY_PLAYLIST_ID = "68ZULOlqdmWGGTeEsp5lup";

const TRACKS = [
  { title: "The Winner Takes It All", artist: "ABBA" },
  { title: "Please, Please, Please, Let Me Get What I Want", artist: "The Smiths" },
  { title: "The Archer - Live From Paris", artist: "Taylor Swift" },
  { title: "Hampstead", artist: "Ariana Grande" },
  { title: "Godspeed", artist: "Frank Ocean" },
  { title: "Di Bale Na Lang", artist: "Regine Velasquez" },
  { title: "Parang Baliw", artist: "Sharon Cuneta" },
  { title: "Maps", artist: "Yeah Yeah Yeahs" },
  { title: "Skinny Love", artist: "Bon Iver" },
  { title: "Universe", artist: "Tyler the Creator" },
];

export function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const embedUrl = `https://open.spotify.com/embed/playlist/${SPOTIFY_PLAYLIST_ID}?utm_source=generator&si=97daf86b3aa24a05&theme=0`;

  return (
    <>
      {/* Floating bubble */}
      <button
        ref={btnRef}
        onClick={() => { setOpen(!open); setMinimized(false); if (!hasStarted) setHasStarted(true); }}
        style={{
          position: "fixed", bottom: 90, right: 20,
          width: 50, height: 50, borderRadius: "50%",
          background: hasStarted
            ? "linear-gradient(135deg, rgba(29,185,84,0.95), rgba(30,215,96,0.95))"
            : "rgba(12, 17, 28, 0.95)",
          border: hasStarted
            ? "2px solid rgba(29,185,84,0.5)"
            : "1.5px solid rgba(29,185,84,0.3)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: hasStarted
            ? "0 4px 24px rgba(29,185,84,0.4), 0 0 0 3px rgba(29,185,84,0.12), 0 0 40px rgba(29,185,84,0.15)"
            : "0 4px 20px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.05)",
          zIndex: 10000,
          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          transform: open ? "scale(0.9) rotate(90deg)" : "scale(1)",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.transform = "scale(1)"; }}
        title={open ? "Close music player" : "Open music player"}
      >
        {open ? (
          <X size={18} color="var(--os-text-primary)" />
        ) : hasStarted ? (
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 16 }}>
            <div style={{ width: 3, background: "#000", borderRadius: 1, animation: "mpBar1 0.5s ease infinite" }} />
            <div style={{ width: 3, background: "#000", borderRadius: 1, animation: "mpBar2 0.7s ease infinite" }} />
            <div style={{ width: 3, background: "#000", borderRadius: 1, animation: "mpBar3 0.6s ease infinite" }} />
            <style>{`
              @keyframes mpBar1 { 0%,100% { height: 6px; } 50% { height: 14px; } }
              @keyframes mpBar2 { 0%,100% { height: 10px; } 50% { height: 5px; } }
              @keyframes mpBar3 { 0%,100% { height: 4px; } 50% { height: 12px; } }
            `}</style>
          </div>
        ) : (
          <Music size={18} color="#1db954" />
        )}
      </button>

      {/* Player panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            bottom: minimized ? 150 : 148,
            right: 20,
            width: 380,
            background: "rgba(12, 17, 28, 0.98)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(29,185,84,0.08), inset 0 1px 0 rgba(255,255,255,0.04)",
            zIndex: 10001,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation: "musicSlideUp 0.3s cubic-bezier(0.16,1,0.3,1)",
            maxHeight: minimized ? 56 : 520,
            transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          <style>{`
            @keyframes musicSlideUp {
              from { opacity: 0; transform: translateY(24px) scale(0.96); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
          `}</style>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: minimized ? "none" : "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: "linear-gradient(135deg, #1db954, #1ed760)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(29,185,84,0.3)",
              }}>
                <Music size={14} color="#000" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--os-text-primary)" }}>Study Playlist</div>
                <div style={{ fontSize: 10, color: "var(--os-text-dim)" }}>{TRACKS.length} tracks</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setMinimized(!minimized)} style={{
                padding: 5, background: "rgba(255,255,255,0.04)", border: "none", borderRadius: 6,
                color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {minimized ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>
              <button onClick={() => setOpen(false)} style={{
                padding: 5, background: "rgba(255,255,255,0.04)", border: "none", borderRadius: 6,
                color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Spotify embed — the actual player */}
          {!minimized && hasStarted && (
            <div style={{ padding: "8px 8px 0" }}>
              <iframe
                src={embedUrl}
                width="100%"
                height={152}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ borderRadius: 12 }}
                title="Spotify Player"
              />
            </div>
          )}

          {/* Track list */}
          {!minimized && (
            <div style={{ flex: 1, overflowY: "auto", padding: "8px 8px 12px" }}>
              <div style={{
                padding: "4px 8px 6px", fontSize: 9, fontWeight: 600,
                color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.08em",
              }}>
                Playlist
              </div>
              {TRACKS.map((track, i) => (
                <div key={`${track.title}-${i}`} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "6px 8px",
                  borderRadius: 8, cursor: "default", transition: "background 0.15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{
                    width: 18, textAlign: "center", fontSize: 11,
                    color: "var(--os-text-dim)", fontVariantNumeric: "tabular-nums",
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12, color: "var(--os-text-primary)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {track.title}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--os-text-dim)" }}>{track.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
