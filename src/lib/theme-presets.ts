export interface ThemePreset {
  name: string;
  wallpaper: string; // primary color
  wallpaperColors: [string, string]; // gradient pair
  accent: string;
  accentRgb: string;
  icon: string;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    name: "Midnight",
    wallpaper: "#0a0e18",
    wallpaperColors: ["#0a0e18", "#0f172a"],
    accent: "#6d28d9",
    accentRgb: "109,40,217",
    icon: "🌙",
  },
  {
    name: "Ocean",
    wallpaper: "#0a1628",
    wallpaperColors: ["#0a1628", "#0c2d48"],
    accent: "#0ea5e9",
    accentRgb: "14,165,233",
    icon: "🌊",
  },
  {
    name: "Forest",
    wallpaper: "#0a1a0f",
    wallpaperColors: ["#0a1a0f", "#0f2918"],
    accent: "#22c55e",
    accentRgb: "34,197,94",
    icon: "🌲",
  },
  {
    name: "Sunset",
    wallpaper: "#1a0a0a",
    wallpaperColors: ["#1a0a0a", "#2d1010"],
    accent: "#f97316",
    accentRgb: "249,115,22",
    icon: "🌅",
  },
  {
    name: "Cherry Blossom",
    wallpaper: "#1a0f1a",
    wallpaperColors: ["#1a0f1a", "#2d1a2d"],
    accent: "#ec4899",
    accentRgb: "236,72,153",
    icon: "🌸",
  },
  {
    name: "Neon",
    wallpaper: "#0a0a14",
    wallpaperColors: ["#0a0a14", "#10102a"],
    accent: "#00d4ff",
    accentRgb: "0,212,255",
    icon: "⚡",
  },
  {
    name: "Lavender",
    wallpaper: "#12101e",
    wallpaperColors: ["#12101e", "#1e1a30"],
    accent: "#a78bfa",
    accentRgb: "167,139,250",
    icon: "💜",
  },
  {
    name: "Ember",
    wallpaper: "#1a0e0a",
    wallpaperColors: ["#1a0e0a", "#2d1a10"],
    accent: "#ef4444",
    accentRgb: "239,68,68",
    icon: "🔥",
  },
  {
    name: "Arctic",
    wallpaper: "#0e1420",
    wallpaperColors: ["#0e1420", "#162030"],
    accent: "#38bdf8",
    accentRgb: "56,189,248",
    icon: "❄️",
  },
  {
    name: "Gold",
    wallpaper: "#141208",
    wallpaperColors: ["#141208", "#201e0f"],
    accent: "#eab308",
    accentRgb: "234,179,8",
    icon: "✨",
  },
];
