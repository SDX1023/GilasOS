import { getSupabase } from "./supabase";

// Flashcards
export async function loadUserFlashcards(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("user_flashcards")
    .select("*")
    .eq("user_id", userId);
  if (error) return [];
  return data || [];
}

export async function saveUserFlashcard(
  userId: string,
  courseId: string,
  moduleId: string,
  reviewerId: string,
  title: string,
  cards: any[]
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("user_flashcards")
    .upsert({
      user_id: userId,
      course_id: courseId,
      module_id: moduleId,
      reviewer_id: reviewerId,
      title,
      cards,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,course_id,module_id,reviewer_id" });
  return !error;
}

export async function deleteUserFlashcard(
  userId: string,
  courseId: string,
  moduleId: string,
  reviewerId: string
) {
  const supabase = getSupabase();
  await supabase
    .from("user_flashcards")
    .delete()
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("module_id", moduleId)
    .eq("reviewer_id", reviewerId);
}

// Notes
export async function loadUserNotes(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("user_notes")
    .select("*")
    .eq("user_id", userId);
  if (error) return [];
  return data || [];
}

export async function saveUserNote(
  userId: string,
  courseId: string,
  moduleId: string,
  noteId: string,
  title: string,
  slug: string,
  content: string
) {
  const supabase = getSupabase();
  const { error } = await supabase
    .from("user_notes")
    .upsert({
      user_id: userId,
      course_id: courseId,
      module_id: moduleId,
      note_id: noteId,
      title,
      slug,
      content,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id,course_id,module_id,note_id" });
  return !error;
}

export async function deleteUserNote(
  userId: string,
  courseId: string,
  moduleId: string,
  noteId: string
) {
  const supabase = getSupabase();
  await supabase
    .from("user_notes")
    .delete()
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .eq("module_id", moduleId)
    .eq("note_id", noteId);
}
