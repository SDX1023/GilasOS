"use client";

import { useState, useEffect } from "react";
import { Wifi, Volume2, Battery, Bell, Moon, Sun, Monitor } from "lucide-react";
import { usePomodoroSafe } from "@/components/pomodoro/pomodoro-context";
import Link from "next/link";

export function SystemTray() {
  const [time, setTime] = useState("");
  const [showTray, setShowTray] = useState(false);
  const pomodoro = usePomodoroSafe();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowTray(!showTray)}
        className="taskbar-time"
        title="System Tray"
      >
        {time}
      </button>

      {showTray && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => setShowTray(false)} />
          <div style={{
            position: "absolute",
            bottom: "100%",
            right: 0,
            marginBottom: 12,
            width: 320,
            borderRadius: 16,
            background: "var(--os-glass)",
            border: "1px solid var(--os-glass-border)",
            backdropFilter: "blur(30px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
            zIndex: 999,
            overflow: "hidden",
          }}>
            {/* Header with clock */}
            <div style={{
              padding: "20px 20px 16px",
              borderBottom: "1px solid var(--os-glass-border)",
              textAlign: "center",
            }}>
              <p style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, lineHeight: 1 }}>{time}</p>
              <p style={{ fontSize: 13, color: "var(--os-text-dim)", marginTop: 4 }}>
                {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>

            {/* Quick toggles */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 8,
              padding: "16px",
            }}>
              {[
                { icon: <Wifi size={18} />, label: "Wi-Fi", active: true },
                { icon: <Volume2 size={18} />, label: "Sound", active: true },
                { icon: <Battery size={18} />, label: "Battery", active: true },
                { icon: <Moon size={18} />, label: "Dark", active: true },
              ].map((item) => (
                <button key={item.label} style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  padding: "12px 4px",
                  borderRadius: 12,
                  background: item.active ? "rgba(109,40,217,0.2)" : "rgba(255,255,255,0.04)",
                  border: "none",
                  color: item.active ? "var(--os-accent)" : "var(--os-text-dim)",
                  cursor: "pointer",
                  fontSize: 10,
                  fontWeight: 500,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = item.active ? "rgba(109,40,217,0.3)" : "rgba(255,255,255,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.background = item.active ? "rgba(109,40,217,0.2)" : "rgba(255,255,255,0.04)"}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Pomodoro status */}
            {pomodoro?.isRunning && (
              <div style={{
                margin: "0 16px 16px",
                padding: 12,
                borderRadius: 12,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: 13,
                color: "#ef4444",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }} />
                  Pomodoro Timer
                </div>
                <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                  {pomodoro.timeLeft || "00:00"}
                </span>
              </div>
            )}

            {/* Footer links */}
            <div style={{
              padding: "12px 16px",
              borderTop: "1px solid var(--os-glass-border)",
              display: "flex",
              justifyContent: "space-between",
            }}>
              <Link href="/settings" onClick={() => setShowTray(false)} style={{
                fontSize: 12, color: "var(--os-text-dim)", textDecoration: "none",
              }}>
                Settings
              </Link>
              <span style={{ fontSize: 12, color: "var(--os-text-dim)" }}>GilasOS v1.0</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
