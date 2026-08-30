"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { getSupabase } from "@/lib/supabase";
import { User, Music, ArrowLeft, UserPlus, UserCheck, Clock, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getSpriteUrl, getProfileSpriteUrl } from "@/components/pixel-pet/pet-sprites";

interface ProfileData {
  username: string;
  avatar_url: string;
  bio: string;
  mood_text: string;
  mood_emoji: string;
  spotify_url: string;
}

interface UserPet {
  name: string;
  pet_type: string;
  color: string;
  sprite_url: string | null;
  bg: string;
  xp: number;
  level: number;
  mood: string;
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
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileData>({ username: "User", avatar_url: "", bio: "", mood_text: "", mood_emoji: "", spotify_url: "" });
  const [loading, setLoading] = useState(true);
  const [friendship, setFriendship] = useState<{ id: string; status: string; requester_id: string } | null>(null);
  const [friendLoading, setFriendLoading] = useState(false);
  const [userPet, setUserPet] = useState<UserPet | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.from("user_profiles").select("username, avatar_url, bio, mood_text, mood_emoji, spotify_url").eq("user_id", userId).maybeSingle();
      setProfile(data || { username: "User", avatar_url: "", bio: "", mood_text: "", mood_emoji: "", spotify_url: "" });
      const { data: petData } = await supabase.from("user_pets").select("name, pet_type, color, sprite_url, bg, xp, level, mood").eq("user_id", userId).maybeSingle();
      if (petData) setUserPet(petData);
      setLoading(false);
    })();
  }, [userId]);

  useEffect(() => {
    if (!user || user.id === userId) return;
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("user_friends")
        .select("id, status, requester_id")
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${userId}),and(requester_id.eq.${userId},addressee_id.eq.${user.id})`)
        .maybeSingle();
      if (data) setFriendship(data);
    })();
  }, [user, userId]);

  const sendRequest = async () => {
    if (!user) return;
    setFriendLoading(true);
    const supabase = getSupabase();
    const { data } = await supabase.from("user_friends").insert({ requester_id: user.id, addressee_id: userId }).select("id, status, requester_id").single();
    if (data) setFriendship(data);
    setFriendLoading(false);
  };

  const cancelRequest = async () => {
    if (!friendship) return;
    setFriendLoading(true);
    const supabase = getSupabase();
    await supabase.from("user_friends").delete().eq("id", friendship.id);
    setFriendship(null);
    setFriendLoading(false);
  };

  const acceptRequest = async () => {
    if (!friendship) return;
    setFriendLoading(true);
    const supabase = getSupabase();
    await supabase.from("user_friends").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", friendship.id);
    setFriendship({ ...friendship, status: "accepted" });
    setFriendLoading(false);
  };

  const unfriend = async () => {
    if (!friendship) return;
    setFriendLoading(true);
    const supabase = getSupabase();
    await supabase.from("user_friends").delete().eq("id", friendship.id);
    setFriendship(null);
    setFriendLoading(false);
  };

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: 600 }}>
        <p className="text-secondary text-sm">Loading profile...</p>
      </div>
    );
  }

  const spotifyParsed = profile.spotify_url ? extractSpotifyId(profile.spotify_url) : null;
  const isOwnProfile = user?.id === userId;

  function renderFriendButton() {
    if (!user || isOwnProfile) return null;
    if (friendLoading) return <Loader2 size={14} className="animate-spin" />;

    if (!friendship) {
      return (
        <button onClick={sendRequest} className="glass-btn glass-btn-primary" style={{ padding: "6px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <UserPlus size={14} /> Add Friend
        </button>
      );
    }

    if (friendship.status === "pending") {
      if (friendship.requester_id === user.id) {
        return (
          <button onClick={cancelRequest} className="glass-btn glass-btn-ghost" style={{ padding: "6px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, color: "var(--os-text-dim)" }}>
            <Clock size={14} /> Pending
          </button>
        );
      }
      return (
        <button onClick={acceptRequest} className="glass-btn glass-btn-primary" style={{ padding: "6px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <UserCheck size={14} /> Accept
        </button>
      );
    }

    if (friendship.status === "accepted") {
      return (
        <button onClick={unfriend} className="glass-btn glass-btn-ghost" style={{ padding: "6px 14px", fontSize: 12, color: "#ef4444", display: "flex", alignItems: "center", gap: 4 }}>
          Unfriend
        </button>
      );
    }

    return null;
  }

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <Link href="/friends" style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
        color: "var(--os-text-dim)", textDecoration: "none", marginBottom: 24,
      }}>
        <ArrowLeft size={14} /> Back to Friends
      </Link>

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
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--os-text-primary)" }}>{profile.username}</h1>
              {renderFriendButton()}
            </div>
            {profile.mood_text && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                {profile.mood_text.split(" | ").map((m: string) => m.trim()).filter(Boolean).map((mood: string, i: number) => (
                  <span key={i} style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 500, background: "rgba(109,40,217,0.1)", color: "var(--os-accent)", border: "1px solid rgba(109,40,217,0.2)" }}>
                    {mood}
                  </span>
                ))}
              </div>
            )}
          </div>
          {userPet && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
              <img src={getProfileSpriteUrl(userPet)} alt={userPet.name} width={96} height={96} style={{ imageRendering: "pixelated" }} />
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-primary)" }}>{userPet.name}</p>
                <p style={{ fontSize: 11, color: "var(--os-text-secondary)", marginTop: 2 }}>
                  Lv.{userPet.level} {userPet.pet_type}
                </p>
                <p style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 1 }}>
                  {userPet.mood === "happy" ? "Feeling great!" : userPet.mood === "sad" ? "Needs attention" : "Just vibing~"}
                </p>
              </div>
            </div>
          )}
        </div>
        {profile.bio && (
          <p style={{ fontSize: 14, color: "var(--os-text-secondary)", lineHeight: 1.6, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>{profile.bio}</p>
        )}
      </div>

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
