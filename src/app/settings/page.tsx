"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { Settings, Lock, User, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, username, changePassword, refreshProfile } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);
  const [cooldownEnd, setCooldownEnd] = useState<Date | null>(null);
  const [cooldownText, setCooldownText] = useState("");

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    supabase
      .from("user_profiles")
      .select("username_changed_at")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.username_changed_at) {
          const lastChange = new Date(data.username_changed_at as string).getTime();
          const end = new Date(lastChange + 7 * 24 * 60 * 60 * 1000);
          if (end > new Date()) setCooldownEnd(end);
        }
      });
  }, [user]);

  useEffect(() => {
    if (!cooldownEnd) return;
    const end = cooldownEnd;
    const interval = setInterval(() => {
      const now = new Date();
      if (end <= now) { setCooldownEnd(null); clearInterval(interval); return; }
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setCooldownText(days > 0 ? `${days}d ${hours}h` : `${hours}h`);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>You need to log in to access settings.</p>
          <Link href="/login" className="glass-btn glass-btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess(false);
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
    setLoading(true);
    const result = await changePassword(newPassword);
    setLoading(false);
    if (result.error) setError(result.error);
    else { setSuccess(true); setNewPassword(""); setConfirmPassword(""); }
  }

  async function handleUsernameChange(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError(""); setUsernameSuccess(false);
    if (!user) return;
    const trimmed = newUsername.trim();
    if (trimmed.length < 2) { setUsernameError("Username must be at least 2 characters"); return; }
    if (trimmed.length > 20) { setUsernameError("Username must be 20 characters or less"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setUsernameError("Only letters, numbers, and underscores allowed"); return; }

    setUsernameLoading(true);
    const supabase = getSupabase();
    const { data: existing } = await supabase.from("user_profiles").select("user_id").eq("username", trimmed).neq("user_id", user.id).maybeSingle();
    if (existing) { setUsernameError("That username is already taken"); setUsernameLoading(false); return; }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from("user_profiles").update({ username: trimmed, username_changed_at: now }).eq("user_id", user.id);
    setUsernameLoading(false);
    if (updateError) setUsernameError(updateError.message);
    else {
      setUsernameSuccess(true); setNewUsername("");
      setCooldownEnd(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      await refreshProfile();
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/" style={{ fontSize: 13, color: "var(--os-text-dim)", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      <div className="flex-between" style={{ marginBottom: 32 }}>
        <div className="page-title" style={{ margin: 0 }}>
          <Settings size={28} /> Settings
        </div>
      </div>

      {/* Change Username */}
      <div className="glass-panel" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <User size={16} />
          <h2 style={{ fontWeight: 600 }}>Change Username</h2>
        </div>
        <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>
          Current: <span style={{ fontWeight: 500, color: "var(--os-text-primary)" }}>{username || "Not set"}</span>
        </p>
        {cooldownEnd ? (
          <p className="text-secondary text-sm">
            You can change your username again in <span style={{ fontWeight: 500, color: "var(--os-text-primary)" }}>{cooldownText}</span>
          </p>
        ) : (
          <form onSubmit={handleUsernameChange} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {usernameError && <p style={{ fontSize: 13, color: "#ef4444", padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)" }}>{usernameError}</p>}
            {usernameSuccess && (
              <p style={{ fontSize: 13, color: "#10b981", padding: 12, borderRadius: 10, background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
                <Check size={14} /> Username changed successfully
              </p>
            )}
            <div>
              <label style={{ fontSize: 11, color: "var(--os-text-dim)", marginBottom: 4, display: "block" }}>New Username</label>
              <input className="glass-input" value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Letters, numbers, underscores" maxLength={20} />
            </div>
            <button type="submit" disabled={usernameLoading} className="glass-btn glass-btn-primary" style={{ width: "100%", opacity: usernameLoading ? 0.5 : 1 }}>
              {usernameLoading ? "Changing..." : "Change Username"}
            </button>
          </form>
        )}
      </div>

      {/* Change Password */}
      <div className="glass-panel">
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <Lock size={16} />
          <h2 style={{ fontWeight: 600 }}>Change Password</h2>
        </div>
        <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>
          Signed in as <span style={{ fontWeight: 500, color: "var(--os-text-primary)" }}>{user.email}</span>
        </p>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {error && <p style={{ fontSize: 13, color: "#ef4444", padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)" }}>{error}</p>}
          {success && (
            <p style={{ fontSize: 13, color: "#10b981", padding: 12, borderRadius: 10, background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", gap: 8 }}>
              <Check size={14} /> Password changed successfully
            </p>
          )}
          <div>
            <label style={{ fontSize: 11, color: "var(--os-text-dim)", marginBottom: 4, display: "block" }}>New Password</label>
            <input className="glass-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--os-text-dim)", marginBottom: 4, display: "block" }}>Confirm Password</label>
            <input className="glass-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat password" />
          </div>
          <button type="submit" disabled={loading} className="glass-btn glass-btn-primary" style={{ width: "100%", opacity: loading ? 0.5 : 1 }}>
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
