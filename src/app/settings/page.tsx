"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { Settings, Lock, User, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, username, changePassword } = useAuth();
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
          if (end > new Date()) {
            setCooldownEnd(end);
          }
        }
      });
  }, [user]);

  useEffect(() => {
    if (!cooldownEnd) return;
    const end = cooldownEnd;
    const interval = setInterval(() => {
      const now = new Date();
      if (end <= now) {
        setCooldownEnd(null);
        clearInterval(interval);
        return;
      }
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      setCooldownText(days > 0 ? `${days}d ${hours}h` : `${hours}h`);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownEnd]);

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md text-center">
        <p className="text-muted-foreground mb-4">You need to log in to access settings.</p>
        <Link href="/login" className="text-primary hover:underline">Log In</Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
    setLoading(true);
    const result = await changePassword(newPassword);
    setLoading(false);
    if (result.error) { setError(result.error); }
    else { setSuccess(true); setNewPassword(""); setConfirmPassword(""); }
  }

  async function handleUsernameChange(e: React.FormEvent) {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess(false);
    if (!user) return;
    const trimmed = newUsername.trim();
    if (trimmed.length < 2) { setUsernameError("Username must be at least 2 characters"); return; }
    if (trimmed.length > 20) { setUsernameError("Username must be 20 characters or less"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) { setUsernameError("Only letters, numbers, and underscores allowed"); return; }

    setUsernameLoading(true);
    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from("user_profiles")
      .select("user_id")
      .eq("username", trimmed)
      .neq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      setUsernameError("That username is already taken");
      setUsernameLoading(false);
      return;
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from("user_profiles")
      .update({ username: trimmed, username_changed_at: now })
      .eq("user_id", user.id);

    setUsernameLoading(false);
    if (updateError) {
      setUsernameError(updateError.message);
    } else {
      setUsernameSuccess(true);
      setNewUsername("");
      setCooldownEnd(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="mb-6">
        <Link href="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Settings className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="p-6 rounded-xl border bg-card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4" />
          <h2 className="font-medium">Change Username</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Current: <span className="font-medium text-foreground">{username || "Not set"}</span>
        </p>
        {cooldownEnd ? (
          <p className="text-sm text-muted-foreground">
            You can change your username again in <span className="font-medium text-foreground">{cooldownText}</span>
          </p>
        ) : (
          <form onSubmit={handleUsernameChange} className="space-y-3">
            {usernameError && <p className="text-sm text-red-600 bg-red-500/10 p-3 rounded-lg">{usernameError}</p>}
            {usernameSuccess && (
              <p className="text-sm text-green-600 bg-green-500/10 p-3 rounded-lg flex items-center gap-2">
                <Check className="h-4 w-4" /> Username changed successfully
              </p>
            )}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">New Username</label>
              <input
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                placeholder="Letters, numbers, underscores"
                maxLength={20}
              />
            </div>
            <button
              type="submit"
              disabled={usernameLoading}
              className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
            >
              {usernameLoading ? "Changing..." : "Change Username"}
            </button>
          </form>
        )}
      </div>

      <div className="p-6 rounded-xl border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-4 w-4" />
          <h2 className="font-medium">Change Password</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-sm text-red-600 bg-red-500/10 p-3 rounded-lg">{error}</p>}
          {success && (
            <p className="text-sm text-green-600 bg-green-500/10 p-3 rounded-lg flex items-center gap-2">
              <Check className="h-4 w-4" /> Password changed successfully
            </p>
          )}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              placeholder="At least 6 characters"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              placeholder="Repeat password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm font-medium"
          >
            {loading ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
