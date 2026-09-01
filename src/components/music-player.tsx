"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Music, X, ChevronUp, ChevronDown, Play, Pause } from "lucide-react";

const PLAYLIST_ID = "68ZULOlqdmWGGTeEsp5lup";

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

const EMBED_URL = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator&si=97daf86b3aa24a05&theme=0`;
const STORAGE_KEY = "gilasos-music-player";

function loadStarted(): boolean {
  if (typeof window === "undefined") return false;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}").started === true; } catch { return false; }
}

export function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [started, setStarted] = useState(loadStarted);
  const [isPlaying, setIsPlaying] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const showInScreen = open && !minimized && started;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ started })); } catch {}
  }, [started]);

  useLayoutEffect(() => {
    if (!started) {
      if (iframeRef.current) {
        iframeRef.current.remove();
        iframeRef.current = null;
      }
      return;
    }

    if (!iframeRef.current) {
      const iframe = document.createElement("iframe");
      iframe.src = EMBED_URL;
      iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      iframe.loading = "lazy";
      iframe.title = "Spotify Player";
      iframe.style.cssText = "position:fixed;bottom:0;left:0;width:100%;height:80px;border:none;z-index:9999;";
      document.body.appendChild(iframe);
      iframeRef.current = iframe;
      
      // Auto-play when iframe loads
      iframe.onload = () => setIsPlaying(true);
    }

    const iframe = iframeRef.current;
    const screen = screenRef.current;

    if (started) {
      if (showInScreen && screen) {
        const r = screen.getBoundingClientRect();
        iframe.style.cssText = `
          position:fixed;
          top:${r.top}px;
          left:${r.left}px;
          width:${r.width}px;
          height:${r.height}px;
          border:2px solid rgba(255,255,255,0.1);
          border-radius:8px;
          z-index:10002;
          opacity:1;
          pointer-events:auto;
        `;
      } else {
        iframe.style.cssText = `
          position:fixed;
          bottom:0;
          left:0;
          width:100%;
          height:80px;
          border:none;
          z-index:9999;
          opacity:1;
          pointer-events:none;
        `;
      }
    }

    return () => {};
  }, [showInScreen, open, minimized, started]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        btnRef.current && !btnRef.current.contains(e.target as Node)
      ) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (!open) setMinimized(false);
  }, [open]);

  const togglePlay = () => {
    if (!started) {
      setStarted(true);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
      // Toggle iframe visibility/playback
      if (iframeRef.current) {
        if (isPlaying) {
          iframeRef.current.style.opacity = "0";
        } else {
          iframeRef.current.style.opacity = "1";
        }
      }
    }
  };

  return (
    <div data-music-player>
      <style>{`
        @keyframes slideUp { 
          from { opacity: 0; transform: translateY(10px) scale(0.98); } 
          to { opacity: 1; transform: translateY(0) scale(1); } 
        }
        .os-scroll::-webkit-scrollbar { width: 4px; }
        .os-scroll::-webkit-scrollbar-track { background: transparent; }
        .os-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
        .os-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>

      {/* Minimal OS-style button */}
      <button 
        ref={btnRef} 
        onClick={() => { setOpen(!open); if (!started) setStarted(true); }}
        style={{
          position: "fixed", 
          bottom: 20, 
          right: 20, 
          width: 40, 
          height: 40, 
          borderRadius: "10px",
          background: "rgba(18, 18, 18, 0.9)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          cursor: "pointer", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          zIndex: 10000, 
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(30, 30, 30, 0.95)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(18, 18, 18, 0.9)";
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
        }}
      >
        {open ? (
          <X size={16} color="#fff" />
        ) : started ? (
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
            <div style={{ width: 2.5, background: "#1db954", borderRadius: 1, animation: "mpBar1 0.5s ease infinite" }} />
            <div style={{ width: 2.5, background: "#1db954", borderRadius: 1, animation: "mpBar2 0.7s ease infinite" }} />
            <div style={{ width: 2.5, background: "#1db954", borderRadius: 1, animation: "mpBar3 0.6s ease infinite" }} />
            <style>{`@keyframes mpBar1{0%,100%{height:6px}50%{height:12px}}@keyframes mpBar2{0%,100%{height:8px}50%{height:4px}}@keyframes mpBar3{0%,100%{height:4px}50%{height:10px}}`}</style>
          </div>
        ) : (
          <Music size={16} color="#666" />
        )}
      </button>

      {/* OS-style panel */}
      {open && (
        <div ref={panelRef} style={{
          position: "fixed", 
          bottom: 70, 
          right: 20, 
          width: 320,
          background: "rgba(22, 22, 22, 0.95)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          zIndex: 10001, 
          overflow: "hidden",
          animation: "slideUp 0.25s cubic-bezier(0.16,1,0.3,1)",
          maxHeight: minimized ? 60 : 480,
          transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}>
          {minimized ? (
            // Minimized view - compact OS style
            <div style={{
              display: "flex", 
              alignItems: "center", 
              gap: 10, 
              padding: "10px 12px",
              cursor: "pointer",
            }} onClick={() => setMinimized(false)}>
              <div style={{
                width: 32, 
                height: 32, 
                borderRadius: "6px", 
                background: "rgba(29, 185, 84, 0.15)",
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
              }}>
                <Music size={14} color="#1db954" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#e0e0e0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  Now Playing
                </div>
                <div style={{ fontSize: 10, color: "#888" }}>GILAS Playlist • {TRACKS.length} songs</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                  style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#888" }}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                  style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#666" }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            // Expanded view
            <div style={{ padding: "16px" }}>
              {/* Header */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "space-between",
                marginBottom: 12,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{
                    width: 28,
                    height: 28,
                    borderRadius: "6px",
                    background: "rgba(29, 185, 84, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Music size={14} color="#1db954" />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#e0e0e0" }}>Music</div>
                    <div style={{ fontSize: 10, color: "#666" }}>{TRACKS.length} tracks</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 2 }}>
                  <button 
                    onClick={() => setMinimized(true)}
                    style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#666" }}
                  >
                    <ChevronDown size={14} />
                  </button>
                  <button 
                    onClick={() => setOpen(false)}
                    style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "#666" }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Spotify embed placeholder */}
              <div 
                ref={screenRef}
                style={{
                  width: "100%",
                  height: 160,
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "8px",
                  border: "1px solid rgba(255,255,255,0.05)",
                  overflow: "hidden",
                  position: "relative",
                  marginBottom: 12,
                }}
              >
                {!started && (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#555",
                  }}>
                    <Music size={24} style={{ opacity: 0.3, marginBottom: 6 }} />
                    <div style={{ fontSize: 10, fontWeight: 400, letterSpacing: "0.05em" }}>
                      Click play to start
                    </div>
                  </div>
                )}
              </div>

              {/* Play button */}
              <button
                onClick={togglePlay}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "rgba(29, 185, 84, 0.1)",
                  border: "1px solid rgba(29, 185, 84, 0.2)",
                  borderRadius: "6px",
                  color: "#1db954",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.2s",
                  marginBottom: 12,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(29, 185, 84, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(29, 185, 84, 0.1)";
                }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                {isPlaying ? "Pause" : "Play"}
              </button>

              {/* Track list - OS-style minimal */}
              <div className="os-scroll" style={{ 
                maxHeight: 180, 
                overflowY: "auto",
                borderTop: "1px solid rgba(255,255,255,0.04)",
                paddingTop: 8,
              }}>
                {TRACKS.slice(0, 10).map((track, i) => (
                  <div 
                    key={`${track.title}-${i}`} 
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "4px 6px",
                      borderRadius: "4px",
                      transition: "background 0.15s",
                      cursor: "default",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div style={{ 
                      width: 16, 
                      textAlign: "center", 
                      fontSize: 9, 
                      color: "#555",
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: "#ccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {track.title}
                      </div>
                      <div style={{ fontSize: 9, color: "#666", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {track.artist}
                      </div>
                    </div>
                  </div>
                ))}
                {TRACKS.length > 10 && (
                  <div style={{ 
                    fontSize: 10, 
                    color: "#555", 
                    textAlign: "center", 
                    padding: "6px 0",
                    borderTop: "1px solid rgba(255,255,255,0.03)",
                    marginTop: 4,
                  }}>
                    +{TRACKS.length - 10} more songs
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}