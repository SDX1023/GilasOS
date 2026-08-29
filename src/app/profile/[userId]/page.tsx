"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { getSupabase } from "@/lib/supabase";
import { User, Music, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProfileData {
  username: string;
  avatar_url: string;
  bio: string;
  mood_text: string;
  mood_emoji: string;
  spotify_url: string;
}

function extractSpotifyId(url: string): { type: string; id: string } | null {
  const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (match) return { type: match[1], id: match[2] };
  const raw = url.match(/^([a-zA-Z0-9]{22})$/);
  if (raw) return { type: "track", id: raw[1] };
  return null;
}

export default function PublicProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.from("user_profiles").select("username, avatar_url, bio, mood_text, mood_emoji, spotify_url").eq("user_id", userId).maybeSingle();
      if (data) setProfile(data);
      else setNotFound(true);
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

  const spotifyParsed = profile.spotify_url ? extractSpotifyId(profile.spotify_url) : null;

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
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
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
            {profile.mood_text && (
              <p style={{ fontSize: 14, color: "var(--os-text-secondary)" }}>
                &ldquo;{profile.mood_text}&rdquo;
              </p>
            )}
          </div>
        </div>
        {profile.bio && (
          <p style={{ fontSize: 14, color: "var(--os-text-secondary)", lineHeight: 1.6, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>{profile.bio}</p>
        )}
      </div>

      {/* Music & Mood */}
      {(profile.mood_text || spotifyParsed) && (
        <div className="glass-panel" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            <Music size={18} /> Music & Mood
          </h2>
          {profile.mood_text && (
            <div style={{ fontSize: 14, color: "var(--os-text-secondary)", marginBottom: spotifyParsed ? 16 : 0 }}>
              &ldquo;{profile.mood_text}&rdquo;
            </div>
          )}
          {spotifyParsed && (
            <iframe
              src={`https://open.spotify.com/embed/${spotifyParsed.type}/${spotifyParsed.id}?utm_source=generator&theme=0`}
              width="100%"
              height={spotifyParsed.type === "track" ? 80 : 152}
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style={{ borderRadius: 12 }}
            />
          )}
        </div>
      )}
    </div>
  );
}
