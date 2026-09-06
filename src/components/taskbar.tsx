"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { BookOpen, Timer, FileText, CheckSquare, Trophy, Users, Sparkles, Archive, Layers, Search, Apple } from "lucide-react";
import { SystemTray } from "./system-tray";

const features = [
  { icon: BookOpen, title: "Subjects", href: "/subjects", color: "#3b82f6" },
  { icon: Sparkles, title: "Study", href: "/flashcards", color: "#8b5cf6" },
  { icon: Layers, title: "My Decks", href: "/decks", color: "#6d28d9" },
  { icon: FileText, title: "PDF to Cards", href: "/pdf-to-cards", color: "#f59e0b" },
  { icon: CheckSquare, title: "Tasks", href: "/tasks", color: "#10b981" },
  { icon: Users, title: "Friends", href: "/friends", color: "#06b6d4" },
  { icon: Trophy, title: "Leaderboard", href: "/leaderboard", color: "#eab308" },
  { icon: Archive, title: "Archive", href: "/archive", color: "#ef4444" },
];

interface TaskbarProps {
  onStartClick?: () => void;
}

export function Taskbar({ onStartClick }: TaskbarProps) {
  const pathname = usePathname();
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      setTime(
        new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  if (pathname === "/") return null;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="taskbar" style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: 56,
      background: "var(--os-glass)",
      borderTop: "1px solid var(--os-glass-border)",
      backdropFilter: "blur(24px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "0 16px",
      gap: 4,
      zIndex: 100,
    }}>
      {/* Start button */}
      <button
        onClick={onStartClick}
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "rgba(109,40,217,0.15)",
          border: "1px solid rgba(109,40,217,0.2)",
          color: "var(--os-accent)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 8,
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(109,40,217,0.25)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(109,40,217,0.15)"}
        title="Start"
      >
        <Apple size={20} />
      </button>

      {/* App dock */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        padding: "4px 8px",
        borderRadius: 14,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid var(--os-glass-border)",
      }}>
        {features.map((f) => {
          const active = isActive(f.href);
          return (
            <Link
              key={f.href}
              href={f.href}
              title={f.title}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: active ? f.color : "var(--os-text-dim)",
                background: active ? `${f.color}15` : "transparent",
                transition: "all 0.15s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <f.icon size={18} strokeWidth={active ? 2 : 1.5} />
              {active && (
                <div style={{
                  position: "absolute",
                  bottom: 2,
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: f.color,
                }} />
              )}
            </Link>
          );
        })}
      </div>

      {/* System tray */}
      <div style={{ position: "absolute", right: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <SystemTray />
      </div>
    </div>
  );
}
