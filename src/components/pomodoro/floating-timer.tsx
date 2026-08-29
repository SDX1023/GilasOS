"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, Maximize2 } from "lucide-react";
import { usePomodoro } from "./pomodoro-context";

export function FloatingTimer() {
  const { timeLeft, isRunning, mode, progress, formatTime, pause, start } = usePomodoro();
  const router = useRouter();

  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  useEffect(() => {
    setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 120 });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = {
        x: e.clientX,
        y: e.clientY,
        posX: position.x,
        posY: position.y,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [position]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.x;
      const dy = e.clientY - dragStart.current.y;
      const clampedX = Math.max(0, Math.min(window.innerWidth - 72, dragStart.current.posX + dx));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 120, dragStart.current.posY + dy));
      setPosition({ x: clampedX, y: clampedY });
    },
    [isDragging]
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!isRunning || position.x === -1) return null;

  const modeBg =
    mode === "work"
      ? "var(--os-accent)"
      : mode === "shortBreak"
      ? "#10b981"
      : "#3b82f6";

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  return (
    <div
      ref={dragRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 9999,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* Circle */}
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: modeBg,
          color: "#fff",
          position: "relative",
          boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        }}
      >
        <svg
          width="64"
          height="64"
          viewBox="0 0 64 64"
          style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
        >
          <circle cx="32" cy="32" r="30" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
          <circle
            cx="32" cy="32" r="30" fill="none"
            stroke="rgba(255,255,255,0.85)" strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 30}`}
            strokeDashoffset={`${2 * Math.PI * 30 * (1 - progress / 100)}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div
          style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600,
          }}
        >
          {timeStr}
        </div>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginTop: 8,
          height: hovered ? 32 : 0,
          opacity: hovered ? 1 : 0,
          overflow: "hidden",
          transition: "all 0.2s ease",
          pointerEvents: hovered ? "auto" : "none",
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            isRunning ? pause() : start();
          }}
          style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "var(--os-bg-secondary)", border: "1px solid var(--os-glass-border)",
            color: "var(--os-text-primary)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
          title={isRunning ? "Pause" : "Resume"}
        >
          {isRunning ? <Pause size={12} /> : <Play size={12} />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push("/pomodoro");
          }}
          style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "var(--os-bg-secondary)", border: "1px solid var(--os-glass-border)",
            color: "var(--os-text-primary)", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
          title="Open Pomodoro"
        >
          <Maximize2 size={12} />
        </button>
      </div>
    </div>
  );
}
