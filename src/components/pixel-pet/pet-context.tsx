"use client";
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getSupabase } from "@/lib/supabase";

export interface Pet {
  id: string;
  name: string;
  pet_type: string;
  color: string;
  sprite_url: string | null;
  level: number;
  xp: number;
  hunger: number;
  happiness: number;
  energy: number;
  mood: string;
  last_fed_at: string;
  last_played_at: string;
  last_slept_at: string;
}

export type PetAction = "idle" | "walking" | "eating" | "playing" | "sleeping" | "happy" | "sad";

export interface GrowthStage {
  name: string;
  emoji: string;
  min: number;
  max: number;
  next: number | null;
}

export interface Cooldowns {
  feed: number;
  play: number;
  sleep: number;
}

interface PetContextType {
  pet: Pet | null;
  action: PetAction;
  setAction: (a: PetAction) => void;
  feedPet: () => Promise<void>;
  playWithPet: () => Promise<void>;
  sleepPet: () => Promise<void>;
  createPet: (name: string, pet_type: string, color: string) => Promise<void>;
  renamePet: (name: string) => Promise<void>;
  changePetColor: (color: string) => Promise<void>;
  uploadSprite: (file: File) => Promise<void>;
  addXP: (amount: number) => Promise<void>;
  loading: boolean;
  userEmail: string | null;
  stage: GrowthStage;
  cooldowns: Cooldowns;
}

const PetContext = createContext<PetContextType | null>(null);

export function usePet() {
  return useContext(PetContext);
}

const COOLDOWN_SECS = { feed: 30, play: 30, sleep: 60 };

function clamp(v: number) { return Math.max(0, Math.min(100, v)); }

function calcMood(pet: Pet): string {
  const avg = (pet.hunger + pet.happiness + pet.energy) / 3;
  if (avg >= 70) return "happy";
  if (avg >= 40) return "neutral";
  return "sad";
}

export function getGrowthStage(xp: number): GrowthStage {
  if (xp < 500) return { name: "Baby", emoji: "🥚", min: 0, max: 500, next: 500 };
  if (xp < 1000) return { name: "Toddler", emoji: "🐾", min: 500, max: 1000, next: 1000 };
  if (xp < 1500) return { name: "Teen", emoji: "⭐", min: 1000, max: 1500, next: 1500 };
  return { name: "Adult", emoji: "👑", min: 1500, max: Infinity, next: null };
}

function getCooldownRemaining(lastAction: string, cooldownSec: number): number {
  const elapsed = (Date.now() - new Date(lastAction).getTime()) / 1000;
  return Math.max(0, cooldownSec - Math.floor(elapsed));
}

export function PetProvider({ children }: { children: React.ReactNode }) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [action, setAction] = useState<PetAction>("idle");
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [cooldowns, setCooldowns] = useState<Cooldowns>({ feed: 0, play: 0, sleep: 0 });
  const decayRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPet = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      setUserEmail(user.email ?? null);

      const { data } = await supabase.from("user_pets").select("*").eq("user_id", user.id).maybeSingle();
      if (data) {
        const now = Date.now();
        const minsSinceFed = (now - new Date(data.last_fed_at).getTime()) / 60000;
        const minsSincePlayed = (now - new Date(data.last_played_at).getTime()) / 60000;
        const minsSinceSlept = (now - new Date(data.last_slept_at).getTime()) / 60000;
        data.hunger = clamp(data.hunger - Math.floor(minsSinceFed * 0.3));
        data.happiness = clamp(data.happiness - Math.floor(minsSincePlayed * 0.2));
        data.energy = clamp(data.energy - Math.floor(minsSinceSlept * 0.25));
        data.mood = calcMood(data);

        const { data: stats } = await supabase
          .from("study_stats").select("known, forgot, cards_total, date").eq("user_id", user.id);
        if (stats && stats.length > 0) {
          const totalKnown = stats.reduce((s, r) => s + (r.known || 0), 0);
          const uniqueDays = new Set(stats.map((r: any) => r.date)).size;
          const sorted = stats.map((r: any) => r.date).sort().reverse();
          let streak = 0;
          const d = new Date(); d.setHours(0, 0, 0, 0);
          for (let i = 0; i < sorted.length; i++) {
            const exp = new Date(d); exp.setDate(exp.getDate() - i);
            if (sorted[i] === exp.toDateString()) streak++; else break;
          }
          const points = totalKnown * 10 + streak * 50 + uniqueDays * 5;
          if (points !== data.xp) {
            data.xp = points;
            void supabase.from("user_pets").update({ xp: points }).eq("id", data.id);
          }
        }
        setPet(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadPet(); }, [loadPet]);

  useEffect(() => {
    if (!pet) return;
    decayRef.current = setInterval(() => {
      setPet((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          hunger: clamp(prev.hunger - 1),
          happiness: clamp(prev.happiness - 1),
          energy: clamp(prev.energy - 1),
          mood: calcMood({ ...prev, hunger: clamp(prev.hunger - 1), happiness: clamp(prev.happiness - 1), energy: clamp(prev.energy - 1) }),
        };
        const supabase = getSupabase();
        void supabase.from("user_pets").update({ hunger: updated.hunger, happiness: updated.happiness, energy: updated.energy, mood: updated.mood }).eq("id", prev.id);
        return updated;
      });
    }, 60000);
    return () => { if (decayRef.current) clearInterval(decayRef.current); };
  }, [pet?.id]);

  useEffect(() => {
    cooldownRef.current = setInterval(() => {
      setPet((prev) => {
        if (!prev) return prev;
        return { ...prev };
      });
    }, 1000);
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  useEffect(() => {
    if (!pet) return;
    setCooldowns({
      feed: getCooldownRemaining(pet.last_fed_at, COOLDOWN_SECS.feed),
      play: getCooldownRemaining(pet.last_played_at, COOLDOWN_SECS.play),
      sleep: getCooldownRemaining(pet.last_slept_at, COOLDOWN_SECS.sleep),
    });
    const t = setInterval(() => {
      setCooldowns({
        feed: getCooldownRemaining(pet.last_fed_at, COOLDOWN_SECS.feed),
        play: getCooldownRemaining(pet.last_played_at, COOLDOWN_SECS.play),
        sleep: getCooldownRemaining(pet.last_slept_at, COOLDOWN_SECS.sleep),
      });
    }, 1000);
    return () => clearInterval(t);
  }, [pet?.last_fed_at, pet?.last_played_at, pet?.last_slept_at]);

  const feedPet = useCallback(async () => {
    if (!pet) return;
    if (getCooldownRemaining(pet.last_fed_at, COOLDOWN_SECS.feed) > 0) return;
    const supabase = getSupabase();
    const updated = { ...pet, hunger: clamp(pet.hunger + 30), last_fed_at: new Date().toISOString() };
    updated.mood = calcMood(updated);
    setPet(updated);
    setAction("eating");
    setTimeout(() => setAction("idle"), 2000);
    await supabase.from("user_pets").update({ hunger: updated.hunger, last_fed_at: updated.last_fed_at, mood: updated.mood }).eq("id", pet.id);
  }, [pet]);

  const playWithPet = useCallback(async () => {
    if (!pet) return;
    if (getCooldownRemaining(pet.last_played_at, COOLDOWN_SECS.play) > 0) return;
    const supabase = getSupabase();
    const updated = { ...pet, happiness: clamp(pet.happiness + 30), energy: clamp(pet.energy - 10), last_played_at: new Date().toISOString() };
    updated.mood = calcMood(updated);
    setPet(updated);
    setAction("playing");
    setTimeout(() => setAction("idle"), 2500);
    await supabase.from("user_pets").update({ happiness: updated.happiness, energy: updated.energy, last_played_at: updated.last_played_at, mood: updated.mood }).eq("id", pet.id);
  }, [pet]);

  const sleepPet = useCallback(async () => {
    if (!pet) return;
    if (getCooldownRemaining(pet.last_slept_at, COOLDOWN_SECS.sleep) > 0) return;
    const supabase = getSupabase();
    const updated = { ...pet, energy: clamp(pet.energy + 40), last_slept_at: new Date().toISOString() };
    updated.mood = calcMood(updated);
    setPet(updated);
    setAction("sleeping");
    setTimeout(() => setAction("idle"), 3000);
    await supabase.from("user_pets").update({ energy: updated.energy, last_slept_at: updated.last_slept_at, mood: updated.mood }).eq("id", pet.id);
  }, [pet]);

  const createPet = useCallback(async (name: string, pet_type: string, color: string, sprite_url?: string) => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("user_pets").insert({ user_id: user.id, name, pet_type, color, sprite_url: sprite_url || null }).select().single();
    if (data) setPet(data);
  }, []);

  const renamePet = useCallback(async (name: string) => {
    if (!pet) return;
    setPet({ ...pet, name });
    await getSupabase().from("user_pets").update({ name }).eq("id", pet.id);
  }, [pet]);

  const changePetColor = useCallback(async (color: string) => {
    if (!pet) return;
    setPet({ ...pet, color });
    await getSupabase().from("user_pets").update({ color }).eq("id", pet.id);
  }, [pet]);

  const uploadSprite = useCallback(async (file: File) => {
    if (!pet) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    await new Promise<void>((resolve) => { img.onload = () => resolve(); img.src = url; });

    const sample = document.createElement("canvas");
    const sctx = sample.getContext("2d")!;
    sample.width = img.width;
    sample.height = img.height;
    sctx.drawImage(img, 0, 0);
    const full = sctx.getImageData(0, 0, img.width, img.height);
    const corners = [
      [0, 0], [img.width - 1, 0], [0, img.height - 1], [img.width - 1, img.height - 1],
    ];
    let rSum = 0, gSum = 0, bSum = 0;
    corners.forEach(([cx, cy]) => {
      const i = (cy * img.width + cx) * 4;
      rSum += full.data[i]; gSum += full.data[i + 1]; bSum += full.data[i + 2];
    });
    const bgR = Math.round(rSum / 4);
    const bgG = Math.round(gSum / 4);
    const bgB = Math.round(bSum / 4);
    const threshold = 60;
    for (let i = 0; i < full.data.length; i += 4) {
      const dr = full.data[i] - bgR;
      const dg = full.data[i + 1] - bgG;
      const db = full.data[i + 2] - bgB;
      if (Math.sqrt(dr * dr + dg * dg + db * db) < threshold) {
        full.data[i + 3] = 0;
      }
    }
    sctx.putImageData(full, 0, 0);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = 32;
    canvas.height = 32;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sample, 0, 0, 32, 32);
    URL.revokeObjectURL(url);

    const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), "image/png"));
    const path = `pet-sprites/${pet.id}.png`;
    await getSupabase().storage.from("avatars").upload(path, blob, { upsert: true });
    const { data: urlData } = getSupabase().storage.from("avatars").getPublicUrl(path);
    const sprite_url = urlData.publicUrl + "?t=" + Date.now();
    setPet({ ...pet, sprite_url });
    await getSupabase().from("user_pets").update({ sprite_url }).eq("id", pet.id);
  }, [pet]);

  const addXP = useCallback(async (amount: number) => {
    if (!pet) return;
    const newXp = pet.xp + amount;
    const updated = { ...pet, xp: newXp };
    setPet(updated);
    await getSupabase().from("user_pets").update({ xp: newXp }).eq("id", pet.id);
  }, [pet]);

  const stage = pet ? getGrowthStage(pet.xp) : getGrowthStage(0);

  return (
    <PetContext.Provider value={{ pet, action, setAction, feedPet, playWithPet, sleepPet, createPet, renamePet, changePetColor, uploadSprite, addXP, loading, userEmail, stage, cooldowns }}>
      {children}
    </PetContext.Provider>
  );
}
