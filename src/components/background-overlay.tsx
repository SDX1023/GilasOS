"use client";

import { useState, useEffect } from "react";
import ThemeOverlay from "./theme-overlay";
import { getSupabase } from "@/lib/supabase";

export const THEME_MAP: Record<string, string> = {
  "#1a0205": "Spiderman",
  "#05001a": "Galaxy",
  "#0a0008": "Resident Evil",
};

function themeFromColor(color: string | null): string | null {
  if (!color) return null;
  return THEME_MAP[color] || null;
}

export default function BackgroundOverlay() {
  const [theme, setTheme] = useState<string | null>(null);

  async function loadTheme() {
    let color: string | null = null;
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from("user_profiles").select("wallpaper").eq("user_id", user.id).maybeSingle();
        if (data?.wallpaper) color = data.wallpaper;
      }
    } catch {}
    if (!color) color = localStorage.getItem("gilasos-wallpaper");
    setTheme(themeFromColor(color));
  }

  function handleThemeChange(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail && "theme" in detail) {
      setTheme(detail.theme);
    } else {
      loadTheme();
    }
  }

  useEffect(() => {
    loadTheme();
    window.addEventListener("storage", loadTheme);
    window.addEventListener("gilasos-theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("storage", loadTheme);
      window.removeEventListener("gilasos-theme-change", handleThemeChange);
    };
  }, []);

  if (!theme) return null;

  const opacity = theme === "Galaxy" ? 0.75 : theme === "Resident Evil" ? 0.4 : 0.35;

  return (
    <div
      key={theme}
      className="theme-overlay-container"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        overflow: "hidden",
        opacity,
      }}
    >
      <ThemeOverlay theme={theme} />
    </div>
  );
}
