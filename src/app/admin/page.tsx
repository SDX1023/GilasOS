"use client";

import { useState, useEffect } from "react";
import { Shield, Lock } from "lucide-react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";

const ADMIN_PASSWORD = "SDX102310";
const ADMIN_STORAGE_KEY = "gilasos_admin_auth";

export function isAdmin(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ADMIN_STORAGE_KEY) === "true";
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setIsAuthenticated(isAdmin());
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      localStorage.setItem(ADMIN_STORAGE_KEY, "true");
      setError("");
    } else {
      setError("Invalid password");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold">Sofia {'<3'}</h1>
          <p className="text-muted-foreground mt-2">Enter password to continue</p>
        </div>

        <form onSubmit={handleLogin} className="p-6 rounded-xl border bg-card space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Password</label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-3 py-2 rounded-lg border bg-background"
                autoFocus
              />
            </div>
            {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Login
          </button>
        </form>
      </div>
    );
  }

  return <AdminDashboard />;
}
