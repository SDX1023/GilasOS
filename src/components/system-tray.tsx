"use client";

import { useState, useEffect } from "react";
import { Wifi, Volume2, Battery, Bell, ChevronUp } from "lucide-react";
import { usePomodoroSafe } from "@/components/pomodoro/pomodoro-context";

export function SystemTray() {
  const [time, setTime] = useState("");
  const [date, setDate] = useState("");
  const [showTray, setShowTray] = useState(false);
  const pomodoro = usePomodoroSafe();

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setDate(now.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setShowTray(!showTray)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px",
          borderRadius: 8,
          background: showTray ? "rgba(255,255,255,0.08)" : "transparent",
          border: "none",
          color: "var(--os-text-secondary)",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 500,
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
        onMouseLeave={(e) => { if (!showTray) e.currentTarget.style.background = "transparent"; }}
      >
        <Wifi size={13} />
        <Volume2 size={13} />
        <Battery size={13} />
        <Bell size={13} />
        <span>{time}</span>
      </button>

      {showTray && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={() => setShowTray(false)} />
          <div style={{
            position: "absolute",
            bottom: "100%",
            right: 0,
            marginBottom: 8,
            width: 280,
            borderRadius: 14,
            background: "var(--os-glass)",
            border: "1px solid var(--os-glass-border)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            zIndex: 999,
            padding: 16,
          }}>
            {/* Clock */}
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <p style={{ fontSize: 32, fontWeight: 700, letterSpacing: -1 }}>{time}</p>
              <p style={{ fontSize: 13, color: "var(--os-text-dim)" }}>{date}</p>
            </div>

            {/* Quick settings */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 16,
            }}>
              {[
                { icon: <Wifi size={16} />, label: "Wi-Fi", active: true },
                { icon: <Volume2 size={16} />, label: "Sound", active: true },
                { icon: <Battery size={16} />, label: "Battery", active: true },
              ].map((item) => (
                <button key={item.label} style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                  padding: "10px 4px",
                  borderRadius: 10,
                  background: item.active ? "rgba(109,40,217,0.2)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${item.active ? "rgba(109,40,217,0.3)" : "var(--os-glass-border)"}`,
                  color: item.active ? "var(--os-accent)" : "var(--os-text-dim)",
                  cursor: "pointer",
                  fontSize: 10,
                }}>
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* Pomodoro status */}
            {pomodoro?.isRunning && (
              <div style={{
                padding: 10,
                borderRadius: 10,
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.2)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#ef4444",
              }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }} />
                Pomodoro: {pomodoro.timeLeft || "00:00"}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
