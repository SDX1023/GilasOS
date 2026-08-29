"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { Trophy, Medal, Flame, Target, Calendar } from "lucide-react";

interface LeaderboardEntry {
  user_id: string;
  username: string;
  totalKnown: number;
  totalForgot: number;
  totalDontKnow: number;
  totalCards: number;
  daysStudied: number;
  streak: number;
  score: number;
  accuracy: number;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, profilesRes] = await Promise.all([
          fetch("/api/study-stats").then((r) => r.json()),
          getSupabase().from("user_profiles").select("user_id, username"),
        ]);
        const profileMap: Record<string, string> = {};
        if (profilesRes.data) profilesRes.data.forEach((p: any) => { profileMap[p.user_id] = p.username; });
        if (Array.isArray(statsRes)) {
          statsRes.forEach((entry: any) => {
            if (!entry.username || entry.username === "Unknown") entry.username = profileMap[entry.user_id] || "Unknown";
          });
        }
        setLeaderboard(statsRes);
      } catch {}
      setLoading(false);
    })();
  }, []);

  function getMedalColor(index: number) {
    if (index === 0) return "#eab308";
    if (index === 1) return "#9ca3af";
    if (index === 2) return "#d97706";
    return "var(--os-text-dim)";
  }

  function getMedalIcon(index: number) {
    if (index < 3) return <Medal size={20} style={{ color: getMedalColor(index) }} />;
    return <span style={{ fontSize: 13, color: "var(--os-text-dim)", width: 20, textAlign: "center" }}>{index + 1}</span>;
  }

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title">
          <Trophy size={28} style={{ color: "#eab308" }} /> Leaderboard
        </h1>
        <p className="page-subtitle">Top performers ranked by study score</p>
      </div>

      {loading ? (
        <p className="text-secondary">Loading leaderboard...</p>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Trophy size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <p className="text-secondary text-sm">No one has studied yet. Be the first!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {leaderboard.map((entry, i) => {
            const isMe = user?.id === entry.user_id;
            return (
              <div key={entry.user_id} className="glass-card" style={{
                padding: 16, display: "flex", alignItems: "center", gap: 16,
                border: isMe ? "1px solid var(--os-accent)" : undefined,
              }}>
                <div style={{ flexShrink: 0 }}>{getMedalIcon(i)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.username}</span>
                    {isMe && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(0,212,255,0.12)", color: "var(--os-accent)" }}>You</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4, fontSize: 12, color: "var(--os-text-dim)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Target size={12} /> {entry.accuracy}% accuracy</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Flame size={12} /> {entry.streak} day streak</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {entry.daysStudied} days</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ fontSize: 18, fontWeight: 700 }}>{entry.score}</p>
                  <p style={{ fontSize: 11, color: "var(--os-text-dim)" }}>pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
