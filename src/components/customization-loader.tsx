"use client";

import { useEffect } from "react";

const wallpapers: Record<string, string[]> = {
  "#0a0e18": ["#0a0e18", "#1a1a2e"],
  "#0f172a": ["#0f172a", "#1e3a5f"],
  "#1a0533": ["#1a0533", "#2d1b69"],
  "#042f2e": ["#042f2e", "#0a3d3d"],
  "#1a0000": ["#1a0000", "#4a1a1a"],
  "#0a1a0a": ["#0a1a0a", "#1a3a1a"],
  "#1a0a2e": ["#1a0a2e", "#3b1f6e"],
  "#1a0a14": ["#1a0a14", "#4a1a2e"],
  "#080808": ["#080808", "#1a1a1a"],
  "#0d1117": ["#0d1117", "#21262d"],
  "#0a1a2a": ["#0a1a2a", "#1a3a5a"],
  "#1a0e05": ["#1a0e05", "#3a2010"],
  "#051a15": ["#051a15", "#0a3a2e"],
  "#001020": ["#001020", "#002040"],
  "#1a1200": ["#1a1200", "#3a2800"],
  "#1a0a18": ["#1a0a18", "#3a1a30"],
  "#1a0205": ["#1a0205", "#001040"],
  "#0a0a0f": ["#0a0a0f", "#1a1a2a"],
  "#1a1205": ["#1a1205", "#2d1b05"],
  "#05001a": ["#05001a", "#1a003a"],
  "#0a0018": ["#0a0018", "#1a0035"],
  "#1a1005": ["#1a1005", "#3a2005"],
  "#0a1525": ["#0a1525", "#1a2a3f"],
  "#1a0505": ["#1a0505", "#3a0a05"],
  "#1a000a": ["#1a000a", "#3a0018"],
  "#000a02": ["#000a02", "#001a08"],
  "#1a1008": ["#1a1008", "#2d1b0d"],
  "#0a0a05": ["#0a0a05", "#1a1a05"],
  "#1a1025": ["#1a1025", "#2d1a40"],
  "#1a1010": ["#1a1010", "#2d1a18"],
  "#081a18": ["#081a18", "#102d2a"],
  "#0a1018": ["#0a1018", "#152030"],
  "#1a0f18": ["#1a0f18", "#2d1a28"],
  "#0f1a12": ["#0f1a12", "#1a2d1c"],
};

const accents: Record<string, string> = {
  "#2563eb": "37,99,235", "#7c3aed": "124,58,237", "#6d28d9": "109,40,217",
  "#4f46e5": "79,70,229", "#ec4899": "236,72,153", "#f43f5e": "244,63,94",
  "#ef4444": "239,68,68", "#f97316": "249,115,22", "#f59e0b": "245,158,11",
  "#eab308": "234,179,8", "#84cc16": "132,204,22", "#10b981": "16,185,129",
  "#059669": "5,150,105", "#14b8a6": "20,184,166", "#06b6d4": "6,182,212",
  "#0ea5e9": "14,165,233", "#d946ef": "217,70,239", "#fb7185": "251,113,133",
  "#fb923c": "251,146,60", "#fbbf24": "251,191,36",
};

export default function CustomizationLoader() {
  useEffect(() => {
    const savedWallpaper = localStorage.getItem("gilasos-wallpaper");
    const savedAccent = localStorage.getItem("gilasos-accent");

    if (savedWallpaper && wallpapers[savedWallpaper]) {
      const colors = wallpapers[savedWallpaper];
      document.documentElement.style.setProperty("--os-bg-primary", `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`);
    }

    if (savedAccent && accents[savedAccent]) {
      document.documentElement.style.setProperty("--os-accent", savedAccent);
      document.documentElement.style.setProperty("--os-accent-rgb", accents[savedAccent]);
    }
  }, []);

  return null;
}
