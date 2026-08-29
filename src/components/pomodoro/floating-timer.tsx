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
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMoved = useRef(false);

  useEffect(() => {
    setPosition({ x: window.innerWidth - 80, y: window.innerHeight - 80 });
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      setIsDragging(true);
      hasMoved.current = false;
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
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasMoved.current = true;
      const clampedX = Math.max(0, Math.min(window.innerWidth - 72, dragStart.current.posX + dx));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 72, dragStart.current.posY + dy));
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
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 9999,
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: modeBg,
        color: "#fff",
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
        userSelect: "none",
        boxShadow: "0 4px 20px rgba(0,0,0,0.35)",
        animation: "fadeIn 0.3s ease",
      }}
    >
      {/* Progress ring */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        style={{ position: "absolute", inset: 0, transform: "rotate(-90deg)" }}
      >
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="3"
        />
        <circle
          cx="32"
          cy="32"
          r="30"
          fill="none"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="3"
          strokeDasharray={`${2 * Math.PI * 30}`}
          strokeDashoffset={`${2 * Math.PI * 30 * (1 - progress / 100)}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>

      {/* Time display */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          fontWeight: 600,
          letterSpacing: "0.02em",
        }}
      >
        {timeStr}
      </div>

      {/* Buttons — show on hover */}
      <div
        style={{
          position: "absolute",
          bottom: -36,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 4,
          opacity: 0,
          transition: "opacity 0.2s ease",
          pointerEvents: "none",
        }}
        className="floating-timer-btns"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            isRunning ? pause() : start();
          }}
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--os-bg-secondary)",
            border: "1px solid var(--os-glass-border)",
            color: "var(--os-text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
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
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--os-bg-secondary)",
            border: "1px solid var(--os-glass-border)",
            color: "var(--os-text-primary)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
          title="Open Pomodoro"
        >
          <Maximize2 size={12} />
        </button>
      </div>

      <style>{`
        .floating-timer-btns {
          opacity: 0 !important;
          pointer-events: none !important;
        }
        div:hover > .floating-timer-btns,
        .floating-timer-btns:hover {
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `}</style>
    </div>
  );
}
