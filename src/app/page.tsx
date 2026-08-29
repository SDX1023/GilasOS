"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

export default function Home() {
  const [time, setTime] = useState("");
  const [activeFeature, setActiveFeature] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ icon: string; title: string; message: string } | null>(null);

  // ============================================================
  // CLOCK
  // ============================================================
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString("en-US", { 
        hour: "2-digit", 
        minute: "2-digit", 
        hour12: true 
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // FEATURES DATA
  // ============================================================
  const features = [
    {
      icon: "📚",
      title: "Subjects",
      description: "Browse subjects and topics",
      href: "/courses",
      color: "#00d4ff"
    },
    {
      icon: "🧠",
      title: "Flashcards",
      description: "Study with interactive flashcards",
      href: "/flashcards",
      color: "#7c3aed"
    },
    {
      icon: "⏱️",
      title: "Pomodoro Timer",
      description: "Stay focused and track time",
      href: "/tools/pomodoro",
      color: "#10b981"
    },
    {
      icon: "📄",
      title: "PDF to Flashcards",
      description: "Generate from your PDFs",
      href: "/tools/pdf-to-flashcards",
      color: "#f59e0b"
    },
    {
      icon: "✅",
      title: "To-Do List",
      description: "Organize tasks with decks",
      href: "/tools/todo",
      color: "#ec4899"
    },
    {
      icon: "🏆",
      title: "Archive",
      description: "Competition history",
      href: "/archive",
      color: "#ef4444"
    },
  ];

  // ============================================================
  // TASKBAR ITEMS
  // ============================================================
  const taskbarItems = features.map(f => ({
    id: f.href,
    icon: f.icon,
    label: f.title.split(" ")[0],
    href: f.href
  }));

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      {/* ============================================================
           BACKGROUND
           ============================================================ */}
      <div className="os-background" />

      {/* ============================================================
           DESKTOP ICONS
           ============================================================ */}
      <div className="desktop-icons">
        {features.map((feature) => (
          <Link
            key={feature.href}
            href={feature.href}
            className="desktop-icon"
          >
            <div className="icon-wrapper" style={{ borderColor: `${feature.color}33` }}>
              {feature.icon}
            </div>
            <span className="label">{feature.title}</span>
          </Link>
        ))}
      </div>

      {/* ============================================================
           MAIN WINDOW
           ============================================================ */}
      <div className="os-window">
        {/* Window Header */}
        <div className="os-window-header">
          <div className="os-window-title">
            <span className="icon">🖥️</span>
            <span>GilasOS - Desktop</span>
          </div>
          <div className="os-window-controls">
            <button className="minimize" title="Minimize">−</button>
            <button className="maximize" title="Maximize">⤢</button>
            <button className="close" title="Close">✕</button>
          </div>
        </div>

        {/* Window Body */}
        <div className="os-window-body">
          {/* Hero */}
          <div className="hero">
            <h1>GilasOS</h1>
            <p className="subtitle">The Ultimate GILAS Reviewer</p>
            <p className="tagline">Guts · Instincts · Luck · Attitude · Skill</p>
            <p className="description">
              Hi! This is a website created by Sofia Isabelle David. If you're here then 
              it's probably between 2 things. 1. You're in GILAS 2. This was sent to you, 
              eitherway it's fine. This website will consist of most reviewers compiled 
              and created throughout my years in GILAS, which is divided per subject. 
              Consider this your jumpstart in your journey in this organization, explore, 
              learn, and hasten your intellect. If you're ever here, I hope this website 
              will be able to aid you in your learnings, and you know possibly might help 
              you bag a few competitions here and there. Regardless, I hope you enjoy this 
              little website created by me! See you guys soonest:)
            </p>
          </div>

          {/* Features Grid */}
          <div className="feature-grid">
            {features.map((feature) => (
              <Link
                key={feature.href}
                href={feature.href}
                className="feature-card"
                onMouseEnter={() => setActiveFeature(feature.href)}
                onMouseLeave={() => setActiveFeature(null)}
              >
                <span className="icon">{feature.icon}</span>
                <span className="title">{feature.title}</span>
                <span className="description">{feature.description}</span>
              </Link>
            ))}
          </div>

          {/* Footer / Status Bar */}
          <div style={{ 
            marginTop: "16px", 
            paddingTop: "12px", 
            borderTop: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "11px",
            color: "var(--os-text-dim)"
          }}>
            <span>🟢 System Ready</span>
            <span>{features.length} applications available</span>
          </div>
        </div>
      </div>

      {/* ============================================================
           TASKBAR / DOCK
           ============================================================ */}
      <div className="taskbar">
        {taskbarItems.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="taskbar-item"
          >
            <span className="icon">{item.icon}</span>
            <span className="label">{item.label}</span>
          </Link>
        ))}
        <div className="taskbar-divider" />
        <div className="taskbar-time">{time}</div>
      </div>

      {/* ============================================================
           NOTIFICATION
           ============================================================ */}
      {notification && (
        <div className="notification">
          <span className="icon">{notification.icon}</span>
          <div className="content">
            <div className="title">{notification.title}</div>
            <div className="message">{notification.message}</div>
          </div>
        </div>
      )}
    </>
  );
}