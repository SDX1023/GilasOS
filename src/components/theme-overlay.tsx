"use client";

import React from "react";

interface ThemeOverlayProps {
  theme: string;
  style?: React.CSSProperties;
}

export default function ThemeOverlay({ theme, style }: ThemeOverlayProps) {
  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
    borderRadius: "inherit",
    ...style,
  };

  switch (theme) {
    case "Spiderman":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
            <defs>
              <pattern id="web" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="18" fill="none" stroke="#ff4444" strokeWidth="0.5" />
                <circle cx="20" cy="20" r="12" fill="none" stroke="#ff4444" strokeWidth="0.3" />
                <circle cx="20" cy="20" r="6" fill="none" stroke="#ff4444" strokeWidth="0.3" />
                <line x1="20" y1="2" x2="20" y2="38" stroke="#ff4444" strokeWidth="0.3" />
                <line x1="2" y1="20" x2="38" y2="20" stroke="#ff4444" strokeWidth="0.3" />
                <line x1="5" y1="5" x2="35" y2="35" stroke="#ff4444" strokeWidth="0.2" />
                <line x1="35" y1="5" x2="5" y2="35" stroke="#ff4444" strokeWidth="0.2" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#web)" />
          </svg>
          <div style={{ position: "absolute", bottom: "8%", right: "8%", fontSize: "28px", opacity: 0.12, filter: "drop-shadow(0 0 8px #ff4444)" }}>🕷️</div>
        </div>
      );

    case "Batman":
      return (
        <div style={base}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
            <path d="M50 15 C45 15 35 25 30 35 C25 25 15 20 10 25 C15 35 20 40 25 45 C20 50 15 60 20 70 C25 65 35 55 50 50 C65 55 75 65 80 70 C85 60 80 50 75 45 C80 40 85 35 90 25 C85 20 75 25 70 35 C65 25 55 15 50 15Z" fill="#a0a0a0" />
          </svg>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", background: "radial-gradient(ellipse at 50% 0%, rgba(100,100,120,0.08), transparent 70%)" }} />
        </div>
      );

    case "Greek Myth":
      return (
        <div style={base}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
            {/* Columns */}
            <rect x="10" y="30" width="4" height="60" rx="1" fill="#d4a847" />
            <rect x="25" y="30" width="4" height="60" rx="1" fill="#d4a847" />
            <rect x="70" y="30" width="4" height="60" rx="1" fill="#d4a847" />
            <rect x="85" y="30" width="4" height="60" rx="1" fill="#d4a847" />
            {/* Pediment */}
            <polygon points="5,30 50,8 95,30" fill="none" stroke="#d4a847" strokeWidth="1.5" />
            <rect x="5" y="28" width="90" height="4" rx="1" fill="#d4a847" />
          </svg>
          {/* Laurel wreath */}
          <svg width="30" height="30" viewBox="0 0 30 30" style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", opacity: 0.08 }}>
            <path d="M15 5 C10 5 5 10 5 15 C5 22 10 27 15 27" fill="none" stroke="#d4a847" strokeWidth="1.5" />
            <path d="M15 5 C20 5 25 10 25 15 C25 22 20 27 15 27" fill="none" stroke="#d4a847" strokeWidth="1.5" />
            <circle cx="12" cy="8" r="1.5" fill="#d4a847" /><circle cx="8" cy="12" r="1.5" fill="#d4a847" />
            <circle cx="8" cy="18" r="1.5" fill="#d4a847" /><circle cx="12" cy="22" r="1.5" fill="#d4a847" />
            <circle cx="18" cy="8" r="1.5" fill="#d4a847" /><circle cx="22" cy="12" r="1.5" fill="#d4a847" />
            <circle cx="22" cy="18" r="1.5" fill="#d4a847" /><circle cx="18" cy="22" r="1.5" fill="#d4a847" />
          </svg>
        </div>
      );

    case "Galaxy":
      return (
        <div style={base}>
          {/* Stars */}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
            {Array.from({ length: 40 }, (_, i) => (
              <circle key={i} cx={`${Math.random() * 100}%`} cy={`${Math.random() * 100}%`} r={Math.random() * 1.2 + 0.3} fill="white" opacity={Math.random() * 0.7 + 0.3} />
            ))}
          </svg>
          {/* Nebula */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 40%, rgba(120,60,200,0.12), transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(60,100,200,0.1), transparent 50%)" }} />
        </div>
      );

    case "Neon Tokyo":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
            {/* Grid lines */}
            {Array.from({ length: 8 }, (_, i) => (
              <line key={`h${i}`} x1="0" y1={`${(i + 1) * 12}%`} x2="100%" y2={`${(i + 1) * 12}%`} stroke="#ff00ff" strokeWidth="0.3" />
            ))}
            {Array.from({ length: 6 }, (_, i) => (
              <line key={`v${i}`} x1={`${(i + 1) * 16}%`} y1="0" x2={`${(i + 1) * 16}%`} y2="100%" stroke="#00ffff" strokeWidth="0.3" />
            ))}
          </svg>
          <div style={{ position: "absolute", bottom: "15%", left: "10%", fontSize: "10px", color: "#ff00ff", opacity: 0.2, fontFamily: "monospace", letterSpacing: "2px", textShadow: "0 0 6px #ff00ff" }}>東京</div>
          <div style={{ position: "absolute", top: "20%", right: "12%", fontSize: "10px", color: "#00ffff", opacity: 0.15, fontFamily: "monospace", letterSpacing: "2px", textShadow: "0 0 6px #00ffff" }}>ネオン</div>
        </div>
      );

    case "Sahara":
      return (
        <div style={base}>
          <svg width="100%" height="100%" viewBox="0 0 100 60" style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.1 }}>
            <path d="M0 60 Q15 30 30 45 Q45 20 60 40 Q75 15 90 35 Q100 25 100 60Z" fill="#d4a040" />
          </svg>
          <div style={{ position: "absolute", top: "15%", right: "15%", width: "20px", height: "20px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,200,80,0.2), transparent 70%)" }} />
        </div>
      );

    case "Nordic Frost":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
            {/* Snowflakes */}
            {["M10,10 L10,30 M5,15 L15,25 M15,15 L5,25", "M30,5 L30,25 M25,10 L35,20 M35,10 L25,20", "M50,8 L50,28 M45,13 L55,23 M55,13 L45,23", "M70,12 L70,32 M65,17 L75,27 M75,17 L65,27", "M88,6 L88,26 M83,11 L93,21 M93,11 L83,21"].map((d, i) => (
              <path key={i} d={d} stroke="#a0d0ff" strokeWidth="0.8" fill="none" />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(160,200,255,0.06), transparent 60%)" }} />
        </div>
      );

    case "Volcanic":
      return (
        <div style={base}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(0deg, rgba(255,60,20,0.1), transparent)" }} />
          <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
            <circle cx="50" cy="85" r="30" fill="none" stroke="#ff4420" strokeWidth="0.5" />
            <circle cx="50" cy="85" r="20" fill="none" stroke="#ff6640" strokeWidth="0.3" />
          </svg>
          {/* Ember particles */}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <circle key={i} cx={`${20 + Math.random() * 60}%`} cy={`${50 + Math.random() * 40}%`} r={Math.random() * 1.5 + 0.5} fill="#ff6633" opacity={Math.random() * 0.6 + 0.2} />
            ))}
          </svg>
        </div>
      );

    case "Cherry Coke":
      return (
        <div style={base}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 80%, rgba(200,20,60,0.1), transparent 60%)" }} />
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.06 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <circle key={i} cx={`${Math.random() * 100}%`} cy={`${60 + Math.random() * 35}%`} r={Math.random() * 3 + 1} fill="none" stroke="#ff3060" strokeWidth="0.4" />
            ))}
          </svg>
        </div>
      );

    case "Matrix":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <text key={i} x={`${8 + i * 8}%`} y={`${10 + Math.random() * 80}%`} fill="#00ff41" fontSize="8" fontFamily="monospace" opacity={Math.random() * 0.5 + 0.3}>
                {String.fromCharCode(0x30A0 + Math.floor(Math.random() * 96))}
              </text>
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,255,65,0.03), transparent 30%, transparent 70%, rgba(0,255,65,0.05))" }} />
        </div>
      );

    case "Steampunk":
      return (
        <div style={base}>
          <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
            {/* Gears */}
            <circle cx="20" cy="20" r="12" fill="none" stroke="#b8860b" strokeWidth="1" />
            <circle cx="20" cy="20" r="8" fill="none" stroke="#b8860b" strokeWidth="0.5" />
            <circle cx="20" cy="20" r="3" fill="#b8860b" />
            <circle cx="75" cy="70" r="15" fill="none" stroke="#b8860b" strokeWidth="1" />
            <circle cx="75" cy="70" r="10" fill="none" stroke="#b8860b" strokeWidth="0.5" />
            <circle cx="75" cy="70" r="4" fill="#b8860b" />
            <circle cx="55" cy="35" r="8" fill="none" stroke="#b8860b" strokeWidth="0.7" />
            <circle cx="55" cy="35" r="5" fill="none" stroke="#b8860b" strokeWidth="0.4" />
            <circle cx="55" cy="35" r="2" fill="#b8860b" />
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 20%, rgba(184,134,11,0.06), transparent 40%), radial-gradient(ellipse at 75% 70%, rgba(184,134,11,0.06), transparent 40%)" }} />
        </div>
      );

    case "Cyberpunk 2077":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
            {/* Diagonal lines */}
            <line x1="0" y1="100%" x2="100%" y2="0" stroke="#fcee09" strokeWidth="0.5" />
            <line x1="10%" y1="100%" x2="100%" y2="10%" stroke="#fcee09" strokeWidth="0.3" />
            <line x1="0" y1="90%" x2="90%" y2="0" stroke="#fcee09" strokeWidth="0.3" />
          </svg>
          <div style={{ position: "absolute", top: "10%", left: "8%", fontSize: "9px", color: "#fcee09", opacity: 0.2, fontFamily: "monospace", fontWeight: 700, letterSpacing: "3px", textShadow: "0 0 8px #fcee09" }}>2077</div>
          <div style={{ position: "absolute", bottom: "12%", right: "8%", fontSize: "8px", color: "#ff003c", opacity: 0.15, fontFamily: "monospace", fontWeight: 700, letterSpacing: "2px", textShadow: "0 0 6px #ff003c" }}>NC</div>
        </div>
      );

    case "Detroit: BH":
      return (
        <div style={base}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%, rgba(0,150,255,0.12), transparent 50%)" }} />
          <svg width="100%" height="100%" viewBox="0 0 100 100" style={{ position: "absolute", inset: 0, opacity: 0.14 }}>
            <circle cx="50" cy="30" r="6" fill="none" stroke="#00aaff" strokeWidth="1.5" />
            <circle cx="50" cy="30" r="3" fill="#00aaff" opacity="0.6" />
            <line x1="50" y1="36" x2="50" y2="65" stroke="#00aaff" strokeWidth="0.5" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="#00aaff" strokeWidth="0.4" />
            <circle cx="50" cy="50" r="25" fill="none" stroke="#00aaff" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="15" fill="none" stroke="#00aaff" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="5" fill="none" stroke="#00aaff" strokeWidth="0.2" />
          </svg>
          <div style={{ position: "absolute", bottom: "10%", left: "50%", transform: "translateX(-50%)", fontSize: "7px", color: "#00aaff", opacity: 0.2, fontFamily: "monospace", letterSpacing: "4px", textTransform: "uppercase", textShadow: "0 0 8px #00aaff", whiteSpace: "nowrap" }}>Become Human</div>
        </div>
      );

    default:
      return null;
  }
}
