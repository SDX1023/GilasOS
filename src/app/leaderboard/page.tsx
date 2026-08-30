"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { Trophy, Medal, Flame, Target, Calendar } from "lucide-react";
import Link from "next/link";
import { getSpriteUrl } from "@/components/pixel-pet/pet-sprites";

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

interface UserPet {
  user_id: string;
  pet_type: string;
  color: string;
  sprite_url: string | null;
  name: string;
  bg: string;
}

interface UserProfile {
  user_id: string;
  username: string;
  avatar_url: string | null;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPets, setUserPets] = useState<Record<string, UserPet>>({});
  const [userAvatars, setUserAvatars] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, profilesRes, petsRes] = await Promise.all([
          fetch("/api/study-stats").then((r) => r.json()),
          getSupabase().from("user_profiles").select("user_id, username, avatar_url"),
          getSupabase().from("user_pets").select("user_id, pet_type, color, sprite_url, name, bg"),
        ]);
        const profileMap: Record<string, string> = {};
        const avatarMap: Record<string, string> = {};
        if (profilesRes.data) profilesRes.data.forEach((p: any) => {
          profileMap[p.user_id] = p.username;
          if (p.avatar_url) avatarMap[p.user_id] = p.avatar_url;
        });
        if (Array.isArray(statsRes)) {
          statsRes.forEach((entry: any) => {
            if (!entry.username || entry.username === "Unknown") entry.username = profileMap[entry.user_id] || "Unknown";
          });
        }
        setLeaderboard(statsRes);
        setUserAvatars(avatarMap);
        if (petsRes.data) {
          const petMap: Record<string, UserPet> = {};
          petsRes.data.forEach((p: any) => { petMap[p.user_id] = p; });
          setUserPets(petMap);
        }
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
                padding: "10px 16px", display: "flex", alignItems: "center", gap: 12,
                border: isMe ? "1px solid var(--os-accent)" : undefined,
              }}>
                <div style={{ flexShrink: 0 }}>{getMedalIcon(i)}</div>
                <div style={{ width: 32, height: 32, borderRadius: "50%", overflow: "hidden", flexShrink: 0, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {userAvatars[entry.user_id] ? (
                    <img src={userAvatars[entry.user_id]} alt="" width={32} height={32} style={{ objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #6d28d9, #2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 600, color: "#fff" }}>
                      {entry.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Link href={`/profile/${entry.user_id}`} style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: "none", color: "var(--os-text-primary)" }}>{entry.username}</Link>
                    {isMe && <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(0,212,255,0.12)", color: "var(--os-accent)" }}>You</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 2, fontSize: 12, color: "var(--os-text-dim)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Target size={12} /> {entry.accuracy}% accuracy</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Flame size={12} /> {entry.streak} day streak</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {entry.daysStudied} days</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                  {userPets[entry.user_id] && (
                    <img
                      src={getSpriteUrl(userPets[entry.user_id])}
                      alt={userPets[entry.user_id].name}
                      width={32} height={32}
                      style={{ imageRendering: "pixelated" }}
                    />
                  )}
                  <div style={{ textAlign: "right" }}>
                    <p style={{ fontSize: 18, fontWeight: 700 }}>{entry.score}</p>
                    <p style={{ fontSize: 11, color: "var(--os-text-dim)" }}>pts</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
