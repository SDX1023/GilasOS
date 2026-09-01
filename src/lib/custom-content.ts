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
    id: `${courseId}/${moduleId}/${reviewer.title.toLowerCase().replace(/\s+/g, "-")}` 
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

  const { data: reviewers } = await supabase
    .from("reviewers")
    .select("*, flashcards(*)")
    .eq("user_id", user.id);

  if (!reviewers) return [];

  return reviewers.map((r: any) => ({
    courseId: r.course_id,
    moduleId: r.module_id,
    reviewer: {
      id: r.id,
      courseId: r.course_id,
      moduleId: r.module_id,
      title: r.title,
      cards: (r.flashcards || []).map((c: any) => ({
        front: c.front,
        back: c.back,
        hint: c.hint || "",
        card_type: c.card_type || "standard",
        image_url: c.image_url || "",
        labels: c.labels || [],
      })),
    },
  }));
}

export async function saveReviewerToSupabase(courseId: string, moduleId: string, reviewer: CustomReviewer) {
  const supabase = getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Generate a unique ID for the deck
  const deckId = `${courseId}/${moduleId}/${reviewer.id}`;

  // Save to custom_decks table
  const { error: deckError } = await supabase
    .from("custom_decks")
    .upsert({
      id: deckId,
      user_id: user.id,
      title: reviewer.title || "Untitled Deck",
      description: "Imported from shared deck",
      card_count: reviewer.cards ? reviewer.cards.length : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (deckError) {
    console.error("Deck save error:", deckError);
    throw deckError;
  }

  // Save the cards
  if (reviewer.cards && reviewer.cards.length > 0) {
    const cards = reviewer.cards.map((card: any, index: number) => ({
      deck_id: deckId,
      front: card.front,
      back: card.back,
      hint: card.hint || "",
      sort_order: index,
      created_at: new Date().toISOString(),
    }));

    // Delete existing cards first
    await supabase
      .from("custom_deck_cards")
      .delete()
      .eq("deck_id", deckId);

    // Insert new cards
    const { error: cardsError } = await supabase
      .from("custom_deck_cards")
      .insert(cards);

    if (cardsError) {
      console.error("Cards save error:", cardsError);
      throw cardsError;
    }
  }

  // Also save to reviewers table for backward compatibility
  const { error: revError } = await supabase.from("reviewers").upsert({
    id: reviewer.id,
    user_id: user.id,
    course_id: courseId,
    module_id: moduleId,
    title: reviewer.title,
  }, { onConflict: "id" });
  
  if (revError) {
    console.error("Failed to save reviewer to Supabase:", revError);
  }

  // Trigger event to refresh decks
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("decksUpdated"));
    localStorage.setItem("decks_updated", Date.now().toString());
  }

  return { success: true, deckId };
}

export async function deleteReviewerFromSupabase(reviewerId: string) {
  const supabase = getSupabase();
  await supabase.from("reviewers").delete().eq("id", reviewerId);
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

// Helper function to fetch deck cards
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