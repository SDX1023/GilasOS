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

// Study Stats
export async function saveStudyStats(
  userId: string,
  known: number,
  forgot: number,
  dontKnow: number,
  cardsTotal: number
) {
  const supabase = getSupabase();
  const today = new Date().toDateString();

  const { data: existing } = await supabase
    .from("study_stats")
    .select("id, known, forgot, dont_know, cards_total")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("study_stats")
      .update({
        known: existing.known + known,
        forgot: existing.forgot + forgot,
        dont_know: existing.dont_know + dontKnow,
        cards_total: existing.cards_total + cardsTotal,
      })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("study_stats")
      .insert({ user_id: userId, date: today, known, forgot, dont_know: dontKnow, cards_total: cardsTotal });
  }
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

// Quiz History
export async function saveQuizHistory(
  userId: string,
  deckTitle: string,
  totalQuestions: number,
  correctAnswers: number,
  wrongAnswers: number,
  source: string
) {
  const supabase = getSupabase();
  const { error } = await supabase.from("quiz_history").insert({
    user_id: userId,
    deck_title: deckTitle,
    total_questions: totalQuestions,
    correct_answers: correctAnswers,
    wrong_answers: wrongAnswers,
    source,
  });
  return !error;
}

export async function loadQuizHistory(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("quiz_history")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) return [];
  return data || [];
}

export async function deleteQuizHistory(userId: string, id: string) {
  const supabase = getSupabase();
  await supabase.from("quiz_history").delete().eq("id", id).eq("user_id", userId);
}

// Bookmarked Cards
export async function loadBookmarkedCards(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("bookmarked_cards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function toggleBookmark(
  userId: string,
  deckId: string,
  deckTitle: string,
  cardFront: string,
  cardBack: string,
  cardHint: string = ""
) {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("bookmarked_cards")
    .select("id")
    .eq("user_id", userId)
    .eq("deck_id", deckId)
    .eq("card_front", cardFront)
    .eq("card_back", cardBack)
    .maybeSingle();

  if (existing) {
    await supabase.from("bookmarked_cards").delete().eq("id", existing.id);
    return false;
  } else {
    await supabase.from("bookmarked_cards").insert({
      user_id: userId,
      deck_id: deckId,
      deck_title: deckTitle,
      card_front: cardFront,
      card_back: cardBack,
      card_hint: cardHint,
    });
    return true;
  }
}

export async function isBookmarked(
  userId: string,
  deckId: string,
  cardFront: string,
  cardBack: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("bookmarked_cards")
    .select("id")
    .eq("user_id", userId)
    .eq("deck_id", deckId)
    .eq("card_front", cardFront)
    .eq("card_back", cardBack)
    .maybeSingle();
  return !!data;
}

export async function removeBookmark(userId: string, bookmarkId: string) {
  const supabase = getSupabase();
  await supabase.from("bookmarked_cards").delete().eq("id", bookmarkId).eq("user_id", userId);
}

// Saved Quizzes
export async function saveQuiz(userId: string, title: string, source: string, questions: any[]) {
  const supabase = getSupabase();
  const { error } = await supabase.from("saved_quizzes").insert({
    user_id: userId, title, source, questions, total_questions: questions.length,
  });
  return !error;
}

export async function loadSavedQuizzes(userId: string) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("saved_quizzes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return [];
  return data || [];
}

export async function deleteSavedQuiz(userId: string, id: string) {
  const supabase = getSupabase();
  await supabase.from("saved_quizzes").delete().eq("id", id).eq("user_id", userId);
}

export async function shareQuiz(userId: string, id: string): Promise<string | null> {
  const supabase = getSupabase();
  const code = Math.random().toString(36).substring(2, 10);
  const { error } = await supabase
    .from("saved_quizzes")
    .update({ shared: true, share_code: code })
    .eq("id", id)
    .eq("user_id", userId);
  if (error) return null;
  return code;
}

export async function loadSharedQuiz(code: string): Promise<any | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("saved_quizzes")
    .select("*")
    .eq("share_code", code)
    .eq("shared", true)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}
