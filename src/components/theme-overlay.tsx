"use client";

import React from "react";

interface ThemeOverlayProps {
  theme: string;
  style?: React.CSSProperties;
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export default function ThemeOverlay({ theme, style }: ThemeOverlayProps) {
  const base: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    overflow: "hidden",
    ...style,
  };

  const rng = seededRandom(theme.length * 137);

  switch (theme) {
    case "Spiderman":
      return (
        <div style={base}>
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
            <rect x="50" y="350" width="60" height="450" fill="#0d0d1a" />
            <rect x="55" y="360" width="10" height="12" fill="#ff4444" opacity="0.5" />
            <rect x="75" y="360" width="10" height="12" fill="#ff4444" opacity="0.35" />
            <rect x="55" y="385" width="10" height="12" fill="#ff4444" opacity="0.6" />
            <rect x="75" y="385" width="10" height="12" fill="#ff4444" opacity="0.25" />
            <rect x="130" y="280" width="80" height="520" fill="#0d0d1a" />
            <rect x="140" y="290" width="12" height="14" fill="#ff4444" opacity="0.4" />
            <rect x="165" y="290" width="12" height="14" fill="#ff4444" opacity="0.55" />
            <rect x="190" y="290" width="12" height="14" fill="#ff4444" opacity="0.3" />
            <rect x="140" y="320" width="12" height="14" fill="#ff4444" opacity="0.65" />
            <rect x="165" y="320" width="12" height="14" fill="#ff4444" opacity="0.2" />
            <rect x="190" y="320" width="12" height="14" fill="#ff4444" opacity="0.5" />
            <rect x="250" y="200" width="100" height="600" fill="#0d0d1a" />
            <rect x="265" y="210" width="14" height="16" fill="#ff4444" opacity="0.45" />
            <rect x="290" y="210" width="14" height="16" fill="#ff4444" opacity="0.3" />
            <rect x="315" y="210" width="14" height="16" fill="#ff4444" opacity="0.6" />
            <rect x="370" y="320" width="70" height="480" fill="#0d0d1a" />
            <rect x="460" y="250" width="90" height="550" fill="#0d0d1a" />
            <rect x="570" y="380" width="65" height="420" fill="#0d0d1a" />
            <rect x="660" y="300" width="85" height="500" fill="#0d0d1a" />
            <rect x="770" y="220" width="110" height="580" fill="#0d0d1a" />
            <rect x="900" y="340" width="75" height="460" fill="#0d0d1a" />
            <rect x="1000" y="280" width="95" height="520" fill="#0d0d1a" />
            <rect x="1110" y="360" width="90" height="440" fill="#0d0d1a" />
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.45 }}>
            <defs>
              <pattern id="spiderweb-full" x="0" y="0" width="250" height="250" patternUnits="userSpaceOnUse">
                <circle cx="125" cy="125" r="120" fill="none" stroke="#ff2222" strokeWidth="1.2" />
                <circle cx="125" cy="125" r="95" fill="none" stroke="#ff2222" strokeWidth="1" />
                <circle cx="125" cy="125" r="70" fill="none" stroke="#ff2222" strokeWidth="0.8" />
                <circle cx="125" cy="125" r="45" fill="none" stroke="#ff2222" strokeWidth="0.7" />
                <circle cx="125" cy="125" r="20" fill="none" stroke="#ff2222" strokeWidth="0.5" />
                <line x1="125" y1="5" x2="125" y2="245" stroke="#ff2222" strokeWidth="0.6" />
                <line x1="5" y1="125" x2="245" y2="125" stroke="#ff2222" strokeWidth="0.6" />
                <line x1="35" y1="35" x2="215" y2="215" stroke="#ff2222" strokeWidth="0.5" />
                <line x1="215" y1="35" x2="35" y2="215" stroke="#ff2222" strokeWidth="0.5" />
                <line x1="125" y1="5" x2="35" y2="215" stroke="#ff2222" strokeWidth="0.3" />
                <line x1="125" y1="5" x2="215" y2="215" stroke="#ff2222" strokeWidth="0.3" />
                <line x1="5" y1="125" x2="215" y2="35" stroke="#ff2222" strokeWidth="0.3" />
                <line x1="5" y1="125" x2="215" y2="215" stroke="#ff2222" strokeWidth="0.3" />
                <line x1="245" y1="125" x2="35" y2="35" stroke="#ff2222" strokeWidth="0.3" />
                <line x1="245" y1="125" x2="35" y2="215" stroke="#ff2222" strokeWidth="0.3" />
                <line x1="125" y1="245" x2="35" y2="35" stroke="#ff2222" strokeWidth="0.3" />
                <line x1="125" y1="245" x2="215" y2="35" stroke="#ff2222" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#spiderweb-full)" />
          </svg>
          {[
            { x: "12%", y: "18%", size: 50, rot: 0 },
            { x: "82%", y: "32%", size: 38, rot: 45 },
            { x: "42%", y: "62%", size: 44, rot: -30 },
            { x: "72%", y: "78%", size: 32, rot: 15 },
            { x: "22%", y: "72%", size: 42, rot: -15 },
          ].map((sp, i) => (
            <svg key={i} width={sp.size} height={sp.size} viewBox="0 0 40 40" style={{ position: "absolute", left: sp.x, top: sp.y, opacity: 0.3, transform: `rotate(${sp.rot}deg)` }}>
              <ellipse cx="20" cy="18" rx="5" ry="6" fill="#ff2222" />
              <circle cx="20" cy="10" r="4" fill="#ff2222" />
              <line x1="15" y1="14" x2="4" y2="6" stroke="#ff2222" strokeWidth="1.2" />
              <line x1="16" y1="16" x2="4" y2="12" stroke="#ff2222" strokeWidth="1.2" />
              <line x1="17" y1="18" x2="5" y2="20" stroke="#ff2222" strokeWidth="1.2" />
              <line x1="18" y1="20" x2="6" y2="28" stroke="#ff2222" strokeWidth="1.2" />
              <line x1="25" y1="14" x2="36" y2="6" stroke="#ff2222" strokeWidth="1.2" />
              <line x1="24" y1="16" x2="36" y2="12" stroke="#ff2222" strokeWidth="1.2" />
              <line x1="23" y1="18" x2="35" y2="20" stroke="#ff2222" strokeWidth="1.2" />
              <line x1="22" y1="20" x2="34" y2="28" stroke="#ff2222" strokeWidth="1.2" />
            </svg>
          ))}
          <svg width="100%" height="40%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.2 }}>
            {[10, 25, 45, 65, 85].map((x) => (
              <path key={x} d={`M${x}% 0 Q${x + 3}% ${20 + rng() * 15}% ${x - 2}% ${35 + rng() * 10}%`} fill="none" stroke="#ff4444" strokeWidth="1.5" />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(255,34,34,0.2), transparent 50%)" }} />
        </div>
      );

    case "Batman":
      return (
        <div style={base}>
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
            <rect x="30" y="300" width="70" height="500" fill="#050508" />
            <rect x="120" y="220" width="90" height="580" fill="#050508" />
            <polygon points="120,220 165,180 210,220" fill="#050508" />
            <rect x="230" y="350" width="60" height="450" fill="#050508" />
            <rect x="310" y="180" width="100" height="620" fill="#050508" />
            <polygon points="310,180 360,120 410,180" fill="#050508" />
            <rect x="430" y="280" width="80" height="520" fill="#050508" />
            <rect x="530" y="350" width="70" height="450" fill="#050508" />
            <rect x="620" y="200" width="110" height="600" fill="#050508" />
            <polygon points="620,200 675,140 730,200" fill="#050508" />
            <rect x="750" y="300" width="85" height="500" fill="#050508" />
            <rect x="860" y="250" width="95" height="550" fill="#050508" />
            <rect x="980" y="320" width="75" height="480" fill="#050508" />
            <rect x="1070" y="280" width="130" height="520" fill="#050508" />
            <polygon points="1070,280 1135,210 1200,280" fill="#050508" />
          </svg>
          <svg width="200" height="200" viewBox="0 0 100 100" style={{ position: "absolute", top: "6%", right: "12%", opacity: 0.25 }}>
            <circle cx="50" cy="50" r="45" fill="none" stroke="#8888aa" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="42" fill="rgba(136,136,170,0.15)" />
            <path d="M50 25 C42 25 30 38 22 50 C30 52 38 48 42 44 C40 55 42 70 50 75 C58 70 60 55 58 44 C62 48 70 52 78 50 C70 38 58 25 50 25Z" fill="#8888aa" />
          </svg>
          {[
            { x: "18%", y: "12%", s: 28 },
            { x: "58%", y: "8%", s: 22 },
            { x: "33%", y: "22%", s: 25 },
            { x: "73%", y: "18%", s: 18 },
            { x: "8%", y: "28%", s: 23 },
            { x: "48%", y: "15%", s: 20 },
          ].map((b, i) => (
            <svg key={i} width={b.s} height={b.s * 0.6} viewBox="0 0 40 24" style={{ position: "absolute", left: b.x, top: b.y, opacity: 0.25 }}>
              <path d="M20 12 C16 4 8 2 2 6 C6 8 10 10 14 12 C10 14 6 18 2 22 C8 20 16 18 20 12Z" fill="#555" />
              <path d="M20 12 C24 4 32 2 38 6 C34 8 30 10 26 12 C30 14 34 18 38 22 C32 20 24 18 20 12Z" fill="#555" />
            </svg>
          ))}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
            {Array.from({ length: 80 }, (_, i) => (
              <line key={i} x1={`${rng() * 100}%`} y1={`${rng() * 80}%`} x2={`${rng() * 100}%`} y2={`${rng() * 80 + 15}%`} stroke="#8888aa" strokeWidth="0.7" />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(80,80,120,0.15), transparent 50%)" }} />
        </div>
      );

    case "Greek Myth":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
            <polyline points="48%,5% 44%,18% 50%,22% 42%,38% 48%,42% 40%,60%" fill="none" stroke="#ffdd44" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="52%,8% 56%,20% 50%,24% 58%,40% 52%,44% 60%,58%" fill="none" stroke="#ffdd44" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="20%,10% 17%,18% 22%,22% 16%,32%" fill="none" stroke="#ffdd44" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <polyline points="80%,12% 83%,22% 78%,26% 84%,36%" fill="none" stroke="#ffdd44" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            <polyline points="65%,5% 62%,14% 68%,18% 60%,28%" fill="none" stroke="#ffdd44" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i / 12) * 60 - 30;
              return (
                <line key={i} x1="50%" y1="0%" x2={`${50 + Math.tan(angle * Math.PI / 180) * 100}%`} y2="100%" stroke="#ffdd44" strokeWidth="1.5" />
              );
            })}
          </svg>
          <svg width="100" height="200" viewBox="0 0 80 160" style={{ position: "absolute", bottom: "8%", left: "6%", opacity: 0.2, transform: "rotate(-15deg)" }}>
            <line x1="40" y1="30" x2="40" y2="155" stroke="#4488cc" strokeWidth="5" />
            <line x1="40" y1="30" x2="40" y2="5" stroke="#4488cc" strokeWidth="4" />
            <line x1="40" y1="30" x2="15" y2="5" stroke="#4488cc" strokeWidth="4" />
            <line x1="40" y1="30" x2="65" y2="5" stroke="#4488cc" strokeWidth="4" />
            <circle cx="40" cy="5" r="4" fill="#4488cc" />
            <circle cx="15" cy="5" r="4" fill="#4488cc" />
            <circle cx="65" cy="5" r="4" fill="#4488cc" />
          </svg>
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
            {Array.from({ length: 25 }, (_, i) => {
              const x = 50 + rng() * 1100;
              const h = 40 + rng() * 120;
              return (
                <path key={i} d={`M${x} 800 Q${x - 15} ${800 - h * 0.6} ${x} ${800 - h} Q${x + 15} ${800 - h * 0.6} ${x} 800`} fill="#8844aa" opacity={rng() * 0.5 + 0.4} />
              );
            })}
          </svg>
          <svg width="130" height="130" viewBox="0 0 100 100" style={{ position: "absolute", top: "10%", right: "8%", opacity: 0.18 }}>
            <ellipse cx="50" cy="45" rx="25" ry="30" fill="none" stroke="#c9a84c" strokeWidth="2.5" />
            <circle cx="40" cy="38" r="8" fill="none" stroke="#c9a84c" strokeWidth="2" />
            <circle cx="60" cy="38" r="8" fill="none" stroke="#c9a84c" strokeWidth="2" />
            <circle cx="40" cy="38" r="3.5" fill="#c9a84c" />
            <circle cx="60" cy="38" r="3.5" fill="#c9a84c" />
            <path d="M45 48 L50 52 L55 48" fill="none" stroke="#c9a84c" strokeWidth="2" />
            <path d="M30 25 L40 32" stroke="#c9a84c" strokeWidth="2.5" />
            <path d="M70 25 L60 32" stroke="#c9a84c" strokeWidth="2.5" />
            <path d="M35 75 L30 95" stroke="#c9a84c" strokeWidth="2.5" />
            <path d="M65 75 L70 95" stroke="#c9a84c" strokeWidth="2.5" />
            <path d="M25 55 L10 50 L15 60" fill="none" stroke="#c9a84c" strokeWidth="2" />
            <path d="M75 55 L90 50 L85 60" fill="none" stroke="#c9a84c" strokeWidth="2" />
          </svg>
          <svg width="200" height="150" viewBox="0 0 160 120" style={{ position: "absolute", top: "28%", left: "58%", opacity: 0.15 }}>
            <path d="M80 80 Q60 60 50 50 Q40 40 45 30 Q50 20 60 25 Q65 28 68 35 Q70 40 75 50 L80 55 Q85 50 90 45 Q95 35 100 30 Q110 25 115 30 Q120 35 115 45 Q110 55 100 60 Q95 65 90 70 L85 80 Z" fill="#c9a84c" />
            <path d="M60 25 Q45 10 30 5 Q40 15 55 20" fill="#c9a84c" />
            <path d="M100 30 Q115 15 130 10 Q120 20 105 25" fill="#c9a84c" />
            <line x1="65" y1="80" x2="55" y2="110" stroke="#c9a84c" strokeWidth="3" />
            <line x1="75" y1="80" x2="68" y2="112" stroke="#c9a84c" strokeWidth="3" />
            <line x1="90" y1="75" x2="98" y2="110" stroke="#c9a84c" strokeWidth="3" />
            <line x1="95" y1="72" x2="108" y2="108" stroke="#c9a84c" strokeWidth="3" />
          </svg>
          <svg width="100%" height="80" style={{ position: "absolute", bottom: "18%", left: 0, opacity: 0.12 }}>
            {Array.from({ length: 25 }, (_, i) => (
              <path key={i} d={`M${i * 50} 40 Q${i * 50 + 12} ${10 + rng() * 60} ${i * 50 + 25} 40 Q${i * 50 + 38} ${10 + rng() * 60} ${i * 50 + 50} 40`} fill="none" stroke="#44aa66" strokeWidth="2" />
            ))}
          </svg>
          <svg width="100%" height="35" style={{ position: "absolute", bottom: "6%", left: 0, opacity: 0.15 }}>
            <defs>
              <pattern id="greek-key" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                <path d="M0 15 L8 15 L8 8 L15 8 L15 0 L30 0 L30 30 L15 30 L15 22 L8 22 L8 15" fill="none" stroke="#c9a84c" strokeWidth="1.5" />
              </pattern>
            </defs>
            <rect width="100%" height="30" fill="url(#greek-key)" />
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(255,220,60,0.18), transparent 35%)" }} />
        </div>
      );

    case "Galaxy":
      return (
        <div style={base}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 30%, rgba(100,40,180,0.35), transparent 45%), radial-gradient(ellipse at 70% 50%, rgba(40,80,200,0.3), transparent 40%), radial-gradient(ellipse at 50% 80%, rgba(180,40,160,0.2), transparent 35%), radial-gradient(ellipse at 20% 70%, rgba(40,120,200,0.18), transparent 30%)" }} />
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 1 }}>
            {Array.from({ length: 250 }, (_, i) => (
              <circle key={i} cx={`${rng() * 100}%`} cy={`${rng() * 100}%`} r={rng() > 0.9 ? rng() * 2.5 + 1 : rng() * 1.5 + 0.3} fill="white" opacity={rng() * 0.8 + 0.2} />
            ))}
          </svg>
          <svg width="100%" height="100%" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, opacity: 0.18 }}>
            <path d="M400 400 Q420 350 460 340 Q520 330 540 370 Q560 420 520 450 Q470 480 440 440 Q410 390 450 360 Q490 330 530 360" fill="none" stroke="#a080ff" strokeWidth="3" />
            <path d="M400 400 Q380 450 340 460 Q280 470 260 430 Q240 380 280 350 Q330 320 360 360 Q390 410 350 440 Q310 470 270 440" fill="none" stroke="#8060ff" strokeWidth="2.5" />
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
            <line x1="20%" y1="15%" x2="35%" y2="25%" stroke="white" strokeWidth="2" />
            <line x1="35%" y1="25%" x2="36%" y2="26%" stroke="white" strokeWidth="0.8" opacity="0.3" />
            <line x1="65%" y1="60%" x2="78%" y2="70%" stroke="white" strokeWidth="1.5" />
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(20,10,40,0.3), transparent 20%, transparent 80%, rgba(20,10,40,0.2))" }} />
        </div>
      );

    case "Neon Tokyo":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.25 }}>
            {Array.from({ length: 25 }, (_, i) => (
              <React.Fragment key={`h${i}`}>
                <line x1="0" y1={`${(i + 1) * 4}%`} x2="100%" y2={`${(i + 1) * 4}%`} stroke="#ff00ff" strokeWidth="0.7" />
                <line x1="0" y1={`${(i + 1) * 4 + 0.5}%`} x2="100%" y2={`${(i + 1) * 4 + 0.5}%`} stroke="#00ffff" strokeWidth="0.5" />
              </React.Fragment>
            ))}
            {Array.from({ length: 20 }, (_, i) => (
              <React.Fragment key={`v${i}`}>
                <line x1={`${(i + 1) * 5}%`} y1="0" x2={`${(i + 1) * 5}%`} y2="100%" stroke="#ff00ff" strokeWidth="0.7" />
                <line x1={`${(i + 1) * 5 + 0.5}%`} y1="0" x2={`${(i + 1) * 5 + 0.5}%`} y2="100%" stroke="#00ffff" strokeWidth="0.5" />
              </React.Fragment>
            ))}
          </svg>
          {[
            { x: "8%", y: "20%", text: "ネオン", color: "#ff00ff", size: 32 },
            { x: "72%", y: "12%", text: "東京", color: "#00ffff", size: 42 },
            { x: "12%", y: "68%", text: "ゲーム", color: "#ff0066", size: 26 },
            { x: "78%", y: "62%", text: "24h", color: "#ffff00", size: 38 },
            { x: "42%", y: "82%", text: "カフェ", color: "#ff6600", size: 28 },
          ].map((sign, i) => (
            <div key={i} style={{
              position: "absolute", left: sign.x, top: sign.y, fontSize: sign.size, color: sign.color, opacity: 0.25,
              fontFamily: "monospace", textShadow: `0 0 25px ${sign.color}, 0 0 50px ${sign.color}`, letterSpacing: "4px",
            }}>{sign.text}</div>
          ))}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
            {Array.from({ length: 100 }, (_, i) => (
              <line key={i} x1={`${rng() * 100}%`} y1={`${rng() * 90}%`} x2={`${rng() * 100 + 1}%`} y2={`${rng() * 90 + 8}%`} stroke="#00ffff" strokeWidth="0.7" />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(255,0,255,0.12), transparent 50%)" }} />
        </div>
      );

    case "Sahara":
      return (
        <div style={base}>
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
            <path d="M0 800 Q100 600 250 650 Q400 500 550 580 Q700 400 850 520 Q1000 350 1100 480 Q1150 420 1200 500 L1200 800Z" fill="#c9a040" />
            <path d="M0 800 Q150 650 300 700 Q450 550 600 630 Q750 450 900 560 Q1050 380 1150 500 L1200 550 L1200 800Z" fill="#b89030" opacity="0.8" />
            <path d="M0 800 Q200 700 350 730 Q500 600 650 670 Q800 500 950 600 Q1100 450 1200 550 L1200 800Z" fill="#a88020" opacity="0.6" />
          </svg>
          <div style={{ position: "absolute", top: "6%", right: "12%", width: "140px", height: "140px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,200,60,0.45), rgba(255,160,20,0.15) 50%, transparent 70%)" }} />
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
            {Array.from({ length: 18 }, (_, i) => (
              <path key={i} d={`M0 ${500 + i * 18} Q300 ${480 + i * 18 + Math.sin(i) * 15} 600 ${500 + i * 18} Q900 ${520 + i * 18 - Math.sin(i) * 15} 1200 ${500 + i * 18}`} fill="none" stroke="#d4a040" strokeWidth="1.2" />
            ))}
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
            {Array.from({ length: 50 }, (_, i) => (
              <circle key={i} cx={`${rng() * 100}%`} cy={`${rng() * 70 + 20}%`} r={rng() * 2.5 + 0.8} fill="#d4a040" />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(180,140,60,0.08), transparent 30%, transparent 70%, rgba(180,140,60,0.15))" }} />
        </div>
      );

    case "Nordic Frost":
      return (
        <div style={base}>
          <svg width="100%" height="60%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.4 }}>
            <defs>
              <linearGradient id="aurora1" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00ff88" stopOpacity="0" />
                <stop offset="30%" stopColor="#00ff88" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#00aaff" stopOpacity="0.8" />
                <stop offset="70%" stopColor="#8800ff" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#8800ff" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="aurora2" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00ffaa" stopOpacity="0" />
                <stop offset="40%" stopColor="#00ffaa" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#0088ff" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#6600ff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M0 100 Q200 40 400 80 Q600 120 800 60 Q1000 0 1200 50 L1200 0 L0 0Z" fill="url(#aurora1)" />
            <path d="M0 150 Q300 80 500 120 Q700 160 900 100 Q1100 40 1200 80 L1200 0 L0 0Z" fill="url(#aurora2)" />
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.4 }}>
            {Array.from({ length: 60 }, (_, i) => {
              const cx = rng() * 100;
              const cy = rng() * 100;
              const s = rng() * 12 + 6;
              return (
                <g key={i} transform={`translate(${cx},${cy})`} opacity={rng() * 0.5 + 0.3}>
                  <line x1={-s} y1="0" x2={s} y2="0" stroke="#c0e0ff" strokeWidth="1.2" />
                  <line x1="0" y1={-s} x2="0" y2={s} stroke="#c0e0ff" strokeWidth="1.2" />
                  <line x1={-s * 0.7} y1={-s * 0.7} x2={s * 0.7} y2={s * 0.7} stroke="#c0e0ff" strokeWidth="0.9" />
                  <line x1={s * 0.7} y1={-s * 0.7} x2={-s * 0.7} y2={s * 0.7} stroke="#c0e0ff" strokeWidth="0.9" />
                  <circle cx="0" cy="0" r="2.5" fill="#c0e0ff" opacity="0.5" />
                </g>
              );
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(100,180,255,0.12), transparent 40%)" }} />
        </div>
      );

    case "Volcanic":
      return (
        <div style={base}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%", background: "linear-gradient(0deg, rgba(255,40,0,0.35), rgba(255,80,0,0.15) 40%, transparent)" }} />
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
            <path d="M400 800 Q420 700 450 650 Q480 580 500 500 Q520 420 540 350" fill="none" stroke="#ff4400" strokeWidth="10" />
            <path d="M500 800 Q530 720 560 660 Q590 580 610 500 Q630 420 650 340" fill="none" stroke="#ff6600" strokeWidth="8" />
            <path d="M600 800 Q620 740 640 680 Q660 600 680 520 Q700 440 720 360" fill="none" stroke="#ff3300" strokeWidth="6" />
            <path d="M350 800 Q370 750 390 700 Q410 640 430 580 Q450 520 470 460" fill="none" stroke="#ff5500" strokeWidth="5" />
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.6 }}>
            {Array.from({ length: 60 }, (_, i) => (
              <circle key={i} cx={`${20 + rng() * 60}%`} cy={`${40 + rng() * 55}%`} r={rng() * 3.5 + 0.8} fill="#ff6633" opacity={rng() * 0.8 + 0.2} />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(255,60,0,0.18), transparent 40%)" }} />
        </div>
      );

    case "Cherry Coke":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
            {Array.from({ length: 100 }, (_, i) => (
              <circle key={i} cx={`${rng() * 100}%`} cy={`${rng() * 100}%`} r={rng() * 14 + 4} fill="none" stroke="#ff2050" strokeWidth="1" />
            ))}
          </svg>
          {[
            { x: "10%", y: "15%", s: 55 },
            { x: "82%", y: "18%", s: 48 },
            { x: "72%", y: "72%", s: 52 },
            { x: "18%", y: "78%", s: 45 },
          ].map((c, i) => (
            <svg key={i} width={c.s} height={c.s} viewBox="0 0 40 40" style={{ position: "absolute", left: c.x, top: c.y, opacity: 0.2 }}>
              <circle cx="14" cy="22" r="8" fill="#cc1133" />
              <circle cx="26" cy="22" r="8" fill="#cc1133" />
              <path d="M14 14 Q20 4 26 14" fill="none" stroke="#228833" strokeWidth="2.5" />
              <ellipse cx="20" cy="6" rx="6" ry="4" fill="#228833" />
            </svg>
          ))}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
            {Array.from({ length: 40 }, (_, i) => (
              <line key={i} x1={`${rng() * 100}%`} y1={`${50 + rng() * 50}%`} x2={`${rng() * 100}%`} y2={`${rng() * 40}%`} stroke="#ff3060" strokeWidth="0.8" />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 80%, rgba(200,20,60,0.18), transparent 50%)" }} />
        </div>
      );

    case "Matrix":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
            {Array.from({ length: 40 }, (_, col) => {
              const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF";
              const x = 1 + col * 2.5;
              const yOffset = rng() * 30;
              return (
                <text key={col} x={`${x}%`} y={`${yOffset}%`} fill="#00ff41" fontSize="14" fontFamily="monospace" opacity={rng() * 0.5 + 0.4}>
                  {Array.from({ length: 18 }, () => chars[Math.floor(rng() * chars.length)]).join("\n")}
                </text>
              );
            })}
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.5 }}>
            {Array.from({ length: 15 }, (_, i) => {
              const chars = "01";
              return (
                <text key={i} x={`${rng() * 95 + 2}%`} y={`${rng() * 90 + 5}%`} fill="#00ff41" fontSize="20" fontFamily="monospace">
                  {chars[Math.floor(rng() * chars.length)]}
                </text>
              );
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,40,0,0.2), transparent 15%, transparent 85%, rgba(0,40,0,0.15))" }} />
        </div>
      );

    case "Steampunk":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
            <g transform="translate(12%, 18%)">
              <circle cx="0" cy="0" r="100" fill="none" stroke="#b8860b" strokeWidth="4" />
              <circle cx="0" cy="0" r="80" fill="none" stroke="#b8860b" strokeWidth="2" />
              <circle cx="0" cy="0" r="50" fill="none" stroke="#b8860b" strokeWidth="3" />
              <circle cx="0" cy="0" r="20" fill="#b8860b" opacity="0.6" />
              {Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2;
                return <line key={i} x1={Math.cos(a) * 50} y1={Math.sin(a) * 50} x2={Math.cos(a) * 100} y2={Math.sin(a) * 100} stroke="#b8860b" strokeWidth="2.5" />;
              })}
            </g>
            <g transform="translate(85%, 78%)">
              <circle cx="0" cy="0" r="120" fill="none" stroke="#b8860b" strokeWidth="4" />
              <circle cx="0" cy="0" r="95" fill="none" stroke="#b8860b" strokeWidth="2" />
              <circle cx="0" cy="0" r="60" fill="none" stroke="#b8860b" strokeWidth="3" />
              <circle cx="0" cy="0" r="25" fill="#b8860b" opacity="0.6" />
              {Array.from({ length: 20 }, (_, i) => {
                const a = (i / 20) * Math.PI * 2;
                return <line key={i} x1={Math.cos(a) * 60} y1={Math.sin(a) * 60} x2={Math.cos(a) * 120} y2={Math.sin(a) * 120} stroke="#b8860b" strokeWidth="2.5" />;
              })}
            </g>
            <g transform="translate(50%, 50%)">
              <circle cx="0" cy="0" r="60" fill="none" stroke="#b8860b" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="45" fill="none" stroke="#b8860b" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="30" fill="none" stroke="#b8860b" strokeWidth="2" />
              <circle cx="0" cy="0" r="10" fill="#b8860b" opacity="0.6" />
              {Array.from({ length: 12 }, (_, i) => {
                const a = (i / 12) * Math.PI * 2;
                return <line key={i} x1={Math.cos(a) * 30} y1={Math.sin(a) * 30} x2={Math.cos(a) * 60} y2={Math.sin(a) * 60} stroke="#b8860b" strokeWidth="2" />;
              })}
            </g>
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
            <path d="M0 30% H25% Q30% 30% 30% 35% V50% Q30% 55% 35% 55% H60%" fill="none" stroke="#b8860b" strokeWidth="5" />
            <path d="M100% 70% H75% Q70% 70% 70% 65% V45% Q70% 40% 65% 40% H40%" fill="none" stroke="#b8860b" strokeWidth="5" />
            <circle cx="25%" cy="30%" r="8" fill="#b8860b" opacity="0.5" />
            <circle cx="75%" cy="70%" r="8" fill="#b8860b" opacity="0.5" />
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <circle key={i} cx={`${rng() * 80 + 10}%`} cy={`${rng() * 40 + 10}%`} r={rng() * 50 + 25} fill="#b8860b" />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 12% 18%, rgba(184,134,11,0.12), transparent 25%), radial-gradient(ellipse at 85% 78%, rgba(184,134,11,0.12), transparent 25%)" }} />
        </div>
      );

    case "Cyberpunk 2077":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
            <line x1="0" y1="100%" x2="100%" y2="0" stroke="#fcee09" strokeWidth="2" />
            <line x1="10%" y1="100%" x2="100%" y2="10%" stroke="#fcee09" strokeWidth="1.2" />
            <line x1="0" y1="90%" x2="90%" y2="0" stroke="#fcee09" strokeWidth="1.2" />
            <line x1="20%" y1="100%" x2="100%" y2="20%" stroke="#ff003c" strokeWidth="1" />
            <line x1="0" y1="80%" x2="80%" y2="0" stroke="#00f0ff" strokeWidth="1" />
          </svg>
          <svg width="100%" height="50%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.15 }}>
            {Array.from({ length: 15 }, (_, i) => (
              <React.Fragment key={i}>
                <line x1="0" y1={i * 28} x2="800" y2={i * 28} stroke="#fcee09" strokeWidth="1" />
                <line x1={i * 57} y1="0" x2={400 - (400 - i * 57) * 0.3} y2="400" stroke="#fcee09" strokeWidth="0.7" />
                <line x1={800 - i * 57} y1="0" x2={400 + (400 - i * 57) * 0.3} y2="400" stroke="#fcee09" strokeWidth="0.7" />
              </React.Fragment>
            ))}
          </svg>
          <div style={{ position: "absolute", top: "6%", left: "5%", fontSize: "90px", color: "#fcee09", opacity: 0.18, fontFamily: "monospace", fontWeight: 900, letterSpacing: "10px", textShadow: "0 0 50px #fcee09" }}>2077</div>
          <div style={{ position: "absolute", bottom: "8%", right: "5%", fontSize: "58px", color: "#ff003c", opacity: 0.15, fontFamily: "monospace", fontWeight: 900, letterSpacing: "8px", textShadow: "0 0 40px #ff003c" }}>NC</div>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <rect key={i} x={`${rng() * 80}%`} y={`${rng() * 90}%`} width={`${rng() * 15 + 5}%`} height="3" fill={rng() > 0.5 ? "#fcee09" : "#ff003c"} />
            ))}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 50%, rgba(252,238,9,0.06), transparent 50%)" }} />
        </div>
      );

    case "Detroit: BH":
      return (
        <div style={base}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%, rgba(0,150,255,0.3), transparent 50%)" }} />
          <svg width="100%" height="100%" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, opacity: 0.25 }}>
            <circle cx="400" cy="250" r="30" fill="#00aaff" opacity="0.7" />
            <circle cx="400" cy="250" r="15" fill="#00ddff" opacity="0.9" />
            <line x1="400" y1="280" x2="400" y2="500" stroke="#00aaff" strokeWidth="2.5" />
            {[80, 140, 200, 260, 320].map((r) => (
              <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="#00aaff" strokeWidth="1.2" opacity={0.4 + (r / 320) * 0.4} />
            ))}
            <path d="M100 400 H200 V300 H350" fill="none" stroke="#00aaff" strokeWidth="1.2" opacity="0.5" />
            <path d="M700 400 H600 V500 H450" fill="none" stroke="#00aaff" strokeWidth="1.2" opacity="0.5" />
            <path d="M400 100 V200 H300 V350" fill="none" stroke="#00aaff" strokeWidth="1.2" opacity="0.5" />
            <path d="M400 700 V600 H500 V450" fill="none" stroke="#00aaff" strokeWidth="1.2" opacity="0.5" />
            {[[200, 400], [350, 300], [600, 400], [450, 500], [300, 350], [500, 450], [150, 350], [650, 450], [350, 150], [450, 650]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="5" fill="#00aaff" opacity="0.6" />
            ))}
          </svg>
          <div style={{ position: "absolute", bottom: "6%", left: "50%", transform: "translateX(-50%)", fontSize: "34px", color: "#00aaff", opacity: 0.2, fontFamily: "monospace", letterSpacing: "14px", textTransform: "uppercase", textShadow: "0 0 30px #00aaff", whiteSpace: "nowrap" }}>Become Human</div>
        </div>
      );

    default:
      return null;
  }
}
