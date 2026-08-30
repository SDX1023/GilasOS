"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, X, Music, Volume2, VolumeX } from "lucide-react";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  url: string;
  preview: string | null;
}

interface MusicSelectorProps {
  onSelect: (track: { name: string; artist: string; url: string; albumArt: string; preview: string | null }, startTime: number) => void;
  onClose: () => void;
}

export function MusicSelector({ onSelect, onClose }: MusicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [startTime, setStartTime] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const [searchPage, setSearchPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [fetchingPreview, setFetchingPreview] = useState(false);

  const searchTracks = async (page = 0) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}&offset=${page * 20}`);
      const data = await response.json();
      if (data.tracks) {
        if (page === 0) setResults(data.tracks);
        else setResults((prev) => [...prev, ...data.tracks]);
        setHasMore(data.tracks.length === 20);
        setSearchPage(page);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPreview = async (trackId: string) => {
    setFetchingPreview(true);
    try {
      const response = await fetch(`/api/spotify/preview?id=${trackId}`);
      const data = await response.json();
      return data.previewUrl || null;
    } catch {
      return null;
    } finally {
      setFetchingPreview(false);
    }
  };

  const handleSelectTrack = async (track: Track) => {
    setSelectedTrack(track);
    if (!track.preview) {
      const previewUrl = await getPreview(track.id);
      if (previewUrl) {
        setSelectedTrack((prev) => prev ? { ...prev, preview: previewUrl } : null);
        loadAudio(previewUrl);
      }
    } else {
      loadAudio(track.preview);
    }
  };

  const loadAudio = (url: string) => {
    if (audio) { audio.pause(); audio.src = ""; }
    const newAudio = new Audio(url);
    newAudio.volume = volume;
    newAudio.addEventListener("loadedmetadata", () => setDuration(Math.min(newAudio.duration, 30)));
    newAudio.addEventListener("timeupdate", () => setCurrentTime(newAudio.currentTime));
    newAudio.addEventListener("ended", () => setIsPlaying(false));
    setAudio(newAudio);
    setCurrentTime(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!audio) return;
    if (isPlaying) audio.pause();
    else audio.play();
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    if (!audio) return;
    const t = Math.max(0, Math.min(time, duration));
    audio.currentTime = t;
    setCurrentTime(t);
  };

  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!waveformRef.current) return;
    const rect = waveformRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    seekTo((x / rect.width) * duration);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  const toggleMute = () => {
    if (!audio) return;
    setIsMuted(!isMuted);
    audio.volume = isMuted ? volume : 0;
  };

  useEffect(() => {
    return () => { if (audio) { audio.pause(); audio.src = ""; } };
  }, [audio]);

  useEffect(() => {
    if (!waveformRef.current || !selectedTrack) return;
    const canvas = waveformRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const bars = 80;
    const barW = w / bars;
    for (let i = 0; i < bars; i++) {
      const pct = 0.2 + Math.random() * 0.6;
      const barH = h * pct;
      const x = i * barW;
      const y = (h - barH) / 2;
      const active = (i / bars) * duration < currentTime;
      ctx.fillStyle = active ? "rgba(29,185,84,0.8)" : "rgba(255,255,255,0.2)";
      ctx.fillRect(x + 1, y, barW - 2, barH);
    }
  }, [selectedTrack, currentTime, duration]);

  const overlayStyle: React.CSSProperties = {
    position: "fixed", inset: 0, zIndex: 10000,
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
  };

  const panelStyle: React.CSSProperties = {
    background: "var(--os-bg-secondary)", borderRadius: 12,
    border: "1px solid var(--os-glass-border)",
    maxWidth: 440, width: "100%", margin: "0 16px",
    maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 16px", borderBottom: "1px solid var(--os-glass-border)",
  };

  const inputStyle: React.CSSProperties = {
    flex: 1, padding: "8px 12px", borderRadius: 8,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
    color: "var(--os-text-primary)", fontSize: 13, outline: "none",
    fontFamily: "Inter, sans-serif",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "8px 16px", borderRadius: 8,
    background: "var(--os-accent)", color: "#fff", border: "none",
    fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif",
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={headerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Music size={18} style={{ color: "#1DB954" }} />
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--os-text-primary)" }}>Add Music</span>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "var(--os-text-dim)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") searchTracks(0); }}
              placeholder="Search for a song..."
              style={inputStyle}
              autoFocus
            />
            <button onClick={() => searchTracks(0)} disabled={loading} style={{ ...btnPrimary, opacity: loading ? 0.5 : 1 }}>
              {loading ? "..." : "Search"}
            </button>
          </div>
        </div>

        {/* Track List */}
        {!selectedTrack && (
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px", maxHeight: 400 }}>
            {results.length === 0 && !loading && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--os-text-dim)" }}>
                <Music size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>Search for a song</p>
              </div>
            )}
            {results.map((track) => (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "8px 10px",
                  borderRadius: 8, cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {track.albumArt ? (
                  <img src={track.albumArt} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 6, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Music size={18} style={{ color: "var(--os-text-dim)" }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{track.name}</p>
                  <p style={{ fontSize: 12, color: "var(--os-text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{track.artist}</p>
                </div>
                <button style={{ padding: "6px 12px", borderRadius: 6, background: "#1DB954", color: "#fff", border: "none", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                  Select
                </button>
              </div>
            ))}
            {hasMore && (
              <button onClick={() => searchTracks(searchPage + 1)} disabled={loading} style={{ ...btnPrimary, width: "100%", marginTop: 8, opacity: loading ? 0.5 : 1 }}>
                {loading ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        )}

        {/* Audio Player */}
        {selectedTrack && (
          <div style={{ padding: "16px" }}>
            {/* Track info */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              {selectedTrack.albumArt ? (
                <img src={selectedTrack.albumArt} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Music size={20} style={{ color: "var(--os-text-dim)" }} />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedTrack.name}</p>
                <p style={{ fontSize: 12, color: "var(--os-text-dim)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedTrack.artist}</p>
                {fetchingPreview && <p style={{ fontSize: 11, color: "#1DB954", margin: "2px 0 0" }}>Loading preview...</p>}
                {selectedTrack && !selectedTrack.preview && !fetchingPreview && (
                  <p style={{ fontSize: 11, color: "#ef4444", margin: "2px 0 0" }}>No preview available</p>
                )}
              </div>
              <button onClick={() => { setSelectedTrack(null); if (audio) { audio.pause(); setAudio(null); } }} style={{ background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", padding: 4 }}>
                <X size={16} />
              </button>
            </div>

            {/* Waveform */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <canvas
                ref={waveformRef}
                width={400}
                height={60}
                style={{ width: "100%", height: 60, borderRadius: 8, cursor: "pointer" }}
                onClick={handleWaveformClick}
                onMouseDown={() => setIsDragging(true)}
                onMouseMove={(e) => { if (isDragging) handleWaveformClick(e); }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", background: "rgba(0,0,0,0.5)", padding: "3px 8px", borderRadius: 6, color: "#1DB954", fontSize: 11, fontWeight: 600 }}>
                30s clip
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--os-text-dim)", marginTop: 4 }}>
                <span>{formatTime(0)}</span>
                <span>{formatTime(30)}</span>
              </div>
            </div>

            {/* Controls */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={togglePlay} style={{ width: 40, height: 40, borderRadius: "50%", background: "#1DB954", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
                </button>
                <span style={{ fontSize: 12, color: "var(--os-text-dim)" }}>{formatTime(currentTime)} / {formatTime(30)}</span>
              </div>
              <button onClick={toggleMute} style={{ background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", padding: 4 }}>
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>

            {/* Add button */}
            <button
              onClick={() => {
                if (selectedTrack) {
                  onSelect({
                    name: selectedTrack.name,
                    artist: selectedTrack.artist,
                    url: selectedTrack.url,
                    albumArt: selectedTrack.albumArt || "",
                    preview: selectedTrack.preview,
                  }, startTime);
                  onClose();
                }
              }}
              style={{ ...btnPrimary, width: "100%", marginTop: 16, padding: "10px 0" }}
            >
              Add to Note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}