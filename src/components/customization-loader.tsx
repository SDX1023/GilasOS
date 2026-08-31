"use client";

import { useEffect } from "react";

const wallpapers: Record<string, string[]> = {
  "#0a0e18": ["#0a0e18", "#1a1a2e"],
  "#0f172a": ["#0f172a", "#1e3a5f"],
  "#1a0533": ["#1a0533", "#2d1b69"],
  "#042f2e": ["#042f2e", "#0a3d3d"],
  "#1a0000": ["#1a0000", "#4a1a1a"],
  "#0a1a0a": ["#0a1a0a", "#1a3a1a"],
};

const accents: Record<string, string> = {
  "#2563eb": "37,99,235",
  "#7c3aed": "124,58,237",
  "#6d28d9": "109,40,217",
  "#ec4899": "236,72,153",
  "#ef4444": "239,68,68",
  "#f97316": "249,115,22",
  "#10b981": "16,185,129",
  "#06b6d4": "6,182,212",
};

export default function CustomizationLoader() {
  useEffect(() => {
    const savedWallpaper = localStorage.getItem("gilasos-wallpaper");
    const savedAccent = localStorage.getItem("gilasos-accent");

    if (savedWallpaper && wallpapers[savedWallpaper]) {
      const colors = wallpapers[savedWallpaper];
      document.documentElement.style.setProperty(
        "--os-bg-primary",
        `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
      );
    }

    if (savedAccent && accents[savedAccent]) {
      document.documentElement.style.setProperty("--os-accent", savedAccent);
      document.documentElement.style.setProperty("--os-accent-rgb", accents[savedAccent]);
    }
  }, []);

  return null;
}
