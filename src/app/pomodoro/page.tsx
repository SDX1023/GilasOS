'use client';

import Link from "next/link";
import { PomodoroTimer } from "@/components/pomodoro/timer";
import { Timer } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function PomodoroPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon"><Timer size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Sign in required</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>Log in to use the Pomodoro Timer.</p>
          <Link href="/login" className="glass-btn glass-btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ textAlign: "center" }}>
        <h1 className="page-title" style={{ justifyContent: "center" }}><Timer size={28} /> Pomodoro Timer</h1>
        <p className="page-subtitle">Stay focused with timed study sessions</p>
      </div>
      <PomodoroTimer />
    </div>
  );
}
