"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, X, Music, Square } from "lucide-react";

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

const WAVEFORM_BARS = 100;
const DEFAULT_DURATION = 60;

let generatedBars: number[] = [];
function getBars() {
  if (generatedBars.length === WAVEFORM_BARS) return generatedBars;
  generatedBars = Array.from({ length: WAVEFORM_BARS }, () => 0.15 + Math.random() * 0.85);
  return generatedBars;
}

export function MusicSelector({ onSelect, onClose }: MusicSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const [clipDuration, setClipDuration] = useState(30);
  const [selectionStart, setSelectionStart] = useState(0);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [fetchingPreview, setFetchingPreview] = useState(false);
  const [searchPage, setSearchPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(400);
  const [trackDuration, setTrackDuration] = useState(DEFAULT_DURATION);
  const isDraggingRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartSel = useRef(0);

  useEffect(() => {
    const measure = () => {
      if (waveformContainerRef.current) {
        setCanvasWidth(waveformContainerRef.current.offsetWidth);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [selectedTrack]);

  const maxStart = Math.max(0, trackDuration - clipDuration);

  const searchTracks = async (page = 0) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}&offset=${page * 20}`);
      const data = await res.json();
      if (data.tracks) {
        if (page === 0) setResults(data.tracks);
        else setResults((prev) => [...prev, ...data.tracks]);
        setHasMore(data.tracks.length === 20);
        setSearchPage(page);
      }
    } catch (e) { console.error("Search error:", e); }
    finally { setLoading(false); }
  };

  const getPreview = async (trackId: string) => {
    setFetchingPreview(true);
    try {
      const res = await fetch(`/api/spotify/preview?id=${trackId}`);
      const data = await res.json();
      return data.previewUrl || null;
    } catch { return null; }
    finally { setFetchingPreview(false); }
  };

  const handleSelectTrack = async (track: Track) => {
    generatedBars = [];
    setSelectedTrack(track);
    setSelectionStart(0);
    setTrackDuration(DEFAULT_DURATION);
    setIsPlaying(false);
    if (audio) { audio.pause(); setAudio(null); }
    if (!track.preview) {
      const url = await getPreview(track.id);
      if (url) {
        setSelectedTrack((prev) => prev ? { ...prev, preview: url } : null);
        loadAudio(url);
      }
    } else {
      loadAudio(track.preview);
    }
  };

  const loadAudio = (url: string) => {
    if (audio) { audio.pause(); audio.src = ""; }
    const a = new Audio(url);
    a.addEventListener("ended", () => setIsPlaying(false));
    let gotValidDur = false;
    const onDur = () => {
      const dur = a.duration;
      if (!gotValidDur && dur && isFinite(dur) && dur > 0 && dur < 300) {
        gotValidDur = true;
        setTrackDuration(Math.ceil(dur));
      }
    };
    a.addEventListener("loadedmetadata", onDur);
    a.addEventListener("canplay", onDur);
    a.addEventListener("durationchange", onDur);
    a.addEventListener("error", () => { if (!gotValidDur) setTrackDuration(30); });
    // Fallback: if duration never loads, assume Spotify preview = 30s
    setTimeout(() => { if (!gotValidDur) setTrackDuration(30); }, 2000);
    setAudio(a);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.currentTime = selectionStart;
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stopPlay = () => {
    if (audio) audio.pause();
    setIsPlaying(false);
  };

  useEffect(() => {
    if (!audio) return;
    const handler = () => {
      if (audio.currentTime >= selectionStart + clipDuration) {
        audio.pause();
        setIsPlaying(false);
      }
    };
    audio.addEventListener("timeupdate", handler);
    return () => audio.removeEventListener("timeupdate", handler);
  }, [audio, selectionStart, clipDuration]);

  useEffect(() => {
    return () => { if (audio) { audio.pause(); audio.src = ""; } };
  }, [audio]);

  const onDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    dragStartX.current = clientX;
    const selEl = waveformContainerRef.current?.querySelector("[data-sel]") as HTMLElement;
    dragStartSel.current = selEl ? parseFloat(selEl.style.left) / 100 * maxStart : selectionStart;
  }, [maxStart, selectionStart]);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current || !waveformContainerRef.current) return;
      const container = waveformContainerRef.current;
      const rect = container.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const dx = clientX - dragStartX.current;
      const dSeconds = (dx / rect.width) * trackDuration;
      const newStart = Math.max(0, Math.min(maxStart, dragStartSel.current + dSeconds));
      setSelectionStart(Math.round(newStart * 10) / 10);
    };
    const onUp = () => { isDraggingRef.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [maxStart, trackDuration]);

  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas || !selectedTrack) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const bars = getBars();
    const barW = w / bars.length;
    const gap = Math.max(1, barW * 0.25);
    const selStartPct = selectionStart / trackDuration;
    const selEndPct = (selectionStart + clipDuration) / trackDuration;

    for (let i = 0; i < bars.length; i++) {
      const pct = bars[i];
      const bh = h * pct * 0.85;
      const x = i * barW;
      const y = (h - bh) / 2;
      const barPct = (i + 0.5) / bars.length;
      const inSel = barPct >= selStartPct && barPct <= selEndPct;

      if (inSel) {
        const gradPct = (barPct - selStartPct) / (selEndPct - selStartPct);
        const r = Math.round(255 * (1 - gradPct * 0.4));
        const g = Math.round(180 * gradPct + 80);
        const b = Math.round(50 + 200 * gradPct);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
      }
      ctx.beginPath();
      ctx.moveTo(x + gap / 2 + 1.5, y);
      ctx.lineTo(x + barW - gap / 2 - 1.5, y);
      ctx.quadraticCurveTo(x + barW - gap / 2, y, x + barW - gap / 2, y + 1.5);
      ctx.lineTo(x + barW - gap / 2, y + bh - 1.5);
      ctx.quadraticCurveTo(x + barW - gap / 2, y + bh, x + barW - gap / 2 - 1.5, y + bh);
      ctx.lineTo(x + gap / 2 + 1.5, y + bh);
      ctx.quadraticCurveTo(x + gap / 2, y + bh, x + gap / 2, y + bh - 1.5);
      ctx.lineTo(x + gap / 2, y + 1.5);
      ctx.quadraticCurveTo(x + gap / 2, y, x + gap / 2 + 1.5, y);
      ctx.closePath();
      ctx.fill();
    }
  }, [selectedTrack, selectionStart, clipDuration, trackDuration]);

  const cycleDuration = () => {
    const steps = [15, 20, 25, 30, 45, 60, Math.min(90, trackDuration)];
    const unique = [...new Set(steps)].filter((s) => s <= trackDuration).sort((a, b) => a - b);
    const idx = unique.indexOf(clipDuration);
    const next = unique[(idx + 1) % unique.length];
    setClipDuration(next);
    if (selectionStart > Math.max(0, trackDuration - next)) {
      setSelectionStart(Math.max(0, trackDuration - next));
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={onClose}>
      <div style={{ background: "#1a1a2e", borderRadius: 16, maxWidth: 440, width: "100%", margin: "0 16px", maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={(e) => e.stopPropagation()}>

        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "10px 0 4px" }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)" }} />
        </div>

        {/* Header: "New song" + "Finished" */}
        {!selectedTrack && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 20px 12px" }}>
            <span style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>New song</span>
            <button onClick={onClose} style={{ background: "none", border: "none", color: "#1DB954", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Finished</button>
          </div>
        )}

        {/* Search */}
        {!selectedTrack && (
          <div style={{ padding: "0 20px 12px" }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") searchTracks(0); }}
              placeholder="Search for a song..."
              autoFocus
              style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", fontSize: 14, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }}
            />
          </div>
        )}

        {/* Track List */}
        {!selectedTrack && (
          <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 20px", maxHeight: "60vh" }}>
            {results.length === 0 && !loading && (
              <div style={{ textAlign: "center", padding: "48px 0", color: "rgba(255,255,255,0.3)" }}>
                <Music size={36} style={{ margin: "0 auto 10px" }} />
                <p style={{ fontSize: 14 }}>Search for a song</p>
              </div>
            )}
            {results.map((track) => (
              <div
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 4px", borderRadius: 8, cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {track.albumArt ? (
                  <img src={track.albumArt} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover" }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 6, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Music size={20} style={{ color: "rgba(255,255,255,0.3)" }} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 500, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{track.name}</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "2px 0 0" }}>{track.artist}</p>
                </div>
              </div>
            ))}
            {hasMore && (
              <button onClick={() => searchTracks(searchPage + 1)} disabled={loading} style={{ width: "100%", padding: 10, marginTop: 8, borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                {loading ? "Loading..." : "Load More"}
              </button>
            )}
          </div>
        )}

        {/* Player */}
        {selectedTrack && (
          <div style={{ padding: "8px 20px 24px" }}>
            {/* "New song" + "Finished" */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <span style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>New song</span>
              <button
                onClick={() => {
                  if (selectedTrack) {
                    onSelect({
                      name: selectedTrack.name, artist: selectedTrack.artist,
                      url: selectedTrack.url, albumArt: selectedTrack.albumArt || "",
                      preview: selectedTrack.preview,
                    }, selectionStart);
                    onClose();
                  }
                }}
                style={{ background: "none", border: "none", color: "#1DB954", fontSize: 16, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
              >Finished</button>
            </div>

            {/* Album art + track info */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
              {selectedTrack.albumArt ? (
                <img src={selectedTrack.albumArt} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", marginBottom: 10 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: 8, background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                  <Music size={24} style={{ color: "rgba(255,255,255,0.3)" }} />
                </div>
              )}
              <p style={{ fontSize: 15, fontWeight: 600, color: "#fff", margin: 0, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{selectedTrack.name}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", margin: "3px 0 0", textAlign: "center" }}>{selectedTrack.artist}</p>
              {fetchingPreview && <p style={{ fontSize: 11, color: "#1DB954", margin: "4px 0 0" }}>Loading preview...</p>}
              {!selectedTrack.preview && !fetchingPreview && (
                <p style={{ fontSize: 11, color: "#ef4444", margin: "4px 0 0" }}>No preview available</p>
              )}
            </div>

            {/* Scrub bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", minWidth: 32, textAlign: "right" }}>{formatTime(selectionStart)}</span>
              <div style={{ flex: 1, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.15)", position: "relative" }}>
                <div style={{ position: "absolute", left: `${(selectionStart / trackDuration) * 100}%`, width: `${(clipDuration / trackDuration) * 100}%`, height: "100%", borderRadius: 2, background: "rgba(29,185,84,0.4)" }} />
                <div style={{ position: "absolute", left: `${(selectionStart / trackDuration) * 100}%`, top: -4, width: 11, height: 11, borderRadius: "50%", background: "#fff", transform: "translateX(-50%)" }} />
                <div style={{ position: "absolute", left: `${((selectionStart + clipDuration) / trackDuration) * 100}%`, top: -4, width: 11, height: 11, borderRadius: "50%", background: "#ef4444", transform: "translateX(-50%)" }} />
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", minWidth: 32 }}>{formatTime(selectionStart + clipDuration)}</span>
            </div>

            {/* Waveform with draggable selection */}
            <div ref={waveformContainerRef} style={{ position: "relative", height: 64, marginBottom: 4, cursor: "grab", touchAction: "none" }} onMouseDown={onDragStart} onTouchStart={onDragStart}>
              <canvas ref={waveformRef} width={canvasWidth} height={64} style={{ width: "100%", height: 64, borderRadius: 6 }} />
            </div>

            {/* Controls: duration badge + play/stop */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <button
                onClick={cycleDuration}
                style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1.5px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}
                title="Click to change clip duration"
              >
                {clipDuration}
              </button>

              <button
                onClick={isPlaying ? stopPlay : togglePlay}
                style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", border: "none", color: "#000", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
              >
                {isPlaying ? <Square size={16} fill="#000" /> : <Play size={18} fill="#000" style={{ marginLeft: 2 }} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}