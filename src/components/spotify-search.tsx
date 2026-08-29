"use client";

import { useState, useEffect, useRef } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, []);

  const searchSpotify = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        setResults([]);
      } else if (data.tracks) {
        setResults(data.tracks);
        if (data.tracks.length === 0) {
          setError("No results found");
        }
      } else {
        setResults([]);
        setError("No results found");
      }
    } catch {
      setError("Failed to search. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const queryRef = useRef(query);
  queryRef.current = query;

  const handleSearch = () => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      searchSpotify(queryRef.current);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      searchSpotify(queryRef.current);
    }
  };

  const handleSelect = (track: Track) => {
    setSelectedTrack(track);
    onSelect(track);
    onClose();
  };

  const handlePlayPreview = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    if (!track.preview) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      if (isPlaying) {
        setIsPlaying(false);
        return;
      }
    }

    const newAudio = new Audio(track.preview);
    newAudio.play().catch(() => {});
    newAudio.onended = () => {
      setIsPlaying(false);
      audioRef.current = null;
    };
    audioRef.current = newAudio;
    setIsPlaying(true);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div style={{
        background: "var(--os-bg-secondary)", borderRadius: 16,
        border: "1px solid var(--os-glass-border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        width: "100%", maxWidth: 480, maxHeight: "80vh", overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", borderBottom: "1px solid var(--os-glass-border)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>&#127925;</span>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--os-text-primary)", margin: 0 }}>
              What are you listening to?
            </h2>
          </div>
          <button onClick={onClose} style={{
            padding: 6, borderRadius: 8, background: "none", border: "none",
            cursor: "pointer", color: "var(--os-text-secondary)", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: 16, borderBottom: "1px solid var(--os-glass-border)" }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, position: "relative" }}>
              <Search size={16} style={{
                position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
                color: "var(--os-text-dim)",
              }} />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  handleSearch();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search for a song or artist..."
                autoFocus
                style={{
                  width: "100%", padding: "10px 12px 10px 36px",
                  background: "rgba(255,255,255,0.05)", border: "1px solid var(--os-glass-border)",
                  borderRadius: 10, color: "var(--os-text-primary)", fontSize: 14,
                  outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <button
              onClick={() => searchSpotify(query)}
              disabled={loading || !query.trim()}
              style={{
                padding: "10px 16px", background: "#1DB954", border: "none", borderRadius: 10,
                color: "#fff", fontWeight: 500, fontSize: 13, cursor: loading || !query.trim() ? "not-allowed" : "pointer",
                opacity: loading || !query.trim() ? 0.5 : 1, whiteSpace: "nowrap",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {loading ? (
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent",
                    borderRadius: "50%", animation: "spin 0.6s linear infinite", display: "inline-block",
                  }} />
                  Loading...
                </span>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>

        {error && results.length === 0 && !loading && (
          <div style={{ padding: 16 }}>
            <div style={{
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
              borderRadius: 12, padding: 16, textAlign: "center",
            }}>
              <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>&#128269;</span>
              <p style={{ color: "#f87171", fontWeight: 500, margin: 0 }}>{error}</p>
              <p style={{ color: "var(--os-text-dim)", fontSize: 13, marginTop: 4 }}>
                Try searching for a different song or artist
              </p>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 0" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <div style={{
                  width: 40, height: 40, border: "3px solid #1DB954", borderTopColor: "transparent",
                  borderRadius: "50%", animation: "spin 0.6s linear infinite",
                }} />
                <p style={{ color: "var(--os-text-secondary)", fontSize: 13, margin: 0 }}>
                  Searching Spotify...
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div style={{ padding: 16, overflowY: "auto", maxHeight: 384 }}>
            {results.map((track) => (
              <div
                key={track.id}
                onClick={() => handleSelect(track)}
                style={{
                  display: "flex", alignItems: "center", gap: 16, padding: 12,
                  borderRadius: 12, cursor: "pointer", transition: "background 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--os-glass-hover)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {track.albumArt ? (
                  <img src={track.albumArt} alt={track.album} style={{
                    width: 48, height: 48, borderRadius: 8, objectFit: "cover", flexShrink: 0,
                  }} />
                ) : (
                  <div style={{
                    width: 48, height: 48, borderRadius: 8, background: "rgba(255,255,255,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 24, flexShrink: 0,
                  }}>&#127925;</div>
                )}

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    color: "var(--os-text-primary)", fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0,
                  }}>{track.name}</p>
                  <p style={{
                    color: "var(--os-text-secondary)", fontSize: 13,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "2px 0 0",
                  }}>{track.artist}</p>
                  <p style={{
                    color: "var(--os-text-dim)", fontSize: 12,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "2px 0 0",
                  }}>{track.album}</p>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {track.preview && (
                    <button
                      onClick={(e) => handlePlayPreview(e, track)}
                      style={{
                        padding: 8, borderRadius: "50%", background: "rgba(255,255,255,0.1)",
                        border: "none", cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {isPlaying && audioRef.current?.src.includes(track.preview) ? (
                        <Pause size={16} color="var(--os-text-primary)" />
                      ) : (
                        <Play size={16} color="var(--os-text-primary)" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSelect(track); }}
                    style={{
                      padding: "6px 12px", fontSize: 13, background: "#1DB954",
                      border: "none", borderRadius: 8, color: "#fff", fontWeight: 500,
                      cursor: "pointer", fontFamily: "Inter, sans-serif",
                    }}
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && !error && query && (
          <div style={{ padding: 16 }}>
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>&#127925;</span>
              <p style={{ color: "var(--os-text-secondary)", margin: 0 }}>No results found</p>
              <p style={{ color: "var(--os-text-dim)", fontSize: 13, marginTop: 4 }}>
                Try searching for a different song
              </p>
            </div>
          </div>
        )}

        {!loading && results.length === 0 && !error && !query && (
          <div style={{ padding: 16 }}>
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>&#128269;</span>
              <p style={{ color: "var(--os-text-secondary)", margin: 0 }}>
                Search for a song to add to your bio
              </p>
              <p style={{ color: "var(--os-text-dim)", fontSize: 13, marginTop: 4 }}>
                Type a song name or artist above
              </p>
            </div>
          </div>
        )}

        <div style={{
          padding: "12px 24px", borderTop: "1px solid var(--os-glass-border)",
          fontSize: 12, color: "var(--os-text-dim)", textAlign: "center",
        }}>
          Powered by Spotify
        </div>
      </div>
    </div>
  );
}
