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
];

const accentColors = [
  { name: "Blue", color: "#2563eb", rgb: "37,99,235" },
  { name: "Purple", color: "#7c3aed", rgb: "124,58,237" },
  { name: "Violet", color: "#6d28d9", rgb: "109,40,217" },
  { name: "Pink", color: "#ec4899", rgb: "236,72,153" },
  { name: "Red", color: "#ef4444", rgb: "239,68,68" },
  { name: "Orange", color: "#f97316", rgb: "249,115,22" },
  { name: "Green", color: "#10b981", rgb: "16,185,129" },
  { name: "Cyan", color: "#06b6d4", rgb: "6,182,212" },
];

const defaultWallpaper = ["#0a0e18", "#1a1a2e"];
const defaultAccent = { color: "#2563eb", rgb: "37,99,235" };

export default function CustomizationPanel({ isOpen, onClose }: CustomizationPanelProps) {
  const [selectedWallpaper, setSelectedWallpaper] = useState<number>(0);
  const [selectedAccent, setSelectedAccent] = useState<number>(0);

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
    localStorage.setItem("gilasos-wallpaper", wallpapers[index].colors[0]);
  };

  const handleSelectAccent = (index: number) => {
    setSelectedAccent(index);
    localStorage.setItem("gilasos-accent", accentColors[index].color);
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
          width: "420px",
          maxHeight: "80vh",
          overflowY: "auto",
          background: "var(--os-glass-bg)",
          border: "1px solid var(--os-glass-border)",
          borderRadius: "16px",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          padding: "24px",
          color: "var(--os-text-primary)",
          fontFamily: "var(--os-font-body)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "24px",
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

        {/* Wallpaper Section */}
        <div style={{ marginBottom: "28px" }}>
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--os-text-secondary)",
              fontFamily: "var(--os-font-heading)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Wallpaper
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
            {wallpapers.map((wp, index) => (
              <button
                key={wp.name}
                onClick={() => handleSelectWallpaper(index)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  borderRadius: "10px",
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
                    width: "60px",
                    height: "60px",
                    borderRadius: "10px",
                    background: `linear-gradient(135deg, ${wp.colors[0]}, ${wp.colors[1]})`,
                    border: selectedWallpaper === index ? "2px solid var(--os-accent)" : "2px solid var(--os-glass-border)",
                    transition: "border-color 0.2s",
                    boxShadow: selectedWallpaper === index ? "0 0 8px var(--os-accent-rgb)" : "none",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    color: selectedWallpaper === index ? "var(--os-text-primary)" : "var(--os-text-secondary)",
                    fontFamily: "var(--os-font-body)",
                  }}
                >
                  {wp.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color Section */}
        <div style={{ marginBottom: "28px" }}>
          <h3
            style={{
              margin: "0 0 12px",
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--os-text-secondary)",
              fontFamily: "var(--os-font-heading)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Accent Color
          </h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {accentColors.map((ac, index) => (
              <button
                key={ac.name}
                onClick={() => handleSelectAccent(index)}
                title={ac.name}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: ac.color,
                  border: selectedAccent === index ? "3px solid var(--os-text-primary)" : "3px solid transparent",
                  cursor: "pointer",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  boxShadow: selectedAccent === index ? `0 0 0 3px ${ac.color}40` : "none",
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              />
            ))}
          </div>
        </div>

        {/* Reset Section */}
        <div>
          <button
            onClick={handleReset}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
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
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
