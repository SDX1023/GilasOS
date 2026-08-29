"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  BookOpen,
  Layers,
  Timer,
  FileText,
  CheckSquare,
  Trophy,
} from "lucide-react";

export default function Home() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-US", {
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

  const features = [
    {
      icon: BookOpen,
      title: "Subjects",
      description: "Browse subjects and topics",
      href: "/courses",
    },
    {
      icon: Layers,
      title: "Flashcards",
      description: "Study with interactive flashcards",
      href: "/flashcards",
    },
    {
      icon: Timer,
      title: "Pomodoro",
      description: "Stay focused and track time",
      href: "/tools/pomodoro",
    },
    {
      icon: FileText,
      title: "PDF to Cards",
      description: "Generate from your PDFs",
      href: "/tools/pdf-to-flashcards",
    },
    {
      icon: CheckSquare,
      title: "Tasks",
      description: "Organize tasks with decks",
      href: "/tools/todo",
    },
    {
      icon: Trophy,
      title: "Archive",
      description: "Competition history",
      href: "/archive",
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
        {features.map((f) => (
          <Link key={f.href} href={f.href} className="desktop-icon">
            <div className="icon-wrapper">
              <f.icon size={22} strokeWidth={1.5} />
            </div>
            <span className="label">{f.title}</span>
          </Link>
        ))}
      </div>

      {/* Main Window */}
      <div className="os-window">
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

        <div className="os-window-body">
          {/* Hero */}
          <div className="hero">
            <h1>GilasOS</h1>
            <p className="subtitle">The Ultimate GILAS Reviewer</p>
            <p className="tagline">Guts · Instincts · Luck · Attitude · Skill</p>
            <p className="description">
              Hi! This is a website created by Sofia Isabelle David. If you&apos;re here then
              it&apos;s probably between 2 things. 1. You&apos;re in GILAS 2. This was sent to you,
              eitherway it&apos;s fine. This website will consist of most reviewers compiled
              and created throughout my years in GILAS, which is divided per subject.
              Consider this your jumpstart in your journey in this organization, explore,
              learn, and hasten your intellect. If you&apos;re ever here, I hope this website
              will be able to aid you in your learnings, and you know possibly might help
              you bag a few competitions here and there. Regardless, I hope you enjoy this
              little website created by me! See you guys soonest:)
            </p>
          </div>

          {/* Features Grid */}
          <div className="feature-grid">
            {features.map((f) => (
              <Link key={f.href} href={f.href} className="feature-card">
                <div className="feature-icon">
                  <f.icon size={18} strokeWidth={1.5} />
                </div>
                <div className="feature-text">
                  <span className="title">{f.title}</span>
                  <span className="description">{f.description}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Status Bar */}
          <div className="status-bar">
            <div className="status-left">
              <span className="status-dot" />
              <span>System Ready</span>
            </div>
            <div className="status-right">{features.length} applications available</div>
          </div>
        </div>
      </div>

      {/* Taskbar */}
      <div className="taskbar">
        {features.map((f) => (
          <Link key={f.href} href={f.href} className="taskbar-item" title={f.title}>
            <f.icon size={18} strokeWidth={1.5} />
          </Link>
        ))}
        <div className="taskbar-divider" />
        <div className="taskbar-time">{time}</div>
      </div>
    </>
  );
}
