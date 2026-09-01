"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Music, X, ChevronUp, ChevronDown } from "lucide-react";

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
  const [color, setColor] = useState<"white" | "black" | "purple">("white");
  const [started, setStarted] = useState(loadStarted);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const showInScreen = open && !minimized && started;

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ started })); } catch {}
  }, [started]);

  useEffect(() => {
    if (!started || !holderRef.current) return;
    if (!iframeRef.current) {
      const iframe = document.createElement("iframe");
      iframe.src = EMBED_URL;
      iframe.allow = "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";
      iframe.loading = "lazy";
      iframe.title = "Spotify Player";
      iframe.style.cssText = "width:100%;height:100%;border:none;display:block;border-radius:8px;";
      holderRef.current.appendChild(iframe);
      iframeRef.current = iframe;
    }
  }, [started]);

  useLayoutEffect(() => {
    const iframe = iframeRef.current;
    const holder = holderRef.current;
    const screen = screenRef.current;
    if (!iframe || !holder || !screen) return;

    if (showInScreen) {
      const r = screen.getBoundingClientRect();
      iframe.style.cssText = `position:fixed;top:${r.top}px;left:${r.left}px;width:${r.width}px;height:${r.height}px;border:2px solid ${color === "white" ? "#333" : color === "black" ? "#111" : "#1e1b4b"};border-radius:10px;box-shadow:inset 0 2px 8px rgba(0,0,0,0.5);z-index:10002;display:block;`;
    } else {
      iframe.style.cssText = "width:100%;height:100%;border:none;display:block;border-radius:8px;";
    }
  }, [showInScreen, open, minimized, color]);

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

  const colorMap = {
    white: { body: "#e8e8e8", accent: "#6d28d9", wheel: "#d4d4d4", wheelRing: "#c0c0c0" },
    black: { body: "#1a1a1a", accent: "#1db954", wheel: "#2a2a2a", wheelRing: "#222" },
    purple: { body: "#c4b5fd", accent: "#8b5cf6", wheel: "#a78bfa", wheelRing: "#9370db" },
  };
  const c = colorMap[color];

  const screenStyle: React.CSSProperties = {
    width: "100%", height: 200, background: "#0a0a14", borderRadius: 10, overflow: "hidden",
    border: `2px solid ${color === "white" ? "#333" : color === "black" ? "#111" : "#1e1b4b"}`,
    boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)", position: "relative",
  };

  return (
    <>
      <style>{`
        @keyframes ipodSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.94); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .ipod-color-btn { transition: all 0.2s; }
        .ipod-color-btn:hover { transform: scale(1.15); }
        .track-scroll::-webkit-scrollbar { width: 4px; }
        .track-scroll::-webkit-scrollbar-track { background: transparent; }
        .track-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
      `}</style>

      {/* Permanent holder — NEVER unmounts, iframe lives here when not in screen */}
      <div ref={holderRef} style={{ position: "fixed", bottom: -9999, right: -9999, width: 320, height: 80, opacity: 0, pointerEvents: "none", zIndex: -1, overflow: "hidden" }} />

      {/* Bubble */}
      <button ref={btnRef} onClick={() => { setOpen(!open); if (!started) setStarted(true); }}
        style={{
          position: "fixed", bottom: 90, right: 20, width: 50, height: 50, borderRadius: "50%",
          background: started ? `linear-gradient(135deg, ${c.accent}, ${c.accent}dd)` : "rgba(12,17,28,0.95)",
          border: `2px solid ${started ? c.accent + "80" : "rgba(29,185,84,0.3)"}`,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: started ? `0 4px 24px ${c.accent}66, 0 0 0 3px ${c.accent}20` : "0 4px 20px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.05)",
          zIndex: 10000, transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          transform: open ? "scale(0.9) rotate(90deg)" : "scale(1)",
        }}>
        {open ? <X size={18} color={color === "white" ? "#333" : "#fff"} /> : started ? (
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 16 }}>
            <div style={{ width: 3, background: color === "white" ? "#333" : "#fff", borderRadius: 1, animation: "mpBar1 0.5s ease infinite" }} />
            <div style={{ width: 3, background: color === "white" ? "#333" : "#fff", borderRadius: 1, animation: "mpBar2 0.7s ease infinite" }} />
            <div style={{ width: 3, background: color === "white" ? "#333" : "#fff", borderRadius: 1, animation: "mpBar3 0.6s ease infinite" }} />
            <style>{`@keyframes mpBar1{0%,100%{height:6px}50%{height:14px}}@keyframes mpBar2{0%,100%{height:10px}50%{height:5px}}@keyframes mpBar3{0%,100%{height:4px}50%{height:12px}}`}</style>
          </div>
        ) : <Music size={18} color="#1db954" />}
      </button>

      {/* Panel */}
      {open && (
        <div ref={panelRef} style={{
          position: "fixed", bottom: minimized ? 150 : 148, right: 20, width: 360,
          background: "rgba(12, 17, 28, 0.98)", backdropFilter: "blur(40px)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24,
          boxShadow: "0 32px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
          zIndex: 10001, overflow: "hidden",
          animation: "ipodSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)",
          maxHeight: minimized ? 80 : 560,
          transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
        }}>

          {minimized && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              background: c.body, borderRadius: 20, margin: 6,
              boxShadow: "inset 0 1px 3px rgba(255,255,255,0.3), inset 0 -1px 3px rgba(0,0,0,0.1)",
              border: `1px solid ${color === "white" ? "rgba(255,255,255,0.5)" : color === "black" ? "rgba(60,60,60,0.4)" : "rgba(200,180,255,0.5)"}`,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${color === "white" ? "#333" : "#111"}` }}>
                <Music size={14} color={c.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: color === "white" ? "#333" : color === "black" ? "#ddd" : "#3b0764", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>GILAS Playlist</div>
                <div style={{ fontSize: 9, color: color === "white" ? "#888" : color === "black" ? "#666" : "#6b21a8" }}>{TRACKS.length} songs</div>
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                <button onClick={() => setMinimized(false)} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: color === "white" ? "#666" : color === "black" ? "#888" : "#6b21a8", display: "flex" }}><ChevronUp size={14} /></button>
                <button onClick={() => setOpen(false)} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: color === "white" ? "#666" : color === "black" ? "#888" : "#6b21a8", display: "flex" }}><X size={14} /></button>
              </div>
            </div>
          )}

          {!minimized && (
            <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: 280, background: c.body, borderRadius: 28, padding: "14px 14px 18px",
                boxShadow: "inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.4)",
                border: `1px solid ${color === "white" ? "rgba(255,255,255,0.6)" : color === "black" ? "rgba(60,60,60,0.5)" : "rgba(200,180,255,0.6)"}`,
              }}>
                {/* Screen — always rendered, iframe overlays via position:fixed when active */}
                <div ref={screenRef} style={screenStyle}>
                  {!started && (
                    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#555" }}>
                      <Music size={28} style={{ opacity: 0.3, marginBottom: 8 }} />
                      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>Press play</div>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: color === "white" ? "#999" : color === "black" ? "#555" : "#7c3aed", marginBottom: 10 }}>MUSIC</div>
                  <div style={{
                    width: 120, height: 120, borderRadius: "50%",
                    background: `radial-gradient(circle at 40% 35%, ${c.wheel}, ${c.wheelRing})`,
                    boxShadow: "inset 0 2px 6px rgba(255,255,255,0.3), inset 0 -2px 6px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: `radial-gradient(circle at 40% 35%, ${color === "white" ? "#f5f5f5" : color === "black" ? "#333" : "#b8a9f0"}, ${color === "white" ? "#ddd" : color === "black" ? "#222" : "#a78bfa"})`,
                      boxShadow: "inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -1px 3px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.15)",
                    }} />
                  </div>
                </div>
              </div>

              <div style={{ width: 280, marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--os-text-primary)" }}>GILAS Playlist</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {(["white", "black", "purple"] as const).map((col) => (
                      <button key={col} onClick={() => setColor(col)} className={`ipod-color-btn${color === col ? " active" : ""}`}
                        style={{ width: 14, height: 14, borderRadius: "50%", border: "none", cursor: "pointer", background: col === "white" ? "#e8e8e8" : col === "black" ? "#1a1a1a" : "#c4b5fd", boxShadow: `0 1px 3px rgba(0,0,0,0.3)${color === col ? `, 0 0 0 2px ${c.accent}` : ""}` }} />
                    ))}
                    <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
                    <button onClick={() => setMinimized(true)} style={{ padding: 5, background: "rgba(255,255,255,0.04)", border: "none", borderRadius: 6, color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center" }}><ChevronDown size={12} /></button>
                    <button onClick={() => setOpen(false)} style={{ padding: 5, background: "rgba(255,255,255,0.04)", border: "none", borderRadius: 6, color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center" }}><X size={12} /></button>
                  </div>
                </div>

                <div className="track-scroll" style={{ maxHeight: 260, overflowY: "auto", borderRadius: 10, background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 10px 4px", position: "sticky", top: 0, background: "rgba(12,17,28,0.98)", zIndex: 1 }}>
                    All Songs ({TRACKS.length})
                  </div>
                  {TRACKS.map((track, i) => (
                    <div key={`${track.title}-${i}`} className="track-row" style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 6 }}>
                      <div style={{ width: 16, textAlign: "center", fontSize: 10, color: "var(--os-text-dim)" }}>{i + 1}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.title}</div>
                        <div style={{ fontSize: 9, color: "var(--os-text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
