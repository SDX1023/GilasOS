"use client";

import Link from "next/link";
import {
  BookOpen,
  Timer,
  FileText,
  CheckSquare,
  Trophy,
  Sparkles,
} from "lucide-react";

export default function Home() {
  const features = [
    {
      icon: BookOpen,
      title: "Subjects",
      description: "Browse subjects and topics",
      href: "/subjects",
      color: "#6d28d9",
    },
    {
      icon: Sparkles,
      title: "Study",
      description: "Quiz, flashcards, and more",
      href: "/study",
      color: "#8b5cf6",
    },
    {
      icon: Timer,
      title: "Pomodoro",
      description: "Stay focused and track time",
      href: "/pomodoro",
      color: "#8b5cf6",
    },
    {
      icon: FileText,
      title: "PDF to Cards",
      description: "Generate from your PDFs",
      href: "/pdf-to-cards",
      color: "#a78bfa",
    },
    {
      icon: CheckSquare,
      title: "Tasks",
      description: "Organize tasks with decks",
      href: "/tasks",
      color: "#c084fc",
    },
    {
      icon: Trophy,
      title: "Archive",
      description: "Competition history",
      href: "/archive",
      color: "#ddd6fe",
    },
  ];

  return (
    <div style={{ minHeight: "100%" }}>
      {/* Background */}
      <div className="os-background">
        <div className="os-orb os-orb--1" />
        <div className="os-orb os-orb--2" />
        <div className="os-orb os-orb--3" />
        <div className="os-grid" />
      </div>

      {/* Main Window — full screen centered */}
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
                <div className="feature-icon" style={{ color: f.color }}>
                  <f.icon size={20} strokeWidth={1.5} />
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
    </div>
  );
}
