"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { getDoomscrollProgress, loadDoomscrollSettings, saveDoomscrollSettings, updateDoomscrollUsage, loadDoomscrollUsage, type DoomscrollSettings } from "@/lib/user-data";
import { Settings, Lock, Unlock, Timer, Play, Pause, RotateCcw, BookOpen, Clock, Zap, ChevronUp, ChevronDown, X } from "lucide-react";

interface Video {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  publishedAt: string;
}

export default function DoomscrollPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<{ current: number; target: number; type: string; unlocked: boolean } | null>(null);
  const [settings, setSettings] = useState<DoomscrollSettings>({ benchmark_type: "cards", benchmark_target: 50, scroll_duration_min: 10 });
  const [usage, setUsage] = useState<{ seconds_used: number; unlocked: boolean }>({ seconds_used: 0, unlocked: false });
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scrolling, setScrolling] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [fetchingVideos, setFetchingVideos] = useState(false);
  const feedRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load progress and settings
  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, s, u] = await Promise.all([
        getDoomscrollProgress(user.id),
        loadDoomscrollSettings(user.id),
        loadDoomscrollUsage(user.id),
      ]);
      setProgress(p);
      setSettings(s);
      setUsage(u);
      setTimeLeft(Math.max(0, s.scroll_duration_min * 60 - u.seconds_used));
      setLoading(false);
    })();
  }, [user]);

  // Fetch videos when unlocked
  useEffect(() => {
    if (!progress?.unlocked || videos.length > 0 || fetchingVideos) return;
    fetchVideos();
  }, [progress?.unlocked]);

  const fetchVideos = async () => {
    setFetchingVideos(true);
    try {
      const res = await fetch(`/api/doomscroll?count=12`);
      const data = await res.json();
      if (data.videos) setVideos(data.videos);
    } catch (e) { console.error("Failed to fetch videos:", e); }
    setFetchingVideos(false);
  };

  // Timer for scroll session
  useEffect(() => {
    if (!scrolling || timeLeft <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setScrolling(false);
          if (user) updateDoomscrollUsage(user.id, settings.scroll_duration_min * 60, true);
          return 0;
        }
        if (user && prev % 5 === 0) {
          updateDoomscrollUsage(user.id, settings.scroll_duration_min * 60 - prev + 1, true);
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [scrolling, timeLeft, user, settings.scroll_duration_min]);

  // Navigate videos
  const goNext = useCallback(() => {
    if (currentIdx < videos.length - 1) setCurrentIdx(currentIdx + 1);
    else { fetchVideos(); setCurrentIdx(0); }
  }, [currentIdx, videos.length]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx(currentIdx - 1);
  }, [currentIdx]);

  // Scroll wheel navigation
  useEffect(() => {
    const el = feedRef.current;
    if (!el || !progress?.unlocked || !scrolling) return;
    let timeout: NodeJS.Timeout | null = null;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (timeout) return;
      timeout = setTimeout(() => { timeout = null; }, 600);
      if (e.deltaY > 30) goNext();
      else if (e.deltaY < -30) goPrev();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [progress?.unlocked, scrolling, goNext, goPrev]);

  // Touch navigation
  const touchStart = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStart.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStart.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) { if (diff > 0) goNext(); else goPrev(); }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const progressPercent = progress ? Math.min(100, (progress.current / progress.target) * 100) : 0;
  const isLocked = progress && !progress.unlocked;
  const isUnlocked = progress?.unlocked && timeLeft > 0;

  const handleSaveSettings = async () => {
    if (!user) return;
    await saveDoomscrollSettings(user.id, settings);
    const p = await getDoomscrollProgress(user.id);
    setProgress(p);
    setTimeLeft(settings.scroll_duration_min * 60 - usage.seconds_used);
    setShowSettings(false);
  };

  if (loading) return <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh", color: "var(--os-text-dim)" }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "16px 16px 100px", minHeight: "80vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {isLocked ? <Lock size={20} style={{ color: "#f59e0b" }} /> : <Unlock size={20} style={{ color: "#22c55e" }} />}
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-primary)", margin: 0 }}>Doomscroll</h1>
        </div>
        <button onClick={() => setShowSettings(!showSettings)} style={{ padding: 6, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 6, color: "var(--os-text-dim)", cursor: "pointer" }}>
          <Settings size={16} />
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid var(--os-glass-border)" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--os-text-primary)", marginBottom: 12 }}>Daily Goal Settings</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--os-text-dim)", marginBottom: 4, display: "block" }}>Benchmark Type</label>
              <select value={settings.benchmark_type} onChange={(e) => setSettings({ ...settings, benchmark_type: e.target.value as any })} style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }}>
                <option value="cards">Cards Reviewed</option>
                <option value="minutes">Minutes Studied</option>
                <option value="quizzes">Quizzes Completed</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--os-text-dim)", marginBottom: 4, display: "block" }}>Target Amount</label>
              <input type="number" value={settings.benchmark_target} onChange={(e) => setSettings({ ...settings, benchmark_target: parseInt(e.target.value) || 1 })} min={1} style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--os-text-dim)", marginBottom: 4, display: "block" }}>Scroll Time (minutes)</label>
              <input type="number" value={settings.scroll_duration_min} onChange={(e) => setSettings({ ...settings, scroll_duration_min: parseInt(e.target.value) || 1 })} min={1} max={60} style={{ width: "100%", padding: "8px 10px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }} />
            </div>
            <button onClick={handleSaveSettings} className="glass-btn glass-btn-primary" style={{ padding: "8px 16px", fontSize: 13, alignSelf: "flex-start" }}>Save Settings</button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid var(--os-glass-border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: "var(--os-text-dim)" }}>
            {settings.benchmark_type === "cards" && `${progress?.current || 0} / ${progress?.target || 50} cards`}
            {settings.benchmark_type === "minutes" && `${progress?.current || 0} / ${progress?.target || 30} min`}
            {settings.benchmark_type === "quizzes" && `${progress?.current || 0} / ${progress?.target || 1} quizzes`}
          </span>
          <span style={{ fontSize: 12, color: progressPercent >= 100 ? "#22c55e" : "#f59e0b", fontWeight: 600 }}>
            {progressPercent >= 100 ? "Unlocked!" : `${Math.round(progressPercent)}%`}
          </span>
        </div>
        <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.08)", borderRadius: 4, overflow: "hidden" }}>
          <div style={{ width: `${Math.min(100, progressPercent)}%`, height: "100%", background: progressPercent >= 100 ? "linear-gradient(90deg, #22c55e, #16a34a)" : "linear-gradient(90deg, #f59e0b, #f97316)", borderRadius: 4, transition: "width 0.5s ease" }} />
        </div>
        {progressPercent < 100 && (
          <div style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 8, textAlign: "center" }}>
            Study to unlock your scroll session
          </div>
        )}
      </div>

      {/* Timer / Scroll Controls */}
      {progress?.unlocked && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: timeLeft > 0 ? "#22c55e" : "var(--os-text-dim)" }}>
            <Timer size={16} />
            {formatTime(timeLeft)}
          </div>
          {!scrolling && timeLeft > 0 && (
            <button onClick={() => setScrolling(true)} style={{ padding: "6px 16px", background: "linear-gradient(135deg, #8b5cf6, #6d28d9)", border: "none", borderRadius: 8, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Play size={14} /> Start Scrolling
            </button>
          )}
          {scrolling && (
            <button onClick={() => setScrolling(false)} style={{ padding: "6px 16px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <Pause size={14} /> Pause
            </button>
          )}
        </div>
      )}

      {/* Feed */}
      {isLocked && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, opacity: 0.6 }}>
          <Lock size={48} style={{ color: "#f59e0b" }} />
          <div style={{ fontSize: 16, fontWeight: 600, color: "var(--os-text-primary)" }}>Feed Locked</div>
          <div style={{ fontSize: 13, color: "var(--os-text-dim)", textAlign: "center", maxWidth: 280 }}>
            Complete your daily goal of {settings.benchmark_target} {settings.benchmark_type} to unlock the scroll feed
          </div>
        </div>
      )}

      {isUnlocked && scrolling && videos.length > 0 && (
        <div ref={feedRef} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, position: "relative" }}>
          {/* Navigation hints */}
          <button onClick={goPrev} disabled={currentIdx === 0} style={{ position: "absolute", top: -30, padding: 4, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 4, color: currentIdx === 0 ? "transparent" : "var(--os-text-dim)", cursor: currentIdx === 0 ? "default" : "pointer", zIndex: 2 }}>
            <ChevronUp size={16} />
          </button>

          {/* Current Video */}
          <div style={{ width: "100%", maxWidth: 400, aspectRatio: "9/16", borderRadius: 16, overflow: "hidden", background: "#000", position: "relative" }}>
            <iframe
              src={`https://www.youtube.com/embed/${videos[currentIdx].id}?autoplay=1&mute=1&controls=0&modestbranding=1&rel=0`}
              style={{ width: "100%", height: "100%", border: "none" }}
              allow="autoplay; encrypted-media"
              title={videos[currentIdx].title}
            />
            {/* Video info overlay */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "40px 16px 16px", background: "linear-gradient(transparent, rgba(0,0,0,0.8))" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{videos[currentIdx].channel}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{videos[currentIdx].title}</div>
            </div>
          </div>

          <button onClick={goNext} style={{ position: "absolute", bottom: -30, padding: 4, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 4, color: "var(--os-text-dim)", cursor: "pointer", zIndex: 2 }}>
            <ChevronDown size={16} />
          </button>

          {/* Scroll indicator */}
          <div style={{ fontSize: 11, color: "var(--os-text-dim)", textAlign: "center" }}>
            {currentIdx + 1} / {videos.length} · Scroll or swipe to navigate
          </div>
        </div>
      )}

      {isUnlocked && !scrolling && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
          <div style={{ fontSize: 14, color: "var(--os-text-dim)", textAlign: "center" }}>
            {timeLeft > 0 ? `You have ${formatTime(timeLeft)} of scroll time remaining` : "No scroll time remaining today"}
          </div>
        </div>
      )}

      {isUnlocked && scrolling && fetchingVideos && (
        <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", color: "var(--os-text-dim)" }}>
          Loading videos...
        </div>
      )}
    </div>
  );
}
