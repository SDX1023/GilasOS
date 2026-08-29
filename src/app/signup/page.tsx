"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (username.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    const result = await signUp(email, password, username);
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push("/");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 className="page-title" style={{ textAlign: "center", marginBottom: 32, justifyContent: "center" }}>Sign Up</h1>
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <p style={{ fontSize: 13, color: "#ef4444", padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)" }}>{error}</p>}
          <div>
            <label style={{ fontSize: 13, color: "var(--os-text-secondary)", marginBottom: 4, display: "block" }}>Username</label>
            <input className="glass-input" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Choose a username" />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--os-text-secondary)", marginBottom: 4, display: "block" }}>Email</label>
            <input className="glass-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--os-text-secondary)", marginBottom: 4, display: "block" }}>Password</label>
            <input className="glass-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="At least 6 characters" />
          </div>
          <button type="submit" disabled={loading} className="glass-btn glass-btn-primary" style={{ width: "100%", opacity: loading ? 0.5 : 1 }}>
            {loading ? "Creating account..." : "Sign Up"}
          </button>
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--os-text-dim)" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "var(--os-accent)", textDecoration: "none" }}>Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
