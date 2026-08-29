"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) setError(result.error);
    else router.push("/");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <h1 className="page-title" style={{ textAlign: "center", marginBottom: 32, justifyContent: "center" }}>Log In</h1>
        <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          {error && <p style={{ fontSize: 13, color: "#ef4444", padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)" }}>{error}</p>}
          <div>
            <label style={{ fontSize: 13, color: "var(--os-text-secondary)", marginBottom: 4, display: "block" }}>Email</label>
            <input className="glass-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@email.com" />
          </div>
          <div>
            <label style={{ fontSize: 13, color: "var(--os-text-secondary)", marginBottom: 4, display: "block" }}>Password</label>
            <input className="glass-input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <button type="submit" disabled={loading} className="glass-btn glass-btn-primary" style={{ width: "100%", opacity: loading ? 0.5 : 1 }}>
            {loading ? "Logging in..." : "Log In"}
          </button>
          <p style={{ textAlign: "center", fontSize: 13, color: "var(--os-text-dim)" }}>
            Don&apos;t have an account?{" "}
            <Link href="/signup" style={{ color: "var(--os-accent)", textDecoration: "none" }}>Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
