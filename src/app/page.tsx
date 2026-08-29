"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [time, setTime] = useState("");
  const [notification, setNotification] = useState<{ icon: string; title: string; message: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: "📚",
      title: "Subjects",
      description: "Browse subjects and topics",
      href: "/courses",
      color: "#00d4ff",
    },
    {
      icon: "🧠",
      title: "Flashcards",
      description: "Study with interactive cards",
      href: "/flashcards",
      color: "#7c3aed",
    },
    {
      icon: "⏱️",
      title: "Pomodoro",
      description: "Focus and track time",
      href: "/tools/pomodoro",
      color: "#10b981",
    },
    {
      icon: "📄",
      title: "PDF to Cards",
      description: "Generate from PDFs",
      href: "/tools/pdf-to-flashcards",
      color: "#f59e0b",
    },
    {
      icon: "✅",
      title: "To-Do",
      description: "Organize your tasks",
      href: "/tools/todo",
      color: "#ec4899",
    },
    {
      icon: "🏆",
      title: "Archive",
      description: "Competition history",
      href: "/archive",
      color: "#ff6b6b",
    },
  ];

  return (
    <>
      {/* Background */}
      <div className="os-background">
        <div className="os-orb os-orb--1" />
        <div className="os-orb os-orb--2" />
        <div className="os-orb os-orb--3" />
        <div className="os-grid" />
      </div>

      {/* Desktop Icons */}
      <div className="desktop-icons">
        {features.map((f, i) => (
          <Link
            key={f.href}
            href={f.href}
            className="desktop-icon"
            style={{ animationDelay: `${0.1 + i * 0.05}s` }}
          >
            <div className="icon-wrapper">{f.icon}</div>
            <span className="label">{f.title}</span>
          </Link>
        ))}
      </div>

      {/* Main Window */}
      <div className="os-window">
        <div className="os-window-header">
          <div className="os-window-title">
            <span className="icon">⬡</span>
            <span>GilasOS</span>
          </div>
          <div className="os-window-controls">
            <button className="minimize" />
            <button className="maximize" />
            <button className="close" />
          </div>
        </div>

        <div className="os-window-body">
          <div className="hero">
            <h1>GilasOS</h1>
            <p className="tagline">Guts · Instincts · Luck · Attitude · Skill</p>
            <p className="description">
              A study system built by Sofia Isabelle David for GILAS.
              Explore subjects, generate flashcards, track focus sessions,
              and prepare for competitions — all in one place.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((f) => (
              <Link key={f.href} href={f.href} className="feature-card">
                <span className="icon">{f.icon}</span>
                <span className="title">{f.title}</span>
                <span className="description">{f.description}</span>
              </Link>
            ))}
          </div>

          <div className="status-bar">
            <div className="status-left">
              <span className="status-dot" />
              <span>system ready</span>
            </div>
            <div className="status-right">{features.length} apps</div>
          </div>
        </div>
      </div>

      {/* Taskbar */}
      <div className="taskbar">
        {features.map((f) => (
          <Link key={f.href} href={f.href} className="taskbar-item" title={f.title}>
            {f.icon}
          </Link>
        ))}
        <div className="taskbar-divider" />
        <div className="taskbar-time">{time}</div>
      </div>

      {/* Notification */}
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
