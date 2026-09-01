"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Music, X, ChevronUp, ChevronDown, Shuffle, Volume2, VolumeX } from "lucide-react";

const PLAYLIST_ID = "68ZULOlqdmWGGTeEsp5lup";
const CLIENT_ID = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
const SCOPES = ["streaming", "user-read-playback-state", "user-modify-playback-state", "user-read-currently-playing"];

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

interface Track {
  id: string;
  name: string;
  artist: string;
  uri: string;
  image: string;
  duration_ms: number;
}

function generateRandomString(len: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let r = "";
  for (let i = 0; i < len; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}

async function sha256(plain: string) {
  const data = new TextEncoder().encode(plain);
  return window.crypto.subtle.digest("SHA-256", data);
}

function base64urlencode(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fmtTime(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

export function MusicPlayer() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(75);
  const [muted, setMuted] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [color, setColor] = useState<"white" | "black" | "purple">("white");

  const playerRef = useRef<any>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tokenRef = useRef<string | null>(null);
  const intervalRef = useRef<any>(null);

  const colorMap = {
    white: { body: "#e8e8e8", accent: "#6d28d9", wheel: "#d4d4d4", wheelRing: "#c0c0c0" },
    black: { body: "#1a1a1a", accent: "#1db954", wheel: "#2a2a2a", wheelRing: "#222" },
    purple: { body: "#c4b5fd", accent: "#8b5cf6", wheel: "#a78bfa", wheelRing: "#9370db" },
  };
  const c = colorMap[color];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && btnRef.current && !btnRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  useEffect(() => {
    if (document.getElementById("spotify-sdk")) return;
    const s = document.createElement("script");
    s.id = "spotify-sdk";
    s.src = "https://sdk.scdn.co/spotify-player.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  const fetchTracks = useCallback(async (token: string) => {
    try {
      const res = await fetch(
        `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks?fields=items(track(id,name,uri,duration_ms,artists,album(images)))`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      setTracks(
        (data.items || [])
          .filter((i: any) => i.track)
          .map((i: any) => ({
            id: i.track.id,
            name: i.track.name,
            artist: i.track.artists.map((a: any) => a.name).join(", "),
            uri: i.track.uri,
            image: i.track.album.images?.[0]?.url || "",
            duration_ms: i.track.duration_ms,
          }))
      );
    } catch (e) {
      console.error("Failed to fetch tracks:", e);
    }
  }, []);

  const initPlayer = useCallback(
    (token: string) => {
      tokenRef.current = token;
      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: "GilasOS Player",
          getOAuthToken: (cb: (t: string) => void) => cb(tokenRef.current || ""),
          volume: volume / 100,
        });
        player.addListener("ready", ({ device_id }: any) => {
          setDeviceId(device_id);
          setPlayerReady(true);
          fetchTracks(token);
        });
        player.addListener("player_state_changed", (state: any) => {
          if (!state) return;
          setIsPlaying(!state.paused);
          setCurrentTrack(state.track_window?.current_track || null);
          setPosition(state.position || 0);
          setDuration(state.duration || 0);
        });
        player.connect();
        playerRef.current = player;
      };
      if (window.Spotify) window.onSpotifyWebPlaybackSDKReady();
    },
    [volume, fetchTracks]
  );

  const authenticate = useCallback(async () => {
    const verifier = generateRandomString(64);
    const challenge = base64urlencode(await sha256(verifier));
    sessionStorage.setItem("spotify_pkce_verifier", verifier);
    const redirectUri = "https://gilasos.onrender.com/";
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: "code",
      redirect_uri: redirectUri,
      scope: SCOPES.join(" "),
      code_challenge_method: "S256",
      code_challenge: challenge,
    });
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
  }, []);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.access_token) {
        initPlayer(e.data.access_token);
      }
    }
    window.addEventListener("message", onMessage);

    // Handle OAuth redirect callback on main page
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (code) {
      const verifier = sessionStorage.getItem("spotify_pkce_verifier");
      if (verifier) {
        fetch("/api/spotify/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, verifier, redirect_uri: "https://gilasos.onrender.com/" }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.access_token) {
              initPlayer(data.access_token);
              window.history.replaceState({}, "", window.location.pathname);
            }
          })
          .catch(console.error);
      }
    }

    return () => window.removeEventListener("message", onMessage);
  }, [initPlayer]);

  const togglePlay = useCallback(async () => {
    if (!playerRef.current) { authenticate(); return; }
    await playerRef.current.togglePlay();
  }, [authenticate]);

  const nextTrack = useCallback(async () => {
    if (playerRef.current) await playerRef.current.nextTrack();
  }, []);

  const prevTrack = useCallback(async () => {
    if (playerRef.current) await playerRef.current.previousTrack();
  }, []);

  const setPlayerVolume = useCallback(async (v: number) => {
    setVolume(v);
    setMuted(v === 0);
    if (playerRef.current) await playerRef.current.setVolume(v / 100);
  }, []);

  const toggleMute = useCallback(async () => {
    const m = !muted;
    setMuted(m);
    if (playerRef.current) await playerRef.current.setVolume(m ? 0 : volume / 100);
  }, [muted, volume]);

  const toggleShuffle = useCallback(async () => {
    if (!deviceId || !tokenRef.current) return;
    const s = !shuffled;
    setShuffled(s);
    await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${s}&device_id=${deviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenRef.current}` },
    });
  }, [shuffled, deviceId]);

  const playTrack = useCallback(async (uri: string) => {
    if (!deviceId || !tokenRef.current) { authenticate(); return; }
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenRef.current}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [uri] }),
    });
  }, [deviceId, authenticate]);

  const playPlaylist = useCallback(async (shuffle = false) => {
    if (!deviceId || !tokenRef.current) { authenticate(); return; }
    setShuffled(shuffle);
    if (shuffle) {
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${deviceId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${tokenRef.current}` },
      });
    }
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${tokenRef.current}`, "Content-Type": "application/json" },
      body: JSON.stringify({ context_uri: `spotify:playlist:${PLAYLIST_ID}` }),
    });
  }, [deviceId, authenticate]);

  const seek = useCallback(async (pos: number) => {
    if (playerRef.current) { await playerRef.current.seek(pos); setPosition(pos); }
  }, []);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => setPosition((p) => Math.min(p + 1000, duration)), 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, duration]);

  const activeColor = isPlaying ? c.accent : undefined;

  return (
    <>
      <style>{`
        @keyframes mpBar1 { 0%,100% { height: 6px; } 50% { height: 14px; } }
        @keyframes mpBar2 { 0%,100% { height: 10px; } 50% { height: 5px; } }
        @keyframes mpBar3 { 0%,100% { height: 4px; } 50% { height: 12px; } }
        @keyframes ipodSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.94); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .ipod-color-btn { transition: all 0.2s; }
        .ipod-color-btn:hover { transform: scale(1.15); }
        .track-row { transition: background 0.15s; cursor: pointer; }
        .track-row:hover { background: rgba(255,255,255,0.04) !important; }
      `}</style>

      {/* Bubble */}
      <button
        ref={btnRef}
        onClick={() => { setOpen(!open); setMinimized(false); if (!playerReady) authenticate(); }}
        style={{
          position: "fixed", bottom: 90, right: 20, width: 50, height: 50, borderRadius: "50%",
          background: isPlaying ? `linear-gradient(135deg, ${c.accent}, ${c.accent}dd)` : "rgba(12,17,28,0.95)",
          border: `2px solid ${isPlaying ? c.accent + "80" : "rgba(29,185,84,0.3)"}`,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: isPlaying ? `0 4px 24px ${c.accent}66, 0 0 0 3px ${c.accent}20` : "0 4px 20px rgba(0,0,0,0.4), 0 0 0 3px rgba(255,255,255,0.05)",
          zIndex: 10000, transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
          transform: open ? "scale(0.9) rotate(90deg)" : "scale(1)",
        }}
      >
        {open ? (
          <X size={18} color={color === "white" ? "#333" : "#fff"} />
        ) : isPlaying ? (
          <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 16 }}>
            <div style={{ width: 3, background: color === "white" ? "#333" : "#fff", borderRadius: 1, animation: "mpBar1 0.5s ease infinite" }} />
            <div style={{ width: 3, background: color === "white" ? "#333" : "#fff", borderRadius: 1, animation: "mpBar2 0.7s ease infinite" }} />
            <div style={{ width: 3, background: color === "white" ? "#333" : "#fff", borderRadius: 1, animation: "mpBar3 0.6s ease infinite" }} />
          </div>
        ) : (
          <Music size={18} color="#1db954" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          style={{
            position: "fixed", bottom: minimized ? 150 : 148, right: 20, width: 360,
            background: "rgba(12, 17, 28, 0.98)", backdropFilter: "blur(40px)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24,
            boxShadow: "0 32px 100px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
            zIndex: 10001, overflow: "hidden",
            animation: "ipodSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)",
            maxHeight: minimized ? 80 : 640,
            transition: "max-height 0.35s cubic-bezier(0.4,0,0.2,1)",
          }}
        >
          {/* MINI BAR */}
          {minimized && (
            <MiniBar
              color={color} c={c} currentTrack={currentTrack} tracks={tracks}
              isPlaying={isPlaying} onPrev={prevTrack} onTogglePlay={togglePlay} onNext={nextTrack}
              onExpand={() => setMinimized(false)} onClose={() => setOpen(false)}
            />
          )}

          {/* FULL */}
          {!minimized && (
            <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              {/* iPod body */}
              <div style={{
                width: 280, background: c.body, borderRadius: 28, padding: "14px 14px 18px",
                boxShadow: "inset 0 2px 4px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.1), 0 8px 32px rgba(0,0,0,0.4)",
                border: `1px solid ${color === "white" ? "rgba(255,255,255,0.6)" : color === "black" ? "rgba(60,60,60,0.5)" : "rgba(200,180,255,0.6)"}`,
              }}>
                {/* Screen */}
                <div style={{
                  width: "100%", height: 200, background: "#0a0a14", borderRadius: 10,
                  border: `2px solid ${color === "white" ? "#333" : color === "black" ? "#111" : "#1e1b4b"}`,
                  boxShadow: "inset 0 2px 8px rgba(0,0,0,0.5)", overflow: "hidden", display: "flex", flexDirection: "column",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 8px", flex: 1 }}>
                    {currentTrack?.image ? (
                      <img src={currentTrack.image} alt="" style={{ width: 64, height: 64, borderRadius: 6, objectFit: "cover", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }} />
                    ) : (
                      <div style={{ width: 64, height: 64, borderRadius: 6, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Music size={24} color="#555" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 8, color: c.accent, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>NOW PLAYING</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#e8edf5", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {currentTrack?.name || "No track"}
                      </div>
                      <div style={{ fontSize: 10, color: "#6b7a90", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {currentTrack?.artist || "Select a song"}
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "0 14px 8px" }}>
                    <div
                      style={{ height: 3, background: "rgba(255,255,255,0.1)", borderRadius: 99, cursor: "pointer" }}
                      onClick={(e) => {
                        const r = e.currentTarget.getBoundingClientRect();
                        seek(((e.clientX - r.left) / r.width) * duration);
                      }}
                    >
                      <div style={{
                        height: "100%", borderRadius: 99, background: c.accent,
                        width: duration ? `${(position / duration) * 100}%` : "0%",
                        transition: "width 0.5s linear",
                      }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: "#555", marginTop: 3 }}>
                      <span>{fmtTime(position)}</span>
                      <span>{fmtTime(duration)}</span>
                    </div>
                  </div>
                </div>

                {/* Click wheel */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 14 }}>
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: color === "white" ? "#999" : color === "black" ? "#555" : "#7c3aed", marginBottom: 10 }}>
                    MUSIC
                  </div>
                  <div style={{
                    width: 120, height: 120, borderRadius: "50%", position: "relative",
                    background: `radial-gradient(circle at 40% 35%, ${c.wheel}, ${c.wheelRing})`,
                    boxShadow: "inset 0 2px 6px rgba(255,255,255,0.3), inset 0 -2px 6px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: "50%",
                      background: `radial-gradient(circle at 40% 35%, ${color === "white" ? "#f5f5f5" : color === "black" ? "#333" : "#b8a9f0"}, ${color === "white" ? "#ddd" : color === "black" ? "#222" : "#a78bfa"})`,
                      boxShadow: "inset 0 1px 3px rgba(255,255,255,0.4), inset 0 -1px 3px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.15)",
                    }} />
                    <button onClick={prevTrack} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 8, color: color === "white" ? "#888" : color === "black" ? "#666" : "#6b21a8", fontSize: 14, lineHeight: 1 }}>
                      {"\u25C0\u25C0"}
                    </button>
                    <button onClick={nextTrack} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 8, color: color === "white" ? "#888" : color === "black" ? "#666" : "#6b21a8", fontSize: 14, lineHeight: 1 }}>
                      {"\u25B6\u25B6"}
                    </button>
                    <button onClick={togglePlay} style={{ position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4, color: color === "white" ? "#888" : color === "black" ? "#666" : "#6b21a8", fontSize: 11, lineHeight: 1 }}>
                      {isPlaying ? "\u23F8" : "\u25B6"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Controls below */}
              <div style={{ width: 280, marginTop: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--os-text-primary)" }}>GILAS Playlist</div>
                    <button
                      onClick={() => { if (!playerReady) { authenticate(); return; } playPlaylist(!shuffled); }}
                      style={{
                        padding: "3px 8px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 9, fontWeight: 600,
                        background: isPlaying ? `${c.accent}20` : "rgba(255,255,255,0.04)",
                        color: isPlaying ? c.accent : "var(--os-text-dim)", transition: "all 0.2s",
                      }}
                    >
                      {isPlaying ? "Playing" : "Shuffle Play"}
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {(["white", "black", "purple"] as const).map((col) => (
                      <button
                        key={col}
                        onClick={() => setColor(col)}
                        className={`ipod-color-btn${color === col ? " active" : ""}`}
                        style={{
                          width: 14, height: 14, borderRadius: "50%", border: "none", cursor: "pointer",
                          background: col === "white" ? "#e8e8e8" : col === "black" ? "#1a1a1a" : "#c4b5fd",
                          boxShadow: `0 1px 3px rgba(0,0,0,0.3)${color === col ? `, 0 0 0 2px ${c.accent}` : ""}`,
                        }}
                      />
                    ))}
                    <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)", margin: "0 2px" }} />
                    <button onClick={() => setMinimized(true)} style={{ padding: 5, background: "rgba(255,255,255,0.04)", border: "none", borderRadius: 6, color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <ChevronDown size={12} />
                    </button>
                    <button onClick={() => setOpen(false)} style={{ padding: 5, background: "rgba(255,255,255,0.04)", border: "none", borderRadius: 6, color: "var(--os-text-dim)", cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <X size={12} />
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, padding: "0 4px" }}>
                  <button
                    onClick={toggleShuffle}
                    style={{
                      padding: "4px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600,
                      background: shuffled ? `${c.accent}20` : "rgba(255,255,255,0.04)",
                      color: shuffled ? c.accent : "var(--os-text-dim)",
                      display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s",
                    }}
                  >
                    <Shuffle size={12} /> Shuffle {shuffled ? "ON" : "OFF"}
                  </button>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button onClick={toggleMute} style={{ padding: 2, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", display: "flex" }}>
                      {muted || volume === 0 ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    <input
                      type="range" min={0} max={100} value={muted ? 0 : volume}
                      onChange={(e) => setPlayerVolume(Number(e.target.value))}
                      style={{
                        width: 60, height: 3, cursor: "pointer", borderRadius: 99,
                        background: `linear-gradient(to right, ${c.accent} 0%, ${c.accent} ${muted ? 0 : volume}%, rgba(255,255,255,0.12) ${muted ? 0 : volume}%)`,
                        WebkitAppearance: "none", appearance: "none", outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ maxHeight: 180, overflowY: "auto", borderRadius: 10, background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "8px 10px 4px" }}>
                    All Songs ({tracks.length})
                  </div>
                  {tracks.map((track, i) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <div
                        key={track.id}
                        className={`track-row${isCurrent ? " playing" : ""}`}
                        onClick={() => playTrack(track.uri)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 6,
                          background: isCurrent ? `rgba(${color === "black" ? "29,185,84" : "109,40,217"},0.08)` : "transparent",
                        }}
                      >
                        <div style={{ width: 16, textAlign: "center", fontSize: 10, color: isCurrent ? c.accent : "var(--os-text-dim)", fontWeight: isCurrent ? 700 : 400 }}>
                          {isCurrent && isPlaying ? "\u266A" : i + 1}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, color: isCurrent ? c.accent : "var(--os-text-primary)", fontWeight: isCurrent ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {track.name}
                          </div>
                          <div style={{ fontSize: 9, color: "var(--os-text-dim)" }}>{track.artist}</div>
                        </div>
                        <span style={{ fontSize: 9, color: "var(--os-text-dim)" }}>{fmtTime(track.duration_ms)}</span>
                      </div>
                    );
                  })}
                  {tracks.length === 0 && (
                    <div style={{ padding: "16px 10px", textAlign: "center", fontSize: 11, color: "var(--os-text-dim)" }}>
                      {playerReady ? "Loading tracks..." : "Click Shuffle Play to start"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function MiniBar({ color, c, currentTrack, tracks, isPlaying, onPrev, onTogglePlay, onNext, onExpand, onClose }: {
  color: string; c: any; currentTrack: Track | null; tracks: Track[]; isPlaying: boolean;
  onPrev: () => void; onTogglePlay: () => void; onNext: () => void;
  onExpand: () => void; onClose: () => void;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
      background: c.body, borderRadius: 20, margin: 6,
      boxShadow: "inset 0 1px 3px rgba(255,255,255,0.3), inset 0 -1px 3px rgba(0,0,0,0.1)",
      border: `1px solid ${color === "white" ? "rgba(255,255,255,0.5)" : color === "black" ? "rgba(60,60,60,0.4)" : "rgba(200,180,255,0.5)"}`,
    }}>
      {currentTrack?.image ? (
        <img src={currentTrack.image} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0, background: "#1a1a2e", display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${color === "white" ? "#333" : "#111"}` }}>
          <Music size={14} color={c.accent} />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: color === "white" ? "#333" : color === "black" ? "#ddd" : "#3b0764", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {currentTrack?.name || "GILAS Playlist"}
        </div>
        <div style={{ fontSize: 9, color: color === "white" ? "#888" : color === "black" ? "#666" : "#6b21a8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {currentTrack?.artist || `${tracks.length} songs`}
        </div>
      </div>
      <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
        <button onClick={onPrev} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: color === "white" ? "#666" : color === "black" ? "#888" : "#6b21a8", fontSize: 10 }}>
          {"\u25C0\u25C0"}
        </button>
        <button onClick={onTogglePlay} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: color === "white" ? "#333" : color === "black" ? "#fff" : c.accent, fontSize: 14 }}>
          {isPlaying ? "\u23F8" : "\u25B6"}
        </button>
        <button onClick={onNext} style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: color === "white" ? "#666" : color === "black" ? "#888" : "#6b21a8", fontSize: 10 }}>
          {"\u25B6\u25B6"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        <button onClick={onExpand} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: color === "white" ? "#666" : color === "black" ? "#888" : "#6b21a8", display: "flex" }}>
          <ChevronUp size={14} />
        </button>
        <button onClick={onClose} style={{ padding: 6, background: "none", border: "none", cursor: "pointer", color: color === "white" ? "#666" : color === "black" ? "#888" : "#6b21a8", display: "flex" }}>
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
