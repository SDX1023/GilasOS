"use client";

import { useState, useEffect } from "react";

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const WALLPAPER_TABS = ["Standard", "Themed", "Pastel"] as const;
type WallpaperTab = typeof WALLPAPER_TABS[number];

const wallpaperGroups: Record<WallpaperTab, { name: string; colors: string[] }[]> = {
  Standard: [
    { name: "Default Dark", colors: ["#0a0e18", "#1a1a2e"] },
    { name: "Midnight Blue", colors: ["#0f172a", "#1e3a5f"] },
    { name: "Purple Haze", colors: ["#1a0533", "#2d1b69"] },
    { name: "Ocean Deep", colors: ["#042f2e", "#0a3d3d"] },
    { name: "Sunset", colors: ["#1a0000", "#4a1a1a"] },
    { name: "Forest", colors: ["#0a1a0a", "#1a3a1a"] },
    { name: "Lavender", colors: ["#1a0a2e", "#3b1f6e"] },
    { name: "Rose", colors: ["#1a0a14", "#4a1a2e"] },
    { name: "Obsidian", colors: ["#080808", "#1a1a1a"] },
    { name: "Storm", colors: ["#0d1117", "#21262d"] },
    { name: "Arctic", colors: ["#0a1a2a", "#1a3a5a"] },
    { name: "Ember", colors: ["#1a0e05", "#3a2010"] },
    { name: "Mint", colors: ["#051a15", "#0a3a2e"] },
    { name: "Deep Sea", colors: ["#001020", "#002040"] },
    { name: "Golden Hour", colors: ["#1a1200", "#3a2800"] },
    { name: "Cherry Blossom", colors: ["#1a0a18", "#3a1a30"] },
  ],
  Themed: [
    { name: "Spiderman", colors: ["#1a0205", "#001040"] },
    { name: "Batman", colors: ["#0a0a0f", "#1a1a2a"] },
    { name: "Greek Myth", colors: ["#1a1205", "#2d1b05"] },
    { name: "Galaxy", colors: ["#05001a", "#1a003a"] },
    { name: "Neon Tokyo", colors: ["#0a0018", "#1a0035"] },
    { name: "Sahara", colors: ["#1a1005", "#3a2005"] },
    { name: "Nordic Frost", colors: ["#0a1525", "#1a2a3f"] },
    { name: "Volcanic", colors: ["#1a0505", "#3a0a05"] },
    { name: "Cherry Coke", colors: ["#1a000a", "#3a0018"] },
    { name: "Matrix", colors: ["#000a02", "#001a08"] },
    { name: "Steampunk", colors: ["#1a1008", "#2d1b0d"] },
    { name: "Cyberpunk 2077", colors: ["#0a0a05", "#1a1a05"] },
  ],
  Pastel: [
    { name: "Lilac Dream", colors: ["#1a1025", "#2d1a40"] },
    { name: "Peach Fuzz", colors: ["#1a1010", "#2d1a18"] },
    { name: "Seafoam", colors: ["#081a18", "#102d2a"] },
    { name: "Powder Blue", colors: ["#0a1018", "#152030"] },
    { name: "Blush", colors: ["#1a0f18", "#2d1a28"] },
    { name: "Sage", colors: ["#0f1a12", "#1a2d1c"] },
  ],
};

const accentColors = [
  { name: "Blue", color: "#2563eb", rgb: "37,99,235" },
  { name: "Purple", color: "#7c3aed", rgb: "124,58,237" },
  { name: "Violet", color: "#6d28d9", rgb: "109,40,217" },
  { name: "Indigo", color: "#4f46e5", rgb: "79,70,229" },
  { name: "Pink", color: "#ec4899", rgb: "236,72,153" },
  { name: "Rose", color: "#f43f5e", rgb: "244,63,94" },
  { name: "Red", color: "#ef4444", rgb: "239,68,68" },
  { name: "Orange", color: "#f97316", rgb: "249,115,22" },
  { name: "Amber", color: "#f59e0b", rgb: "245,158,11" },
  { name: "Yellow", color: "#eab308", rgb: "234,179,8" },
  { name: "Lime", color: "#84cc16", rgb: "132,204,22" },
  { name: "Green", color: "#10b981", rgb: "16,185,129" },
  { name: "Emerald", color: "#059669", rgb: "5,150,105" },
  { name: "Teal", color: "#14b8a6", rgb: "20,184,166" },
  { name: "Cyan", color: "#06b6d4", rgb: "6,182,212" },
  { name: "Sky", color: "#0ea5e9", rgb: "14,165,233" },
  { name: "Fuchsia", color: "#d946ef", rgb: "217,70,239" },
  { name: "Coral", color: "#fb7185", rgb: "251,113,133" },
  { name: "Peach", color: "#fb923c", rgb: "251,146,60" },
  { name: "Gold", color: "#fbbf24", rgb: "251,191,36" },
];

const defaultWallpaper = ["#0a0e18", "#1a1a2e"];
const defaultAccent = { color: "#2563eb", rgb: "37,99,235" };

function getAllWallpapers(): { name: string; colors: string[] }[] {
  return Object.values(wallpaperGroups).flat();
}

export default function CustomizationPanel({ isOpen, onClose }: CustomizationPanelProps) {
  const [selectedWallpaper, setSelectedWallpaper] = useState<number>(0);
  const [selectedAccent, setSelectedAccent] = useState<number>(0);
  const [wallpaperTab, setWallpaperTab] = useState<WallpaperTab>("Standard");
  const [saved, setSaved] = useState(false);

  const allWallpapers = getAllWallpapers();
  const currentGroup = wallpaperGroups[wallpaperTab];

  useEffect(() => {
    const savedWallpaper = localStorage.getItem("gilasos-wallpaper");
    if (savedWallpaper) {
      const index = allWallpapers.findIndex((w) => w.colors[0] === savedWallpaper);
      if (index !== -1) setSelectedWallpaper(index);
    }

    const savedAccent = localStorage.getItem("gilasos-accent");
    if (savedAccent) {
      const index = accentColors.findIndex((a) => a.color === savedAccent);
      if (index !== -1) setSelectedAccent(index);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    document.documentElement.style.setProperty(
      "--os-bg-primary",
      `linear-gradient(135deg, ${allWallpapers[selectedWallpaper].colors[0]}, ${allWallpapers[selectedWallpaper].colors[1]})`
    );
    document.documentElement.style.setProperty("--os-accent", accentColors[selectedAccent].color);
    document.documentElement.style.setProperty("--os-accent-rgb", accentColors[selectedAccent].rgb);
  }, [selectedWallpaper, selectedAccent, isOpen]);

  function getGlobalIndex(groupIndex: number): number {
    let offset = 0;
    for (const tab of WALLPAPER_TABS) {
      if (tab === wallpaperTab) return offset + groupIndex;
      offset += wallpaperGroups[tab].length;
    }
    return offset + groupIndex;
  }

  const handleSave = () => {
    localStorage.setItem("gilasos-wallpaper", allWallpapers[selectedWallpaper].colors[0]);
    localStorage.setItem("gilasos-accent", accentColors[selectedAccent].color);
    setSaved(true);
    setTimeout(() => { onClose(); setSaved(false); }, 600);
  };

  const handleReset = () => {
    setSelectedWallpaper(0);
    setSelectedAccent(0);
    localStorage.removeItem("gilasos-wallpaper");
    localStorage.removeItem("gilasos-accent");
    document.documentElement.style.setProperty("--os-bg-primary", `linear-gradient(135deg, ${defaultWallpaper[0]}, ${defaultWallpaper[1]})`);
    document.documentElement.style.setProperty("--os-accent", defaultAccent.color);
    document.documentElement.style.setProperty("--os-accent-rgb", defaultAccent.rgb);
    setSaved(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "5vh", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative", width: "480px", maxHeight: "92vh", display: "flex", flexDirection: "column",
          background: "var(--os-glass-bg)", border: "1px solid var(--os-glass-border)", borderRadius: "16px",
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)", color: "var(--os-text-primary)", fontFamily: "var(--os-font-body)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0", flexShrink: 0 }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, fontFamily: "var(--os-font-heading)" }}>Customize Appearance</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--os-text-secondary)", cursor: "pointer", fontSize: "18px", padding: "4px", lineHeight: 1 }}>✕</button>
        </div>

        {/* Wallpaper Tabs — fixed, not scrollable */}
        <div style={{ display: "flex", gap: "3px", margin: "12px 20px 0", background: "rgba(255,255,255,0.04)", borderRadius: "8px", padding: "3px", flexShrink: 0 }}>
          {WALLPAPER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setWallpaperTab(tab)}
              style={{
                flex: 1, padding: "7px 0", borderRadius: "6px", border: "none", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                background: wallpaperTab === tab ? "var(--os-accent)" : "transparent",
                color: wallpaperTab === tab ? "#fff" : "var(--os-text-dim)",
                transition: "all 0.15s", fontFamily: "var(--os-font-body)",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scrollable */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "12px 20px 0" }}>

          {/* Wallpaper Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px", marginBottom: "20px" }}>
            {currentGroup.map((wp, i) => {
              const globalIdx = getGlobalIndex(i);
              const isSelected = selectedWallpaper === globalIdx;
              return (
                <button
                  key={wp.name}
                  onClick={() => setSelectedWallpaper(globalIdx)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                    background: isSelected ? "rgba(255,255,255,0.06)" : "none", border: "none", cursor: "pointer",
                    padding: "4px", borderRadius: "6px", transition: "background 0.15s",
                  }}
                >
                  <div style={{
                    width: "100%", aspectRatio: "1.3", borderRadius: "6px",
                    background: `linear-gradient(135deg, ${wp.colors[0]}, ${wp.colors[1]})`,
                    border: isSelected ? "2px solid var(--os-accent)" : "2px solid rgba(255,255,255,0.08)",
                    boxShadow: isSelected ? `0 0 8px var(--os-accent-rgb)` : "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                  }} />
                  <span style={{
                    fontSize: "8px", lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%",
                    color: isSelected ? "var(--os-text-primary)" : "var(--os-text-dim)",
                  }}>{wp.name}</span>
                </button>
              );
            })}
          </div>

          {/* Accent Colors */}
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Accent Color
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", justifyContent: "center" }}>
              {accentColors.map((ac, i) => (
                <button
                  key={ac.name}
                  onClick={() => setSelectedAccent(i)}
                  title={ac.name}
                  style={{
                    width: "28px", height: "28px", borderRadius: "50%", background: ac.color, padding: 0, cursor: "pointer",
                    border: selectedAccent === i ? "2.5px solid var(--os-text-primary)" : "2.5px solid transparent",
                    boxShadow: selectedAccent === i ? `0 0 0 2px ${ac.color}50` : "none",
                    transition: "transform 0.12s, box-shadow 0.12s", flexShrink: 0,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
                />
              ))}
            </div>
            <p style={{ fontSize: "10px", color: "var(--os-text-dim)", marginTop: "6px", textAlign: "center" }}>{accentColors[selectedAccent].name}</p>
          </div>
        </div>

        {/* Sticky Footer */}
        <div style={{ display: "flex", gap: "8px", padding: "12px 20px 16px", borderTop: "1px solid var(--os-glass-border)", flexShrink: 0, background: "var(--os-glass-bg)" }}>
          <button
            onClick={handleReset}
            style={{
              flex: 1, padding: "9px", borderRadius: "8px", background: "rgba(255,255,255,0.06)", border: "1px solid var(--os-glass-border)",
              color: "var(--os-text-secondary)", fontSize: "12px", fontWeight: 500, cursor: "pointer", fontFamily: "var(--os-font-body)",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "var(--os-text-primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "var(--os-text-secondary)"; }}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2, padding: "9px", borderRadius: "8px", background: saved ? "#22c55e" : "var(--os-accent)", border: "none",
              color: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", fontFamily: "var(--os-font-body)",
              boxShadow: saved ? "0 4px 12px rgba(34,197,94,0.3)" : "0 4px 12px rgba(var(--os-accent-rgb), 0.3)",
              transition: "background 0.2s, transform 0.1s",
            }}
            onMouseDown={(e) => { e.currentTarget.style.transform = "scale(0.97)"; }}
            onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
          >
            {saved ? "✓ Saved!" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
