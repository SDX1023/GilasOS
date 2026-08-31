"use client";

import { useState, useEffect } from "react";
import ThemeOverlay from "./theme-overlay";
import { getSupabase } from "@/lib/supabase";

const colorToTheme: Record<string, string> = {
  "#1a0205": "Spiderman",
  "#0a0a0f": "Batman",
  "#1a1205": "Greek Myth",
  "#05001a": "Galaxy",
  "#0a0018": "Neon Tokyo",
  "#1a1005": "Sahara",
  "#0a1525": "Nordic Frost",
  "#1a0505": "Volcanic",
  "#1a000a": "Cherry Coke",
  "#000a02": "Matrix",
  "#1a1008": "Steampunk",
  "#0a0a05": "Cyberpunk 2077",
  "#050a12": "Detroit: BH",
};

function themeFromColor(color: string | null): string | null {
  if (!color) return null;
  return colorToTheme[color] || null;
}

export default function BackgroundOverlay() {
  const [theme, setTheme] = useState<string | null>(null);

  async function loadFromSupabase() {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return loadFromStorage();
      const { data } = await supabase.from("user_profiles").select("wallpaper").eq("user_id", user.id).maybeSingle();
      if (data?.wallpaper) {
        const t = themeFromColor(data.wallpaper);
        setTheme(t);
        localStorage.setItem("gilasos-wallpaper", data.wallpaper);
      } else {
        loadFromStorage();
      }
    } catch {
      loadFromStorage();
    }
  }

  function loadFromStorage() {
    const saved = localStorage.getItem("gilasos-wallpaper");
    setTheme(themeFromColor(saved));
  }

  function handleThemeChange(e: Event) {
    const detail = (e as CustomEvent).detail;
    if (detail && "theme" in detail) {
      setTheme(detail.theme);
    } else {
      loadFromStorage();
    }
  }

  useEffect(() => {
    loadFromSupabase();
    window.addEventListener("storage", loadFromStorage);
    window.addEventListener("gilasos-theme-change", handleThemeChange);
    return () => {
      window.removeEventListener("storage", loadFromStorage);
      window.removeEventListener("gilasos-theme-change", handleThemeChange);
    };
  }, []);

  if (!theme) return null;

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
        opacity: 0.15,
      }}
    >
      <ThemeOverlay
        theme={theme}
        style={{ borderRadius: 0 }}
      />
    </div>
  );
}
