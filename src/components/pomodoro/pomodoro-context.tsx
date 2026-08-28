"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from "react";

export interface PomodoroSettings {
  workDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  sessionsBeforeLongBreak: number;
}

export type TimerMode = "work" | "shortBreak" | "longBreak";

const defaultSettings: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
};

interface PomodoroContextValue {
  timeLeft: number;
  isRunning: boolean;
  mode: TimerMode;
  sessions: number;
  settings: PomodoroSettings;
  progress: number;
  totalTime: number;
  formatTime: (seconds: number) => string;
  start: () => void;
  pause: () => void;
  reset: () => void;
  switchMode: (mode: TimerMode) => void;
  updateSettings: (settings: PomodoroSettings) => void;
}

const PomodoroContext = createContext<PomodoroContextValue | null>(null);

function loadSettings(): PomodoroSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem("pomodoro-settings");
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {}
  return defaultSettings;
}

function loadSessions(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = localStorage.getItem("pomodoro-sessions");
    if (raw !== null) return JSON.parse(raw);
  } catch {}
  return 0;
}

function playSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    osc.type = "sine";
    gain.gain.value = 0.3;
    osc.start();
    setTimeout(() => {
      osc.stop();
      ctx.close();
    }, 200);
  } catch {}
}

function playNotification(title: string, body: string) {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(title, { body });
    }
  }
  playSound();
}

function getDuration(mode: TimerMode, settings: PomodoroSettings): number {
  return mode === "work"
    ? settings.workDuration * 60
    : mode === "shortBreak"
    ? settings.shortBreakDuration * 60
    : settings.longBreakDuration * 60;
}

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PomodoroSettings>(defaultSettings);
  const [mode, setMode] = useState<TimerMode>("work");
  const [timeLeft, setTimeLeft] = useState(settings.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    setSessions(loadSessions());
    setTimeLeft(s.workDuration * 60);
  }, []);

  useEffect(() => {
    localStorage.setItem("pomodoro-settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("pomodoro-sessions", JSON.stringify(sessions));
  }, [sessions]);

  const totalTime = getDuration(mode, settings);
  const progress = totalTime > 0 ? ((totalTime - timeLeft) / totalTime) * 100 : 0;

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  const doSwitchMode = useCallback(
    (newMode: TimerMode) => {
      setMode(newMode);
      setIsRunning(false);
      setTimeLeft(getDuration(newMode, settings));
    },
    [settings]
  );

  const start = useCallback(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    setIsRunning((prev) => !prev);
  }, []);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(getDuration(mode, settings));
  }, [mode, settings]);

  const updateSettings = useCallback(
    (newSettings: PomodoroSettings) => {
      setSettings(newSettings);
      if (!isRunning) {
        setTimeLeft(getDuration(mode, newSettings));
      }
    },
    [isRunning, mode]
  );

  // Single interval
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isRunning || timeLeft <= 0) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, timeLeft]);

  // Handle timer reaching zero
  useEffect(() => {
    if (timeLeft > 0 || !isRunning) return;

    if (mode === "work") {
      const newSessions = sessions + 1;
      setSessions(newSessions);
      if (newSessions % settings.sessionsBeforeLongBreak === 0) {
        playNotification("Work session complete!", "Time for a long break.");
        doSwitchMode("longBreak");
      } else {
        playNotification("Work session complete!", "Time for a short break.");
        doSwitchMode("shortBreak");
      }
    } else {
      playNotification("Break is over!", "Ready to focus?");
      doSwitchMode("work");
    }
  }, [timeLeft, isRunning, mode, sessions, settings.sessionsBeforeLongBreak, doSwitchMode]);

  return (
    <PomodoroContext.Provider
      value={{
        timeLeft,
        isRunning,
        mode,
        sessions,
        settings,
        progress,
        totalTime,
        formatTime,
        start,
        pause,
        reset,
        switchMode: doSwitchMode,
        updateSettings,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const ctx = useContext(PomodoroContext);
  if (!ctx) throw new Error("usePomodoro must be used within PomodoroProvider");
  return ctx;
}

export function usePomodoroSafe() {
  return useContext(PomodoroContext);
}
