"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { BarChart3, TrendingUp, Clock, Target, Flame, BookOpen } from "lucide-react";
import Link from "next/link";

interface DayStats {
  date: string;
  known: number;
  forgot: number;
  dont_know: number;
  cards_total: number;
}

interface SessionInfo {
  session_type: string;
  subject: string;
  duration_seconds: number;
  cards_studied: number;
  known: number;
  created_at: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DayStats[]>([]);
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "all">("week");

  useEffect(() => {
    if (user) loadData();
  }, [user?.id, period]);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabase();

    const now = new Date();
    let startDate = new Date();
    if (period === "week") startDate.setDate(now.getDate() - 7);
    else if (period === "month") startDate.setDate(now.getDate() - 30);
    else startDate = new Date(2024, 0, 1);

    const [{ data: statsData }, { data: sessionsData }] = await Promise.all([
      supabase.from("study_stats").select("*").eq("user_id", user.id).gte("date", startDate.toDateString()).order("date"),
      supabase.from("study_sessions").select("*").eq("user_id", user.id).gte("created_at", startDate.toISOString()).order("created_at", { ascending: false }).limit(50),
    ]);

    setStats((statsData || []) as DayStats[]);
    setSessions((sessionsData || []) as SessionInfo[]);
    setLoading(false);
  }

  const totalCards = stats.reduce((s, d) => s + d.cards_total, 0);
  const totalKnown = stats.reduce((s, d) => s + d.known, 0);
  const totalForgot = stats.reduce((s, d) => s + d.forgot, 0);
  const totalDontKnow = stats.reduce((s, d) => s + d.dont_know, 0);
  const accuracy = totalCards > 0 ? Math.round((totalKnown / totalCards) * 100) : 0;
  const totalMinutes = Math.round(sessions.reduce((s, sess) => s + (sess.duration_seconds || 0), 0) / 60);
  const daysActive = new Set(stats.filter((d) => d.cards_total > 0).map((d) => d.date)).size;

  // Streak
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    if (stats.some((s) => s.date === d.toDateString() && s.cards_total > 0)) streak++;
    else break;
  }

  // Subject breakdown
  const subjectMap = new Map<string, { cards: number; sessions: number; minutes: number }>();
  sessions.forEach((s) => {
    const key = s.subject || "Unknown";
    const existing = subjectMap.get(key) || { cards: 0, sessions: 0, minutes: 0 };
    existing.cards += s.cards_studied || 0;
    existing.sessions += 1;
    existing.minutes += Math.round((s.duration_seconds || 0) / 60);
    subjectMap.set(key, existing);
  });
  const subjects = Array.from(subjectMap.entries()).sort((a, b) => b[1].cards - a[1].cards);

  // Max cards for bar scaling
  const maxCards = Math.max(...stats.map((d) => d.cards_total), 1);

  function getDateLabel(dateStr: string, idx: number): string {
    const d = new Date(dateStr);
    if (period === "week") return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
    if (period === "month") return `${d.getMonth() + 1}/${d.getDate()}`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  return (
    <div style={{ minHeight: "100%" }}>
      <div className="os-background">
        <div className="os-orb os-orb--1" />
        <div className="os-orb os-orb--2" />
        <div className="os-orb os-orb--3" />
        <div className="os-grid" />
      </div>

      <div className="os-window" style={{ maxWidth: 720 }}>
        <div className="os-window-header">
          <div className="os-window-title">
            <span className="icon">📊</span>
            <span>Progress Analytics</span>
          </div>
          <div className="os-window-controls">
            <Link href="/" style={{ textDecoration: "none" }}>
              <button className="close" title="Close">✕</button>
            </Link>
          </div>
        </div>

        <div className="os-window-body" style={{ padding: "20px 24px" }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#64748b", fontSize: 13 }}>Loading analytics...</div>
          ) : (
            <>
              {/* Period selector */}
              <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
                {(["week", "month", "all"] as const).map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} style={{
                    padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer",
                    background: period === p ? "var(--os-accent)" : "rgba(255,255,255,0.04)",
                    color: period === p ? "#fff" : "#94a3b8", transition: "all 0.15s",
                  }}>
                    {p === "week" ? "7 Days" : p === "month" ? "30 Days" : "All Time"}
                  </button>
                ))}
              </div>

              {/* Summary stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
                {[
                  { icon: BookOpen, label: "Cards Studied", value: totalCards.toLocaleString(), color: "var(--os-accent)" },
                  { icon: Target, label: "Accuracy", value: `${accuracy}%`, color: accuracy >= 80 ? "#22c55e" : accuracy >= 60 ? "#eab308" : "#ef4444" },
                  { icon: Clock, label: "Study Time", value: `${totalMinutes}m`, color: "#0ea5e9" },
                  { icon: Flame, label: "Streak", value: `${streak}d`, color: "#f97316" },
                ].map((s) => (
                  <div key={s.label} style={{ padding: "12px 10px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                    <s.icon size={16} color={s.color} style={{ marginBottom: 4 }} />
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Activity chart */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Daily Activity</h3>
                <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 120, padding: "0 4px" }}>
                  {stats.map((d, i) => {
                    const height = d.cards_total > 0 ? Math.max(4, (d.cards_total / maxCards) * 100) : 2;
                    return (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                        <div style={{ fontSize: 9, color: "#64748b" }}>{d.cards_total > 0 ? d.cards_total : ""}</div>
                        <div style={{
                          width: "100%", height, borderRadius: 4,
                          background: d.cards_total > 0
                            ? d.known / d.cards_total >= 0.8 ? "#22c55e" : d.known / d.cards_total >= 0.5 ? "#eab308" : "#ef4444"
                            : "rgba(255,255,255,0.04)",
                          transition: "height 0.3s ease",
                        }} />
                        <div style={{ fontSize: 8, color: "#4a5568" }}>{getDateLabel(d.date, i)}</div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 8, fontSize: 10, color: "#64748b" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#22c55e" }} /> 80%+</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#eab308" }} /> 50-80%</span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: "#ef4444" }} /> &lt;50%</span>
                </div>
              </div>

              {/* Accuracy breakdown */}
              <div style={{ marginBottom: 24 }}>
                <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Card Results</h3>
                <div style={{ display: "flex", gap: 2, height: 8, borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ flex: totalKnown, background: "#22c55e" }} />
                  <div style={{ flex: totalForgot, background: "#ef4444" }} />
                  <div style={{ flex: totalDontKnow, background: "#f97316" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 11 }}>
                  <span style={{ color: "#22c55e" }}>✓ Known: {totalKnown}</span>
                  <span style={{ color: "#ef4444" }}>✗ Forgot: {totalForgot}</span>
                  <span style={{ color: "#f97316" }}>? Don&apos;t Know: {totalDontKnow}</span>
                </div>
              </div>

              {/* Subject breakdown */}
              {subjects.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>By Subject</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {subjects.slice(0, 8).map(([name, data]) => {
                      const maxSubjectCards = Math.max(...subjects.map(([, d]) => d.cards), 1);
                      return (
                        <div key={name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 120, fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                          <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)" }}>
                            <div style={{ width: `${(data.cards / maxSubjectCards) * 100}%`, height: "100%", borderRadius: 3, background: "var(--os-accent)", transition: "width 0.3s" }} />
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", minWidth: 40, textAlign: "right" }}>{data.cards} cards</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent sessions */}
              {sessions.length > 0 && (
                <div>
                  <h3 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600, color: "#94a3b8" }}>Recent Sessions</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {sessions.slice(0, 10).map((s, i) => {
                      const sessAcc = (s.cards_studied || 0) > 0 ? Math.round(((s.known || 0) / s.cards_studied) * 100) : 0;
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                          <span style={{
                            fontSize: 10, padding: "2px 6px", borderRadius: 4, fontWeight: 500,
                            background: s.session_type === "quiz" ? "rgba(139,92,246,0.15)" : "rgba(14,165,233,0.15)",
                            color: s.session_type === "quiz" ? "#a78bfa" : "#38bdf8",
                          }}>{s.session_type}</span>
                          <span style={{ flex: 1, fontSize: 12, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.subject}</span>
                          <span style={{ fontSize: 11, color: "#64748b" }}>{s.cards_studied} cards</span>
                          <span style={{ fontSize: 11, color: sessAcc >= 80 ? "#22c55e" : sessAcc >= 50 ? "#eab308" : "#ef4444" }}>{sessAcc}%</span>
                          <span style={{ fontSize: 10, color: "#4a5568" }}>{Math.round((s.duration_seconds || 0) / 60)}m</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Days active */}
              <div style={{ marginTop: 20, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  <strong style={{ color: "#94a3b8" }}>{daysActive}</strong> active {daysActive === 1 ? "day" : "days"} in this period
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
