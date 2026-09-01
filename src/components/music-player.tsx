"use client";

import { useState, useRef, useEffect } from "react";
import { Music, X, Play, Pause, ChevronDown, SkipForward, SkipBack } from "lucide-react";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const currentTrack = TRACKS[currentTrackIndex];

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ started })); } catch {}
  }, [started]);

  // Create and manage iframe
  useEffect(() => {
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
      iframe.style.cssText = `
        position:fixed;
        bottom:0;
        left:0;
        width:100%;
        height:80px;
        border:none;
        z-index:9999;
        opacity:1;
        pointer-events:auto;
      `;
      document.body.appendChild(iframe);
      iframeRef.current = iframe;
      
      // Auto-play when iframe loads
      iframe.onload = () => {
        setIsPlaying(true);
        startProgressSimulation();
      };
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [started]);

  // Position iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    const screen = screenRef.current;

    if (!iframe || !started) return;

    if (open && !minimized && screen) {
      const r = screen.getBoundingClientRect();
      iframe.style.cssText = `
        position:fixed;
        top:${r.top}px;
        left:${r.left}px;
        width:${r.width}px;
        height:${r.height}px;
        border:none;
        border-radius:6px;
        z-index:10002;
        opacity:1;
        pointer-events:auto;
      `;
    } else {
      // Keep iframe visible at bottom for background playback
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
  }, [open, minimized, started]);

  // Close panel on outside click
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

  const startProgressSimulation = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    
    setProgress(0);
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 180) { // 3 minutes
          // Auto-advance to next track
          const next = (currentTrackIndex + 1) % TRACKS.length;
          setCurrentTrackIndex(next);
          if (iframeRef.current) {
            iframeRef.current.src = EMBED_URL;
          }
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (!started) {
      setStarted(true);
      setIsPlaying(true);
      // Create iframe with autoplay
      if (!iframeRef.current) {
        const iframe = document.createElement("iframe");
        iframe.src = EMBED_URL;
        iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
        iframe.loading = "lazy";
        iframe.title = "Spotify Player";
        iframe.style.cssText = `
          position:fixed;
          bottom:0;
          left:0;
          width:100%;
          height:80px;
          border:none;
          z-index:9999;
          opacity:1;
          pointer-events:auto;
        `;
        document.body.appendChild(iframe);
        iframeRef.current = iframe;
        iframe.onload = () => {
          startProgressSimulation();
        };
      }
      return;
    }

    setIsPlaying(!isPlaying);
    if (isPlaying) {
      // Pause - hide iframe
      if (iframeRef.current) {
        iframeRef.current.style.opacity = "0.3";
      }
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    } else {
      // Resume - show iframe and reload
      if (iframeRef.current) {
        iframeRef.current.style.opacity = "1";
        iframeRef.current.src = EMBED_URL;
        setTimeout(() => {
          startProgressSimulation();
        }, 500);
      }
    }
  };

  const nextTrack = () => {
    const next = (currentTrackIndex + 1) % TRACKS.length;
    setCurrentTrackIndex(next);
    setProgress(0);
    if (isPlaying && iframeRef.current) {
      iframeRef.current.src = EMBED_URL;
      setTimeout(startProgressSimulation, 500);
    }
  };

  const prevTrack = () => {
    const prev = (currentTrackIndex - 1 + TRACKS.length) % TRACKS.length;
    setCurrentTrackIndex(prev);
    setProgress(0);
    if (isPlaying && iframeRef.current) {
      iframeRef.current.src = EMBED_URL;
      setTimeout(startProgressSimulation, 500);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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
        ) : started && isPlaying ? (
          <div style={{ display: "flex", gap: 2.5, alignItems: "flex-end", height: 16 }}>
            <div style={{ width: 2.5, background: "#1db954", borderRadius: 1, animation: "bar1 0.6s ease-in-out infinite" }} />
            <div style={{ width: 2.5, background: "#1db954", borderRadius: 1, animation: "bar2 0.8s ease-in-out infinite 0.2s" }} />
            <div style={{ width: 2.5, background: "#1db954", borderRadius: 1, animation: "bar3 0.7s ease-in-out infinite 0.4s" }} />
          </div>
        ) : started ? (
          <Play size={18} color="#1db954" />
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
          width: 300,
          background: "rgba(28, 28, 30, 0.92)",
          backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "12px",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
          zIndex: 10001, 
          overflow: "hidden",
          animation: "slideUp 0.2s ease",
          padding: minimized ? "12px 16px" : "16px",
          maxHeight: minimized ? 68 : 480,
          transition: "max-height 0.3s ease, padding 0.3s ease",
        }}>
          {minimized ? (
            // Minimized view
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 10,
              cursor: "pointer",
            }} onClick={() => setMinimized(false)}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: "8px",
                background: "rgba(29, 185, 84, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Music size={16} color="#1db954" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: "#e5e5e5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentTrack.title}
                </div>
                <div style={{ fontSize: 10, color: "#888", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {currentTrack.artist}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay(e);
                }}
                style={{
                  padding: "6px",
                  background: "rgba(29, 185, 84, 0.1)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#1db954",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s",
                  width: 28,
                  height: 28,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(29, 185, 84, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(29, 185, 84, 0.1)";
                }}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
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
                <X size={14} />
              </button>
            </div>
          ) : (
            // Expanded view
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
                    Now Playing
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

              <div style={{ 
                padding: "10px 12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "8px",
                marginBottom: 8,
              }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#e5e5e5", marginBottom: 2 }}>
                  {currentTrack.title}
                </div>
                <div style={{ fontSize: 12, color: "#888" }}>
                  {currentTrack.artist}
                </div>
              </div>

              {/* Progress */}
              <div style={{ marginBottom: 10 }}>
                <div style={{
                  width: "100%",
                  height: 4,
                  background: "rgba(255,255,255,0.06)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}>
                  <div style={{
                    width: `${(progress / 180) * 100}%`,
                    height: "100%",
                    background: "#1db954",
                    borderRadius: 2,
                    transition: "width 0.3s ease",
                  }} />
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "#555",
                  marginTop: 4,
                }}>
                  <span>{formatTime(progress)}</span>
                  <span>3:00</span>
                </div>
              </div>

              {/* Spotify embed placeholder */}
              <div 
                ref={screenRef}
                style={{
                  width: "100%",
                  height: 80,
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: "6px",
                  border: "1px solid rgba(255,255,255,0.04)",
                  overflow: "hidden",
                  position: "relative",
                  marginBottom: 10,
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
                    color: "#444",
                  }}>
                    <Music size={16} style={{ opacity: 0.3, marginBottom: 4 }} />
                    <div style={{ fontSize: 9, letterSpacing: "0.05em" }}>
                      Click play to start
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={prevTrack}
                  style={{
                    padding: "6px 10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "6px",
                    color: "#666",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#e5e5e5";
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#666";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                >
                  <SkipBack size={16} />
                </button>

                <button
                  onClick={togglePlay}
                  style={{
                    padding: "8px 20px",
                    background: "rgba(29, 185, 84, 0.12)",
                    border: "1px solid rgba(29, 185, 84, 0.15)",
                    borderRadius: "6px",
                    color: "#1db954",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.15s",
                    flex: 1,
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(29, 185, 84, 0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(29, 185, 84, 0.12)";
                  }}
                >
                  {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  {isPlaying ? "Pause" : "Play"}
                </button>

                <button
                  onClick={nextTrack}
                  style={{
                    padding: "6px 10px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "6px",
                    color: "#666",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#e5e5e5";
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#666";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }}
                >
                  <SkipForward size={16} />
                </button>
              </div>

              {/* Track list */}
              <div style={{ 
                marginTop: 12,
                borderTop: "1px solid rgba(255,255,255,0.04)",
                paddingTop: 10,
                maxHeight: 120,
                overflowY: "auto",
              }}>
                <div style={{ fontSize: 10, color: "#555", marginBottom: 6, letterSpacing: "0.05em" }}>
                  PLAYLIST • {TRACKS.length} SONGS
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {TRACKS.slice(0, 4).map((track, i) => (
                    <div 
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "3px 6px",
                        borderRadius: "4px",
                        fontSize: 11,
                        color: i === currentTrackIndex ? "#1db954" : "#666",
                        background: i === currentTrackIndex ? "rgba(29, 185, 84, 0.08)" : "transparent",
                        transition: "all 0.15s",
                        cursor: "pointer",
                      }}
                      onClick={() => {
                        setCurrentTrackIndex(i);
                        setProgress(0);
                        if (isPlaying && iframeRef.current) {
                          iframeRef.current.src = EMBED_URL;
                          setTimeout(startProgressSimulation, 500);
                        }
                      }}
                      onMouseEnter={(e) => {
                        if (i !== currentTrackIndex) e.currentTarget.style.color = "#e5e5e5";
                      }}
                      onMouseLeave={(e) => {
                        if (i !== currentTrackIndex) e.currentTarget.style.color = "#666";
                      }}
                    >
                      <span style={{ width: 16, fontSize: 9, color: "#444", fontVariantNumeric: "tabular-nums" }}>
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
                  {TRACKS.length > 4 && (
                    <div style={{ fontSize: 10, color: "#444", padding: "4px 6px" }}>
                      +{TRACKS.length - 4} more
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