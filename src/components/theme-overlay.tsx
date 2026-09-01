"use client";

import React from "react";

interface ThemeOverlayProps {
  theme: string;
}

export default function ThemeOverlay({ theme }: ThemeOverlayProps) {
  if (theme === "Spiderman") return <SpidermanOverlay />;
  if (theme === "Galaxy") return <GalaxyOverlay />;
  if (theme === "Resident Evil") return <ResidentEvilOverlay />;
  return null;
}

function SpidermanOverlay() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* NYC skyline at bottom */}
      <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0 }}>
        <rect x="40" y="420" width="55" height="380" fill="#0c0c18" />
        <rect x="48" y="430" width="8" height="10" fill="#ff4444" opacity="0.6" />
        <rect x="62" y="430" width="8" height="10" fill="#ffcc00" opacity="0.4" />
        <rect x="48" y="450" width="8" height="10" fill="#ffcc00" opacity="0.5" />
        <rect x="62" y="450" width="8" height="10" fill="#ff4444" opacity="0.3" />
        <rect x="120" y="350" width="75" height="450" fill="#0c0c18" />
        <rect x="130" y="360" width="10" height="12" fill="#ff4444" opacity="0.5" />
        <rect x="150" y="360" width="10" height="12" fill="#ffcc00" opacity="0.6" />
        <rect x="170" y="360" width="10" height="12" fill="#ff4444" opacity="0.35" />
        <rect x="130" y="385" width="10" height="12" fill="#ffcc00" opacity="0.4" />
        <rect x="150" y="385" width="10" height="12" fill="#ff4444" opacity="0.55" />
        <rect x="240" y="300" width="90" height="500" fill="#0c0c18" />
        <rect x="250" y="310" width="12" height="14" fill="#ffcc00" opacity="0.5" />
        <rect x="272" y="310" width="12" height="14" fill="#ff4444" opacity="0.4" />
        <rect x="294" y="310" width="12" height="14" fill="#ffcc00" opacity="0.6" />
        <rect x="360" y="400" width="65" height="400" fill="#0c0c18" />
        <rect x="450" y="340" width="85" height="460" fill="#0c0c18" />
        <rect x="560" y="460" width="60" height="340" fill="#0c0c18" />
        <rect x="650" y="380" width="80" height="420" fill="#0c0c18" />
        <rect x="760" y="310" width="100" height="490" fill="#0c0c18" />
        <rect x="890" y="410" width="70" height="390" fill="#0c0c18" />
        <rect x="990" y="360" width="90" height="440" fill="#0c0c18" />
        <rect x="1100" y="430" width="85" height="370" fill="#0c0c18" />
      </svg>

      {/* Web radiating from top center */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <g opacity="0.3">
          {/* Radial lines */}
          {[0, 18, 36, 54, 72, 90, 108, 126, 144, 162, 180].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const ex = 50 + Math.cos(rad) * 80;
            const ey = Math.sin(rad) * 80;
            return <line key={angle} x1="50%" y1="0" x2={`${ex}%`} y2={`${ey}%`} stroke="#ff2222" strokeWidth="0.6" />;
          })}
          {/* Connecting arcs */}
          {[80, 170, 280, 400, 540].map((r) => (
            <ellipse key={r} cx="50%" cy="0" rx={r} ry={r * 0.55} fill="none" stroke="#ff2222" strokeWidth="0.5" />
          ))}
        </g>
      </svg>

      {/* Hanging spider */}
      <svg width="28" height="55" viewBox="0 0 28 55" style={{ position: "absolute", top: "10%", left: "47%", opacity: 0.5 }}>
        <line x1="14" y1="0" x2="14" y2="18" stroke="#ff2222" strokeWidth="0.7" />
        <ellipse cx="14" cy="30" rx="5.5" ry="7" fill="#1a1a1a" />
        <circle cx="14" cy="21" r="3.5" fill="#1a1a1a" />
        <circle cx="12" cy="20" r="1" fill="#ff0000" />
        <circle cx="16" cy="20" r="1" fill="#ff0000" />
        <line x1="8.5" y1="26" x2="2" y2="20" stroke="#1a1a1a" strokeWidth="0.8" />
        <line x1="8.5" y1="28" x2="2" y2="28" stroke="#1a1a1a" strokeWidth="0.8" />
        <line x1="8.5" y1="31" x2="3" y2="38" stroke="#1a1a1a" strokeWidth="0.8" />
        <line x1="19.5" y1="26" x2="26" y2="20" stroke="#1a1a1a" strokeWidth="0.8" />
        <line x1="19.5" y1="28" x2="26" y2="28" stroke="#1a1a1a" strokeWidth="0.8" />
        <line x1="19.5" y1="31" x2="25" y2="38" stroke="#1a1a1a" strokeWidth="0.8" />
      </svg>

      {/* Red glow bottom */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(255,30,30,0.12), transparent 50%)" }} />
    </div>
  );
}

function GalaxyOverlay() {
  const stars = React.useMemo(() =>
    Array.from({ length: 250 }, (_, i) => ({
      x: (Math.sin(i * 127.1) * 0.5 + 0.5) * 100,
      y: (Math.sin(i * 311.7) * 0.5 + 0.5) * 100,
      r: i % 17 === 0 ? 2.2 : i % 11 === 0 ? 1.4 : i % 5 === 0 ? 0.9 : 0.4,
      o: (Math.sin(i * 73.3) * 0.5 + 0.5) * 0.7 + 0.2,
      twinkleDur: 2 + (i % 7) * 0.8,
      twinkleDelay: (i % 13) * 0.3,
      color: i % 23 === 0 ? "#a5b4fc" : i % 19 === 0 ? "#fde68a" : i % 17 === 0 ? "#c4b5fd" : "#ffffff",
    })), []);

  const clusters = React.useMemo(() => [
    { x: 25, y: 35, r: 60, stars: 12 },
    { x: 72, y: 60, r: 45, stars: 8 },
    { x: 50, y: 20, r: 30, stars: 6 },
  ], []);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <style>{`
        @keyframes twinkle { 0%,100% { opacity: var(--so); } 50% { opacity: 0.15; } }
        @keyframes shoot1 { 0% { transform: translate(0,0) scaleX(1); opacity: 0; } 5% { opacity: 1; } 15% { opacity: 1; } 20% { transform: translate(120px,80px) scaleX(0.3); opacity: 0; } 100% { opacity: 0; } }
        @keyframes shoot2 { 0% { transform: translate(0,0) scaleX(1); opacity: 0; } 8% { opacity: 0.8; } 18% { opacity: 0.8; } 25% { transform: translate(100px,60px) scaleX(0.2); opacity: 0; } 100% { opacity: 0; } }
        @keyframes nebulaDrift { 0%,100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.05) rotate(2deg); } }
        @keyframes dustFloat { 0%,100% { opacity: 0.12; transform: translateX(0); } 50% { opacity: 0.18; transform: translateX(15px); } }
        @keyframes corePulse { 0%,100% { opacity: 0.35; } 50% { opacity: 0.5; } }
      `}</style>

      {/* Deep space base gradient */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, #0a0025 0%, #050014 40%, #020008 100%)" }} />

      {/* Galaxy core glow */}
      <div style={{ position: "absolute", left: "35%", top: "30%", width: "30%", height: "40%", background: "radial-gradient(ellipse, rgba(180,120,255,0.25), rgba(100,60,200,0.1) 40%, transparent 70%)", animation: "corePulse 8s ease-in-out infinite" }} />

      {/* Spiral arm 1 */}
      <div style={{ position: "absolute", inset: 0, background: "conic-gradient(from 30deg at 45% 45%, transparent 0deg, rgba(120,80,220,0.12) 30deg, rgba(80,140,255,0.08) 90deg, transparent 150deg, rgba(180,100,240,0.1) 210deg, transparent 270deg, rgba(100,160,255,0.06) 330deg, transparent 360deg)", animation: "nebulaDrift 20s ease-in-out infinite" }} />

      {/* Spiral arm 2 */}
      <div style={{ position: "absolute", inset: 0, background: "conic-gradient(from 210deg at 55% 55%, transparent 0deg, rgba(200,80,180,0.1) 40deg, rgba(100,60,200,0.07) 100deg, transparent 160deg, rgba(160,100,255,0.08) 220deg, transparent 280deg, rgba(80,140,220,0.05) 340deg, transparent 360deg)", animation: "nebulaDrift 25s ease-in-out infinite reverse" }} />

      {/* Nebula clouds */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 30%, rgba(100,40,180,0.22), transparent 40%), radial-gradient(ellipse at 70% 50%, rgba(40,80,200,0.18), transparent 35%), radial-gradient(ellipse at 50% 80%, rgba(180,40,160,0.12), transparent 30%), radial-gradient(ellipse at 80% 25%, rgba(60,120,220,0.15), transparent 30%), radial-gradient(ellipse at 20% 70%, rgba(140,60,200,0.1), transparent 25%)" }} />

      {/* Dust lanes */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.12, background: "repeating-linear-gradient(135deg, transparent 0px, transparent 40px, rgba(0,0,0,0.4) 41px, transparent 42px, transparent 80px)", animation: "dustFloat 15s ease-in-out infinite" }} />

      {/* Star clusters */}
      {clusters.map((c, ci) => (
        <div key={ci} style={{ position: "absolute", left: `${c.x}%`, top: `${c.y}%`, width: c.r * 2, height: c.r * 2, transform: "translate(-50%,-50%)", borderRadius: "50%", background: `radial-gradient(circle, rgba(200,180,255,0.15), transparent 70%)` }}>
          {Array.from({ length: c.stars }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: `${50 + Math.cos(i * 2.4) * (20 + i * 3)}%`, top: `${50 + Math.sin(i * 2.4) * (20 + i * 3)}%`, width: 2, height: 2, borderRadius: "50%", background: "#e0d0ff", boxShadow: "0 0 4px 1px rgba(200,180,255,0.6)", transform: "translate(-50%,-50%)" }} />
          ))}
        </div>
      ))}

      {/* Stars with twinkling */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        {stars.map((s, i) => (
          <circle key={i} cx={`${s.x}%`} cy={`${s.y}%`} r={s.r} fill={s.color}
            style={{ opacity: s.o, animation: `twinkle ${s.twinkleDur}s ease-in-out ${s.twinkleDelay}s infinite`, ["--so" as any]: s.o }} />
        ))}
      </svg>

      {/* Shooting stars */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="shootGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="40%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="#c4b5fd" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="shootGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="#a5b4fc" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Shooting star 1 - long trail */}
        <g style={{ animation: "shoot1 7s ease-in infinite 2s" }}>
          <line x1="15%" y1="12%" x2="28%" y2="22%" stroke="url(#shootGrad1)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="28%" cy="22%" r="2" fill="white" opacity="0.8" />
        </g>
        {/* Shooting star 2 - short fast */}
        <g style={{ animation: "shoot2 9s ease-in infinite 5s" }}>
          <line x1="65%" y1="45%" x2="75%" y2="52%" stroke="url(#shootGrad2)" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="75%" cy="52%" r="1.5" fill="#a5b4fc" opacity="0.7" />
        </g>
        {/* Shooting star 3 - diagonal */}
        <g style={{ animation: "shoot1 11s ease-in infinite 8s" }}>
          <line x1="80%" y1="15%" x2="88%" y2="30%" stroke="url(#shootGrad1)" strokeWidth="1" strokeLinecap="round" />
          <circle cx="88%" cy="30%" r="1.5" fill="white" opacity="0.6" />
        </g>
      </svg>

      {/* Subtle color wash */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(100,60,180,0.06) 0%, transparent 50%, rgba(40,80,160,0.04) 100%)" }} />
    </div>
  );
}

function ResidentEvilOverlay() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Umbrella hexagon logo top-right */}
      <svg width="180" height="180" viewBox="0 0 200 200" style={{ position: "absolute", top: "5%", right: "8%", opacity: 0.15 }}>
        <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" fill="none" stroke="#cc0000" strokeWidth="3" />
        <polygon points="100,35 158,65 158,135 100,165 42,135 42,65" fill="none" stroke="#cc0000" strokeWidth="2" />
        {/* Umbrella spokes */}
        <line x1="100" y1="10" x2="100" y2="100" stroke="#cc0000" strokeWidth="2" />
        <line x1="178" y1="55" x2="100" y2="100" stroke="#cc0000" strokeWidth="2" />
        <line x1="178" y1="145" x2="100" y2="100" stroke="#cc0000" strokeWidth="2" />
        <line x1="100" y1="190" x2="100" y2="100" stroke="#cc0000" strokeWidth="2" />
        <line x1="22" y1="145" x2="100" y2="100" stroke="#cc0000" strokeWidth="2" />
        <line x1="22" y1="55" x2="100" y2="100" stroke="#cc0000" strokeWidth="2" />
        {/* Red/white alternating sections */}
        <path d="M100,10 L100,100 L178,55 Z" fill="#cc0000" opacity="0.3" />
        <path d="M178,145 L100,100 L178,55 Z" fill="#ffffff" opacity="0.1" />
        <path d="M100,190 L100,100 L178,145 Z" fill="#cc0000" opacity="0.3" />
        <path d="M22,145 L100,100 L100,190 Z" fill="#ffffff" opacity="0.1" />
        <path d="M22,55 L100,100 L22,145 Z" fill="#cc0000" opacity="0.3" />
        <path d="M100,10 L100,100 L22,55 Z" fill="#ffffff" opacity="0.1" />
        <circle cx="100" cy="100" r="15" fill="#cc0000" opacity="0.3" />
      </svg>

      {/* Biohazard symbol bottom-left */}
      <svg width="140" height="140" viewBox="0 0 100 100" style={{ position: "absolute", bottom: "10%", left: "6%", opacity: 0.12 }}>
        <circle cx="50" cy="50" r="8" fill="none" stroke="#cc0000" strokeWidth="2" />
        <circle cx="50" cy="50" r="3" fill="#cc0000" opacity="0.5" />
        {/* Three crescents */}
        <path d="M50,20 Q65,30 50,42 Q35,30 50,20" fill="none" stroke="#cc0000" strokeWidth="2" />
        <path d="M25,64 Q30,48 42,58 Q35,72 25,64" fill="none" stroke="#cc0000" strokeWidth="2" />
        <path d="M75,64 Q70,48 58,58 Q65,72 75,64" fill="none" stroke="#cc0000" strokeWidth="2" />
        <line x1="50" y1="42" x2="50" y2="20" stroke="#cc0000" strokeWidth="1.5" />
        <line x1="42" y1="58" x2="25" y2="64" stroke="#cc0000" strokeWidth="1.5" />
        <line x1="58" y1="58" x2="75" y2="64" stroke="#cc0000" strokeWidth="1.5" />
      </svg>

      {/* Red virus particles scattered */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
        {[
          [15, 25], [82, 18], [45, 70], [70, 45], [25, 85],
          [88, 72], [55, 15], [35, 50], [60, 80], [10, 60],
        ].map(([x, y], i) => (
          <g key={i}>
            <circle cx={`${x}%`} cy={`${y}%`} r="4" fill="#cc0000" />
            <circle cx={`${x}%`} cy={`${y}%`} r="8" fill="none" stroke="#cc0000" strokeWidth="0.5" />
          </g>
        ))}
      </svg>

      {/* Dark fog from bottom */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(0deg, rgba(10,0,0,0.4), transparent)" }} />

      {/* Red vignette */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(80,0,0,0.15) 100%)" }} />
    </div>
  );
}
