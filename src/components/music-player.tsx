"use client";

import { useState, useRef, useEffect } from "react";
import { Music, X } from "lucide-react";

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
  const [started, setStarted] = useState(loadStarted);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const miniIframeRef = useRef<HTMLIFrameElement | null>(null);

  const selectedTrack = TRACKS[selectedTrackIndex];

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ started })); } catch {}
  }, [started]);

  // Create mini player iframe (hidden when panel open)
  useEffect(() => {
    if (!started) {
      if (miniIframeRef.current) {
        miniIframeRef.current.remove();
        miniIframeRef.current = null;
      }
      return;
    }

    if (!miniIframeRef.current) {
      const iframe = document.createElement("iframe");
      iframe.src = EMBED_URL;
      iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      iframe.loading = "lazy";
      iframe.title = "Spotify Player";
      iframe.style.cssText = `
        position:fixed;
        bottom:80px;
        right:24px;
        width:320px;
        height:80px;
        border:none;
        border-radius:12px;
        z-index:9999;
        opacity:0.6;
        pointer-events:auto;
        box-shadow: 0 4px 20px rgba(0,0,0,0.5);
        border: 1px solid rgba(255,255,255,0.08);
        transition: opacity 0.3s ease, transform 0.3s ease;
      `;
      iframe.setAttribute("data-mini-spotify", "");
      document.body.appendChild(iframe);
      miniIframeRef.current = iframe;
    }

    return () => {};
  }, [started]);

  // Hide mini player when panel is open
  useEffect(() => {
    const iframe = miniIframeRef.current;
    if (!iframe) return;
    iframe.style.display = open ? "none" : started ? "block" : "none";
  }, [open, started]);

  // Hover effect for mini player
  useEffect(() => {
    const iframe = miniIframeRef.current;
    if (!iframe) return;

    const handleMouseEnter = () => {
      if (!open) {
        iframe.style.opacity = "0.85";
        iframe.style.transform = "scale(1.02)";
      }
    };

    const handleMouseLeave = () => {
      if (!open) {
        iframe.style.opacity = "0.6";
        iframe.style.transform = "scale(1)";
      }
    };

    iframe.addEventListener('mouseenter', handleMouseEnter);
    iframe.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      iframe.removeEventListener('mouseenter', handleMouseEnter);
      iframe.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [open]);

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
        .track-list-scroll::-webkit-scrollbar {
          width: 3px;
        }
        .track-list-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .track-list-scroll::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 99px;
        }
      `}</style>

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

      {open && (
        <div ref={panelRef} style={{
          position: "fixed", 
          bottom: 80, 
          right: 24, 
          width: 380,
          background: "rgba(28, 28, 30, 0.95)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "14px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          zIndex: 10001, 
          overflow: "hidden",
          animation: "slideUp 0.2s ease",
          padding: "16px",
        }}>
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
            <button 
              onClick={() => setOpen(false)}
              style={{ 
                padding: 4, 
                background: "none", 
                border: "none", 
                cursor: "pointer", 
                color: "#666",
                display: "flex",
                borderRadius: "4px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#e5e5e5"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#666"; }}
            >
              <X size={14} />
            </button>
          </div>

          <div style={{
            width: "100%",
            height: 152,
            borderRadius: "12px",
            overflow: "hidden",
            marginBottom: 12,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(0,0,0,0.3)",
          }}>
            <iframe
              key="panel-embed"
              src={EMBED_URL}
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              title="Spotify Player"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
              }}
            />
          </div>

          <div style={{ 
            borderTop: "1px solid rgba(255,255,255,0.04)",
            paddingTop: 10,
          }}>
            <div style={{ 
              fontSize: 10, 
              color: "#555", 
              marginBottom: 6, 
              letterSpacing: "0.05em",
              display: "flex",
              justifyContent: "space-between",
            }}>
              <span>PLAYLIST</span>
              <span style={{ color: "#444" }}>Select a track</span>
            </div>
            <div className="track-list-scroll" style={{ 
              maxHeight: 200,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}>
              {TRACKS.map((track, i) => (
                <div 
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "5px 8px",
                    borderRadius: "6px",
                    fontSize: 11,
                    color: i === selectedTrackIndex ? "#1db954" : "#666",
                    background: i === selectedTrackIndex ? "rgba(29, 185, 84, 0.08)" : "transparent",
                    border: i === selectedTrackIndex ? "1px solid rgba(29, 185, 84, 0.15)" : "1px solid transparent",
                    transition: "all 0.15s",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedTrackIndex(i)}
                  onMouseEnter={(e) => {
                    if (i !== selectedTrackIndex) {
                      e.currentTarget.style.color = "#e5e5e5";
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (i !== selectedTrackIndex) {
                      e.currentTarget.style.color = "#666";
                      e.currentTarget.style.background = "transparent";
                    }
                  }}
                >
                  <span style={{ 
                    width: 18, 
                    fontSize: 9, 
                    color: i === selectedTrackIndex ? "#1db954" : "#444",
                    fontVariantNumeric: "tabular-nums",
                    textAlign: "center",
                  }}>
                    {i + 1}
                  </span>
                  <span style={{ 
                    flex: 1, 
                    overflow: "hidden", 
                    textOverflow: "ellipsis", 
                    whiteSpace: "nowrap",
                    fontWeight: i === selectedTrackIndex ? 500 : 400,
                  }}>
                    {track.title}
                  </span>
                  <span style={{ 
                    fontSize: 9, 
                    color: i === selectedTrackIndex ? "#1db954" : "#555",
                  }}>
                    {track.artist}
                  </span>
                  {i === selectedTrackIndex && (
                    <span style={{
                      fontSize: 8,
                      color: "#1db954",
                      marginLeft: 4,
                    }}>
                      ▶
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
