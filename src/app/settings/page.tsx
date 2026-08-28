"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Settings, Lock, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
  const { user, changePassword } = useAuth();
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

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

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    const result = await changePassword(newPassword);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setNewPassword("");
      setConfirmPassword("");
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
