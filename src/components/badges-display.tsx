"use client";

import { useState, useEffect } from "react";
import { BADGES, getEarnedBadges, retroactiveBadgeCheck, type Badge } from "@/lib/badges";
import { useAuth } from "@/lib/auth-context";
import { Award, Lock } from "lucide-react";

const CATEGORY_LABELS: Record<string, string> = {
  study: "Study",
  streak: "Streaks",
  social: "Social",
  milestone: "Milestones",
};

const CATEGORY_COLORS: Record<string, string> = {
  study: "#6d28d9",
  streak: "#dc2626",
  social: "#0891b2",
  milestone: "#d97706",
};

export default function BadgesDisplay() {
  const [earnedIds, setEarnedIds] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    setEarnedIds(getEarnedBadges());
  }, []);

  useEffect(() => {
    if (!user) return;
    retroactiveBadgeCheck(user.id).then((newlyEarned) => {
      if (newlyEarned.length > 0) {
        setEarnedIds(getEarnedBadges());
      }
    }).catch(() => {});
  }, [user]);

  const earnedCount = earnedIds.length;
  const totalCount = BADGES.length;

  const grouped = Object.keys(CATEGORY_LABELS).map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat],
    color: CATEGORY_COLORS[cat],
    badges: BADGES.filter((b) => b.category === cat),
  }));

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <div className="page-header">
        <h1 className="page-title">
          <Award size={28} /> Achievements
        </h1>
        <p className="page-subtitle">
          {earnedCount} / {totalCount} badges earned
        </p>
      </div>

      {/* Progress bar */}
      <div className="glass-panel" style={{ marginBottom: 24 }}>
        <div
          style={{
            width: "100%",
            height: 8,
            borderRadius: 4,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(earnedCount / totalCount) * 100}%`,
              height: "100%",
              borderRadius: 4,
              background: "linear-gradient(90deg, #6d28d9, #7c3aed)",
              transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        </div>
        <p
          style={{
            fontSize: 12,
            color: "var(--os-text-dim)",
            marginTop: 8,
          }}
        >
          {earnedCount === totalCount
            ? "All badges unlocked! You are a true champion."
            : `${totalCount - earnedCount} badge${totalCount - earnedCount !== 1 ? "s" : ""} remaining`}
        </p>
      </div>

      {/* Badge categories */}
      {grouped.map(({ category, label, color, badges }) => (
        <div key={category} style={{ marginBottom: 28 }}>
          <h2
            style={{
              fontSize: 15,
              fontWeight: 600,
              color,
              marginBottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                display: "inline-block",
              }}
            />
            {label}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: 10,
            }}
          >
            {badges.map((badge) => {
              const earned = earnedIds.includes(badge.id);
              return (
                <div
                  key={badge.id}
                  className="glass-card"
                  style={{
                    padding: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    opacity: earned ? 1 : 0.45,
                    borderColor: earned
                      ? `${color}33`
                      : "rgba(255,255,255,0.35)",
                    background: earned
                      ? `${color}08`
                      : "rgba(255,255,255,0.02)",
                    transition: "all 0.25s ease",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: earned
                        ? `${color}18`
                        : "rgba(255,255,255,0.04)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      fontSize: 32,
                      filter: earned ? "none" : "grayscale(1)",
                      position: "relative",
                    }}
                  >
                    {badge.icon}
                    {!earned && (
                      <div
                        style={{
                          position: "absolute",
                          bottom: -2,
                          right: -2,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "var(--os-bg-primary)",
                          border: "2px solid rgba(255,255,255,0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Lock
                          size={10}
                          style={{ color: "var(--os-text-dim)" }}
                        />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: earned
                          ? "var(--os-text-primary)"
                          : "var(--os-text-secondary)",
                        lineHeight: 1.2,
                      }}
                    >
                      {badge.name}
                    </p>
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--os-text-dim)",
                        marginTop: 2,
                        lineHeight: 1.3,
                      }}
                    >
                      {badge.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
