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
}

const PetContext = createContext<PetContextType | null>(null);

export function usePet() {
  return useContext(PetContext);
}

const PET_TYPES = ["cat", "dog", "fox", "bunny", "penguin", "owl"];
const PET_COLORS = ["#f59e0b", "#ef4444", "#3b82f6", "#10b981", "#8b5cf6", "#ec4899", "#6b7280", "#f97316"];

function clamp(v: number) { return Math.max(0, Math.min(100, v)); }

function calcMood(pet: Pet): string {
  const avg = (pet.hunger + pet.happiness + pet.energy) / 3;
  if (avg >= 70) return "happy";
  if (avg >= 40) return "neutral";
  return "sad";
}

export { PET_TYPES, PET_COLORS };

export function PetProvider({ children }: { children: React.ReactNode }) {
  const [pet, setPet] = useState<Pet | null>(null);
  const [action, setAction] = useState<PetAction>("idle");
  const [loading, setLoading] = useState(true);
  const decayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadPet = useCallback(async () => {
    try {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
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

  const feedPet = useCallback(async () => {
    if (!pet) return;
    const supabase = getSupabase();
    const updated = { ...pet, hunger: clamp(pet.hunger + 30), last_fed_at: new Date().toISOString() };
    updated.mood = calcMood(updated);
    setPet(updated);
    setAction("eating");
    setTimeout(() => setAction("happy"), 2000);
    await supabase.from("user_pets").update({ hunger: updated.hunger, last_fed_at: updated.last_fed_at, mood: updated.mood }).eq("id", pet.id);
  }, [pet]);

  const playWithPet = useCallback(async () => {
    if (!pet) return;
    const supabase = getSupabase();
    const updated = { ...pet, happiness: clamp(pet.happiness + 30), energy: clamp(pet.energy - 10), last_played_at: new Date().toISOString() };
    updated.mood = calcMood(updated);
    setPet(updated);
    setAction("playing");
    setTimeout(() => setAction("happy"), 2500);
    await supabase.from("user_pets").update({ happiness: updated.happiness, energy: updated.energy, last_played_at: updated.last_played_at, mood: updated.mood }).eq("id", pet.id);
  }, [pet]);

  const sleepPet = useCallback(async () => {
    if (!pet) return;
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
    const newLevel = Math.floor(newXp / 100) + 1;
    const updated = { ...pet, xp: newXp % 100, level: newLevel };
    setPet(updated);
    await getSupabase().from("user_pets").update({ xp: updated.xp, level: updated.level }).eq("id", pet.id);
  }, [pet]);

  return (
    <PetContext.Provider value={{ pet, action, setAction, feedPet, playWithPet, sleepPet, createPet, renamePet, changePetColor, uploadSprite, addXP, loading }}>
      {children}
    </PetContext.Provider>
  );
}
