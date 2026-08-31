"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";

const DURATIONS = [15, 25, 30, 45, 60] as const;
const AMBIENT_OPTIONS = ["Silent", "Rain", "Lo-fi", "Forest"] as const;

const QUOTES = [
  "The secret of getting ahead is getting started.",
  "It always seems impossible until it's done.",
  "Don't watch the clock; do what it does. Keep going.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Focus on being productive instead of busy.",
  "The only way to do great work is to love what you do.",
  "Discipline is choosing between what you want now and what you want most.",
  "Study hard what interests you the most in the most undisciplined way possible.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Your future is created by what you do today, not tomorrow.",
];

function getQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FocusMode({ isOpen, onClose }: FocusModeProps) {
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [ambient, setAmbient] = useState<string>("Silent");
  const [quote] = useState(getQuote);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const totalSeconds = duration * 60;

  const reset = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = null;
    setIsRunning(false);
    setTimeLeft(duration * 60);
  }, [duration]);

  const selectDuration = useCallback(
    (min: number) => {
      setDuration(min);
      setTimeLeft(min * 60);
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    },
    []
  );

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsRunning(false);
          if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
              new Notification("Focus session complete!", {
                body: "Great work — take a break!",
              });
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeStr = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const progress = totalSeconds > 0 ? 1 - timeLeft / totalSeconds : 0;

  const ringRadius = 100;
  const ringStroke = 4;
  const circumference = 2 * Math.PI * ringRadius;
  const offset = circumference * (1 - progress);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0a0e18",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily:
          "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "var(--os-text-primary)",
      }}
    >
      <button
        onClick={onClose}
        aria-label="Close focus mode"
        style={{
          position: "absolute",
          top: 24,
          right: 24,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "50%",
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "var(--os-text-secondary)",
          transition: "background 0.2s, color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.12)";
          e.currentTarget.style.color = "var(--os-text-primary)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          e.currentTarget.style.color = "var(--os-text-secondary)";
        }}
      >
        <X size={18} />
      </button>

      <p
        style={{
          fontSize: 14,
          color: "var(--os-text-dim)",
          marginBottom: 48,
          maxWidth: 480,
          textAlign: "center",
          lineHeight: 1.6,
          fontStyle: "italic",
          padding: "0 24px",
        }}
      >
        &ldquo;{quote}&rdquo;
      </p>

      <div
        style={{
          position: "relative",
          width: 240,
          height: 240,
          marginBottom: 40,
        }}
      >
        <svg
          width={240}
          height={240}
          style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
        >
          <circle
            cx={120}
            cy={120}
            r={ringRadius}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={ringStroke}
          />
          <circle
            cx={120}
            cy={120}
            r={ringRadius}
            fill="none"
            stroke="var(--os-accent)"
            strokeWidth={ringStroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{
              transition: "stroke-dashoffset 0.8s ease",
              filter: "drop-shadow(0 0 8px rgba(var(--os-accent-rgb), 0.4))",
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 72,
            fontWeight: 200,
            letterSpacing: -2,
            fontVariantNumeric: "tabular-nums",
            fontFamily:
              "'SF Mono', ui-monospace, 'Cascadia Code', 'Fira Code', monospace",
          }}
        >
          {timeStr}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 36,
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        {DURATIONS.map((m) => (
          <button
            key={m}
            onClick={() => selectDuration(m)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: `1px solid ${duration === m ? "var(--os-accent)" : "rgba(255,255,255,0.08)"}`,
              background:
                duration === m
                  ? "rgba(var(--os-accent-rgb), 0.15)"
                  : "rgba(255,255,255,0.04)",
              color:
                duration === m ? "var(--os-accent)" : "var(--os-text-secondary)",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            {m} min
          </button>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 40,
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        <button
          onClick={() => setIsRunning((r) => !r)}
          disabled={timeLeft === 0}
          style={{
            padding: "10px 32px",
            borderRadius: 10,
            border: "none",
            background:
              timeLeft === 0
                ? "rgba(255,255,255,0.06)"
                : "linear-gradient(135deg, var(--os-accent), var(--os-accent-purple))",
            color: timeLeft === 0 ? "var(--os-text-dim)" : "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: timeLeft === 0 ? "not-allowed" : "pointer",
            transition: "all 0.2s",
            boxShadow:
              timeLeft === 0
                ? "none"
                : "0 4px 20px rgba(var(--os-accent-rgb), 0.3)",
            fontFamily: "inherit",
          }}
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          style={{
            padding: "10px 32px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.04)",
            color: "var(--os-text-secondary)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
        >
          Reset
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          justifyContent: "center",
          padding: "0 24px",
        }}
      >
        {AMBIENT_OPTIONS.map((opt) => (
          <button
            key={opt}
            onClick={() => setAmbient(opt)}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: `1px solid ${ambient === opt ? "var(--os-accent)" : "rgba(255,255,255,0.06)"}`,
              background:
                ambient === opt
                  ? "rgba(var(--os-accent-rgb), 0.1)"
                  : "transparent",
              color:
                ambient === opt ? "var(--os-accent)" : "var(--os-text-dim)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
              fontFamily: "inherit",
            }}
          >
            {opt === "Silent" && "🔇 "}
            {opt === "Rain" && "🌧️ "}
            {opt === "Lo-fi" && "🎵 "}
            {opt === "Forest" && "🌲 "}
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
