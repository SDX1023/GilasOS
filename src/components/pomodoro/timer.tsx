"use client";

import { useState } from "react";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className="flex flex-col items-center gap-8">
      <div className="flex gap-2">
        {(["work", "shortBreak", "longBreak"] as const).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              mode === m ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
            )}
          >
            {modeLabel(m)}
          </button>
        ))}
      </div>

      <div className="relative">
        <svg width="280" height="280" className="-rotate-90">
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx="140"
            cy="140"
            r="120"
            fill="transparent"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={cn(
              "transition-all duration-1000",
              mode === "work" ? "text-primary" : "text-green-500"
            )}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-5xl font-mono font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={start}
          className={cn(
            "flex items-center gap-2 px-8 py-3 rounded-xl font-medium transition-colors",
            isRunning
              ? "bg-muted hover:bg-muted/80"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          {isRunning ? (
            <>
              <Pause className="h-5 w-5" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Start
            </>
          )}
        </button>

        <button
          onClick={reset}
          className="p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
        >
          <RotateCcw className="h-5 w-5" />
        </button>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
        >
          <Settings className="h-5 w-5" />
        </button>
      </div>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Session {sessions + 1} of {settings.sessionsBeforeLongBreak}
        </p>
      </div>

      {showSettings && (
        <div className="w-full max-w-sm p-4 rounded-xl border bg-card space-y-4">
          <h3 className="font-semibold">Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted-foreground">Focus (min)</label>
              <input
                type="number"
                value={settings.workDuration}
                onChange={(e) =>
                  updateSettings({ ...settings, workDuration: Number(e.target.value) })
                }
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                min={1}
                max={120}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Short Break (min)</label>
              <input
                type="number"
                value={settings.shortBreakDuration}
                onChange={(e) =>
                  updateSettings({ ...settings, shortBreakDuration: Number(e.target.value) })
                }
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                min={1}
                max={30}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Long Break (min)</label>
              <input
                type="number"
                value={settings.longBreakDuration}
                onChange={(e) =>
                  updateSettings({ ...settings, longBreakDuration: Number(e.target.value) })
                }
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                min={1}
                max={60}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Sessions</label>
              <input
                type="number"
                value={settings.sessionsBeforeLongBreak}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    sessionsBeforeLongBreak: Number(e.target.value),
                  })
                }
                className="w-full mt-1 px-3 py-2 rounded-lg border bg-background"
                min={1}
                max={10}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
