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
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [audio]);

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

  const handleSearch = () => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      searchSpotify(query);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
      searchSpotify(query);
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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#1a1a2e] rounded-2xl border border-white/10 shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎵</span>
            <h2 className="text-lg font-semibold text-white">What are you listening to?</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  handleSearch();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search for a song or artist..."
                className="w-full pl-9 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-[#1DB954] transition-colors"
                autoFocus
              />
            </div>
            <button
              onClick={() => searchSpotify(query)}
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 bg-[#1DB954] hover:bg-[#1ed760] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-medium transition-colors whitespace-nowrap"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  Loading...
                </span>
              ) : (
                "Search"
              )}
            </button>
          </div>
        </div>

        {error && results.length === 0 && !loading && (
          <div className="p-4">
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
              <span className="text-3xl block mb-2">🔍</span>
              <p className="text-red-400 font-medium">{error}</p>
              <p className="text-white/40 text-sm mt-1">Try searching for a different song or artist</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="p-4">
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin w-10 h-10 border-[3px] border-[#1DB954] border-t-transparent rounded-full" />
                <p className="text-white/60 text-sm">Searching Spotify...</p>
              </div>
            </div>
          </div>
        )}

        {!loading && results.length > 0 && (
          <div className="p-4 overflow-y-auto max-h-96">
            {results.map((track) => (
              <div
                key={track.id}
                onClick={() => handleSelect(track)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
              >
                {track.albumArt ? (
                  <img src={track.albumArt} alt={track.album} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-2xl flex-shrink-0">🎵</div>
                )}

                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{track.name}</p>
                  <p className="text-white/60 text-sm truncate">{track.artist}</p>
                  <p className="text-white/40 text-xs truncate">{track.album}</p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {track.preview && (
                    <button
                      onClick={(e) => handlePlayPreview(e, track)}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      {isPlaying && audio?.src.includes(track.preview) ? (
                        <Pause className="w-4 h-4 text-white" />
                      ) : (
                        <Play className="w-4 h-4 text-white" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSelect(track); }}
                    className="px-3 py-1.5 text-sm bg-[#1DB954] hover:bg-[#1ed760] rounded-lg text-white font-medium transition-colors"
                  >
                    Select
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && results.length === 0 && !error && query && (
          <div className="p-4">
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">🎵</span>
              <p className="text-white/60">No results found</p>
              <p className="text-white/40 text-sm mt-1">Try searching for a different song</p>
            </div>
          </div>
        )}

        {!loading && results.length === 0 && !error && !query && (
          <div className="p-4">
            <div className="text-center py-12">
              <span className="text-4xl block mb-3">🔍</span>
              <p className="text-white/60">Search for a song to add to your bio</p>
              <p className="text-white/40 text-sm mt-1">Type a song name or artist above</p>
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-b border-white/10 text-xs text-white/40 text-center">
          Powered by Spotify
        </div>
      </div>
    </div>
  );
}
