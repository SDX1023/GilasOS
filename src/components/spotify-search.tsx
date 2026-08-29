"use client";

import { useState, useEffect } from "react";
import { Search, X, Play, Pause } from "lucide-react";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  url: string;
  preview: string | null;
}

interface SpotifySearchProps {
  onSelect: (track: Track) => void;
  onClose: () => void;
}

export function SpotifySearch({ onSelect, onClose }: SpotifySearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, [audio]);

  const searchSpotify = async () => {
    if (!query.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.tracks) setResults(data.tracks);
      else setResults([]);
    } catch { setResults([]); }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") searchSpotify();
  };

  const handleSelect = (track: Track) => {
    setSelectedTrack(track);
    onSelect(track);
    onClose();
  };

  const handlePlayPreview = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (!track.preview) return;
    if (audio && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      const newAudio = new Audio(track.preview);
      newAudio.play();
      newAudio.onended = () => setIsPlaying(false);
      setAudio(newAudio);
      setIsPlaying(true);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ background: "#1a1a2e", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 25px 50px rgba(0,0,0,0.5)", width: "100%", maxWidth: 480, maxHeight: "80vh", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>🎵</span>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>What are you listening to?</h2>
          </div>
          <button onClick={onClose} style={{ padding: 6, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.6)" }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search for a song..."
                autoFocus
                style={{ width: "100%", paddingLeft: 36, paddingRight: 12, paddingTop: 10, paddingBottom: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", outline: "none", fontSize: 14, fontFamily: "Inter, sans-serif" }}
              />
            </div>
            <button
              onClick={searchSpotify}
              disabled={loading || !query.trim()}
              style={{ padding: "10px 16px", background: "#1DB954", color: "#fff", border: "none", borderRadius: 12, fontWeight: 600, cursor: loading || !query.trim() ? "not-allowed" : "pointer", opacity: loading || !query.trim() ? 0.5 : 1, fontSize: 14, fontFamily: "Inter, sans-serif" }}
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </div>

        <div style={{ padding: 16, overflowY: "auto", maxHeight: 384 }}>
          {loading && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
              <div style={{ width: 32, height: 32, border: "2px solid #1DB954", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
            </div>
          )}

          {!loading && results.length === 0 && query && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🔍</span>
              <p style={{ color: "rgba(255,255,255,0.6)" }}>No results found</p>
              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 4 }}>Try searching for a different song</p>
            </div>
          )}

          {!loading && results.length === 0 && !query && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🎵</span>
              <p style={{ color: "rgba(255,255,255,0.6)" }}>Search for a song to add to your bio</p>
            </div>
          )}

          {results.map((track) => (
            <div
              key={track.id}
              onClick={() => handleSelect(track)}
              style={{ display: "flex", alignItems: "center", gap: 16, padding: 12, borderRadius: 12, cursor: "pointer", transition: "background 0.15s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
            >
              {track.albumArt ? (
                <img src={track.albumArt} alt={track.album} style={{ width: 48, height: 48, borderRadius: 8, objectFit: "cover" }} />
              ) : (
                <div style={{ width: 48, height: 48, borderRadius: 8, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎵</div>
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: "#fff", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.name}</p>
                <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {track.preview && (
                  <button
                    onClick={(e) => handlePlayPreview(e, track)}
                    style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}
                  >
                    {isPlaying && audio?.src.includes(track.preview) ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleSelect(track); }}
                  style={{ padding: "6px 12px", background: "#1DB954", color: "#fff", border: "none", borderRadius: 8, fontWeight: 500, cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}
                >
                  Select
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ padding: "12px 24px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: 12, color: "rgba(255,255,255,0.4)", textAlign: "center" }}>
          Powered by Spotify
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
