"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { Share2, X, Flame, BookOpen, Target, TrendingUp } from "lucide-react";

interface WeekData {
  date: string;
  known: number;
  forgot: number;
  dont_know: number;
  cards_total: number;
}

interface WeekSummary {
  days: WeekData[];
  totalCards: number;
  totalKnown: number;
  accuracy: number;
  streak: number;
  bestDay: string;
  bestDayCards: number;
  weekLabel: string;
}

function getWeekRange(): { start: Date; end: Date; label: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - ((dayOfWeek + 6) % 7)); // Monday
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const label = `${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
  return { start, end, label };
}

function getEmptyWeek(): WeekData[] {
  const { start } = getWeekRange();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return { date: d.toDateString(), known: 0, forgot: 0, dont_know: 0, cards_total: 0 };
  });
}

function getDayLabel(index: number): string {
  return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][index];
}

function getMotivation(accuracy: number, streak: number, totalCards: number): string {
  if (totalCards === 0) return "Start your week strong!";
  if (accuracy >= 90 && streak >= 7) return "Absolute legend. Keep it up!";
  if (accuracy >= 80 && streak >= 3) return "Crushing it this week!";
  if (accuracy >= 70) return "Solid progress — keep going!";
  if (totalCards >= 100) return "High volume week! Quality will follow.";
  return "Every card counts. Keep studying!";
}

export default function WeeklySummary({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<WeekSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    loadSummary();
  }, [user?.id]);

  async function loadSummary() {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabase();
    const { start, end, label } = getWeekRange();

    const { data } = await supabase
      .from("study_stats")
      .select("date, known, forgot, dont_know, cards_total")
      .eq("user_id", user.id)
      .gte("date", start.toDateString())
      .lte("date", end.toDateString());

    const emptyWeek = getEmptyWeek();
    const dataMap = new Map<string, WeekData>();
    (data || []).forEach((row: any) => {
      dataMap.set(row.date, {
        date: row.date,
        known: row.known || 0,
        forgot: row.forgot || 0,
        dont_know: row.dont_know || 0,
        cards_total: row.cards_total || 0,
      });
    });

    const days = emptyWeek.map((empty) => dataMap.get(empty.date) || empty);
    const totalCards = days.reduce((s, d) => s + d.cards_total, 0);
    const totalKnown = days.reduce((s, d) => s + d.known, 0);
    const accuracy = totalCards > 0 ? Math.round((totalKnown / totalCards) * 100) : 0;

    // Streak
    let streak = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toDateString();
      const hasData = (data || []).some((r: any) => r.date === key && (r.known > 0 || r.forgot > 0 || r.dont_know > 0));
      if (hasData) streak++;
      else break;
    }

    // Best day
    let bestDay = "";
    let bestDayCards = 0;
    days.forEach((d) => {
      if (d.cards_total > bestDayCards) {
        bestDayCards = d.cards_total;
        bestDay = d.date;
      }
    });

    setSummary({ days, totalCards, totalKnown, accuracy, streak, bestDay, bestDayCards: bestDayCards, weekLabel: label });
    setLoading(false);
  }

  function getMaxCards(): number {
    if (!summary) return 1;
    return Math.max(...summary.days.map((d) => d.cards_total), 1);
  }

  function getIntensityColor(known: number, total: number): string {
    if (total === 0) return "rgba(255,255,255,0.04)";
    const ratio = known / total;
    const accent = "var(--os-accent)";
    if (ratio >= 0.8) return accent;
    if (ratio >= 0.5) return `color-mix(in srgb, ${accent} 60%, transparent)`;
    return `color-mix(in srgb, ${accent} 30%, transparent)`;
  }

  async function handleShare() {
    if (!cardRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: "#0a0e18",
        borderRadius: 16,
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `gilasos-weekly-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Share failed:", err);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#64748b", fontSize: 13 }}>Loading summary...</div>
    );
  }

  if (!summary) return null;

  const maxCards = getMaxCards();

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
      backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} ref={cardRef} style={{
        width: 420, borderRadius: 20, overflow: "hidden",
        background: "linear-gradient(160deg, rgba(15,20,35,0.97), rgba(10,14,24,0.99))",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#e2e8f0", position: "relative",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--os-accent)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>
              Weekly Summary
            </div>
            <div style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{summary.weekLabel}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={handleShare} title="Download as image" style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)", color: "#94a3b8", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#e2e8f0"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94a3b8"; }}
            ><Share2 size={14} /></button>
            {onClose && (
              <button onClick={onClose} style={{
                width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)", color: "#94a3b8", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}><X size={14} /></button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 1, padding: "20px 28px", marginTop: 12 }}>
          {[
            { icon: BookOpen, label: "Cards", value: summary.totalCards.toLocaleString(), color: "var(--os-accent)" },
            { icon: Target, label: "Accuracy", value: `${summary.accuracy}%`, color: summary.accuracy >= 80 ? "#22c55e" : summary.accuracy >= 60 ? "#eab308" : "#ef4444" },
            { icon: Flame, label: "Streak", value: `${summary.streak}d`, color: summary.streak >= 7 ? "#f97316" : summary.streak >= 3 ? "#eab308" : "#94a3b8" },
            { icon: TrendingUp, label: "Best Day", value: summary.bestDayCards > 0 ? getDayLabel(new Date(summary.bestDay).getDay() === 0 ? 6 : new Date(summary.bestDay).getDay() - 1) : "–", color: "#94a3b8" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <stat.icon size={14} color={stat.color} style={{ marginBottom: 4 }} />
              <div style={{ fontSize: 20, fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 500, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* 7-Day Heatmap */}
        <div style={{ padding: "0 28px 20px" }}>
          <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
            {summary.days.map((day, i) => {
              const height = day.cards_total > 0 ? Math.max(20, (day.cards_total / maxCards) * 64) : 8;
              return (
                <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flex: 1 }}>
                  <div style={{
                    width: "100%", height, borderRadius: 6,
                    background: day.cards_total > 0 ? getIntensityColor(day.known, day.cards_total) : "rgba(255,255,255,0.04)",
                    border: day.cards_total > 0 ? "none" : "1px solid rgba(255,255,255,0.06)",
                    transition: "all 0.3s ease",
                  }} />
                  <span style={{ fontSize: 9, fontWeight: 500, color: "#4a5568" }}>{getDayLabel(i)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Motivation */}
        <div style={{
          padding: "14px 28px", borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
        }}>
          <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", fontWeight: 500, fontStyle: "italic" }}>
            {getMotivation(summary.accuracy, summary.streak, summary.totalCards)}
          </div>
        </div>

        {/* GilasOS branding */}
        <div style={{ padding: "8px 28px 16px", textAlign: "center" }}>
          <span style={{ fontSize: 9, color: "#374151", fontWeight: 500, letterSpacing: "0.1em" }}>GILASOS</span>
        </div>
      </div>
    </div>
  );
}
