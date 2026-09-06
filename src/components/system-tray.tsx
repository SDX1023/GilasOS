"use client";

import { useState, useEffect, useRef } from "react";
import { Wifi, Volume2, Battery, Moon, Settings } from "lucide-react";
import { usePomodoroSafe } from "@/components/pomodoro/pomodoro-context";
import Link from "next/link";

export function SystemTray() {
  const [time, setTime] = useState("");
  const [showTray, setShowTray] = useState(false);
  const pomodoro = usePomodoroSafe();
  const trayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!showTray) return;
    const handle = (e: MouseEvent) => {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) setShowTray(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showTray]);

  return (
    <div ref={trayRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={(e) => { e.stopPropagation(); setShowTray(!showTray); }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          borderRadius: 8,
          background: showTray ? "rgba(255,255,255,0.1)" : "transparent",
          border: "none",
          color: "#a8b5c8",
          cursor: "pointer",
          fontSize: 12,
          fontWeight: 500,
          fontFamily: "Inter, sans-serif",
          fontVariantNumeric: "tabular-nums",
          transition: "all 0.15s",
          flexShrink: 0,
          zIndex: 10001,
          position: "relative",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
        onMouseLeave={(e) => { if (!showTray) e.currentTarget.style.background = "transparent"; }}
      >
        {time}
      </button>

      {showTray && (
        <div style={{
          position: "fixed",
          bottom: 80,
          right: 30,
          width: 320,
          borderRadius: 16,
          background: "rgba(12, 17, 28, 0.95)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(30px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
          zIndex: 10000,
          overflow: "hidden",
          animation: "slideUp 0.2s ease",
        }}>
          <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <p style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, lineHeight: 1, color: "#e8edf5", margin: 0 }}>{time}</p>
            <p style={{ fontSize: 13, color: "#6b7a90", marginTop: 4, margin: "4px 0 0" }}>
              {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, padding: 16 }}>
            {[
              { icon: <Wifi size={18} />, label: "Wi-Fi" },
              { icon: <Volume2 size={18} />, label: "Sound" },
              { icon: <Battery size={18} />, label: "Battery" },
              { icon: <Moon size={18} />, label: "Dark" },
            ].map((item) => (
              <button key={item.label} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                padding: "12px 4px", borderRadius: 12,
                background: "rgba(109,40,217,0.2)", border: "none",
                color: "#a78bfa", cursor: "pointer", fontSize: 10, fontWeight: 500,
              }}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          {pomodoro?.isRunning && (
            <div style={{
              margin: "0 16px 16px", padding: 12, borderRadius: 12,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.15)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: 13, color: "#ef4444",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444" }} />
                Pomodoro
              </div>
              <span style={{ fontWeight: 600 }}>{pomodoro.timeLeft || "00:00"}</span>
            </div>
          )}
          <div style={{
            padding: "12px 16px", borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <Link href="/settings" onClick={() => setShowTray(false)} style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, color: "#6b7a90", textDecoration: "none",
            }}>
              <Settings size={13} /> Settings
            </Link>
            <span style={{ fontSize: 11, color: "#6b7a90" }}>GilasOS</span>
          </div>
        </div>
      )}
    </div>
  );
}
