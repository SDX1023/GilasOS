"use client";
import { useState, useRef, useEffect } from "react";
import { usePet } from "./pet-context";
import { GROWTH_STAGE_NAMES } from "./pet-context";
import { getSpriteUrl, PET_BGS } from "./pet-sprites";
import { ChevronRight, ChevronLeft, Utensils, Moon, Gamepad2, Palette, Upload, X, Sparkles } from "lucide-react";

const ALL_PET_TYPES = ["cat", "dog", "fox", "bunny", "penguin", "owl", "olaf"];

function getGrowthScale(xp: number, stageOverride?: string | null): number {
  const name = stageOverride || (xp < 500 ? "Baby" : xp < 1000 ? "Toddler" : xp < 1500 ? "Teen" : "Adult");
  if (name === "Baby") return 0.7;
  if (name === "Toddler") return 0.85;
  if (name === "Teen") return 1.0;
  return 1.15;
}

export default function PixelPet() {
  const ctx = usePet();
  if (!ctx) return null;
  const { pet, action, feedPet, playWithPet, sleepPet, renamePet, changePetColor, changePetType, changePetBg, setStageOverride, uploadSprite, loading, userEmail, stage, cooldowns } = ctx;
  const [open, setOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showAdopt, setShowAdopt] = useState(false);
  const [rename, setRename] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [editAnswer, setEditAnswer] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isOwner = userEmail === "si.davidsdx@gmail.com";
  const availableTypes = isOwner ? ALL_PET_TYPES : ALL_PET_TYPES.filter((t) => t !== "olaf");
  const isLoggedIn = !!userEmail;

  useEffect(() => {
    if (!pet && !loading && isLoggedIn) setShowAdopt(true);
  }, [pet, loading, isLoggedIn]);

  if (loading) return null;

  if (!pet) {
    if (showAdopt && isLoggedIn) return <AdoptModal onClose={() => setShowAdopt(false)} availableTypes={availableTypes} />;
    return null;
  }

  const sprite = getSpriteUrl(pet, action === "sleeping");
  const xpProgress = stage.next !== null ? ((pet.xp - stage.min) / (stage.max - stage.min)) * 100 : 100;
  const scale = getGrowthScale(pet.xp, pet.stage_override);
  const bg = PET_BGS[pet.bg] || PET_BGS.night;

  const petAnimStyle: React.CSSProperties = {
    imageRendering: "pixelated" as any,
    width: Math.round(56 * scale),
    height: Math.round(56 * scale),
    animation: action === "eating" ? "petShake 0.5s ease-in-out 4"
      : action === "playing" ? "petPlay 0.6s ease-in-out 3"
      : action === "sleeping" ? "petSleep 2.5s ease-in-out infinite"
      : action === "happy" ? "petBounce 0.6s ease-in-out 3"
      : "petIdle 2s ease-in-out infinite",
    transition: "width 0.5s, height 0.5s",
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", right: open ? 260 : 0, top: "50%", transform: "translateY(-50%)",
          zIndex: 101, width: 20, height: 48,
          background: "var(--os-bg)", border: "1px solid rgba(255,255,255,0.1)", borderRight: open ? "none" : undefined,
          borderRadius: "8px 0 0 8px",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.15)", transition: "right 0.25s ease",
          color: "var(--os-text-secondary)",
        }}
      >
        {open ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      <div
        style={{
          position: "fixed", right: 0, top: 0, bottom: 0, width: 260, zIndex: 100,
          background: "var(--os-bg)", borderLeft: "1px solid rgba(255,255,255,0.08)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
          display: "flex", flexDirection: "column",
          boxShadow: open ? "-4px 0 20px rgba(0,0,0,0.2)" : "none",
          overflowY: "auto",
        }}
      >
        {/* Pet Scene Background */}
        <div style={{ position: "relative", width: "100%", height: 130, overflow: "hidden", flexShrink: 0 }}>
          <div style={{ position: "absolute", inset: 0, background: bg.sky }} />
          {/* Stars for night/sakura */}
          {["night", "sakura"].includes(pet.bg || "night") && [...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: "absolute", width: 2, height: 2, borderRadius: "50%",
              background: `rgba(255,255,255,${0.3 + (i % 3) * 0.2})`,
              top: 8 + (i * 13) % 50, left: 15 + (i * 37) % 220,
              animation: `cloudDrift ${3 + i}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }} />
          ))}
          {/* Clouds */}
          <div style={{ position: "absolute", top: 12, left: 20, width: 36, height: 10, borderRadius: 5, background: "rgba(255,255,255,0.06)", animation: "cloudDrift 6s ease-in-out infinite" }} />
          <div style={{ position: "absolute", top: 28, right: 25, width: 28, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.04)", animation: "cloudDrift 8s ease-in-out infinite", animationDelay: "2s" }} />
          {/* Grass */}
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 32 }}>
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 14, background: bg.grass }} />
            <div style={{ position: "absolute", bottom: 14, left: 0, right: 0, height: 6, background: bg.grass.includes("#166534") ? "#166534" : bg.grass.includes("#f1f5f9") ? "#e2e8f0" : "#166534", borderRadius: "4px 4px 0 0" }} />
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{
                position: "absolute", bottom: 14 + (i % 3) * 2, left: 8 + i * 20,
                width: 3, height: 6 + (i % 4) * 2,
                background: bg.grass.includes("#f1f5f9") ? "#cbd5e1" : "#22c55e",
                borderRadius: "2px 2px 0 0",
                animation: `grassSway ${2 + (i % 3)}s ease-in-out infinite`,
                animationDelay: `${i * 0.2}s`, opacity: 0.7,
              }} />
            ))}
          </div>
          {/* Pet Sprite */}
          <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {action === "sleeping" && (
              <div style={{ position: "relative", marginBottom: -4 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{
                    position: "absolute", top: -8 - i * 6, right: -10 + i * 4,
                    fontSize: 10, opacity: 0,
                    animation: `zzzFloat 2s ease-out infinite`, animationDelay: `${i * 0.6}s`,
                    color: "#93c5fd",
                  }}>z</span>
                ))}
              </div>
            )}
            {action === "happy" && (
              <div style={{ position: "relative" }}>
                {[0, 1].map((i) => (
                  <span key={i} style={{
                    position: "absolute", top: -6, left: i === 0 ? -6 : undefined, right: i === 1 ? -6 : undefined,
                    fontSize: 10, opacity: 0,
                    animation: `heartPop 1.2s ease-out infinite`, animationDelay: `${i * 0.3}s`,
                    color: "#f472b6",
                  }}>&#10084;</span>
                ))}
              </div>
            )}
            {action === "eating" && (
              <div style={{ position: "absolute", top: -4, right: -8, fontSize: 12, animation: "heartPop 0.8s ease-out infinite" }}>🐟</div>
            )}
            <img src={sprite} alt={pet.name} style={petAnimStyle} />
          </div>
          {/* Pet Name */}
          <div style={{ position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center" }}>
            {renaming ? (
              <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
                <input autoFocus value={rename} onChange={(e) => setRename(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && rename.trim()) { renamePet(rename.trim()); setRename(""); setRenaming(false); } if (e.key === "Escape") setRenaming(false); }}
                  className="glass-input" style={{ width: 100, padding: "2px 6px", fontSize: 11, textAlign: "center", height: 22 }} />
                <button onClick={() => { if (rename.trim()) { renamePet(rename.trim()); setRename(""); } setRenaming(false); }}
                  style={{ background: "var(--os-accent)", border: "none", borderRadius: 4, color: "#fff", fontSize: 10, padding: "0 6px", cursor: "pointer" }}>OK</button>
              </div>
            ) : (
              <p onClick={() => { setRename(pet.name); setRenaming(true); }} style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.9)", textShadow: "0 1px 4px rgba(0,0,0,0.6)", cursor: "pointer" }} title="Click to rename">
                {pet.name} <span style={{ fontSize: 8, opacity: 0.5 }}>&#9998;</span>
              </p>
            )}
          </div>
        </div>

        {/* Stage + XP Bar */}
        <div style={{ padding: "10px 14px 6px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 500, color: "var(--os-text-secondary)" }}>
              {stage.emoji} {stage.name}
            </span>
            <span style={{ fontSize: 10, color: "var(--os-text-secondary)" }}>
              {pet.xp} XP{stage.next !== null ? ` / ${stage.next}` : ""}
            </span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${xpProgress}%`,
              background: stage.name === "Baby" ? "#22c55e" : stage.name === "Toddler" ? "#3b82f6" : stage.name === "Teen" ? "#f59e0b" : "#8b5cf6",
              borderRadius: 99, transition: "width 0.5s ease",
            }} />
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: 7 }}>
          <StatBar label="Hunger" value={pet.hunger} color="#f59e0b" icon="🍖" />
          <StatBar label="Happiness" value={pet.happiness} color="#ec4899" icon="❤️" />
          <StatBar label="Energy" value={pet.energy} color="#3b82f6" icon="⚡" />
        </div>

        {/* Actions */}
        <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          <CooldownBtn icon={<Utensils size={14} />} label="Feed" sublabel="+30 hunger" onClick={feedPet} color="#f59e0b" cooldown={cooldowns.feed} maxCooldown={30} />
          <CooldownBtn icon={<Gamepad2 size={14} />} label="Play" sublabel="+30 happy, -10 energy" onClick={playWithPet} color="#ec4899" cooldown={cooldowns.play} maxCooldown={30} />
          <CooldownBtn icon={<Moon size={14} />} label="Sleep" sublabel="+40 energy" onClick={sleepPet} color="#3b82f6" cooldown={cooldowns.sleep} maxCooldown={60} />
          <ActionBtn icon={<Palette size={14} />} label="Customize" sublabel="Name, type, color, BG" onClick={() => setShowCustomize(true)} color="#8b5cf6" />
        </div>

        {/* Mood */}
        <div style={{ padding: "12px 14px", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 11, color: "var(--os-text-secondary)", textAlign: "center" }}>
            {pet.mood === "happy" ? "Feeling great!" : pet.mood === "sad" ? "Needs attention..." : "Just vibing~"}
          </p>
        </div>
      </div>

      {showCustomize && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowCustomize(false)}>
          <div className="glass-panel" style={{ padding: 20, width: 300, borderRadius: 14, maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ fontWeight: 600, fontSize: 14, color: "var(--os-text-primary)" }}>Customize {pet.name}</h3>
              <button onClick={() => setShowCustomize(false)} style={{ background: "none", border: "none", color: "var(--os-text-secondary)", cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "var(--os-text-secondary)", marginBottom: 4, display: "block" }}>Name</label>
                <div style={{ display: "flex", gap: 6 }}>
                  <input value={rename || pet.name} onChange={(e) => setRename(e.target.value)} className="glass-input" style={{ flex: 1, padding: "6px 8px", fontSize: 12 }} />
                  <button onClick={() => { if (rename.trim()) renamePet(rename.trim()); setRename(""); }} className="glass-btn-primary" style={{ padding: "6px 10px", fontSize: 11 }}>Save</button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "var(--os-text-secondary)", marginBottom: 6, display: "block" }}>Pet Type</label>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {availableTypes.map((t) => (
                    <button key={t} onClick={() => changePetType(t)} style={{
                      width: 40, height: 40, borderRadius: 8, padding: 3,
                      background: pet.pet_type === t ? "var(--os-accent)" : "rgba(255,255,255,0.05)",
                      border: pet.pet_type === t ? "2px solid var(--os-accent)" : "2px solid rgba(255,255,255,0.08)",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }} title={t}>
                      <img src={getSpriteUrl({ pet_type: t, color: pet.color, sprite_url: null })} alt={t} width={28} height={28} style={{ imageRendering: "pixelated" }} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "var(--os-text-secondary)", marginBottom: 6, display: "block" }}>Color</label>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {["#f59e0b","#ef4444","#3b82f6","#10b981","#8b5cf6","#ec4899","#6b7280","#f97316"].map((c) => (
                    <button key={c} onClick={() => changePetColor(c)} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: pet.color === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "var(--os-text-secondary)", marginBottom: 6, display: "block" }}>Background</label>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {Object.entries(PET_BGS).map(([key, val]) => (
                    <button key={key} onClick={() => changePetBg(key)} style={{
                      width: 40, height: 28, borderRadius: 6, padding: 0, overflow: "hidden",
                      background: val.sky, border: (pet.bg || "night") === key ? "2px solid #fff" : "2px solid rgba(255,255,255,0.08)",
                      cursor: "pointer", fontSize: 10, display: "flex", alignItems: "flex-end", justifyContent: "center",
                      color: "#fff", textShadow: "0 1px 2px rgba(0,0,0,0.5)", paddingBottom: 1,
                    }} title={val.name}>
                      {val.emoji}
                    </button>
                  ))}
                </div>
              </div>
              {isOwner && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: "var(--os-text-secondary)", marginBottom: 6, display: "block" }}>Age Override (Admin)</label>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {GROWTH_STAGE_NAMES.map((s) => (
                      <button key={s} onClick={() => setStageOverride(pet.stage_override === s ? null : s)} style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: 11,
                        background: pet.stage_override === s ? "var(--os-accent)" : "rgba(255,255,255,0.05)",
                        border: pet.stage_override === s ? "2px solid var(--os-accent)" : "2px solid rgba(255,255,255,0.08)",
                        cursor: "pointer", color: "var(--os-text-primary)",
                      }}>
                        {s === "Baby" ? "🥚" : s === "Toddler" ? "🐾" : s === "Teen" ? "⭐" : "👑"} {s}
                      </button>
                    ))}
                    {pet.stage_override && (
                      <button onClick={() => setStageOverride(null)} style={{
                        padding: "4px 10px", borderRadius: 6, fontSize: 11,
                        background: "rgba(239,68,68,0.1)", border: "2px solid rgba(239,68,68,0.2)",
                        cursor: "pointer", color: "#ef4444",
                      }}>Reset</button>
                    )}
                  </div>
                  <p style={{ fontSize: 10, color: "var(--os-text-dim)", marginTop: 4 }}>
                    {pet.stage_override ? `Forced: ${pet.stage_override} (overrides XP)` : "Auto from XP"}
                  </p>
                </div>
              )}
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "var(--os-text-secondary)", marginBottom: 6, display: "block" }}>Upload Photo</label>
                <button onClick={() => fileRef.current?.click()} className="glass-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", fontSize: 11, width: "100%", justifyContent: "center" }}>
                  <Upload size={12} /> Choose image (BG removed + pixelated)
                </button>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSprite(f); }} />
              </div>
              {pet.sprite_url && (
                <button onClick={() => { getSupabase().from("user_pets").update({ sprite_url: null }).eq("id", pet.id); }} className="glass-btn" style={{ fontSize: 11, padding: "6px 10px" }}>
                  Reset to default sprite
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showAdopt && isLoggedIn && <AdoptModal onClose={() => setShowAdopt(false)} availableTypes={availableTypes} />}
    </>
  );
}

function AdoptModal({ onClose, availableTypes }: { onClose: () => void; availableTypes: string[] }) {
  const ctx = usePet();
  if (!ctx) return null;
  const { createPet } = ctx;
  const [name, setName] = useState("Buddy");
  const [type, setType] = useState(availableTypes[0] || "cat");
  const [color, setColor] = useState("#f59e0b");

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="glass-panel" style={{ padding: 24, width: 320, borderRadius: 16, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        <Sparkles size={28} style={{ color: "var(--os-accent)" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--os-text-primary)" }}>Adopt a Pet!</h2>
        <p className="text-sm" style={{ color: "var(--os-text-secondary)", textAlign: "center" }}>Your study companion grows as you study.</p>
        <div style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img src={getSpriteUrl({ pet_type: type, color, sprite_url: null })} alt="preview" width={64} height={64} style={{ imageRendering: "pixelated" }} />
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
          {availableTypes.map((t) => (
            <button key={t} onClick={() => setType(t)} style={{ width: 44, height: 44, borderRadius: 10, background: type === t ? "var(--os-accent)" : "rgba(255,255,255,0.05)", border: type === t ? "2px solid var(--os-accent)" : "2px solid rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4 }} title={t}>
              <img src={getSpriteUrl({ pet_type: t, color: type === t ? "#fff" : color, sprite_url: null })} alt={t} width={32} height={32} style={{ imageRendering: "pixelated" }} />
            </button>
          ))}
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} className="glass-input" style={{ width: "100%", padding: "8px 10px", fontSize: 13, textAlign: "center" }} placeholder="Name your pet..." />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
          {["#f59e0b","#ef4444","#3b82f6","#10b981","#8b5cf6","#ec4899","#6b7280","#f97316"].map((c) => (
            <button key={c} onClick={() => setColor(c)} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: color === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }} />
          ))}
        </div>
        <button onClick={() => { createPet(name, type, color); onClose(); }} className="glass-btn-primary" style={{ width: "100%", padding: "10px", fontWeight: 600, fontSize: 13 }}>
          Adopt {name}!
        </button>
      </div>
    </div>
  );
}

function StatBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
        <span style={{ fontSize: 11, color: "var(--os-text-secondary)" }}>{icon} {label}</span>
        <span style={{ fontSize: 11, color: "var(--os-text-secondary)" }}>{value}%</span>
      </div>
      <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function CooldownBtn({ icon, label, sublabel, onClick, color, cooldown, maxCooldown }: {
  icon: React.ReactNode; label: string; sublabel: string; onClick: () => void; color: string; cooldown: number; maxCooldown: number;
}) {
  const ready = cooldown <= 0;
  const pct = ready ? 100 : ((maxCooldown - cooldown) / maxCooldown) * 100;
  return (
    <button onClick={onClick} disabled={!ready} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
      background: ready ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.01)",
      border: "1px solid " + (ready ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)"),
      cursor: ready ? "pointer" : "not-allowed",
      transition: "all 0.15s", textAlign: "left", width: "100%",
      opacity: ready ? 1 : 0.5, position: "relative", overflow: "hidden",
    }}
      onMouseEnter={(e) => { if (ready) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
      onMouseLeave={(e) => { if (ready) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
    >
      {!ready && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: `${pct}%`, background: color + "0d", animation: "cooldownPulse 1.5s ease-in-out infinite" }} />}
      <div style={{ width: 30, height: 30, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0, position: "relative" }}>
        {icon}
        {!ready && <div style={{ position: "absolute", inset: 0, borderRadius: 8, border: `2px solid ${color}`, borderRightColor: "transparent", animation: "spin 1s linear infinite", opacity: 0.6 }} />}
      </div>
      <div style={{ position: "relative", flex: 1 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-primary)" }}>{label}</p>
        <p style={{ fontSize: 10, color: "var(--os-text-secondary)" }}>{ready ? sublabel : `Ready in ${cooldown}s`}</p>
      </div>
    </button>
  );
}

function ActionBtn({ icon, label, sublabel, onClick, color }: { icon: React.ReactNode; label: string; sublabel: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
      cursor: "pointer", transition: "all 0.15s", textAlign: "left", width: "100%",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
    >
      <div style={{ width: 30, height: 30, borderRadius: 8, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-primary)" }}>{label}</p>
        <p style={{ fontSize: 10, color: "var(--os-text-secondary)" }}>{sublabel}</p>
      </div>
    </button>
  );
}

function getSupabase() {
  return require("@/lib/supabase").getSupabase();
}
