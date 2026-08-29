"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { User, Music, Save, Camera, X, Smile } from "lucide-react";
import Link from "next/link";

const DEFAULT_AVATARS = [
  "https://cdn-icons-png.flaticon.com/512/1154/1154460.png",
  "https://cdn-icons-png.flaticon.com/512/1154/1154454.png",
  "https://cdn-icons-png.flaticon.com/512/1154/1154462.png",
  "https://cdn-icons-png.flaticon.com/512/1154/1154446.png",
  "https://cdn-icons-png.flaticon.com/512/1154/1154452.png",
  "https://cdn-icons-png.flaticon.com/512/1154/1154443.png",
  "https://cdn-icons-png.flaticon.com/512/1154/1154456.png",
  "https://cdn-icons-png.flaticon.com/512/1154/1154447.png",
];

const MOOD_EMOJIS = ["😊", "😎", "🤓", "😴", "🔥", "💯", "🎵", "📚", "💪", "🧠", "✨", "🌟"];

export default function ProfilePage() {
  const { user, username, refreshProfile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [moodText, setMoodText] = useState("");
  const [moodEmoji, setMoodEmoji] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.from("user_profiles").select("avatar_url, bio, mood_text, mood_emoji").eq("user_id", user.id).maybeSingle();
      if (data) {
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
        setMoodText(data.mood_text || "");
        setMoodEmoji(data.mood_emoji || "");
      }
      setLoading(false);
    })();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = getSupabase();
    await supabase.from("user_profiles").update({ avatar_url: avatarUrl, bio, mood_text: moodText, mood_emoji: moodEmoji }).eq("user_id", user.id);
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const supabase = getSupabase();
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("avatars").upload(path, file);
      if (!error) {
        const { data } = supabase.storage.from("avatars").getPublicUrl(path);
        setAvatarUrl(data.publicUrl);
        setShowAvatarPicker(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>You need to log in to view your profile.</p>
          <Link href="/login" className="glass-btn glass-btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title"><User size={28} /> Profile</h1>
        <p className="page-subtitle">Manage your public profile</p>
      </div>

      {/* Profile Picture + Username */}
      <div className="glass-panel" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            <div
              onClick={() => setShowAvatarPicker(true)}
              style={{
                width: 96, height: 96, borderRadius: "50%", overflow: "hidden", cursor: "pointer",
                border: "2px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User size={40} style={{ color: "var(--os-text-dim)" }} />
              )}
            </div>
            <button
              onClick={() => setShowAvatarPicker(true)}
              style={{
                position: "absolute", bottom: 0, right: 0, width: 28, height: 28,
                borderRadius: "50%", background: "var(--os-accent)", border: "2px solid rgba(15,21,35,0.8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#fff",
              }}
            >
              <Camera size={12} />
            </button>
          </div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-primary)" }}>{username || "User"}</h2>
            <p className="text-secondary text-sm">{user.email}</p>
          </div>
        </div>

        {/* Avatar Picker */}
        {showAvatarPicker && (
          <div style={{ padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20 }}>
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Choose Avatar</span>
              <button onClick={() => setShowAvatarPicker(false)} style={{ background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}><X size={14} /></button>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {DEFAULT_AVATARS.map((url) => (
                <button
                  key={url}
                  onClick={() => { setAvatarUrl(url); setShowAvatarPicker(false); }}
                  style={{
                    width: 56, height: 56, borderRadius: "50%", overflow: "hidden", cursor: "pointer",
                    border: avatarUrl === url ? "2px solid var(--os-accent)" : "2px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.05)", padding: 0,
                  }}
                >
                  <img src={url} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="glass-btn glass-btn-ghost" style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
              <Camera size={14} /> Upload your own
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
          </div>
        )}

        {/* Bio */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "var(--os-text-dim)", display: "block", marginBottom: 6 }}>Bio</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            className="glass-input"
            style={{ height: 80, resize: "none" }}
            maxLength={200}
          />
          <p style={{ fontSize: 11, color: "var(--os-text-dim)", textAlign: "right", marginTop: 4 }}>{bio.length}/200</p>
        </div>

        {/* Save Button */}
        <button onClick={handleSave} disabled={saving} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Save size={14} /> {saving ? "Saving..." : saved ? "Saved!" : "Save Profile"}
        </button>
      </div>

      {/* Music / Mood */}
      <div className="glass-panel" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <Music size={18} /> Music & Mood
        </h2>

        {/* Mood Emoji */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "var(--os-text-dim)", display: "block", marginBottom: 8 }}>
            <Smile size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Current Mood
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MOOD_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => setMoodEmoji(moodEmoji === emoji ? "" : emoji)}
                style={{
                  width: 40, height: 40, borderRadius: 10, fontSize: 20,
                  border: moodEmoji === emoji ? "2px solid var(--os-accent)" : "1px solid rgba(255,255,255,0.08)",
                  background: moodEmoji === emoji ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.03)",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.15s",
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Spotify / Music */}
        <div>
          <label style={{ fontSize: 12, color: "var(--os-text-dim)", display: "block", marginBottom: 6 }}>
            <Music size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> What are you listening to?
          </label>
          <input
            className="glass-input"
            value={moodText}
            onChange={(e) => setMoodText(e.target.value)}
            placeholder="e.g. Lo-fi beats to study to..."
            maxLength={100}
          />
          <p style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 4 }}>
            {moodEmoji && <span style={{ marginRight: 6 }}>{moodEmoji}</span>}
            {moodText ? `Feeling ${moodText}` : "Set your mood and music above"}
          </p>
        </div>
      </div>
    </div>
  );
}
