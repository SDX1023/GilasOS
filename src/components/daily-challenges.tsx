"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { Zap, CheckCircle, BookOpen, Target, Flame, Trophy } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  target: number;
  progress: number;
  completed: boolean;
  icon: any;
  color: string;
}

const CHALLENGE_TEMPLATES = [
  { id: "cards-20", title: "Review 20 cards", target: 20, type: "cards", icon: BookOpen, color: "#8b5cf6" },
  { id: "cards-50", title: "Review 50 cards", target: 50, type: "cards", icon: BookOpen, color: "#6d28d9" },
  { id: "accuracy-80", title: "Score 80%+ accuracy", target: 80, type: "accuracy", icon: Target, color: "#22c55e" },
  { id: "accuracy-90", title: "Score 90%+ accuracy", target: 90, type: "accuracy", icon: Target, color: "#10b981" },
  { id: "study-15", title: "Study for 15 minutes", target: 15, type: "minutes", icon: Flame, color: "#f97316" },
  { id: "study-30", title: "Study for 30 minutes", target: 30, type: "minutes", icon: Flame, color: "#ef4444" },
  { id: "quiz-done", title: "Complete a quiz", target: 1, type: "quizzes", icon: Trophy, color: "#eab308" },
  { id: "streak-keep", title: "Keep your streak", target: 1, type: "streak", icon: Zap, color: "#0ea5e9" },
];

function getTodayKey(): string {
  return new Date().toDateString();
}

function generateDailyChallenges(): Challenge[] {
  const seed = new Date().getDate() + new Date().getMonth() * 31;
  const shuffled = [...CHALLENGE_TEMPLATES].sort((a, b) => {
    const ha = (seed * (a.id.charCodeAt(0) + 1)) % 100;
    const hb = (seed * (b.id.charCodeAt(0) + 1)) % 100;
    return ha - hb;
  });
  return shuffled.slice(0, 3).map((t) => ({
    id: t.id,
    title: t.title,
    target: t.target,
    progress: 0,
    completed: false,
    icon: t.icon,
    color: t.color,
  }));
}

export default function DailyChallenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadAndCheck();
  }, [user?.id]);

  async function loadAndCheck() {
    if (!user) return;
    const today = getTodayKey();
    const stored = localStorage.getItem("gilasos-daily-challenges");

    let currentChallenges: Challenge[];
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date === today) {
        currentChallenges = data.challenges;
      } else {
        currentChallenges = generateDailyChallenges();
      }
    } else {
      currentChallenges = generateDailyChallenges();
    }

    // Check progress against today's stats
    const supabase = getSupabase();
    const { data: todayStats } = await supabase
      .from("study_stats")
      .select("known, forgot, dont_know, cards_total")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    const { data: todaySessions } = await supabase
      .from("study_sessions")
      .select("session_type, duration_seconds, score, total_questions")
      .eq("user_id", user.id)
      .gte("created_at", new Date(new Date().setHours(0, 0, 0, 0)).toISOString());

    const cardsToday = todayStats?.cards_total || 0;
    const knownToday = todayStats?.known || 0;
    const accuracyToday = cardsToday > 0 ? Math.round((knownToday / cardsToday) * 100) : 0;
    const minutesToday = Math.round((todaySessions || []).reduce((s, sess) => s + (sess.duration_seconds || 0), 0) / 60);
    const quizzesToday = (todaySessions || []).filter((s) => s.session_type === "quiz").length;

    // Streak check
    const { data: streakData } = await supabase
      .from("study_stats")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false });
    let streak = 0;
    const todayDate = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      if ((streakData || []).some((r) => r.date === d.toDateString())) streak++;
      else break;
    }

    const updated = currentChallenges.map((c) => {
      let progress = 0;
      let completed = false;
      switch (c.id) {
        case "cards-20": progress = cardsToday; completed = cardsToday >= 20; break;
        case "cards-50": progress = cardsToday; completed = cardsToday >= 50; break;
        case "accuracy-80": progress = accuracyToday; completed = accuracyToday >= 80; break;
        case "accuracy-90": progress = accuracyToday; completed = accuracyToday >= 90; break;
        case "study-15": progress = minutesToday; completed = minutesToday >= 15; break;
        case "study-30": progress = minutesToday; completed = minutesToday >= 30; break;
        case "quiz-done": progress = quizzesToday; completed = quizzesToday >= 1; break;
        case "streak-keep": progress = streak > 0 ? 1 : 0; completed = streak > 0; break;
      }
      return { ...c, progress, completed };
    });

    setChallenges(updated);
    localStorage.setItem("gilasos-daily-challenges", JSON.stringify({ date: today, challenges: updated }));
  }

  const completedCount = challenges.filter((c) => c.completed).length;

  return (
    <div style={{
      padding: "14px 16px", borderRadius: 14,
      background: "linear-gradient(145deg, rgba(20,25,40,0.8), rgba(12,15,25,0.9))",
      border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Zap size={14} color="#eab308" />
          <span style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8" }}>Daily Challenges</span>
        </div>
        <span style={{ fontSize: 11, color: completedCount === challenges.length ? "#22c55e" : "#64748b" }}>
          {completedCount}/{challenges.length}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {challenges.map((c) => {
          const Icon = c.icon;
          const pct = Math.min(100, (c.progress / c.target) * 100);
          return (
            <div key={c.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 8,
              background: c.completed ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${c.completed ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)"}`,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                background: `${c.color}15`, flexShrink: 0,
              }}>
                {c.completed ? <CheckCircle size={14} color="#22c55e" /> : <Icon size={14} color={c.color} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: c.completed ? "#22c55e" : "#e2e8f0", textDecoration: c.completed ? "line-through" : "none" }}>
                  {c.title}
                </div>
                <div style={{ marginTop: 4, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                  <div style={{ width: `${pct}%`, height: "100%", borderRadius: 2, background: c.completed ? "#22c55e" : c.color, transition: "width 0.3s" }} />
                </div>
              </div>
              <span style={{ fontSize: 10, color: "#64748b" }}>{Math.min(c.progress, c.target)}/{c.target}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
