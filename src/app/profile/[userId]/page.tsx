"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { getSupabase } from "@/lib/supabase";
import { User, Music, ArrowLeft, Smile } from "lucide-react";
import Link from "next/link";

interface ProfileData {
  username: string;
  avatar_url: string;
  bio: string;
  mood_text: string;
  mood_emoji: string;
}

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.from("user_profiles").select("username, avatar_url, bio, mood_text, mood_emoji").eq("user_id", userId).maybeSingle();
      if (data) {
        setProfile(data);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: 600 }}>
        <p className="text-secondary text-sm">Loading profile...</p>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="page-container" style={{ maxWidth: 600 }}>
        <div className="empty-state">
          <div className="empty-state-icon"><User size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <p className="text-secondary text-sm">User not found.</p>
          <Link href="/leaderboard" className="glass-btn glass-btn-ghost" style={{ marginTop: 12 }}>
            <ArrowLeft size={14} /> Back to Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <Link href="/leaderboard" style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
        color: "var(--os-text-dim)", textDecoration: "none", marginBottom: 24,
      }}>
        <ArrowLeft size={14} /> Back to Leaderboard
      </Link>

      {/* Profile Card */}
      <div className="glass-panel" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: profile.bio ? 16 : 0 }}>
          <div style={{
            width: 96, height: 96, borderRadius: "50%", overflow: "hidden",
            border: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <User size={40} style={{ color: "var(--os-text-dim)" }} />
            )}
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4 }}>{profile.username}</h1>
            {profile.mood_emoji && (
              <p style={{ fontSize: 14, color: "var(--os-text-secondary)" }}>
                {profile.mood_emoji} {profile.mood_text || "No mood set"}
              </p>
            )}
          </div>
        </div>
        {profile.bio && (
          <p style={{ fontSize: 14, color: "var(--os-text-secondary)", lineHeight: 1.6, marginTop: 12, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>{profile.bio}</p>
        )}
      </div>

      {/* Music & Mood */}
      {(profile.mood_emoji || profile.mood_text) && (
        <div className="glass-panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <Music size={18} /> Music & Mood
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 14, color: "var(--os-text-secondary)" }}>
            {profile.mood_emoji && <span style={{ fontSize: 28 }}>{profile.mood_emoji}</span>}
            <span>{profile.mood_text || "No mood set"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
