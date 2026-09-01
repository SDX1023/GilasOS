"use client";

import { useState, useRef, useEffect } from "react";
import { Music, X, ChevronDown } from "lucide-react";

const PLAYLIST_ID = "68ZULOlqdmWGGTeEsp5lup";
const STORAGE_KEY = "gilasos-music-player";

const TRACKS = [
  { title: "The Winner Takes It All", artist: "ABBA" },
  { title: "Please, Please, Please, Let Me Get What I Want", artist: "The Smiths" },
  { title: "The Archer - Live From Paris", artist: "Taylor Swift" },
  { title: "Hampstead", artist: "Ariana Grande" },
  { title: "Godspeed", artist: "Frank Ocean" },
  { title: "Sure Thing", artist: "Miguel" },
  { title: "Bags", artist: "Clairo" },
  { title: "Let Alone The One You Love", artist: "Olivia Dean" },
  { title: "Love You Anyway", artist: "The Marias" },
  { title: "The Weekend", artist: "SZA" },
  { title: "Take Me Away", artist: "Daniel Caesar, Syd" },
  { title: "Into You", artist: "Ariana Grande" },
  { title: "Sway", artist: "Bic Runga" },
  { title: "On My Own", artist: "Samantha Barks" },
  { title: "Iris", artist: "The Goo Goo Dolls" },
  { title: "The Man Who Can't Be Moved", artist: "The Script" },
  { title: "Kiss Me", artist: "Sixpence None The Richer" },
  { title: "Lovefool", artist: "The Cardigans" },
  { title: "Fantasy", artist: "Mariah Carey" },
  { title: "Dance with Me Tonight", artist: "Olly Murs" },
  { title: "Teenage Dirtbag", artist: "Wheatus" },
  { title: "Put Your Records On", artist: "Corinne Bailey Rae" },
  { title: "Love On The Brain", artist: "Rihanna" },
  { title: "If I Ain't Got You", artist: "Alicia Keys" },
  { title: "Sunday Morning", artist: "Maroon 5" },
  { title: "She Will Be Loved", artist: "Maroon 5" },
  { title: "Chasing Pavements", artist: "Adele" },
  { title: "All I Ask", artist: "Adele" },
  { title: "When We Were Young", artist: "Adele" },
  { title: "Complicated", artist: "Avril Lavigne" },
  { title: "Pocketful of Sunshine", artist: "Natasha Bedingfield" },
  { title: "Just the Way You Are", artist: "Bruno Mars" },
  { title: "Bleeding Love", artist: "Leona Lewis" },
  { title: "Make You Feel My Love", artist: "Adele" },
  { title: "Hey There Delilah", artist: "Plain White T's" },
  { title: "One Last Time", artist: "Ariana Grande" },
  { title: "No Scrubs", artist: "TLC" },
  { title: "Love On Top", artist: "Beyonce" },
  { title: "I'm Yours", artist: "Jason Mraz" },
  { title: "No One", artist: "Alicia Keys" },
  { title: "Need You Now", artist: "Lady A" },
  { title: "We Are Young", artist: "fun., Janelle Monae" },
  { title: "Piano Man", artist: "Billy Joel" },
  { title: "If I Were a Boy", artist: "Beyonce" },
  { title: "Di Bale Na Lang", artist: "Regine Velasquez" },
  { title: "Parang Baliw", artist: "Sharon Cuneta" },
  { title: "Maps", artist: "Yeah Yeah Yeahs" },
  { title: "Skinny Love", artist: "Bon Iver" },
  { title: "Universe", artist: "Tyler the Creator" },
];

const EMBED_URL = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&theme=0`;

function loadStarted(): boolean {
  if (typeof window === "undefined") return false;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").started === true; } catch { return false; }
}

export function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [started, setStarted] = useState(loadStarted);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ started })); } catch {}
  }, [started]);

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

  useEffect(() => {
    if (!open) setMinimized(false);
  }, [open]);

  return (
    <div data-music-player>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes bar1 { 0%,100% { height: 6px; } 50% { height: 14px; } }
        @keyframes bar2 { 0%,100% { height: 10px; } 50% { height: 4px; } }
        @keyframes bar3 { 0%,100% { height: 8px; } 50% { height: 12px; } }
      `}</style>

      {/* Floating button */}
      <button 
        ref={btnRef} 
        onClick={() => { setOpen(!open); if (!started) setStarted(true); }}
        style={{
          position: "fixed", 
          bottom: 24, 
          right: 24, 
          width: 44, 
          height: 44, 
          borderRadius: "12px",
          background: open ? "rgba(30,30,30,0.95)" : "rgba(20,20,20,0.9)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.06)",
          cursor: "pointer", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          boxShadow: "0 2px 16px rgba(0,0,0,0.4)",
          zIndex: 10000, 
          transition: "all 0.2s ease",
        }}
      >
        {open ? (
          <X size={18} color="#999" />
        ) : started ? (
          <div style={{ display: "flex", gap: 2.5, alignItems: "flex-end", height: 16 }}>
            <div style={{ width: 2.5, background: "#1db954", borderRadius: 1, animation: "bar1 0.6s ease-in-out infinite" }} />
            <div style={{ width: 2.5, background: "#1db954", borderRadius: 1, animation: "bar2 0.8s ease-in-out infinite 0.2s" }} />
            <div style={{ width: 2.5, background: "#1db954", borderRadius: 1, animation: "bar3 0.7s ease-in-out infinite 0.4s" }} />
          </div>
        ) : (
          <Music size={18} color="#666" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div ref={panelRef} style={{
          position: "fixed", 
          bottom: 80, 
          right: 24, 
          width: 360,
          background: "rgba(28, 28, 30, 0.95)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "14px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          zIndex: 10001, 
          overflow: "hidden",
          animation: "slideUp 0.2s ease",
          padding: minimized ? "12px 16px" : "16px",
          maxHeight: minimized ? 72 : 580,
          transition: "max-height 0.3s ease, padding 0.3s ease",
        }}>
          {minimized ? (
            // Minimized view
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 12,
            }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: "8px",
                background: "linear-gradient(135deg, #1db954, #1ed760)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                boxShadow: "0 2px 8px rgba(29, 185, 84, 0.3)",
              }}>
                <Music size={20} color="#fff" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ 
                  fontSize: 13, 
                  fontWeight: 500, 
                  color: "#e5e5e5", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap",
                  marginBottom: 2,
                }}>
                  {currentTrack.title}
                </div>
                <div style={{ 
                  fontSize: 11, 
                  color: "#888", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis", 
                  whiteSpace: "nowrap" 
                }}>
                  {currentTrack.artist}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setMinimized(false);
                }}
                style={{
                  padding: "6px 12px",
                  background: "rgba(255,255,255,0.06)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#888",
                  cursor: "pointer",
                  fontSize: 11,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                  e.currentTarget.style.color = "#e5e5e5";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                  e.currentTarget.style.color = "#888";
                }}
              >
                Expand
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                style={{
                  padding: "4px",
                  background: "none",
                  border: "none",
                  color: "#555",
                  cursor: "pointer",
                  display: "flex",
                }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            // Expanded view with FULL Spotify embed
            <>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                marginBottom: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Music size={14} color="#1db954" />
                  <span style={{ fontSize: 13, fontWeight: 500, color: "#e5e5e5" }}>
                    GILAS Playlist
                  </span>
                  <span style={{ fontSize: 11, color: "#555" }}>
                    · {TRACKS.length} songs
                  </span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button 
                    onClick={() => setMinimized(true)}
                    style={{ 
                      padding: 4, 
                      background: "none", 
                      border: "none", 
                      cursor: "pointer", 
                      color: "#666",
                      display: "flex",
                    }}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button 
                    onClick={() => setOpen(false)}
                    style={{ 
                      padding: 4, 
                      background: "none", 
                      border: "none", 
                      cursor: "pointer", 
                      color: "#666",
                      display: "flex",
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Current track display */}
              <div style={{ 
                padding: "10px 14px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "8px",
                marginBottom: 12,
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#e5e5e5", marginBottom: 2 }}>
                  {currentTrack.title}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {currentTrack.artist}
                </div>
              </div>

              {/* FULL SPOTIFY EMBED - Now with correct height */}
              <div style={{
                width: "100%",
                height: 152,
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: 12,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(0,0,0,0.3)",
              }}>
                {started ? (
                  <iframe
                    src={EMBED_URL}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    title="Spotify Player"
                    style={{
                      width: "100%",
                      height: "100%",
                      border: "none",
                      display: "block",
                    }}
                  />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#444",
                  }}>
                    <Music size={24} style={{ opacity: 0.3, marginBottom: 8 }} />
                    <div style={{ fontSize: 11, letterSpacing: "0.05em" }}>
                      Click the music icon to start
                    </div>
                  </div>
                )}
              </div>

              {/* Track list */}
              <div style={{ 
                marginTop: 8,
                borderTop: "1px solid rgba(255,255,255,0.04)",
                paddingTop: 10,
                maxHeight: 200,
                overflowY: "auto",
              }}>
                <div style={{ fontSize: 10, color: "#555", marginBottom: 6, letterSpacing: "0.05em" }}>
                  PLAYLIST
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {TRACKS.slice(0, 8).map((track, i) => (
                    <div 
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: 11,
                        color: i === currentTrackIndex ? "#1db954" : "#666",
                        background: i === currentTrackIndex ? "rgba(29, 185, 84, 0.08)" : "transparent",
                        transition: "all 0.15s",
                        cursor: "default",
                      }}
                    >
                      <span style={{ 
                        width: 16, 
                        fontSize: 9, 
                        color: i === currentTrackIndex ? "#1db954" : "#444",
                        fontVariantNumeric: "tabular-nums",
                      }}>
                        {i + 1}
                      </span>
                      <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {track.title}
                      </span>
                      <span style={{ fontSize: 9, color: "#555" }}>
                        {track.artist}
                      </span>
                    </div>
                  ))}
                  {TRACKS.length > 8 && (
                    <div style={{ fontSize: 10, color: "#444", padding: "4px 8px" }}>
                      +{TRACKS.length - 8} more songs
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}