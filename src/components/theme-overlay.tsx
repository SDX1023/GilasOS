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
          {/* NYC Skyline silhouette at bottom */}
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0 }}>
            <rect x="50" y="450" width="55" height="350" fill="#0c0c18" />
            <rect x="55" y="460" width="8" height="10" fill="#ff4444" opacity="0.6" />
            <rect x="70" y="460" width="8" height="10" fill="#ffcc00" opacity="0.4" />
            <rect x="55" y="480" width="8" height="10" fill="#ffcc00" opacity="0.5" />
            <rect x="70" y="480" width="8" height="10" fill="#ff4444" opacity="0.3" />
            <rect x="130" y="380" width="75" height="420" fill="#0c0c18" />
            <rect x="140" y="390" width="10" height="12" fill="#ff4444" opacity="0.5" />
            <rect x="160" y="390" width="10" height="12" fill="#ffcc00" opacity="0.6" />
            <rect x="180" y="390" width="10" height="12" fill="#ff4444" opacity="0.35" />
            <rect x="140" y="415" width="10" height="12" fill="#ffcc00" opacity="0.4" />
            <rect x="160" y="415" width="10" height="12" fill="#ff4444" opacity="0.55" />
            <rect x="250" y="320" width="90" height="480" fill="#0c0c18" />
            <rect x="260" y="330" width="12" height="14" fill="#ffcc00" opacity="0.5" />
            <rect x="280" y="330" width="12" height="14" fill="#ff4444" opacity="0.4" />
            <rect x="300" y="330" width="12" height="14" fill="#ffcc00" opacity="0.6" />
            <rect x="370" y="420" width="65" height="380" fill="#0c0c18" />
            <rect x="460" y="360" width="85" height="440" fill="#0c0c18" />
            <rect x="570" y="480" width="60" height="320" fill="#0c0c18" />
            <rect x="660" y="400" width="80" height="400" fill="#0c0c18" />
            <rect x="770" y="330" width="100" height="470" fill="#0c0c18" />
            <rect x="900" y="430" width="70" height="370" fill="#0c0c18" />
            <rect x="1000" y="380" width="90" height="420" fill="#0c0c18" />
            <rect x="1110" y="450" width="85" height="350" fill="#0c0c18" />
          </svg>

          {/* Single large web from top-center corner */}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            <defs>
              <radialGradient id="web-fade" cx="50%" cy="0%" r="80%">
                <stop offset="0%" stopOpacity="1" />
                <stop offset="60%" stopOpacity="0.4" />
                <stop offset="100%" stopOpacity="0" />
              </radialGradient>
            </defs>
            <g opacity="0.35" style={{ filter: "url(#web-fade)" }}>
              {/* Radial lines from top-center */}
              {[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const len = 900;
                return (
                  <line key={angle} x1="50%" y1="0%" x2={`calc(50% + ${Math.cos(rad) * len}px)`} y2={`${Math.sin(rad) * len}px`} stroke="#ff2222" strokeWidth="0.8" />
                );
              })}
              {/* Concentric弧 connecting the radials */}
              {[120, 250, 400, 560, 730].map((r) => (
                <path
                  key={r}
                  d={`M ${500 - r} ${r * 0.6} Q 500 ${r * 0.3} ${500 + r} ${r * 0.6}`}
                  fill="none"
                  stroke="#ff2222"
                  strokeWidth="0.6"
                />
              ))}
            </g>
          </svg>

          {/* Spider hanging from web thread */}
          <svg width="30" height="60" viewBox="0 0 30 60" style={{ position: "absolute", top: "8%", left: "48%", opacity: 0.5 }}>
            <line x1="15" y1="0" x2="15" y2="20" stroke="#ff2222" strokeWidth="0.8" />
            <ellipse cx="15" cy="32" rx="6" ry="8" fill="#222" />
            <circle cx="15" cy="22" r="4" fill="#222" />
            <circle cx="13" cy="21" r="1" fill="#ff0000" />
            <circle cx="17" cy="21" r="1" fill="#ff0000" />
            <line x1="9" y1="28" x2="2" y2="22" stroke="#222" strokeWidth="0.8" />
            <line x1="9" y1="30" x2="2" y2="30" stroke="#222" strokeWidth="0.8" />
            <line x1="9" y1="33" x2="3" y2="40" stroke="#222" strokeWidth="0.8" />
            <line x1="21" y1="28" x2="28" y2="22" stroke="#222" strokeWidth="0.8" />
            <line x1="21" y1="30" x2="28" y2="30" stroke="#222" strokeWidth="0.8" />
            <line x1="21" y1="33" x2="27" y2="40" stroke="#222" strokeWidth="0.8" />
          </svg>

          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(255,30,30,0.15), transparent 50%)" }} />
        </div>
      );

    case "Batman":
      return (
        <div style={base}>
          {/* Gotham skyline */}
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0 }}>
            <rect x="30" y="380" width="65" height="420" fill="#05050a" />
            <rect x="120" y="300" width="85" height="500" fill="#05050a" />
            <polygon points="120,300 162,260 205,300" fill="#05050a" />
            <rect x="230" y="420" width="55" height="380" fill="#05050a" />
            <rect x="310" y="260" width="95" height="540" fill="#05050a" />
            <polygon points="310,260 357,200 405,260" fill="#05050a" />
            <rect x="430" y="360" width="75" height="440" fill="#05050a" />
            <rect x="530" y="430" width="65" height="370" fill="#05050a" />
            <rect x="620" y="280" width="105" height="520" fill="#05050a" />
            <polygon points="620,280 672,215 725,280" fill="#05050a" />
            <rect x="750" y="380" width="80" height="420" fill="#05050a" />
            <rect x="860" y="330" width="90" height="470" fill="#05050a" />
            <rect x="980" y="400" width="70" height="400" fill="#05050a" />
            <rect x="1070" y="360" width="120" height="440" fill="#05050a" />
            <polygon points="1070,360 1130,290 1190,360" fill="#05050a" />
          </svg>

          {/* Bat signal - proper bat shape in a circle of light */}
          <svg width="220" height="220" viewBox="0 0 200 200" style={{ position: "absolute", top: "5%", right: "10%", opacity: 0.35 }}>
            <defs>
              <radialGradient id="bat-light" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ccccdd" stopOpacity="0.4" />
                <stop offset="70%" stopColor="#8888aa" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#8888aa" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#bat-light)" />
            <circle cx="100" cy="100" r="75" fill="none" stroke="#aaaacc" strokeWidth="1.5" opacity="0.5" />
            {/* Bat shape */}
            <path d="M100 55 L95 62 L85 58 L78 52 L70 55 L65 62 L60 58 L55 65 L52 72 L55 78 L50 85 L55 90 L50 100 L55 105 L50 115 L55 120 L60 125 L65 128 L70 130 L75 128 L80 132 L85 128 L90 135 L95 130 L100 138 L105 130 L110 135 L115 128 L120 132 L125 128 L130 130 L135 128 L140 125 L145 120 L150 115 L145 105 L150 100 L145 90 L150 85 L145 78 L148 72 L145 65 L140 58 L135 62 L130 55 L122 52 L115 58 L105 62 Z" fill="#8888aa" />
            {/* Eyes */}
            <circle cx="88" cy="82" r="2" fill="#ccccdd" />
            <circle cx="112" cy="82" r="2" fill="#ccccdd" />
          </svg>

          {/* Flying bats scattered */}
          {[
            { x: "18%", y: "10%", s: 24 },
            { x: "55%", y: "6%", s: 18 },
            { x: "32%", y: "18%", s: 20 },
            { x: "70%", y: "14%", s: 16 },
            { x: "8%", y: "22%", s: 22 },
            { x: "45%", y: "12%", s: 15 },
          ].map((b, i) => (
            <svg key={i} width={b.s} height={b.s * 0.5} viewBox="0 0 40 20" style={{ position: "absolute", left: b.x, top: b.y, opacity: 0.2 }}>
              <path d="M20 10 L17 4 L12 2 L8 4 L5 2 L2 5 L5 8 L2 12 L5 15 L8 13 L12 16 L17 14 L20 18 L23 14 L28 16 L32 13 L35 15 L38 12 L35 8 L38 5 L35 2 L32 4 L28 2 L23 4 Z" fill="#666" />
            </svg>
          ))}

          {/* Rain */}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
            {Array.from({ length: 80 }, (_, i) => (
              <line key={i} x1={`${rng() * 100}%`} y1={`${rng() * 80}%`} x2={`${rng() * 100 - 1}%`} y2={`${rng() * 80 + 12}%`} stroke="#7777aa" strokeWidth="0.6" />
            ))}
          </svg>
        </div>
      );

    case "Greek Myth":
      return (
        <div style={base}>
          {/* Zeus lightning bolts */}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            <g opacity="0.6">
              <polyline points="48%,3% 44%,14% 50%,18% 42%,30% 48%,34% 40%,48%" fill="none" stroke="#ffdd44" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="52%,5% 56%,16% 50%,20% 58%,34% 52%,38% 60%,52%" fill="none" stroke="#ffdd44" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <polyline points="22%,8% 18%,16% 24%,20% 17%,28%" fill="none" stroke="#ffdd44" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              <polyline points="78%,10% 82%,18% 76%,22% 83%,30%" fill="none" stroke="#ffdd44" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
            </g>
          </svg>

          {/* Light rays from above */}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
            {Array.from({ length: 8 }, (_, i) => {
              const angle = (i / 8) * 40 - 20;
              return <line key={i} x1="50%" y1="0%" x2={`${50 + Math.tan((angle * Math.PI) / 180) * 100}%`} y2="100%" stroke="#ffdd44" strokeWidth="1.5" />;
            })}
          </svg>

          {/* Trident bottom-left */}
          <svg width="70" height="140" viewBox="0 0 70 140" style={{ position: "absolute", bottom: "12%", left: "8%", opacity: 0.2, transform: "rotate(-12deg)" }}>
            <line x1="35" y1="25" x2="35" y2="135" stroke="#4488cc" strokeWidth="4" />
            <line x1="35" y1="25" x2="35" y2="5" stroke="#4488cc" strokeWidth="3" />
            <line x1="35" y1="25" x2="12" y2="5" stroke="#4488cc" strokeWidth="3" />
            <line x1="35" y1="25" x2="58" y2="5" stroke="#4488cc" strokeWidth="3" />
            <circle cx="35" cy="5" r="3" fill="#4488cc" />
            <circle cx="12" cy="5" r="3" fill="#4488cc" />
            <circle cx="58" cy="5" r="3" fill="#4488cc" />
          </svg>

          {/* Divine glow from top */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 0%, rgba(255,220,60,0.12), transparent 40%)" }} />
        </div>
      );

    case "Galaxy":
      return (
        <div style={base}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 30%, rgba(100,40,180,0.3), transparent 45%), radial-gradient(ellipse at 70% 50%, rgba(40,80,200,0.25), transparent 40%), radial-gradient(ellipse at 50% 80%, rgba(180,40,160,0.15), transparent 35%)" }} />
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            {Array.from({ length: 200 }, (_, i) => (
              <circle key={i} cx={`${rng() * 100}%`} cy={`${rng() * 100}%`} r={rng() > 0.92 ? rng() * 2 + 0.8 : rng() * 1.2 + 0.2} fill="white" opacity={rng() * 0.7 + 0.3} />
            ))}
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
            <line x1="22%" y1="18%" x2="34%" y2="26%" stroke="white" strokeWidth="1.5" />
            <line x1="34%" y1="26%" x2="35%" y2="27%" stroke="white" strokeWidth="0.5" opacity="0.3" />
            <line x1="68%" y1="55%" x2="78%" y2="63%" stroke="white" strokeWidth="1" />
          </svg>
        </div>
      );

    case "Neon Tokyo":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
            {Array.from({ length: 20 }, (_, i) => (
              <React.Fragment key={`h${i}`}>
                <line x1="0" y1={`${(i + 1) * 5}%`} x2="100%" y2={`${(i + 1) * 5}%`} stroke="#ff00ff" strokeWidth="0.5" />
                <line x1="0" y1={`${(i + 1) * 5 + 0.3}%`} x2="100%" y2={`${(i + 1) * 5 + 0.3}%`} stroke="#00ffff" strokeWidth="0.3" />
              </React.Fragment>
            ))}
            {Array.from({ length: 15 }, (_, i) => (
              <React.Fragment key={`v${i}`}>
                <line x1={`${(i + 1) * 6.6}%`} y1="0" x2={`${(i + 1) * 6.6}%`} y2="100%" stroke="#ff00ff" strokeWidth="0.5" />
                <line x1={`${(i + 1) * 6.6 + 0.3}%`} y1="0" x2={`${(i + 1) * 6.6 + 0.3}%`} y2="100%" stroke="#00ffff" strokeWidth="0.3" />
              </React.Fragment>
            ))}
          </svg>
          {[
            { x: "8%", y: "22%", text: "ネオン", color: "#ff00ff", size: 26 },
            { x: "74%", y: "14%", text: "東京", color: "#00ffff", size: 34 },
            { x: "14%", y: "68%", text: "ゲーム", color: "#ff0066", size: 20 },
            { x: "78%", y: "62%", text: "24h", color: "#ffff00", size: 30 },
            { x: "44%", y: "84%", text: "カフェ", color: "#ff6600", size: 22 },
          ].map((sign, i) => (
            <div key={i} style={{
              position: "absolute", left: sign.x, top: sign.y, fontSize: sign.size, color: sign.color, opacity: 0.2,
              fontFamily: "monospace", textShadow: `0 0 20px ${sign.color}, 0 0 40px ${sign.color}`, letterSpacing: "4px",
            }}>{sign.text}</div>
          ))}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% 100%, rgba(255,0,255,0.1), transparent 50%)" }} />
        </div>
      );

    case "Sahara":
      return (
        <div style={base}>
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0 }}>
            <path d="M0 800 Q100 620 250 660 Q400 520 550 590 Q700 420 850 530 Q1000 370 1100 490 Q1150 430 1200 510 L1200 800Z" fill="#c9a040" opacity="0.4" />
            <path d="M0 800 Q150 670 300 710 Q450 570 600 640 Q750 470 900 570 Q1050 400 1150 510 L1200 560 L1200 800Z" fill="#b89030" opacity="0.3" />
          </svg>
          <div style={{ position: "absolute", top: "8%", right: "14%", width: "100px", height: "100px", borderRadius: "50%", background: "radial-gradient(circle, rgba(255,200,60,0.35), transparent 70%)" }} />
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
            {Array.from({ length: 40 }, (_, i) => (
              <circle key={i} cx={`${rng() * 100}%`} cy={`${rng() * 60 + 30}%`} r={rng() * 2 + 0.5} fill="#d4a040" />
            ))}
          </svg>
        </div>
      );

    case "Nordic Frost":
      return (
        <div style={base}>
          <svg width="100%" height="50%" style={{ position: "absolute", top: 0, left: 0, opacity: 0.3 }}>
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
            <path d="M0 80 Q200 30 400 65 Q600 100 800 50 Q1000 0 1200 40 L1200 0 L0 0Z" fill="url(#aurora1)" />
            <path d="M0 120 Q300 65 500 100 Q700 135 900 85 Q1100 30 1200 65 L1200 0 L0 0Z" fill="url(#aurora2)" />
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.25 }}>
            {Array.from({ length: 45 }, (_, i) => {
              const cx = rng() * 100;
              const cy = rng() * 100;
              const s = rng() * 8 + 4;
              return (
                <g key={i} transform={`translate(${cx},${cy})`} opacity={rng() * 0.5 + 0.3}>
                  <line x1={-s} y1="0" x2={s} y2="0" stroke="#c0e0ff" strokeWidth="0.8" />
                  <line x1="0" y1={-s} x2="0" y2={s} stroke="#c0e0ff" strokeWidth="0.8" />
                  <line x1={-s * 0.7} y1={-s * 0.7} x2={s * 0.7} y2={s * 0.7} stroke="#c0e0ff" strokeWidth="0.6" />
                  <line x1={s * 0.7} y1={-s * 0.7} x2={-s * 0.7} y2={s * 0.7} stroke="#c0e0ff" strokeWidth="0.6" />
                </g>
              );
            })}
          </svg>
        </div>
      );

    case "Volcanic":
      return (
        <div style={base}>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "35%", background: "linear-gradient(0deg, rgba(255,40,0,0.25), rgba(255,80,0,0.1) 40%, transparent)" }} />
          <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", inset: 0 }}>
            <path d="M400 800 Q420 700 450 650 Q480 580 500 500 Q520 420 540 350" fill="none" stroke="#ff4400" strokeWidth="6" opacity="0.25" />
            <path d="M500 800 Q530 720 560 660 Q590 580 610 500 Q630 420 650 340" fill="none" stroke="#ff6600" strokeWidth="5" opacity="0.2" />
            <path d="M600 800 Q620 740 640 680 Q660 600 680 520 Q700 440 720 360" fill="none" stroke="#ff3300" strokeWidth="4" opacity="0.2" />
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.35 }}>
            {Array.from({ length: 45 }, (_, i) => (
              <circle key={i} cx={`${25 + rng() * 50}%`} cy={`${45 + rng() * 50}%`} r={rng() * 2.5 + 0.5} fill="#ff6633" opacity={rng() * 0.7 + 0.3} />
            ))}
          </svg>
        </div>
      );

    case "Cherry Coke":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
            {Array.from({ length: 60 }, (_, i) => (
              <circle key={i} cx={`${rng() * 100}%`} cy={`${rng() * 100}%`} r={rng() * 10 + 3} fill="none" stroke="#ff2050" strokeWidth="0.7" />
            ))}
          </svg>
          {[
            { x: "10%", y: "15%", s: 45 },
            { x: "82%", y: "18%", s: 40 },
            { x: "72%", y: "72%", s: 42 },
            { x: "18%", y: "78%", s: 38 },
          ].map((c, i) => (
            <svg key={i} width={c.s} height={c.s} viewBox="0 0 40 40" style={{ position: "absolute", left: c.x, top: c.y, opacity: 0.15 }}>
              <circle cx="14" cy="22" r="7" fill="#cc1133" />
              <circle cx="26" cy="22" r="7" fill="#cc1133" />
              <path d="M14 15 Q20 6 26 15" fill="none" stroke="#228833" strokeWidth="2" />
              <ellipse cx="20" cy="8" rx="5" ry="3" fill="#228833" />
            </svg>
          ))}
        </div>
      );

    case "Matrix":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
            {Array.from({ length: 35 }, (_, col) => {
              const chars = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン0123456789ABCDEF";
              const x = 1 + col * 2.8;
              return (
                <text key={col} x={`${x}%`} y={`${rng() * 30}%`} fill="#00ff41" fontSize="13" fontFamily="monospace" opacity={rng() * 0.4 + 0.3}>
                  {Array.from({ length: 16 }, () => chars[Math.floor(rng() * chars.length)]).join("\n")}
                </text>
              );
            })}
          </svg>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,40,0,0.12), transparent 15%, transparent 85%, rgba(0,40,0,0.08))" }} />
        </div>
      );

    case "Steampunk":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
            <g transform="translate(12%, 18%)">
              <circle cx="0" cy="0" r="90" fill="none" stroke="#b8860b" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="65" fill="none" stroke="#b8860b" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="40" fill="none" stroke="#b8860b" strokeWidth="2" />
              <circle cx="0" cy="0" r="15" fill="#b8860b" opacity="0.4" />
              {Array.from({ length: 14 }, (_, i) => {
                const a = (i / 14) * Math.PI * 2;
                return <line key={i} x1={Math.cos(a) * 40} y1={Math.sin(a) * 40} x2={Math.cos(a) * 90} y2={Math.sin(a) * 90} stroke="#b8860b" strokeWidth="2" />;
              })}
            </g>
            <g transform="translate(85%, 78%)">
              <circle cx="0" cy="0" r="100" fill="none" stroke="#b8860b" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="75" fill="none" stroke="#b8860b" strokeWidth="1.5" />
              <circle cx="0" cy="0" r="50" fill="none" stroke="#b8860b" strokeWidth="2" />
              <circle cx="0" cy="0" r="18" fill="#b8860b" opacity="0.4" />
              {Array.from({ length: 16 }, (_, i) => {
                const a = (i / 16) * Math.PI * 2;
                return <line key={i} x1={Math.cos(a) * 50} y1={Math.sin(a) * 50} x2={Math.cos(a) * 100} y2={Math.sin(a) * 100} stroke="#b8860b" strokeWidth="2" />;
              })}
            </g>
          </svg>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.08 }}>
            {Array.from({ length: 8 }, (_, i) => (
              <circle key={i} cx={`${rng() * 80 + 10}%`} cy={`${rng() * 35 + 10}%`} r={rng() * 35 + 15} fill="#b8860b" />
            ))}
          </svg>
        </div>
      );

    case "Cyberpunk 2077":
      return (
        <div style={base}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.2 }}>
            <line x1="0" y1="100%" x2="100%" y2="0" stroke="#fcee09" strokeWidth="1.5" />
            <line x1="10%" y1="100%" x2="100%" y2="10%" stroke="#fcee09" strokeWidth="0.8" />
            <line x1="0" y1="90%" x2="90%" y2="0" stroke="#fcee09" strokeWidth="0.8" />
            <line x1="20%" y1="100%" x2="100%" y2="20%" stroke="#ff003c" strokeWidth="0.6" />
            <line x1="0" y1="80%" x2="80%" y2="0" stroke="#00f0ff" strokeWidth="0.6" />
          </svg>
          <svg width="100%" height="50%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMax slice" style={{ position: "absolute", bottom: 0, left: 0, opacity: 0.1 }}>
            {Array.from({ length: 12 }, (_, i) => (
              <React.Fragment key={i}>
                <line x1="0" y1={i * 33} x2="800" y2={i * 33} stroke="#fcee09" strokeWidth="0.7" />
                <line x1={i * 67} y1="0" x2={400 - (400 - i * 67) * 0.3} y2="400" stroke="#fcee09" strokeWidth="0.4" />
                <line x1={800 - i * 67} y1="0" x2={400 + (400 - i * 67) * 0.3} y2="400" stroke="#fcee09" strokeWidth="0.4" />
              </React.Fragment>
            ))}
          </svg>
          <div style={{ position: "absolute", top: "8%", left: "6%", fontSize: "72px", color: "#fcee09", opacity: 0.12, fontFamily: "monospace", fontWeight: 900, letterSpacing: "8px", textShadow: "0 0 30px #fcee09" }}>2077</div>
          <div style={{ position: "absolute", bottom: "10%", right: "6%", fontSize: "48px", color: "#ff003c", opacity: 0.1, fontFamily: "monospace", fontWeight: 900, letterSpacing: "6px", textShadow: "0 0 25px #ff003c" }}>NC</div>
        </div>
      );

    case "Detroit: BH":
      return (
        <div style={base}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%, rgba(0,150,255,0.2), transparent 50%)" }} />
          <svg width="100%" height="100%" viewBox="0 0 800 800" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
            <circle cx="400" cy="250" r="25" fill="#00aaff" opacity="0.5" />
            <circle cx="400" cy="250" r="12" fill="#00ddff" opacity="0.7" />
            <line x1="400" y1="275" x2="400" y2="480" stroke="#00aaff" strokeWidth="1.5" />
            {[70, 120, 175, 230, 290].map((r) => (
              <circle key={r} cx="400" cy="400" r={r} fill="none" stroke="#00aaff" strokeWidth="0.7" opacity={0.3 + (r / 290) * 0.3} />
            ))}
            <path d="M100 400 H200 V300 H340" fill="none" stroke="#00aaff" strokeWidth="0.6" opacity="0.35" />
            <path d="M700 400 H600 V500 H460" fill="none" stroke="#00aaff" strokeWidth="0.6" opacity="0.35" />
            <path d="M400 100 V200 H300 V340" fill="none" stroke="#00aaff" strokeWidth="0.6" opacity="0.35" />
            <path d="M400 700 V600 H500 V460" fill="none" stroke="#00aaff" strokeWidth="0.6" opacity="0.35" />
            {[[200, 400], [340, 300], [600, 400], [460, 500], [300, 340], [500, 460]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="3.5" fill="#00aaff" opacity="0.45" />
            ))}
          </svg>
          <div style={{ position: "absolute", bottom: "8%", left: "50%", transform: "translateX(-50%)", fontSize: "26px", color: "#00aaff", opacity: 0.12, fontFamily: "monospace", letterSpacing: "10px", textTransform: "uppercase", textShadow: "0 0 20px #00aaff", whiteSpace: "nowrap" }}>Become Human</div>
        </div>
      );

    default:
      return null;
  }
}
