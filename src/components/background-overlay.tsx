"use client";

import { useState, useEffect } from "react";
import ThemeOverlay from "./theme-overlay";

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

export default function BackgroundOverlay() {
  const [theme, setTheme] = useState<string | null>(null);

  function checkTheme() {
    const saved = localStorage.getItem("gilasos-wallpaper");
    if (saved && colorToTheme[saved]) {
      setTheme(colorToTheme[saved]);
    } else {
      setTheme(null);
    }
  }

  useEffect(() => {
    checkTheme();
    window.addEventListener("storage", checkTheme);
    window.addEventListener("gilasos-theme-change", checkTheme);
    return () => {
      window.removeEventListener("storage", checkTheme);
      window.removeEventListener("gilasos-theme-change", checkTheme);
    };
  }, []);

  if (!theme) return null;

  return (
    <div
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
