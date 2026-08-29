"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { usePomodoro, type TimerMode } from "./pomodoro-context";

export function PomodoroTimer() {
  const {
    timeLeft,
    isRunning,
    mode,
    sessions,
    settings,
    progress,
    totalTime,
    formatTime,
    start,
    reset,
    switchMode,
    updateSettings,
  } = usePomodoro();

  const [showSettings, setShowSettings] = useState(false);

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const modeLabel = (m: TimerMode) =>
    m === "work" ? "Focus" : m === "shortBreak" ? "Short Break" : "Long Break";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
      {/* Mode Tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {(["work", "shortBreak", "longBreak"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            style={{
              padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 500,
              border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif",
              background: mode === m ? "var(--os-accent)" : "rgba(255,255,255,0.06)",
              color: mode === m ? "#fff" : "var(--os-text-dim)",
              transition: "all 0.15s",
            }}
          >
            {modeLabel(m)}
          </button>
        ))}
      </div>

      {/* Timer Circle */}
      <div style={{ position: "relative" }}>
        <svg width="280" height="280" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="140" cy="140" r="120"
            fill="transparent"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
          />
          <circle
            cx="140" cy="140" r="120"
            fill="transparent"
            stroke={mode === "work" ? "var(--os-accent)" : "#10b981"}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 48, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <button
          onClick={start}
          style={{
            display: "flex", alignItems: "center", gap: 8, padding: "12px 32px",
            borderRadius: 14, fontSize: 15, fontWeight: 600, border: "none",
            cursor: "pointer", fontFamily: "Inter, sans-serif",
            background: isRunning ? "rgba(255,255,255,0.06)" : "var(--os-accent)",
            color: isRunning ? "var(--os-text-secondary)" : "#fff",
            transition: "all 0.15s",
          }}
        >
          {isRunning ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Start</>}
        </button>

        <button
          onClick={reset}
          style={{
            padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.06)",
            border: "none", cursor: "pointer", color: "var(--os-text-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <RotateCcw size={20} />
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            padding: 12, borderRadius: 14, background: "rgba(255,255,255,0.06)",
            border: "none", cursor: "pointer", color: "var(--os-text-dim)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Session Info */}
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 13, color: "var(--os-text-dim)" }}>
          Session {sessions + 1} of {settings.sessionsBeforeLongBreak}
        </p>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="glass-panel" style={{ width: "100%", maxWidth: 400, padding: 20 }}>
          <h3 style={{ fontWeight: 600, marginBottom: 16 }}>Settings</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: "var(--os-text-dim)", display: "block", marginBottom: 4 }}>Focus (min)</label>
              <input
                type="number"
                value={settings.workDuration}
                onChange={(e) => updateSettings({ ...settings, workDuration: Number(e.target.value) })}
                className="glass-input"
                min={1} max={120}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--os-text-dim)", display: "block", marginBottom: 4 }}>Short Break (min)</label>
              <input
                type="number"
                value={settings.shortBreakDuration}
                onChange={(e) => updateSettings({ ...settings, shortBreakDuration: Number(e.target.value) })}
                className="glass-input"
                min={1} max={30}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--os-text-dim)", display: "block", marginBottom: 4 }}>Long Break (min)</label>
              <input
                type="number"
                value={settings.longBreakDuration}
                onChange={(e) => updateSettings({ ...settings, longBreakDuration: Number(e.target.value) })}
                className="glass-input"
                min={1} max={60}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, color: "var(--os-text-dim)", display: "block", marginBottom: 4 }}>Sessions</label>
              <input
                type="number"
                value={settings.sessionsBeforeLongBreak}
                onChange={(e) => updateSettings({ ...settings, sessionsBeforeLongBreak: Number(e.target.value) })}
                className="glass-input"
                min={1} max={10}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
