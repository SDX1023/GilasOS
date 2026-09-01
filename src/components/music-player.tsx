"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Music, X, Shuffle, Volume2, VolumeX, SkipBack, SkipForward, Play, Pause, ChevronUp, ChevronDown } from "lucide-react";

const SPOTIFY_EMBED_URL = "https://open.spotify.com/embed/playlist/68ZULOlqdmWGGTeEsp5lup?utm_source=generator&si=97daf86b3aa24a05&theme=0";

const TRACKS = [
  { title: "The Winner Takes It All", artist: "ABBA", duration: "04:54" },
  { title: "Please, Please, Please, Let Me Get What I Want", artist: "The Smiths", duration: "01:52" },
  { title: "The Archer - Live From Paris", artist: "Taylor Swift", duration: "03:30" },
  { title: "Hampstead", artist: "Ariana Grande", duration: "03:36" },
  { title: "Godspeed", artist: "Frank Ocean", duration: "04:02" },
  { title: "Di Bale Na Lang", artist: "Regine Velasquez", duration: "04:12" },
  { title: "Parang Baliw", artist: "Sharon Cuneta", duration: "03:48" },
  { title: "Maps", artist: "Yeah Yeah Yeahs", duration: "03:39" },
  { title: "Skinny Love", artist: "Bon Iver", duration: "03:58" },
  { title: "Universe", artist: "Tyler the Creator", duration: "04:16" },
];

export function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [volume, setVolume] = useState(75);
  const [muted, setMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Auto-advance track timer
  useEffect(() => {
    if (!isPlaying || !hasStarted) return;
    const parts = TRACKS[currentTrack].duration.split(":");
    const ms = (parseInt(parts[0]) * 60 + parseInt(parts[1])) * 1000;
    // Simulate track end (in real app would use Spotify API)
    const timer = setTimeout(() => {
      if (currentTrack < TRACKS.length - 1) setCurrentTrack(c => c + 1);
      else { setCurrentTrack(0); setIsPlaying(false); }
    }, Math.min(ms, 30000)); // Cap at 30s for demo
    return () => clearTimeout(timer);
  }, [isPlaying, currentTrack, hasStarted]);

  const togglePlay = useCallback(() => {
    if (!hasStarted) setHasStarted(true);
    setIsPlaying(p => !p);
  }, [hasStarted]);

  const prevTrack = useCallback(() => {
    setCurrentTrack(c => Math.max(0, c - 1));
  }, []);

  const nextTrack = useCallback(() => {
    setCurrentTrack(c => Math.min(TRACKS.length - 1, c + 1));
  }, []);

  const displayTracks = shuffled ? [...TRACKS].sort(() => Math.random() - 0.5) : TRACKS;
  const effectiveVolume = muted ? 0 : volume;

  return (
    <>
      {/* Persistent hidden iframe for audio */}
      <iframe
        ref={iframeRef}
        src={hasStarted ? SPOTIFY_EMBED_URL : ""}
        width="320"
        height="80"
        frameBorder="0"
        allow="autoplay; encrypted-media"
        title="Spotify Player"
        style={{
          position: "fixed",
          bottom: -200,
          left: -200,
          opacity: 0,
          pointerEvents: "none",
          zIndex: -1,
        }}
      />

      {/* Floating bubble */}
      <button
        ref={btnRef}
        onClick={() => { setOpen(!open); setMinimized(false); }}
        style={{
          position: "fixed", bottom: 90, right: 20,
          width: 50, height: 50, borderRadius: "50%",
          background: isPlaying && hasStarted
            ? "linear-gradient(135deg, rgba(29,185,84,0.95), rgba(30,215,96,0.95))"
            : "rgba(12, 17, 28, 0.95)",
          border: isPlaying && hasStarted
            ? "2px solid rgba(29,185,84,0.5)"
            : "1.5px solid rgba(29,185,84,0.3)",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: isPlaying && hasStarted
            ? "0 4px 24px rgba(29,185,84,0.4), 0 0 0 3px rgba(29,185,84,0.12), 0 0 40px rgba(29,185,84,0.15)"
            : "0 4px 20px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.05)",
          zIndex: 10000,
          transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          transform: open ? "scale(0.9) rotate(90deg)" : "scale(1)",
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.transform = "scale(1.1)"; }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.transform = "scale(1)"; }}
        title={isPlaying ? "Pause music" : "Open music player"}
      >
        {open ? (
          <X size={18} color={isPlaying && hasStarted ? "#000" : "var(--os-text-primary)"} />
        ) : isPlaying && hasStarted ? (
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

      {/* Quick play/pause when bubble is hovered and music has started */}
      {hasStarted && !open && (
        <button
          onClick={(e) => { e.stopPropagation(); togglePlay(); }}
          style={{
            position: "fixed", bottom: 90, right: 76,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(12, 17, 28, 0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
            zIndex: 10000,
            opacity: 0,
            transition: "opacity 0.2s",
            pointerEvents: "none",
          }}
          className="music-quick-pause"
          title={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={14} color="var(--os-text-primary)" /> : <Play size={14} color="var(--os-text-primary)" style={{ marginLeft: 1 }} />}
        </button>
      )}

      {/* Player panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            bottom: minimized ? 150 : 148,
            right: 20,
            width: 380,
            maxHeight: minimized ? 72 : 600,
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
          }}
        >
          <style>{`
            @keyframes musicSlideUp {
              from { opacity: 0; transform: translateY(24px) scale(0.96); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes nowPlayingPulse {
              0%, 100% { opacity: 0.6; } 50% { opacity: 1; }
            }
            .track-item:hover { background: rgba(255,255,255,0.04) !important; }
            .track-item.active { background: rgba(29,185,84,0.08) !important; }
            .vol-slider::-webkit-slider-thumb {
              -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
              background: #1db954; cursor: pointer; border: 2px solid #000;
              box-shadow: 0 0 6px rgba(29,185,84,0.4);
            }
            .vol-slider::-webkit-slider-runnable-track {
              height: 4px; border-radius: 2px;
              background: linear-gradient(to right, #1db954 0%, #1db954 var(--vol), rgba(255,255,255,0.12) var(--vol));
            }
            .vol-slider { -webkit-appearance: none; width: 100%; background: transparent; cursor: pointer; }
            .music-quick-pause { pointer-events: auto !important; }
            .music-bubble:hover + .music-quick-pause { opacity: 1 !important; pointer-events: auto !important; }
          `}</style>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "linear-gradient(135deg, #1db954, #1ed760)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 2px 8px rgba(29,185,84,0.3)",
              }}>
                <Music size={16} color="#000" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--os-text-primary)", letterSpacing: "-0.01em" }}>Study Playlist</div>
                <div style={{ fontSize: 11, color: "var(--os-text-dim)", display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#1db954", animation: isPlaying ? "nowPlayingPulse 1.5s ease infinite" : "none" }} />
                  {isPlaying ? "Playing" : hasStarted ? "Paused" : "Ready"} · {TRACKS.length} tracks
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setMinimized(!minimized)} style={{ padding: 6, background: "rgba(255,255,255,0.04)", border: "none", borderRadius: 8, color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {minimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button onClick={() => setOpen(false)} style={{ padding: 6, background: "rgba(255,255,255,0.04)", border: "none", borderRadius: 8, color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Now playing */}
          {!minimized && (
            <div style={{ padding: "0 18px 12px" }}>
              <div style={{
                padding: "12px 14px", borderRadius: 12,
                background: "rgba(29,185,84,0.06)",
                border: "1px solid rgba(29,185,84,0.12)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                    background: "linear-gradient(135deg, rgba(109,40,217,0.3), rgba(29,185,84,0.2))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Music size={16} color="#1db954" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {TRACKS[currentTrack].title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{TRACKS[currentTrack].artist}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--os-text-dim)", flexShrink: 0 }}>{TRACKS[currentTrack].duration}</span>
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, background: "rgba(255,255,255,0.08)", borderRadius: 99, marginBottom: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "35%", background: "linear-gradient(90deg, #1db954, #1ed760)", borderRadius: 99 }} />
                </div>

                {/* Controls */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button onClick={() => setShuffled(!shuffled)} style={{ padding: 6, background: shuffled ? "rgba(29,185,84,0.12)" : "transparent", border: "none", borderRadius: 6, color: shuffled ? "#1db954" : "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Shuffle size={14} />
                    </button>
                    <button onClick={prevTrack} style={{ padding: 6, background: "transparent", border: "none", color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SkipBack size={16} fill="currentColor" />
                    </button>
                    <button onClick={togglePlay} style={{
                      width: 36, height: 36, borderRadius: "50%",
                      background: "#fff", border: "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", transition: "transform 0.1s",
                    }}
                      onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.92)"; }}
                      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}>
                      {isPlaying ? <Pause size={16} color="#000" fill="#000" /> : <Play size={16} color="#000" fill="#000" style={{ marginLeft: 2 }} />}
                    </button>
                    <button onClick={nextTrack} style={{ padding: 6, background: "transparent", border: "none", color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <SkipForward size={16} fill="currentColor" />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={() => setMuted(!muted)} style={{ padding: 4, background: "transparent", border: "none", color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      {muted || volume === 0 ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    <input type="range" min={0} max={100} value={muted ? 0 : volume} onChange={(e) => { setVolume(Number(e.target.value)); setMuted(false); }}
                      className="vol-slider"
                      style={{ width: 70, ["--vol" as any]: `${muted ? 0 : volume}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Track list */}
          {!minimized && (
            <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}>
              <div style={{ padding: "4px 10px 8px", fontSize: 10, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Up Next
              </div>
              {displayTracks.map((track, i) => {
                const realIndex = TRACKS.indexOf(track);
                return (
                  <div key={`${track.title}-${i}`}
                    className={`track-item${realIndex === currentTrack ? " active" : ""}`}
                    onClick={() => { setCurrentTrack(realIndex); if (!hasStarted) setHasStarted(true); setIsPlaying(true); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "8px 10px",
                      borderRadius: 10, cursor: "pointer", transition: "background 0.15s",
                    }}>
                    <div style={{ width: 20, textAlign: "center", fontSize: 12, color: realIndex === currentTrack ? "#1db954" : "var(--os-text-dim)", fontWeight: realIndex === currentTrack ? 600 : 400 }}>
                      {realIndex === currentTrack && isPlaying ? (
                        <div style={{ display: "flex", gap: 2, justifyContent: "center", alignItems: "flex-end", height: 14 }}>
                          <div style={{ width: 2, background: "#1db954", borderRadius: 1, animation: "bar1 0.6s ease infinite" }} />
                          <div style={{ width: 2, background: "#1db954", borderRadius: 1, animation: "bar2 0.8s ease infinite" }} />
                          <div style={{ width: 2, background: "#1db954", borderRadius: 1, animation: "bar3 0.5s ease infinite" }} />
                          <style>{`
                            @keyframes bar1 { 0%,100% { height: 4px; } 50% { height: 12px; } }
                            @keyframes bar2 { 0%,100% { height: 8px; } 50% { height: 4px; } }
                            @keyframes bar3 { 0%,100% { height: 6px; } 50% { height: 10px; } }
                          `}</style>
                        </div>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: realIndex === currentTrack ? 600 : 400, color: realIndex === currentTrack ? "#1db954" : "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {track.title}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{track.artist}</div>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--os-text-dim)", flexShrink: 0 }}>{track.duration}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </>
  );
}
