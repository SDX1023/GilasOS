"use client";

import { Shield } from "lucide-react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="page-container">
        <p className="text-secondary" style={{ textAlign: "center" }}>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon"><Shield size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Admin Access</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>You need to log in to access the admin panel</p>
          <Link href="/login" className="glass-btn glass-btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon"><Shield size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Access Denied</h2>
          <p className="text-secondary text-sm">Your account ({user.email}) does not have admin permissions.</p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
