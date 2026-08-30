import { getSupabase } from "./supabase";

// Course operations
export async function getCourses() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCourse(id: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCourse(course: { id: string; title: string; description?: string }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("courses")
    .upsert({ id: course.id, title: course.title, description: course.description || "" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCourse(id: string, updates: { title?: string; description?: string }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("courses")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCourse(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("courses")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Module operations
export async function getModules(courseId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("modules")
    .select("*")
    .eq("course_id", courseId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createModule(module: {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  sort_order?: number;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("modules")
    .upsert(module)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateModule(id: string, updates: { title?: string; description?: string }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("modules")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteModule(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("modules")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Note operations
export async function getNotes(courseId: string, moduleId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("course_id", courseId)
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getNote(courseId: string, moduleId: string, slug: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notes")
    .select("*")
    .eq("course_id", courseId)
    .eq("module_id", moduleId)
    .eq("slug", slug)
    .single();

  if (error) return null;
  return data;
}

export async function createNote(note: {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  slug: string;
  content?: string;
  sort_order?: number;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notes")
    .upsert(note)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateNote(id: string, updates: { title?: string; content?: string; slug?: string }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteNote(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("notes")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Module Content operations (standardized content per module)
export async function getModuleContents(courseId: string, moduleId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("module_content")
    .select("*")
    .eq("course_id", courseId)
    .eq("module_id", moduleId)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getModuleContent(courseId: string, moduleId: string, slug: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("module_content")
    .select("*")
    .eq("course_id", courseId)
    .eq("module_id", moduleId)
    .eq("id", slug)
    .single();

  if (error) return null;
  return data;
}

export async function createModuleContent(content: {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
  content?: string;
  sort_order?: number;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("module_content")
    .upsert(content)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateModuleContent(id: string, updates: { title?: string; content?: string }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("module_content")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteModuleContent(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("module_content")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Reviewer operations
export async function getReviewers(courseId: string, moduleId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reviewers")
    .select("*, flashcards(*)")
    .eq("course_id", courseId)
    .eq("module_id", moduleId);

  if (error) throw error;
  return data || [];
}

export async function getAllReviewers() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reviewers")
    .select("*, flashcards(*)");

  if (error) throw error;
  return data || [];
}

export async function getReviewerWithCards(reviewerId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reviewers")
    .select("*, flashcards(*)")
    .eq("id", reviewerId)
    .single();

  if (error) return null;
  return data;
}

export async function createReviewer(reviewer: {
  id: string;
  course_id: string;
  module_id: string;
  title: string;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reviewers")
    .upsert(reviewer)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReviewer(id: string, updates: { title?: string }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("reviewers")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReviewer(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("reviewers")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// Flashcard operations
export async function createFlashcard(card: {
  id: string;
  reviewer_id: string;
  front: string;
  back: string;
  hint?: string;
  card_type?: string;
  sort_order?: number;
}) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("flashcards")
    .upsert(card)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateFlashcard(id: string, updates: { front?: string; back?: string; hint?: string }) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("flashcards")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteFlashcard(id: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("flashcards")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function deleteFlashcardsByReviewer(reviewerId: string) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("flashcards")
    .delete()
    .eq("reviewer_id", reviewerId);

  if (error) throw error;
}

// Get all notes for wiki-link resolution
export async function getAllNotes() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("notes")
    .select("id, course_id, module_id, title, slug");

  if (error) throw error;
  return data || [];
}
