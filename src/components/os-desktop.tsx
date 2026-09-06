"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen, Layers, Brain, FileText, ListTodo, Users, Archive,
  Clock, BarChart3, Trophy, Settings, Palette, LogOut, Music,
  Calculator, Search, Folder
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { usePomodoroSafe } from "@/components/pomodoro/pomodoro-context";

interface DesktopIcon {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  color: string;
}

export function useDesktopIcons(): DesktopIcon[] {
  const { user, signOut } = useAuth();
  const pomodoro = usePomodoroSafe();

  return [
    { id: "subjects", label: "Subjects", icon: <BookOpen size={28} />, href: "/subjects", color: "#3b82f6" },
    { id: "study", label: "Study", icon: <Brain size={28} />, href: "/flashcards", color: "#8b5cf6" },
    { id: "decks", label: "My Decks", icon: <Layers size={28} />, href: "/decks", color: "#6d28d9" },
    { id: "tasks", label: "Tasks", icon: <ListTodo size={28} />, href: "/tasks", color: "#10b981" },
    { id: "friends", label: "Friends", icon: <Users size={28} />, href: "/friends", color: "#f59e0b" },
    { id: "archive", label: "Archive", icon: <Archive size={28} />, href: "/archive", color: "#ef4444" },
    { id: "pdf", label: "PDF to Cards", icon: <FileText size={28} />, href: "/pdf-to-cards", color: "#06b6d4" },
    { id: "anki", label: "Import Anki", icon: <Layers size={28} />, href: "/import-anki", color: "#f97316" },
    { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={28} />, href: "/leaderboard", color: "#eab308" },
    { id: "pomodoro", label: "Pomodoro", icon: <Clock size={28} />, onClick: () => pomodoro?.isRunning ? pomodoro?.pause() : pomodoro?.start(), color: "#ef4444" },
  ];
}

export function DesktopIcons() {
  const icons = useDesktopIcons();

  return (
    <div className="desktop-icons" style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, 90px)",
      gap: 8,
      padding: "16px 20px",
      justifyItems: "center",
    }}>
      {icons.map((icon) => (
        <Link
          key={icon.id}
          href={icon.href || "#"}
          onClick={(e) => {
            if (icon.onClick) { e.preventDefault(); icon.onClick(); }
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            padding: "12px 8px",
            borderRadius: 12,
            textDecoration: "none",
            color: "var(--os-text-primary)",
            transition: "all 0.15s",
            width: "100%",
            textAlign: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.06)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: `linear-gradient(135deg, ${icon.color}22, ${icon.color}11)`,
            border: `1px solid ${icon.color}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: icon.color,
          }}>
            {icon.icon}
          </div>
          <span style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.2, color: "var(--os-text-secondary)" }}>
            {icon.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

export function StartMenu({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth();
  const icons = useDesktopIcons();

  if (!isOpen) return null;

  return (
    <>
      <div style={{ position: "fixed", inset: 0, zIndex: 998 }} onClick={onClose} />
      <div style={{
        position: "fixed",
        bottom: 72,
        left: "50%",
        transform: "translateX(-50%)",
        width: 360,
        maxHeight: 480,
        borderRadius: 16,
        background: "var(--os-glass)",
        border: "1px solid var(--os-glass-border)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 25px 60px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1)",
        zIndex: 999,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Search bar */}
        <div style={{ padding: "16px 16px 12px" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--os-glass-border)",
          }}>
            <Search size={16} style={{ color: "var(--os-text-dim)" }} />
            <span style={{ fontSize: 13, color: "var(--os-text-dim)" }}>Search apps...</span>
          </div>
        </div>

        {/* User info */}
        <div style={{
          padding: "0 16px 12px",
          borderBottom: "1px solid var(--os-glass-border)",
          marginBottom: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, var(--os-accent), var(--os-accent-purple))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 700,
              color: "white",
            }}>
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600 }}>{user?.email?.split("@")[0] || "User"}</p>
              <p style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{user?.email}</p>
            </div>
          </div>
        </div>

        {/* App grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 4,
          padding: "8px 12px",
          overflowY: "auto",
          flex: 1,
        }}>
          {icons.map((icon) => (
            <Link
              key={icon.id}
              href={icon.href || "#"}
              onClick={(e) => {
                if (icon.onClick) { e.preventDefault(); icon.onClick(); }
                onClose();
              }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
                padding: "10px 4px",
                borderRadius: 10,
                textDecoration: "none",
                color: "var(--os-text-primary)",
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `linear-gradient(135deg, ${icon.color}22, ${icon.color}11)`,
                border: `1px solid ${icon.color}33`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: icon.color,
                fontSize: 18,
              }}>
                {icon.icon}
              </div>
              <span style={{ fontSize: 10, fontWeight: 500, color: "var(--os-text-secondary)" }}>
                {icon.label}
              </span>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: "10px 16px",
          borderTop: "1px solid var(--os-glass-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}>
          <Link href="/settings" onClick={onClose} style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12,
            color: "var(--os-text-dim)", textDecoration: "none",
          }}>
            <Settings size={14} /> Settings
          </Link>
          <button onClick={() => { signOut(); onClose(); }} style={{
            display: "flex", alignItems: "center", gap: 6, fontSize: 12,
            color: "var(--os-text-dim)", background: "none", border: "none", cursor: "pointer",
          }}>
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </>
  );
}
