"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Flame } from "lucide-react";

interface StreakData {
  current: number;
  longest: number;
  todayStudied: boolean;
  last7: boolean[];
}

export function DailyStreak() {
  const { user } = useAuth();
  const [streak, setStreak] = useState<StreakData | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    supabase.from("study_stats").select("date, known").eq("user_id", user.id).order("date", { ascending: false })
      .then(({ data }) => {
        if (!data?.length) { setStreak({ current: 0, longest: 0, todayStudied: false, last7: Array(7).fill(false) }); return; }

        const dates = new Set(data.map((d: any) => d.date));
        const today = new Date().toDateString();
        const todayStudied = dates.has(today);

        // Current streak
        let current = 0;
        const d = new Date();
        if (!dates.has(d.toDateString())) d.setDate(d.getDate() - 1); // start from yesterday if today not studied
        while (dates.has(d.toDateString())) { current++; d.setDate(d.getDate() - 1); }

        // Longest streak
        const sorted = [...dates].sort();
        let longest = 0, run = 0;
        for (let i = 0; i < sorted.length; i++) {
          if (i === 0) { run = 1; }
          else {
            const prev = new Date(sorted[i - 1]);
            const curr = new Date(sorted[i]);
            const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
            if (diff === 1) run++; else run = 1;
          }
          longest = Math.max(longest, run);
        }

        // Last 7 days
        const last7: boolean[] = [];
        for (let i = 6; i >= 0; i--) {
          const dd = new Date();
          dd.setDate(dd.getDate() - i);
          last7.push(dates.has(dd.toDateString()));
        }

        setStreak({ current, longest, todayStudied, last7 });
      });
  }, [user]);

  if (!user || !streak) return null;

  return (
    <div style={{ background: "rgba(0,0,0,0.25)", borderRadius: 16, padding: "20px 24px", border: "1px solid var(--os-glass-border)", backdropFilter: "blur(20px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Flame size={32} style={{ color: streak.current > 0 ? "#f97316" : "var(--os-text-dim)" }} />
            {streak.current > 0 && (
              <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(249,115,22,0.4) 0%, transparent 70%", filter: "blur(8px)" }} />
            )}
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, color: streak.current > 0 ? "#f97316" : "var(--os-text-dim)", lineHeight: 1 }}>
              {streak.current}
            </div>
            <div style={{ fontSize: 11, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: 1 }}>
              day streak
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "var(--os-text-dim)" }}>Best: {streak.longest} days</div>
          <div style={{ fontSize: 12, color: streak.todayStudied ? "#22c55e" : "#f59e0b", marginTop: 2 }}>
            {streak.todayStudied ? "Studied today ✓" : "Not yet today"}
          </div>
        </div>
      </div>

      {/* Last 7 days */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
        {streak.last7.map((active, i) => {
          const dd = new Date();
          dd.setDate(dd.getDate() - (6 - i));
          const dayName = dd.toLocaleDateString("en", { weekday: "short" });
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: active ? "linear-gradient(135deg, #f97316, #ef4444)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? "rgba(249,115,22,0.3)" : "rgba(255,255,255,0.06)"}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}>
                {active ? "🔥" : ""}
              </div>
              <div style={{ fontSize: 9, color: "var(--os-text-dim)", textTransform: "uppercase" }}>{dayName}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
