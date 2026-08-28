"use client";

import { Shield } from "lucide-react";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <p className="text-muted-foreground text-center">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center mb-8">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold">Admin Access</h1>
          <p className="text-muted-foreground mt-2">You need to log in to access the admin panel</p>
        </div>
        <Link
          href="/login"
          className="block w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-center font-medium"
        >
          Log In
        </Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground mt-2">
            Your account ({user.email}) does not have admin permissions.
          </p>
        </div>
      </div>
    );
  }

  return <AdminDashboard />;
}
