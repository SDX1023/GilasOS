"use client";

import { DailyStreak } from "@/components/daily-streak";

export default function StreakPage() {
  return (
    <div style={{ minHeight: "100%" }}>
      <div className="os-background">
        <div className="os-orb os-orb--1" />
        <div className="os-orb os-orb--2" />
        <div className="os-orb os-orb--3" />
        <div className="os-grid" />
      </div>

      <div className="os-window" style={{ maxWidth: 560 }}>
        <div className="os-window-header">
          <div className="os-window-title">
            <span className="icon">🔥</span>
            <span>Streak Tracker</span>
          </div>
          <div className="os-window-controls">
            <a href="/" style={{ textDecoration: "none" }}>
              <button className="close" title="Close">✕</button>
            </a>
          </div>
        </div>

        <div className="os-window-body" style={{ padding: "24px 20px" }}>
          <DailyStreak />
        </div>
      </div>
    </div>
  );
}
