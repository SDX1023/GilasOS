"use client";
import { useState, useRef, useEffect } from "react";
import { usePet } from "./pet-context";
import { ChevronRight, ChevronLeft, Utensils, Moon, Gamepad2, Palette, Upload, X, Sparkles } from "lucide-react";

const PET_SVG: Record<string, (color: string) => string> = {
  cat: (c) => `<svg viewBox="0 0 32 32" width="64" height="64"><rect x="8" y="4" width="4" height="6" fill="${c}"/><rect x="20" y="4" width="4" height="6" fill="${c}"/><rect x="6" y="8" width="20" height="16" rx="4" fill="${c}"/><rect x="10" y="12" width="4" height="4" rx="1" fill="#111"/><rect x="18" y="12" width="4" height="4" rx="1" fill="#111"/><rect x="14" y="18" width="4" height="2" rx="1" fill="#111"/><rect x="8" y="28" width="4" height="4" fill="${c}"/><rect x="20" y="28" width="4" height="4" fill="${c}"/><rect x="26" y="18" width="6" height="3" fill="${c}"/></svg>`,
  dog: (c) => `<svg viewBox="0 0 32 32" width="64" height="64"><rect x="4" y="6" width="6" height="10" rx="2" fill="${c}"/><rect x="22" y="6" width="6" height="10" rx="2" fill="${c}"/><rect x="6" y="8" width="20" height="16" rx="4" fill="${c}"/><rect x="10" y="12" width="4" height="4" rx="1" fill="#111"/><rect x="18" y="12" width="4" height="4" rx="1" fill="#111"/><rect x="13" y="18" width="6" height="4" rx="2" fill="#111"/><rect x="8" y="28" width="4" height="4" fill="${c}"/><rect x="20" y="28" width="4" height="4" fill="${c}"/></svg>`,
  fox: (c) => `<svg viewBox="0 0 32 32" width="64" height="64"><rect x="6" y="2" width="4" height="8" fill="${c}"/><rect x="22" y="2" width="4" height="8" fill="${c}"/><rect x="6" y="8" width="20" height="14" rx="4" fill="${c}"/><rect x="10" y="12" width="4" height="3" rx="1" fill="#111"/><rect x="18" y="12" width="4" height="3" rx="1" fill="#111"/><rect x="14" y="17" width="4" height="3" rx="1" fill="#111"/><rect x="8" y="22" width="16" height="4" fill="#fff"/><rect x="8" y="28" width="4" height="4" fill="${c}"/><rect x="20" y="28" width="4" height="4" fill="${c}"/></svg>`,
  bunny: (c) => `<svg viewBox="0 0 32 32" width="64" height="64"><rect x="10" y="0" width="3" height="10" rx="1" fill="${c}"/><rect x="19" y="0" width="3" height="10" rx="1" fill="${c}"/><rect x="7" y="8" width="18" height="16" rx="6" fill="${c}"/><rect x="11" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="18" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="14" y="18" width="4" height="2" rx="1" fill="#f9a8d4"/><rect x="8" y="28" width="4" height="4" fill="${c}"/><rect x="20" y="28" width="4" height="4" fill="${c}"/></svg>`,
  penguin: (c) => `<svg viewBox="0 0 32 32" width="64" height="64"><rect x="6" y="4" width="20" height="22" rx="6" fill="#111"/><rect x="10" y="10" width="12" height="14" rx="4" fill="#fff"/><rect x="11" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="18" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="14" y="17" width="4" height="2" rx="1" fill="${c}"/><rect x="6" y="14" width="3" height="8" fill="#111"/><rect x="23" y="14" width="3" height="8" fill="#111"/><rect x="10" y="28" width="4" height="4" fill="${c}"/><rect x="18" y="28" width="4" height="4" fill="${c}"/></svg>`,
  owl: (c) => `<svg viewBox="0 0 32 32" width="64" height="64"><rect x="4" y="4" width="8" height="6" fill="${c}"/><rect x="20" y="4" width="8" height="6" fill="${c}"/><rect x="4" y="8" width="24" height="18" rx="4" fill="${c}"/><rect x="8" y="10" width="7" height="7" rx="3" fill="#fff"/><rect x="17" y="10" width="7" height="7" rx="3" fill="#fff"/><rect x="10" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="19" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="14" y="17" width="4" height="3" rx="1" fill="${c === '#f59e0b' ? '#f97316' : c}"/><rect x="6" y="22" width="6" height="4" fill="${c}"/><rect x="20" y="22" width="6" height="4" fill="${c}"/><rect x="10" y="28" width="4" height="4" fill="#f97316"/><rect x="18" y="28" width="4" height="4" fill="#f97316"/></svg>`,
};

function getSpriteUrl(pet: any): string | null {
  if (pet.sprite_url) return pet.sprite_url;
  return `data:image/svg+xml,${encodeURIComponent((PET_SVG[pet.pet_type] || PET_SVG.cat)(pet.color))}`;
}

export default function PixelPet() {
  const ctx = usePet();
  if (!ctx) return null;
  const { pet, action, feedPet, playWithPet, sleepPet, renamePet, changePetColor, uploadSprite, loading } = ctx;
  const [open, setOpen] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [showAdopt, setShowAdopt] = useState(false);
  const [rename, setRename] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pet && !loading) setShowAdopt(true);
  }, [pet, loading]);

  if (loading || !pet) return null;

  const sprite = getSpriteUrl(pet) || "";

  return (
    <>
      {/* Side toggle arrow — fixed right edge, centered vertically */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "fixed", right: open ? 250 : 0, top: "50%", transform: "translateY(-50%)",
          zIndex: 101, width: 20, height: 48,
          background: "var(--os-bg)", border: "1px solid rgba(255,255,255,0.1)", borderRight: open ? "none" : "1px solid rgba(255,255,255,0.1)",
          borderRadius: open ? "8px 0 0 8px" : "8px 0 0 8px",
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "-2px 0 8px rgba(0,0,0,0.15)", transition: "right 0.25s ease",
          color: "var(--os-text-secondary)",
        }}
      >
        {open ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Side panel — slides from right */}
      <div
        style={{
          position: "fixed", right: 0, top: 0, bottom: 0, width: 250, zIndex: 100,
          background: "var(--os-bg)", borderLeft: "1px solid rgba(255,255,255,0.08)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.25s ease",
          display: "flex", flexDirection: "column",
          boxShadow: open ? "-4px 0 20px rgba(0,0,0,0.2)" : "none",
          overflowY: "auto",
        }}
      >
        {/* Pet header */}
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src={sprite} alt={pet.name} width={44} height={44} style={{ imageRendering: "pixelated", borderRadius: 10, background: "rgba(255,255,255,0.05)", padding: 2 }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 600, fontSize: 14, color: "var(--os-text-primary)" }}>{pet.name}</p>
              <p className="text-xs" style={{ color: "var(--os-text-secondary)" }}>Lv.{pet.level} {pet.pet_type}</p>
            </div>
            <button onClick={() => setShowCustomize(true)} style={{ background: "none", border: "none", color: "var(--os-text-secondary)", cursor: "pointer", padding: 4 }}>
              <Palette size={14} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: "12px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
          <StatRow label="Hunger" value={pet.hunger} color="#f59e0b" icon="🍖" />
          <StatRow label="Happiness" value={pet.happiness} color="#ec4899" icon="💖" />
          <StatRow label="Energy" value={pet.energy} color="#3b82f6" icon="⚡" />
        </div>

        {/* Action buttons */}
        <div style={{ padding: "0 14px", display: "flex", flexDirection: "column", gap: 6 }}>
          <ActionBtn icon={<Utensils size={14} />} label="Feed" sublabel="+30 hunger" onClick={feedPet} color="#f59e0b" />
          <ActionBtn icon={<Gamepad2 size={14} />} label="Play" sublabel="+30 happy, -10 energy" onClick={playWithPet} color="#ec4899" />
          <ActionBtn icon={<Moon size={14} />} label="Sleep" sublabel="+40 energy" onClick={sleepPet} color="#3b82f6" />
        </div>

        {/* Mood */}
        <div style={{ padding: "14px", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ fontSize: 11, color: "var(--os-text-secondary)", textAlign: "center" }}>
            {action === "eating" ? "Nom nom nom! 🐟" : action === "playing" ? "Wheee! 🧶" : action === "sleeping" ? "Zzz... 💤" : pet.mood === "happy" ? "Feeling great! ✨" : pet.mood === "sad" ? "Needs attention... 💔" : "Just vibing~ 😌"}
          </p>
        </div>
      </div>

      {/* Customize modal */}
      {showCustomize && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowCustomize(false)}>
          <div className="glass-panel" style={{ padding: 20, width: 300, borderRadius: 14 }} onClick={(e) => e.stopPropagation()}>
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
                <label style={{ fontSize: 11, fontWeight: 500, color: "var(--os-text-secondary)", marginBottom: 6, display: "block" }}>Color</label>
                <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                  {["#f59e0b","#ef4444","#3b82f6","#10b981","#8b5cf6","#ec4899","#6b7280","#f97316"].map((c) => (
                    <button key={c} onClick={() => changePetColor(c)} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: pet.color === c ? "2px solid #fff" : "2px solid transparent", cursor: "pointer" }} />
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 500, color: "var(--os-text-secondary)", marginBottom: 6, display: "block" }}>Upload Photo as Pet</label>
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

      {showAdopt && <AdoptModal onClose={() => setShowAdopt(false)} />}
    </>
  );
}

function StatRow({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span style={{ fontSize: 11, color: "var(--os-text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>{icon} {label}</span>
        <span style={{ fontSize: 11, color: "var(--os-text-secondary)" }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, borderRadius: 99, transition: "width 0.4s ease" }} />
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, sublabel, onClick, color }: { icon: React.ReactNode; label: string; sublabel: string; onClick: () => void; color: string }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
      cursor: "pointer", transition: "all 0.15s", textAlign: "left", width: "100%",
    }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = color + "40"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
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

function AdoptModal({ onClose }: { onClose: () => void }) {
  const ctx = usePet();
  if (!ctx) return null;
  const { createPet } = ctx;
  const { PET_TYPES, PET_COLORS } = require("./pet-context");
  const [name, setName] = useState("Buddy");
  const [type, setType] = useState("cat");
  const [color, setColor] = useState("#f59e0b");

  const makeSvg = (t: string, c: string) => {
    const map: Record<string, (c: string) => string> = {
      cat: (c) => `<svg viewBox="0 0 32 32" width="40" height="40"><rect x="8" y="4" width="4" height="6" fill="${c}"/><rect x="20" y="4" width="4" height="6" fill="${c}"/><rect x="6" y="8" width="20" height="16" rx="4" fill="${c}"/><rect x="10" y="12" width="4" height="4" rx="1" fill="#111"/><rect x="18" y="12" width="4" height="4" rx="1" fill="#111"/><rect x="14" y="18" width="4" height="2" rx="1" fill="#111"/><rect x="8" y="28" width="4" height="4" fill="${c}"/><rect x="20" y="28" width="4" height="4" fill="${c}"/></svg>`,
      dog: (c) => `<svg viewBox="0 0 32 32" width="40" height="40"><rect x="4" y="6" width="6" height="10" rx="2" fill="${c}"/><rect x="22" y="6" width="6" height="10" rx="2" fill="${c}"/><rect x="6" y="8" width="20" height="16" rx="4" fill="${c}"/><rect x="10" y="12" width="4" height="4" rx="1" fill="#111"/><rect x="18" y="12" width="4" height="4" rx="1" fill="#111"/><rect x="13" y="18" width="6" height="4" rx="2" fill="#111"/><rect x="8" y="28" width="4" height="4" fill="${c}"/><rect x="20" y="28" width="4" height="4" fill="${c}"/></svg>`,
      fox: (c) => `<svg viewBox="0 0 32 32" width="40" height="40"><rect x="6" y="2" width="4" height="8" fill="${c}"/><rect x="22" y="2" width="4" height="8" fill="${c}"/><rect x="6" y="8" width="20" height="14" rx="4" fill="${c}"/><rect x="10" y="12" width="4" height="3" rx="1" fill="#111"/><rect x="18" y="12" width="4" height="3" rx="1" fill="#111"/><rect x="8" y="28" width="4" height="4" fill="${c}"/><rect x="20" y="28" width="4" height="4" fill="${c}"/></svg>`,
      bunny: (c) => `<svg viewBox="0 0 32 32" width="40" height="40"><rect x="10" y="0" width="3" height="10" rx="1" fill="${c}"/><rect x="19" y="0" width="3" height="10" rx="1" fill="${c}"/><rect x="7" y="8" width="18" height="16" rx="6" fill="${c}"/><rect x="11" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="18" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="8" y="28" width="4" height="4" fill="${c}"/><rect x="20" y="28" width="4" height="4" fill="${c}"/></svg>`,
      penguin: (c) => `<svg viewBox="0 0 32 32" width="40" height="40"><rect x="6" y="4" width="20" height="22" rx="6" fill="#111"/><rect x="10" y="10" width="12" height="14" rx="4" fill="#fff"/><rect x="11" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="18" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="14" y="17" width="4" height="2" rx="1" fill="${c}"/><rect x="10" y="28" width="4" height="4" fill="${c}"/><rect x="18" y="28" width="4" height="4" fill="${c}"/></svg>`,
      owl: (c) => `<svg viewBox="0 0 32 32" width="40" height="40"><rect x="4" y="4" width="8" height="6" fill="${c}"/><rect x="20" y="4" width="8" height="6" fill="${c}"/><rect x="4" y="8" width="24" height="18" rx="4" fill="${c}"/><rect x="8" y="10" width="7" height="7" rx="3" fill="#fff"/><rect x="17" y="10" width="7" height="7" rx="3" fill="#fff"/><rect x="10" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="19" y="12" width="3" height="3" rx="1" fill="#111"/><rect x="10" y="28" width="4" height="4" fill="#f97316"/><rect x="18" y="28" width="4" height="4" fill="#f97316"/></svg>`,
    };
    return (map[t] || map.cat)(c);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="glass-panel" style={{ padding: 24, width: 320, borderRadius: 16, display: "flex", flexDirection: "column", gap: 14, alignItems: "center" }}>
        <Sparkles size={28} style={{ color: "var(--os-accent)" }} />
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "var(--os-text-primary)" }}>Adopt a Pet!</h2>
        <p className="text-sm" style={{ color: "var(--os-text-secondary)", textAlign: "center" }}>Your study companion grows as you study.</p>
        <div dangerouslySetInnerHTML={{ __html: makeSvg(type, color) }} style={{ imageRendering: "pixelated" }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 4 }}>
          {PET_TYPES.map((t: string) => (
            <button key={t} onClick={() => setType(t)} style={{ width: 36, height: 36, borderRadius: 8, background: type === t ? "var(--os-accent)" : "rgba(255,255,255,0.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={t}>
              <div dangerouslySetInnerHTML={{ __html: makeSvg(t, type === t ? "#fff" : color) }} style={{ imageRendering: "pixelated", width: 28, height: 28 }} />
            </button>
          ))}
        </div>
        <input value={name} onChange={(e) => setName(e.target.value)} className="glass-input" style={{ width: "100%", padding: "8px 10px", fontSize: 13, textAlign: "center" }} placeholder="Name your pet..." />
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "center" }}>
          {PET_COLORS.map((c: string) => (
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

function getSupabase() {
  return require("@/lib/supabase").getSupabase();
}
