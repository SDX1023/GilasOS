"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { User, Music, Save, Camera, X, Smile, ExternalLink, Crop } from "lucide-react";
import Link from "next/link";
import { SpotifySearch } from "@/components/spotify-search";

const DEFAULT_AVATARS = [
  { url: "https://cdn-icons-png.flaticon.com/512/1318/1318913.png", label: "Cat" },
  { url: "https://cdn-icons-png.flaticon.com/512/1318/1318939.png", label: "Dog" },
  { url: "https://cdn-icons-png.flaticon.com/512/1318/1318923.png", label: "Owl" },
  { url: "https://cdn-icons-png.flaticon.com/512/1318/1318927.png", label: "Penguin" },
  { url: "https://cdn-icons-png.flaticon.com/512/1318/1318915.png", label: "Bear" },
  { url: "https://cdn-icons-png.flaticon.com/512/1318/1318940.png", label: "Fox" },
  { url: "https://cdn-icons-png.flaticon.com/512/1318/1318917.png", label: "Tiger" },
  { url: "https://cdn-icons-png.flaticon.com/512/1318/1318912.png", label: "Panda" },
];

const DEFAULT_MOODS = [
  "Bahala na si Lord",
  "Ayoko na po",
  "Sana all",
  "Keri pa!",
  "Laban lang!",
  "Pagod na ako",
  "Masaya today",
  "Nakaka-zero ang life",
  "Gipit na gipit",
  "Kaya 'yan!",
  "Prayer lang lagi",
  "Study first, regrets later",
  "Surviving, not thriving",
  "Energy level: 1%",
  "Todo na lang kulang",
  "Fighting for my 1.0",
  "Walang tulugan",
  "Push lang, deadline pa naman",
  "Skibidi Sila",
  "Eme eme lang",
];

interface SpotifyTrack {
  id: string;
  name: string;
  artist: string;
  album: string;
  albumArt: string | null;
  url: string;
  preview: string | null;
}

function AvatarCropModal({ src, onCrop, onClose }: { src: string; onCrop: (d: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [cs, setCs] = useState({ w: 0, h: 0 });
  const [action, setAction] = useState<"move" | "tl" | "tr" | "bl" | "br" | null>(null);
  const sr = useRef({ mx: 0, my: 0, c: { x: 0, y: 0, w: 0, h: 0 } });

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const maxW = Math.min(400, img.width);
      const r = img.height / img.width;
      const h = maxW * r;
      setCs({ w: maxW, h });
      const s = Math.min(maxW, h);
      setCrop({ x: (maxW - s) / 2, y: (h - s) / 2, w: s, h: s });
    };
    img.src = src;
  }, [src]);

  useEffect(() => {
    const cv = canvasRef.current;
    const img = imgRef.current;
    if (!cv || !img || !cs.w) return;
    cv.width = cs.w;
    cv.height = cs.h;
    const ctx = cv.getContext("2d")!;
    ctx.drawImage(img, 0, 0, cs.w, cs.h);
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, cs.w, cs.h);
    ctx.clearRect(crop.x, crop.y, crop.w, crop.h);
    const scaleX = img.naturalWidth / cs.w;
    const scaleY = img.naturalHeight / cs.h;
    ctx.drawImage(img, crop.x * scaleX, crop.y * scaleY, crop.w * scaleX, crop.h * scaleY, crop.x, crop.y, crop.w, crop.h);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    ctx.setLineDash([]);
    [[crop.x, crop.y], [crop.x + crop.w, crop.y], [crop.x, crop.y + crop.h], [crop.x + crop.w, crop.y + crop.h]].forEach(([cx, cy]) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 5, cy - 5, 10, 10);
    });
  }, [crop, cs]);

  const gp = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const hc = (p: { x: number; y: number }): "tl" | "tr" | "bl" | "br" | null => {
    const m = 12;
    if (Math.abs(p.x - crop.x) < m && Math.abs(p.y - crop.y) < m) return "tl";
    if (Math.abs(p.x - (crop.x + crop.w)) < m && Math.abs(p.y - crop.y) < m) return "tr";
    if (Math.abs(p.x - crop.x) < m && Math.abs(p.y - (crop.y + crop.h)) < m) return "bl";
    if (Math.abs(p.x - (crop.x + crop.w)) < m && Math.abs(p.y - (crop.y + crop.h)) < m) return "br";
    return null;
  };

  const md = (e: React.MouseEvent) => {
    const p = gp(e);
    const c = hc(p);
    if (c) { setAction(c); sr.current = { mx: p.x, my: p.y, c: { ...crop } }; }
    else if (p.x >= crop.x && p.x <= crop.x + crop.w && p.y >= crop.y && p.y <= crop.y + crop.h) {
      setAction("move");
      sr.current = { mx: p.x - crop.x, my: p.y - crop.y, c: { ...crop } };
    }
  };

  const mm = (e: React.MouseEvent) => {
    if (!action) return;
    const p = gp(e);
    const s = sr.current;
    const min = 30;
    let c = { ...s.c };
    if (action === "move") { c.x = Math.max(0, Math.min(cs.w - c.w, p.x - s.mx)); c.y = Math.max(0, Math.min(cs.h - c.h, p.y - s.my)); }
    else if (action === "br") { c.w = Math.max(min, Math.min(cs.w - c.x, p.x - c.x)); c.h = c.w; }
    else if (action === "bl") { const nx = Math.min(p.x, c.x + c.w - min); c.w += c.x - nx; c.x = nx; c.h = c.w; }
    else if (action === "tr") { c.w = Math.max(min, Math.min(cs.w - c.x, p.x - c.x)); const ny = c.y + c.h - c.w; c.h = c.w; c.y = ny; }
    else if (action === "tl") { const nx = Math.min(p.x, c.x + c.w - min); c.w += c.x - nx; c.x = nx; c.h = c.w; c.y = s.c.y + s.c.h - c.w; }
    setCrop(c);
  };

  const apply = () => {
    const img = imgRef.current;
    if (!img) return;
    const out = document.createElement("canvas");
    out.width = 256;
    out.height = 256;
    const ctx = out.getContext("2d")!;
    const sx = img.naturalWidth / cs.w;
    const sy = img.naturalHeight / cs.h;
    ctx.drawImage(img, crop.x * sx, crop.y * sy, crop.w * sx, crop.h * sy, 0, 0, 256, 256);
    onCrop(out.toDataURL("image/png"));
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 10000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)" }} onClick={onClose}>
      <div style={{ background: "var(--os-bg-secondary)", borderRadius: 12, padding: 24, maxWidth: 460, width: "100%", margin: "0 16px" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 16, color: "var(--os-text-primary)" }}>Crop Profile Picture</h3>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <canvas
            ref={canvasRef}
            style={{ borderRadius: 10, cursor: action === "move" ? "move" : action ? "nwse-resize" : "default", maxWidth: "100%" }}
            onMouseDown={md}
            onMouseMove={mm}
            onMouseUp={() => setAction(null)}
            onMouseLeave={() => setAction(null)}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer", color: "var(--os-text-secondary)", fontFamily: "Inter, sans-serif" }}>Cancel</button>
          <button onClick={apply} style={{ padding: "8px 16px", background: "var(--os-accent)", color: "#fff", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, username, refreshProfile } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [moodText, setMoodText] = useState("");
  const [customMood, setCustomMood] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [spotifyInput, setSpotifyInput] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showSpotifySearch, setShowSpotifySearch] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.from("user_profiles").select("avatar_url, bio, mood_text, spotify_url").eq("user_id", user.id).maybeSingle();
      if (data) {
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
        setMoodText(data.mood_text || "");
        setSpotifyUrl(data.spotify_url || "");
        setSpotifyInput(data.spotify_url || "");
      }
      setLoading(false);
    })();
  }, [user]);

  const selectTrack = (track: SpotifyTrack) => {
    setSelectedTrack(track);
    setSpotifyInput(track.url);
    setShowSpotifySearch(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = getSupabase();
    await supabase.from("user_profiles").update({
      avatar_url: avatarUrl, bio, mood_text: moodText,
      spotify_url: spotifyInput.trim() || "",
    }).eq("user_id", user.id);
    setSpotifyUrl(spotifyInput.trim() || "");
    await refreshProfile();
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropImage(ev.target?.result as string);
      setShowAvatarPicker(false);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const applyCrop = async (dataUrl: string) => {
    if (!user) return;
    setCropImage(null);
    const supabase = getSupabase();
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const path = `${user.id}/${Date.now()}.png`;
    const { error } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/png" });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
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

        {/* Mood Phrase - Multiple Selection */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, color: "var(--os-text-dim)", display: "block", marginBottom: 8 }}>
            <Smile size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Current Moods
          </label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {DEFAULT_MOODS.map((phrase) => {
              const selected = moodText.split(" | ").map((s) => s.trim()).filter(Boolean).includes(phrase);
              return (
                <button
                  key={phrase}
                  onClick={() => {
                    const moods = moodText.split(" | ").map((s) => s.trim()).filter(Boolean);
                    if (selected) {
                      setMoodText(moods.filter((m) => m !== phrase).join(" | "));
                    } else {
                      setMoodText([...moods, phrase].join(" | "));
                    }
                  }}
                  style={{
                    padding: "6px 12px", borderRadius: 20, fontSize: 12, fontWeight: 500,
                    border: selected ? "1.5px solid var(--os-accent)" : "1px solid rgba(255,255,255,0.08)",
                    background: selected ? "rgba(109,40,217,0.12)" : "rgba(255,255,255,0.03)",
                    color: selected ? "var(--os-accent)" : "var(--os-text-secondary)",
                    cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
                  }}
                >
                  {selected ? "✓ " : ""}{phrase}
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <input
              className="glass-input"
              value={customMood}
              onChange={(e) => setCustomMood(e.target.value)}
              placeholder="Or type your own mood..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && customMood.trim()) {
                  const moods = moodText.split(" | ").map((s) => s.trim()).filter(Boolean);
                  if (!moods.includes(customMood.trim())) {
                    setMoodText([...moods, customMood.trim()].join(" | "));
                  }
                  setCustomMood("");
                }
              }}
              style={{ flex: 1, fontSize: 12 }}
            />
            <button
              onClick={() => {
                if (customMood.trim()) {
                  const moods = moodText.split(" | ").map((s) => s.trim()).filter(Boolean);
                  if (!moods.includes(customMood.trim())) {
                    setMoodText([...moods, customMood.trim()].join(" | "));
                  }
                  setCustomMood("");
                }
              }}
              disabled={!customMood.trim()}
              className="glass-btn glass-btn-primary"
              style={{ padding: "6px 14px", fontSize: 12, opacity: customMood.trim() ? 1 : 0.5 }}
            >
              Add
            </button>
          </div>
          {moodText && (
            <p style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 8 }}>
              Current: <span style={{ color: "var(--os-accent)", fontWeight: 500 }}>&ldquo;{moodText}&rdquo;</span>
              <button onClick={() => setMoodText("")} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", marginLeft: 8, fontSize: 11 }}>(clear)</button>
            </p>
          )}
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
              {selectedTrack.albumArt && <img src={selectedTrack.albumArt} alt="" style={{ width: 44, height: 44, borderRadius: 6, objectFit: "cover" }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedTrack.name}</p>
                <p style={{ fontSize: 11, color: "var(--os-text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedTrack.artist}</p>
              </div>
              <button onClick={() => { setSelectedTrack(null); setSpotifyInput(""); }} style={{ background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", padding: 4 }}><X size={14} /></button>
            </div>
          )}

          {/* Search Button */}
          {!showSpotifySearch && !selectedTrack && (
            <button
              onClick={() => setShowSpotifySearch(true)}
              className="glass-btn"
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-start", padding: "10px 14px", background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.2)", color: "#1DB954", fontSize: 13 }}
            >
              <Music size={14} /> Search for a song on Spotify...
            </button>
          )}

          {/* Spotify Search Modal */}
          {showSpotifySearch && (
            <SpotifySearch
              onSelect={(track) => {
                setSelectedTrack({ id: track.id, name: track.name, artist: track.artist, album: track.album, albumArt: track.albumArt, url: track.url, preview: track.preview });
                setSpotifyInput(track.url);
              }}
              onClose={() => setShowSpotifySearch(false)}
            />
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
              {moodText ? <>&ldquo;{moodText}&rdquo;</> : "Set your mood above, or search for a song"}
            </p>
          )}
        </div>
      </div>

      {/* Crop Modal */}
      {cropImage && <AvatarCropModal src={cropImage} onCrop={applyCrop} onClose={() => setCropImage(null)} />}
    </div>
  );
}
