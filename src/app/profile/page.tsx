"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { User, Music, Save, Camera, X, Smile, Search, ExternalLink, Play, Pause } from "lucide-react";
import Link from "next/link";

const DEFAULT_AVATARS = [
  { url: "https://em-content.zobj.net/source/apple/391/cat_1f431.png", label: "Cat" },
  { url: "https://em-content.zobj.net/source/apple/391/dog_1f436.png", label: "Dog" },
  { url: "https://em-content.zobj.net/source/apple/391/owl_1f989.png", label: "Owl" },
  { url: "https://em-content.zobj.net/source/apple/391/penguin_1f427.png", label: "Penguin" },
  { url: "https://em-content.zobj.net/source/apple/391/fox_1f98a.png", label: "Fox" },
  { url: "https://em-content.zobj.net/source/apple/391/bear_1f43b.png", label: "Bear" },
  { url: "https://em-content.zobj.net/source/apple/391/rabbit_1f430.png", label: "Rabbit" },
  { url: "https://em-content.zobj.net/source/apple/391/panda_1f43c.png", label: "Panda" },
];

const MOOD_EMOJIS = ["😊", "😎", "🤓", "😴", "🔥", "💯", "🎵", "📚", "💪", "🧠", "✨", "🌟"];

interface SpotifyTrack {
  id: string;
  type: string;
  name: string;
  artist: string;
  album: string;
  image: string;
  url: string;
  duration_ms: number;
}

function formatDuration(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

export default function ProfilePage() {
  const { user, username, refreshProfile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [moodText, setMoodText] = useState("");
  const [moodEmoji, setMoodEmoji] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [spotifyInput, setSpotifyInput] = useState("");
  const [spotifySearch, setSpotifySearch] = useState("");
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showSpotifySearch, setShowSpotifySearch] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.from("user_profiles").select("avatar_url, bio, mood_text, mood_emoji, spotify_url").eq("user_id", user.id).maybeSingle();
      if (data) {
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
        setMoodText(data.mood_text || "");
        setMoodEmoji(data.mood_emoji || "");
        setSpotifyUrl(data.spotify_url || "");
        setSpotifyInput(data.spotify_url || "");
      }
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (!showSpotifySearch || !spotifySearch.trim()) { setSpotifyResults([]); return; }
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/spotify/search?q=${encodeURIComponent(spotifySearch.trim())}&type=track`);
        const data = await res.json();
        setSpotifyResults(data.items || []);
      } catch { setSpotifyResults([]); }
      setSearching(false);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [spotifySearch, showSpotifySearch]);

  const selectTrack = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setSpotifyInput(track.url);
    setShowSpotifySearch(false);
    setSpotifySearch("");
    setSpotifyResults([]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = getSupabase();
    await supabase.from("user_profiles").update({
      avatar_url: avatarUrl, bio, mood_text: moodText, mood_emoji: moodEmoji,
      spotify_url: spotifyInput.trim() || "",
    }).eq("user_id", user.id);
    setSpotifyUrl(spotifyInput.trim() || "");
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
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

  const extractSpotifyId = (url: string): { type: string; id: string } | null => {
    const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
    if (match) return { type: match[1], id: match[2] };
    return null;
  };

  const spotifyParsed = spotifyInput.trim() ? extractSpotifyId(spotifyInput.trim()) : null;

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
                <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
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
              {DEFAULT_AVATARS.map((av) => (
                <button
                  key={av.url}
                  onClick={() => { setAvatarUrl(av.url); setShowAvatarPicker(false); }}
                  title={av.label}
                  style={{
                    width: 56, height: 56, borderRadius: "50%", overflow: "hidden", cursor: "pointer",
                    border: avatarUrl === av.url ? "2px solid var(--os-accent)" : "2px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.05)", padding: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <img src={av.url} alt={av.label} style={{ width: 36, height: 36, objectFit: "contain" }} />
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

        {/* Spotify */}
        <div>
          <label style={{ fontSize: 12, color: "var(--os-text-dim)", display: "block", marginBottom: 6 }}>
            <Music size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> What are you listening to?
          </label>

          {/* Selected Track Preview */}
          {selectedTrack && !showSpotifySearch && (
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: 10, borderRadius: 10,
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", marginBottom: 10,
            }}>
              {selectedTrack.image && <img src={selectedTrack.image} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedTrack.name}</p>
                <p style={{ fontSize: 11, color: "var(--os-text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedTrack.artist}</p>
              </div>
              <span style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{formatDuration(selectedTrack.duration_ms)}</span>
              <button onClick={() => { setSelectedTrack(null); setSpotifyInput(""); }} style={{ background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", padding: 4 }}><X size={14} /></button>
            </div>
          )}

          {/* Search Button / Input */}
          {!showSpotifySearch && !selectedTrack && (
            <button
              onClick={() => setShowSpotifySearch(true)}
              className="glass-btn glass-btn-ghost"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start", color: "var(--os-text-dim)" }}
            >
              <Search size={14} /> Search for a song on Spotify...
            </button>
          )}

          {showSpotifySearch && (
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--os-text-dim)" }} />
                <input
                  className="glass-input"
                  value={spotifySearch}
                  onChange={(e) => setSpotifySearch(e.target.value)}
                  placeholder="Search songs, artists, albums..."
                  autoFocus
                  style={{ paddingLeft: 32, paddingRight: 32 }}
                />
                <button
                  onClick={() => { setShowSpotifySearch(false); setSpotifySearch(""); setSpotifyResults([]); }}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", padding: 4 }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Search Results */}
              {searching && <p style={{ fontSize: 12, color: "var(--os-text-dim)", padding: "8px 0" }}>Searching...</p>}
              {spotifyResults.length > 0 && (
                <div style={{
                  maxHeight: 300, overflowY: "auto", marginTop: 6, borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.06)", background: "rgba(15,21,35,0.95)",
                }}>
                  {spotifyResults.map((track) => (
                    <button
                      key={track.id}
                      onClick={() => selectTrack(track)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px",
                        background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
                        cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif",
                      }}
                    >
                      {track.image && <img src={track.image} alt="" style={{ width: 36, height: 36, borderRadius: 4, objectFit: "cover", flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.name}</p>
                        <p style={{ fontSize: 11, color: "var(--os-text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.artist}{track.album ? ` - ${track.album}` : ""}</p>
                      </div>
                      <span style={{ fontSize: 11, color: "var(--os-text-dim)", flexShrink: 0 }}>{formatDuration(track.duration_ms)}</span>
                    </button>
                  ))}
                </div>
              )}
              {spotifySearch && !searching && spotifyResults.length === 0 && (
                <p style={{ fontSize: 12, color: "var(--os-text-dim)", padding: "8px 0" }}>No results found</p>
              )}
            </div>
          )}

          {/* Spotify Embed */}
          {spotifyParsed && !showSpotifySearch && (
            <div style={{ marginTop: 12 }}>
              <iframe
                src={`https://open.spotify.com/embed/${spotifyParsed.type}/${spotifyParsed.id}?utm_source=generator&theme=0`}
                width="100%"
                height={80}
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                style={{ borderRadius: 12 }}
              />
            </div>
          )}

          {!spotifyInput && !showSpotifySearch && !selectedTrack && (
            <p style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 8 }}>
              {moodEmoji && <span style={{ marginRight: 6 }}>{moodEmoji}</span>}
              {moodText ? `Feeling ${moodText}` : "Search for a song to share what you're listening to"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
