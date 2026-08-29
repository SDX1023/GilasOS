"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pause, Maximize2, Coffee, Brain, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePomodoro } from "./pomodoro-context";

export function FloatingTimer() {
  const { timeLeft, isRunning, mode, progress, formatTime, pause } = usePomodoro();
  const router = useRouter();

  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const hasMoved = useRef(false);

  useEffect(() => {
    setPosition({ x: window.innerWidth - 200, y: window.innerHeight - 80 });
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
      const clampedX = Math.max(0, Math.min(window.innerWidth - 200, dragStart.current.posX + dx));
      const clampedY = Math.max(0, Math.min(window.innerHeight - 60, dragStart.current.posY + dy));
      setPosition({ x: clampedX, y: clampedY });
    },
    [isDragging]
  );

  const onPointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  if (!isRunning || position.x === -1) return null;

  const modeIcon =
    mode === "work" ? (
      <Brain className="h-3.5 w-3.5" />
    ) : mode === "shortBreak" ? (
      <Coffee className="h-3.5 w-3.5" />
    ) : (
      <Timer className="h-3.5 w-3.5" />
    );

  const modeColor =
    mode === "work"
      ? "bg-primary/90 text-primary-foreground"
      : mode === "shortBreak"
      ? "bg-green-500/90 text-white"
      : "bg-blue-500/90 text-white";

  return (
    <div
      ref={dragRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ left: position.x, top: position.y }}
      className={cn(
        "fixed z-50 select-none touch-none",
        "rounded-full shadow-lg border border-white/10 backdrop-blur-md",
        modeColor,
        isDragging && "cursor-grabbing"
      )}
    >
      {/* Progress ring background */}
      <div
        className="absolute inset-0 rounded-full opacity-30"
        style={{
          background: `conic-gradient(white ${progress}%, transparent ${progress}%)`,
        }}
      />

      <div className="relative flex items-center gap-2 pl-3 pr-1.5 py-2">
        <span className="flex items-center gap-1.5 text-xs font-medium whitespace-nowrap">
          {modeIcon}
          <span className="font-mono text-sm tabular-nums">{formatTime(timeLeft)}</span>
        </span>

        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              pause();
            }}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Pause timer"
          >
            <Pause className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push("/pomodoro");
            }}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Expand timer"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
