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

  const { data: reviewers } = await supabase
    .from("reviewers")
    .select("*, flashcards(*)")
    .eq("user_id", user.id);

  const { data: customDecks } = await supabase
    .from("custom_decks")
    .select("*, custom_deck_cards(*)")
    .eq("user_id", user.id);

  const seenIds = new Set<string>();
  const result: { courseId: string; moduleId: string; reviewer: CustomReviewer }[] = [];

  if (reviewers) {
    for (const r of reviewers) {
      seenIds.add(r.id);
      result.push({
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
      });
    }
  }

  if (customDecks) {
    for (const d of customDecks) {
      if (seenIds.has(d.id)) continue;
      seenIds.add(d.id);
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
            card_type: "standard",
            image_url: "",
            labels: [],
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

  // Use the reviewer.id directly as the deck ID
  const deckId = reviewer.id;

  console.log("=== SAVING DECK ===");
  console.log("Deck ID:", deckId);
  console.log("Title:", reviewer.title);
  console.log("Cards array length:", reviewer.cards?.length || 0);
  console.log("First card sample:", reviewer.cards?.[0]);

  // Save to custom_decks table
  const { data: deckData, error: deckError } = await supabase
    .from("custom_decks")
    .upsert({
      id: deckId,
      user_id: user.id,
      title: reviewer.title || "Untitled Deck",
      description: "Imported from shared deck",
      card_count: reviewer.cards ? reviewer.cards.length : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select();

  if (deckError) {
    console.error("Deck save error:", deckError);
    throw deckError;
  }

  console.log("Deck saved:", deckData);

  // Save the cards
  if (reviewer.cards && reviewer.cards.length > 0) {
    console.log("Preparing to save", reviewer.cards.length, "cards");
    
    const cards = reviewer.cards.map((card: any, index: number) => ({
      deck_id: deckId,
      front: String(card.front || ""),
      back: String(card.back || ""),
      hint: String(card.hint || ""),
      sort_order: index,
      created_at: new Date().toISOString(),
    }));

    console.log("Cards formatted:", cards.slice(0, 2));

    // Delete existing cards first
    const { error: deleteError } = await supabase
      .from("custom_deck_cards")
      .delete()
      .eq("deck_id", deckId);
    
    if (deleteError) {
      console.error("Delete error:", deleteError);
    } else {
      console.log("Deleted existing cards");
    }

    // Insert new cards
    const { data: cardsData, error: cardsError } = await supabase
      .from("custom_deck_cards")
      .insert(cards)
      .select();

    if (cardsError) {
      console.error("Cards save error:", cardsError);
      // Try inserting one by one
      console.log("Trying individual inserts...");
      let successCount = 0;
      for (let i = 0; i < cards.length; i++) {
        const { error: singleError } = await supabase
          .from("custom_deck_cards")
          .insert(cards[i]);
        if (!singleError) {
          successCount++;
        } else {
          console.error(`Failed to insert card ${i}:`, singleError);
          console.error("Card data:", cards[i]);
        }
      }
      console.log(`Inserted ${successCount}/${cards.length} cards individually`);
    } else {
      console.log("Cards saved successfully:", cardsData?.length || cards.length);
    }
  } else {
    console.log("No cards to save - reviewer.cards is empty or undefined");
  }

  // Verify the cards were saved
  const { data: verifyCards, error: verifyError } = await supabase
    .from("custom_deck_cards")
    .select("*")
    .eq("deck_id", deckId);

  if (verifyError) {
    console.error("Verification error:", verifyError);
  } else {
    console.log("Verification - cards in DB:", verifyCards?.length || 0);
  }

  // Trigger event to refresh decks
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("decksUpdated"));
    localStorage.setItem("decks_updated", Date.now().toString());
  }

  // Also save to reviewers/flashcards tables so the Study page can load them
  // Use insert (not upsert) to avoid conflicts with other users' rows
  const { error: reviewerError } = await supabase
    .from("reviewers")
    .insert({
      id: deckId,
      user_id: user.id,
      course_id: courseId,
      module_id: moduleId,
      title: reviewer.title || "Untitled Deck",
    });

  if (reviewerError && reviewerError.code !== "23505") {
    console.error("Reviewers table save error:", reviewerError);
  }

  // Save flashcards for this user (even if reviewers row already existed for another user)
  await supabase.from("flashcards").delete().eq("reviewer_id", deckId).eq("user_id", user.id);

  if (reviewer.cards && reviewer.cards.length > 0) {
    const timestamp = Date.now();
    const flashcardRows = reviewer.cards.map((card: any, index: number) => ({
      id: `${deckId.replace(/\//g, "-")}-card-${timestamp}-${index}`,
      reviewer_id: deckId,
      user_id: user.id,
      front: String(card.front || ""),
      back: String(card.back || ""),
      hint: String(card.hint || ""),
    }));
    const { error: fcError } = await supabase.from("flashcards").insert(flashcardRows);
    if (fcError) {
      console.error("Flashcards table save error:", fcError);
    } else {
      console.log("Also saved to flashcards table:", flashcardRows.length, "cards");
    }
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