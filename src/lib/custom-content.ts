// lib/custom-content.ts

"use client";

import { getSupabase } from "./supabase";

const STORAGE_KEY = "studyos_custom_content";

export interface CustomCourse {
  id: string;
  title: string;
  description: string;
  modules: CustomModule[];
}

export interface CustomModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  notes: CustomNote[];
  reviewers: CustomReviewer[];
}

export interface CustomNote {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  slug: string;
  content: string;
}

export interface CustomReviewer {
  id: string;
  moduleId: string;
  courseId: string;
  title: string;
  cards: { front: string; back: string; hint?: string }[];
}

export interface CustomContentStore {
  courses: CustomCourse[];
}

function getDefaultStore(): CustomContentStore {
  return { courses: [] };
}

export function loadCustomContent(): CustomContentStore {
  if (typeof window === "undefined") return getDefaultStore();
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : getDefaultStore();
  } catch {
    return getDefaultStore();
  }
}

export function saveCustomContent(store: CustomContentStore) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

// Course operations
export function addCourse(course: Omit<CustomCourse, "modules">): CustomCourse {
  const store = loadCustomContent();
  const newCourse: CustomCourse = { ...course, modules: [] };
  store.courses.push(newCourse);
  saveCustomContent(store);
  return newCourse;
}

export function updateCourse(id: string, updates: Partial<CustomCourse>) {
  const store = loadCustomContent();
  const idx = store.courses.findIndex((c) => c.id === id);
  if (idx !== -1) {
    store.courses[idx] = { ...store.courses[idx], ...updates };
    saveCustomContent(store);
  }
}

export function deleteCourse(id: string) {
  const store = loadCustomContent();
  store.courses = store.courses.filter((c) => c.id !== id);
  saveCustomContent(store);
}

// Module operations
export function addModule(courseId: string, module: Omit<CustomModule, "notes" | "reviewers">) {
  const store = loadCustomContent();
  const course = store.courses.find((c) => c.id === courseId);
  if (course) {
    course.modules.push({ ...module, notes: [], reviewers: [] });
    saveCustomContent(store);
  }
}

export function updateModule(courseId: string, moduleId: string, updates: Partial<CustomModule>) {
  const store = loadCustomContent();
  const course = store.courses.find((c) => c.id === courseId);
  if (course) {
    const idx = course.modules.findIndex((m) => m.id === moduleId);
    if (idx !== -1) {
      course.modules[idx] = { ...course.modules[idx], ...updates };
      saveCustomContent(store);
    }
  }
}

export function deleteModule(courseId: string, moduleId: string) {
  const store = loadCustomContent();
  const course = store.courses.find((c) => c.id === courseId);
  if (course) {
    course.modules = course.modules.filter((m) => m.id !== moduleId);
    saveCustomContent(store);
  }
}

// Note operations
export function addNote(courseId: string, moduleId: string, note: Omit<CustomNote, "id">) {
  const store = loadCustomContent();
  const course = store.courses.find((c) => c.id === courseId);
  if (course) {
    const mod = course.modules.find((m) => m.id === moduleId);
    if (mod) {
      const newNote: CustomNote = { ...note, id: `${courseId}/${moduleId}/${note.slug}` };
      mod.notes.push(newNote);
      saveCustomContent(store);
    }
  }
}

export function updateNote(courseId: string, moduleId: string, noteId: string, updates: Partial<CustomNote>) {
  const store = loadCustomContent();
  const course = store.courses.find((c) => c.id === courseId);
  if (course) {
    const mod = course.modules.find((m) => m.id === moduleId);
    if (mod) {
      const idx = mod.notes.findIndex((n) => n.id === noteId);
      if (idx !== -1) {
        mod.notes[idx] = { ...mod.notes[idx], ...updates };
        saveCustomContent(store);
      }
    }
  }
}

export function deleteNote(courseId: string, moduleId: string, noteId: string) {
  const store = loadCustomContent();
  const course = store.courses.find((c) => c.id === courseId);
  if (course) {
    const mod = course.modules.find((m) => m.id === moduleId);
    if (mod) {
      mod.notes = mod.notes.filter((n) => n.id !== noteId);
      saveCustomContent(store);
    }
  }
}

// Reviewer operations
export function addReviewer(courseId: string, moduleId: string, reviewer: Omit<CustomReviewer, "id" | "courseId" | "moduleId">) {
  const store = loadCustomContent();
  let course = store.courses.find((c) => c.id === courseId);
  if (!course) {
    course = { id: courseId, title: courseId, description: "", modules: [] };
    store.courses.push(course);
  }
  let mod = course.modules.find((m) => m.id === moduleId);
  if (!mod) {
    mod = { id: moduleId, courseId, title: moduleId, description: "", notes: [], reviewers: [] };
    course.modules.push(mod);
  }
  const newReviewer: CustomReviewer = {
    ...reviewer,
    courseId,
    moduleId,
    id: `${courseId}/${moduleId}/${reviewer.title.toLowerCase().replace(/\s+/g, "-")}`,
  };
  mod.reviewers.push(newReviewer);
  saveCustomContent(store);
}

export function updateReviewer(courseId: string, moduleId: string, reviewerId: string, updates: Partial<CustomReviewer>) {
  const store = loadCustomContent();
  const course = store.courses.find((c) => c.id === courseId);
  if (course) {
    const mod = course.modules.find((m) => m.id === moduleId);
    if (mod) {
      const idx = mod.reviewers.findIndex((r) => r.id === reviewerId);
      if (idx !== -1) {
        mod.reviewers[idx] = { ...mod.reviewers[idx], ...updates };
        saveCustomContent(store);
      }
    }
  }
}

export function deleteReviewer(courseId: string, moduleId: string, reviewerId: string) {
  const store = loadCustomContent();
  const course = store.courses.find((c) => c.id === courseId);
  if (course) {
    const mod = course.modules.find((m) => m.id === moduleId);
    if (mod) {
      mod.reviewers = mod.reviewers.filter((r) => r.id !== reviewerId);
      saveCustomContent(store);
    }
  }
}

// ── Supabase sync ────────────────────────────────────────────────

export async function loadReviewersFromSupabase(): Promise<{ courseId: string; moduleId: string; reviewer: CustomReviewer }[]> {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const result: { courseId: string; moduleId: string; reviewer: CustomReviewer }[] = [];

  const { data: customDecks } = await supabase
    .from("custom_decks")
    .select("*, custom_deck_cards(*)")
    .eq("user_id", user.id);

  if (customDecks) {
    for (const d of customDecks) {
      result.push({
        courseId: d.title || "My Decks",
        moduleId: "custom",
        reviewer: {
          id: d.id,
          courseId: d.title || "My Decks",
          moduleId: "custom",
          title: d.title,
          cards: (d.custom_deck_cards || []).map((c: any) => ({
            front: c.front,
            back: c.back,
            hint: c.hint || "",
            card_type: c.card_type || "standard",
            image_url: c.image_url || "",
            labels: c.labels || [],
          })),
        },
      });
    }
  }

  return result;
}

export async function saveReviewerToSupabase(courseId: string, moduleId: string, reviewer: any) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  console.log("=== SAVING DECK ===");
  console.log("Title:", reviewer.title);
  console.log("Cards:", reviewer.cards?.length || 0);

  let deckId: string | null = null;

  // Step 1: Try to save to custom_decks / custom_deck_cards
  try {
    const { data: existingDeck, error: findErr } = await supabase
      .from("custom_decks")
      .select("id")
      .eq("user_id", user.id)
      .eq("title", reviewer.title || "Untitled Deck")
      .maybeSingle();

    if (findErr) {
      console.warn("custom_decks query failed:", findErr.message);
    } else if (existingDeck) {
      deckId = existingDeck.id;
      await supabase
        .from("custom_decks")
        .update({ card_count: reviewer.cards?.length || 0, updated_at: new Date().toISOString() })
        .eq("id", deckId);
    } else {
      // Generate explicit UUID since the column may not have a DEFAULT
      const newId = typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 15)}`;

      const { data: deckData, error: deckError } = await supabase
        .from("custom_decks")
        .insert({
          id: newId,
          user_id: user.id,
          title: reviewer.title || "Untitled Deck",
          description: "Imported from shared deck",
          card_count: reviewer.cards?.length || 0,
        })
        .select()
        .single();

      if (deckError) {
        console.warn("custom_decks insert failed:", deckError.message);
      } else {
        deckId = deckData.id;
      }
    }

    // Save cards to custom_deck_cards
    if (deckId && reviewer.cards && reviewer.cards.length > 0) {
      await supabase.from("custom_deck_cards").delete().eq("deck_id", deckId);

      // Insert cards with correct column names (sort_order, not card_order)
      const cardRows = reviewer.cards.map((card: any, index: number) => ({
        deck_id: String(deckId),
        user_id: user.id,
        front: String(card.front || ""),
        back: String(card.back || ""),
        hint: String(card.hint || ""),
        sort_order: index,
        card_type: card.card_type || "standard",
        image_url: card.image_url || null,
        labels: card.labels || null,
      }));

      const { error: cardsError } = await supabase.from("custom_deck_cards").insert(cardRows);
      if (cardsError) {
        console.warn("custom_deck_cards insert failed:", cardsError.message);
      }
    }
  } catch (e) {
    console.warn("custom_decks/custom_deck_cards save failed:", e);
  }

  console.log("Custom deck ID:", deckId);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("decksUpdated"));
  }

  const finalId = deckId || reviewer.id;
  return { success: true, deckId: finalId };
}

export async function deleteReviewerFromSupabase(reviewerId: string) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("reviewers").delete().eq("id", reviewerId).eq("user_id", user.id);
  await supabase.from("flashcards").delete().eq("reviewer_id", reviewerId).eq("user_id", user.id);
  await supabase.from("custom_deck_cards").delete().eq("deck_id", reviewerId);
  await supabase.from("custom_decks").delete().eq("id", reviewerId).eq("user_id", user.id);
}

export async function migrateLocalStorageToSupabase() {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const local = loadCustomContent();
  for (const course of local.courses) {
    for (const mod of course.modules) {
      for (const reviewer of mod.reviewers) {
        await saveReviewerToSupabase(course.id, mod.id, reviewer);
      }
    }
  }
}

export async function fetchDeckCards(deckId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("custom_deck_cards")
    .select("*")
    .eq("deck_id", deckId)
    .order("sort_order", { ascending: true });
  
  if (error) {
    console.error("Error fetching deck cards:", error);
    return [];
  }
  return data || [];
}