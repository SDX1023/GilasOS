"use client";

import { useState, useEffect } from "react";

interface CustomizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const wallpapers = [
  { name: "Default Dark", colors: ["#0a0e18", "#1a1a2e"] },
  { name: "Midnight Blue", colors: ["#0f172a", "#1e3a5f"] },
  { name: "Purple Haze", colors: ["#1a0533", "#2d1b69"] },
  { name: "Ocean Deep", colors: ["#042f2e", "#0a3d3d"] },
  { name: "Sunset", colors: ["#1a0000", "#4a1a1a"] },
  { name: "Forest", colors: ["#0a1a0a", "#1a3a1a"] },
  { name: "Lavender", colors: ["#1a0a2e", "#3b1f6e"] },
  { name: "Rose", colors: ["#1a0a14", "#4a1a2e"] },
  { name: "Cyberpunk", colors: ["#0a0a1a", "#1a0a3a"] },
  { name: "Arctic", colors: ["#0a1a2a", "#1a3a5a"] },
  { name: "Ember", colors: ["#1a0e05", "#3a2010"] },
  { name: "Mint", colors: ["#051a15", "#0a3a2e"] },
  { name: "Obsidian", colors: ["#080808", "#1a1a1a"] },
  { name: "Storm", colors: ["#0d1117", "#21262d"] },
  { name: "Neon Night", colors: ["#0a001a", "#1a0040"] },
  { name: "Blood Moon", colors: ["#1a0505", "#3a0a0a"] },
  { name: "Deep Sea", colors: ["#001020", "#002040"] },
  { name: "Golden Hour", colors: ["#1a1200", "#3a2800"] },
  { name: "Cherry Blossom", colors: ["#1a0a18", "#3a1a30"] },
  { name: "Toxic", colors: ["#0a1a00", "#1a3a00"] },
];

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

export default function CustomizationPanel({ isOpen, onClose }: CustomizationPanelProps) {
  const [selectedWallpaper, setSelectedWallpaper] = useState<number>(0);
  const [selectedAccent, setSelectedAccent] = useState<number>(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedWallpaper = localStorage.getItem("gilasos-wallpaper");
    if (savedWallpaper) {
      const index = wallpapers.findIndex((w) => w.colors[0] === savedWallpaper);
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

    const applyWallpaper = (colors: string[]) => {
      const gradient = `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`;
      document.documentElement.style.setProperty("--os-bg-primary", gradient);
    };

    const applyAccent = (color: string, rgb: string) => {
      document.documentElement.style.setProperty("--os-accent", color);
      document.documentElement.style.setProperty("--os-accent-rgb", rgb);
    };

    applyWallpaper(wallpapers[selectedWallpaper].colors);
    applyAccent(accentColors[selectedAccent].color, accentColors[selectedAccent].rgb);
  }, [selectedWallpaper, selectedAccent, isOpen]);

  const handleSelectWallpaper = (index: number) => {
    setSelectedWallpaper(index);
    setSaved(false);
  };

  const handleSelectAccent = (index: number) => {
    setSelectedAccent(index);
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem("gilasos-wallpaper", wallpapers[selectedWallpaper].colors[0]);
    localStorage.setItem("gilasos-accent", accentColors[selectedAccent].color);
    setSaved(true);
    setTimeout(() => {
      onClose();
      setSaved(false);
    }, 600);
  };

  const handleReset = () => {
    setSelectedWallpaper(0);
    setSelectedAccent(0);
    localStorage.removeItem("gilasos-wallpaper");
    localStorage.removeItem("gilasos-accent");
    document.documentElement.style.setProperty(
      "--os-bg-primary",
      `linear-gradient(135deg, ${defaultWallpaper[0]}, ${defaultWallpaper[1]})`
    );
    document.documentElement.style.setProperty("--os-accent", defaultAccent.color);
    document.documentElement.style.setProperty("--os-accent-rgb", defaultAccent.rgb);
    setSaved(false);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "460px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          background: "var(--os-glass-bg)",
          border: "1px solid var(--os-glass-border)",
          borderRadius: "16px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          color: "var(--os-text-primary)",
          fontFamily: "var(--os-font-body)",
          overflow: "hidden",
        }}
      >
        {/* Sticky Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
            flexShrink: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              fontFamily: "var(--os-font-heading)",
              color: "var(--os-text-primary)",
            }}
          >
            Customize Appearance
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "var(--os-text-secondary)",
              cursor: "pointer",
              fontSize: "20px",
              padding: "4px",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "0 24px",
          }}
        >
          {/* Wallpaper Section */}
          <div style={{ marginBottom: "24px" }}>
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--os-text-dim)",
                fontFamily: "var(--os-font-heading)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Wallpaper
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px" }}>
              {wallpapers.map((wp, index) => (
                <button
                  key={wp.name}
                  onClick={() => handleSelectWallpaper(index)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "8px",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "1",
                      borderRadius: "8px",
                      background: `linear-gradient(135deg, ${wp.colors[0]}, ${wp.colors[1]})`,
                      border: selectedWallpaper === index ? "2px solid var(--os-accent)" : "2px solid var(--os-glass-border)",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                      boxShadow: selectedWallpaper === index ? `0 0 8px var(--os-accent-rgb)` : "none",
                    }}
                  />
                  <span
                    style={{
                      fontSize: "9px",
                      color: selectedWallpaper === index ? "var(--os-text-primary)" : "var(--os-text-dim)",
                      fontFamily: "var(--os-font-body)",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      maxWidth: "100%",
                    }}
                  >
                    {wp.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color Section */}
          <div style={{ marginBottom: "20px" }}>
            <h3
              style={{
                margin: "0 0 10px",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--os-text-dim)",
                fontFamily: "var(--os-font-heading)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Accent Color
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", justifyContent: "center" }}>
              {accentColors.map((ac, index) => (
                <button
                  key={ac.name}
                  onClick={() => handleSelectAccent(index)}
                  title={ac.name}
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: ac.color,
                    border: selectedAccent === index ? "3px solid var(--os-text-primary)" : "3px solid transparent",
                    cursor: "pointer",
                    transition: "transform 0.15s, box-shadow 0.15s",
                    boxShadow: selectedAccent === index ? `0 0 0 2px ${ac.color}50` : "none",
                    padding: 0,
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                />
              ))}
            </div>
            <p style={{ fontSize: "11px", color: "var(--os-text-dim)", marginTop: "8px", textAlign: "center" }}>
              {accentColors[selectedAccent].name}
            </p>
          </div>
        </div>

        {/* Sticky Footer Buttons */}
        <div
          style={{
            display: "flex",
            gap: "8px",
            padding: "16px 24px 20px",
            borderTop: "1px solid var(--os-glass-border)",
            flexShrink: 0,
            background: "var(--os-glass-bg)",
          }}
        >
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "10px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--os-glass-border)",
              color: "var(--os-text-secondary)",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "var(--os-font-body)",
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.1)";
              e.currentTarget.style.color = "var(--os-text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.06)";
              e.currentTarget.style.color = "var(--os-text-secondary)";
            }}
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 2,
              padding: "10px",
              borderRadius: "10px",
              background: saved ? "#22c55e" : "var(--os-accent)",
              border: "none",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "var(--os-font-body)",
              cursor: "pointer",
              transition: "background 0.2s, transform 0.1s",
              boxShadow: saved ? "0 4px 16px rgba(34,197,94,0.3)" : "0 4px 16px rgba(var(--os-accent-rgb), 0.3)",
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
