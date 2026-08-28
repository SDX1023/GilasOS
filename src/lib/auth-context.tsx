"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSupabase } from "./supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  username: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  signUp: async () => ({}),
  signIn: async () => ({}),
  signOut: async () => {},
  username: "",
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function checkAdmin(userId: string, userEmail: string) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("admin_emails")
      .select("email")
      .eq("email", userEmail)
      .single();
    setIsAdmin(!!data);
  }

  useEffect(() => {
    const supabase = getSupabase();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUsername(session.user.id);
        checkAdmin(session.user.id, session.user.email || "");
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUsername(session.user.id);
        checkAdmin(session.user.id, session.user.email || "");
      } else {
        setUsername("");
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchUsername(userId: string) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from("user_profiles")
      .select("username")
      .eq("user_id", userId)
      .single();
    if (data) setUsername(data.username);
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
    }
    return {};
  }

  async function signIn(email: string, password: string) {
    const supabase = getSupabase();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      checkAdmin(data.user.id, data.user.email || "");
    }
    return {};
  }

  async function signOut() {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    setUsername("");
    setIsAdmin(false);
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signUp, signIn, signOut, username }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
