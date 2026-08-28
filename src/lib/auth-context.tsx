"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSupabase } from "./supabase";
import { migrateLocalStorageToSupabase } from "./custom-content";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ error?: string }>;
  refreshProfile: () => Promise<void>;
  username: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signOut: async () => {},
  changePassword: async () => ({}),
  refreshProfile: async () => {},
  username: "",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkAdmin(userId: string, userEmail: string) {
    try {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("admin_emails")
        .select("email")
        .eq("email", userEmail)
        .maybeSingle();
      setIsAdmin(!!data);
    } catch {}
  }

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUsername(session.user.id, session.user.email || "");
        checkAdmin(session.user.id, session.user.email || "");
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUsername(session.user.id, session.user.email || "");
        checkAdmin(session.user.id, session.user.email || "");
      } else {
        setUsername("");
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUsername(userId: string, userEmail?: string) {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from("user_profiles")
        .select("username")
        .eq("user_id", userId)
        .maybeSingle();
      if (data) {
        setUsername(data.username);
      } else if (userEmail) {
        const fallbackName = userEmail.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
        const { error: insertError } = await supabase.from("user_profiles").insert({
          user_id: userId,
          username: fallbackName,
          email: userEmail,
        });
        if (!insertError) setUsername(fallbackName);
      }
    } catch {}
  }

  async function signUp(email: string, password: string, newUsername: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const { error: profileError } = await supabase
        .from("user_profiles")
        .insert({ user_id: data.user.id, username: newUsername, email });
      if (profileError) return { error: profileError.message };
      setUsername(newUsername);
      checkAdmin(data.user.id, email);
      // Migrate any existing localStorage flashcards to this user's account
      migrateLocalStorageToSupabase().catch((e) => console.error("Migration failed:", e));
    }
    return {};
  }

  async function signIn(email: string, password: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      checkAdmin(data.user.id, data.user.email || "");
      fetchUsername(data.user.id, data.user.email || "");
      // Migrate any existing localStorage flashcards to this user's account
      migrateLocalStorageToSupabase().catch((e) => console.error("Migration failed:", e));
    }
    return {};
  }

  async function signOut() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUsername("");
    setIsAdmin(false);
  }

  async function changePassword(newPassword: string) {
    const supabase = getSupabase();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: error.message };
    return {};
  }

  async function refreshProfile() {
    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await fetchUsername(session.user.id, session.user.email || "");
      await checkAdmin(session.user.id, session.user.email || "");
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signUp, signIn, signOut, changePassword, refreshProfile, username }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
