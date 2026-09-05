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

// Study Sessions
export interface StudySession {
  id: string;
  user_id: string;
  session_type: "flashcards" | "quiz";
  subject: string;
  module: string | null;
  deck_title: string | null;
  duration_seconds: number;
  cards_studied: number;
  known: number;
  forgot: number;
  dont_know: number;
  score: number | null;
  total_questions: number | null;
  created_at: string;
}

export async function saveStudySession(
  userId: string,
  session: {
    session_type: "flashcards" | "quiz";
    subject: string;
    module?: string;
    deck_title?: string;
    duration_seconds: number;
    cards_studied?: number;
    known?: number;
    forgot?: number;
    dont_know?: number;
    score?: number;
    total_questions?: number;
  }
) {
  const supabase = getSupabase();
  await supabase.from("study_sessions").insert({
    user_id: userId,
    ...session,
  });
}

export async function loadStudySessions(userId: string, limit = 50): Promise<StudySession[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("study_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data || [];
}

export async function deleteStudySession(userId: string, id: string) {
  const supabase = getSupabase();
  await supabase.from("study_sessions").delete().eq("id", id).eq("user_id", userId);
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
  return (data || []).map((q: any) => ({
    ...q,
    questions: typeof q.questions === "string" ? JSON.parse(q.questions) : q.questions || [],
  }));
}

export async function deleteSavedQuiz(userId: string, id: string) {
  const supabase = getSupabase();
  await supabase.from("saved_quizzes").delete().eq("id", id).eq("user_id", userId);
}

export async function renameSavedQuiz(userId: string, quizId: string, newTitle: string) {
  const supabase = getSupabase();
  await supabase.from("saved_quizzes").update({ title: newTitle }).eq("id", quizId).eq("user_id", userId);
}

export async function updateQuizQuestions(userId: string, quizId: string, questions: any[]) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("saved_quizzes")
    .update({ questions: JSON.parse(JSON.stringify(questions)), total_questions: questions.length })
    .eq("id", quizId)
    .eq("user_id", userId)
    .select("id, questions");
  if (error) {
    console.error("Failed to update quiz questions:", error.message, error.details, error.hint);
    return false;
  }
  return true;
}

export async function shareQuiz(userId: string, id: string, recipientUserId?: string): Promise<string | null> {
  const supabase = getSupabase();
  const code = Math.random().toString(36).substring(2, 10);
  const update: Record<string, any> = { shared: true, share_code: code };
  if (recipientUserId) update.shared_with_user_id = recipientUserId;
  const { error } = await supabase
    .from("saved_quizzes")
    .update(update)
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
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

export async function loadSharedQuizzesForUser(userId: string): Promise<any[]> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from("saved_quizzes")
    .select("*")
    .or(`shared_with_user_id.eq.${userId},and(shared.eq.true,user_id.neq.${userId})`)
    .order("created_at", { ascending: false });
  return data || [];
}

// Friend Notes
export interface FriendNote {
  id: string;
  user_id: string;
  content: string;
  song_name: string | null;
  song_artist: string | null;
  song_url: string | null;
  song_album_art: string | null;
  song_preview: string | null;
  song_start_time: number;
  expires_at: string;
  created_at: string;
  username?: string;
  avatar_url?: string | null;
}

export async function postFriendNote(
  userId: string,
  content: string,
  song?: { name: string; artist: string; url: string; album_art: string; preview: string | null },
  startTime: number = 0
): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase.from("friend_notes").insert({
    user_id: userId,
    content,
    song_name: song?.name || null,
    song_artist: song?.artist || null,
    song_url: song?.url || null,
    song_album_art: song?.album_art || null,
    song_preview: song?.preview || null,
    song_start_time: startTime,
  });
  return !error;
}

export async function loadFriendNotes(userId: string): Promise<FriendNote[]> {
  const supabase = getSupabase();
  const { data: notes } = await supabase
    .from("friend_notes")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(50);
  if (!notes || notes.length === 0) return [];

  const userIds = [...new Set(notes.map((n) => n.user_id))];
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, username, avatar_url")
    .in("user_id", userIds);

  const profileMap: Record<string, { username: string; avatar_url: string | null }> = {};
  if (profiles) {
    profiles.forEach((p) => { profileMap[p.user_id] = { username: p.username, avatar_url: p.avatar_url }; });
  }

  return notes.map((n) => ({
    ...n,
    username: profileMap[n.user_id]?.username || "Unknown",
    avatar_url: profileMap[n.user_id]?.avatar_url || null,
  }));
}

export async function deleteFriendNote(userId: string, noteId: string) {
  const supabase = getSupabase();
  await supabase.from("friend_notes").delete().eq("id", noteId).eq("user_id", userId);
}

export async function updateFriendNote(
  userId: string,
  noteId: string,
  content: string,
  song?: { name: string; artist: string; url: string; album_art: string; preview: string | null } | null
): Promise<boolean> {
  const supabase = getSupabase();
  const update: Record<string, any> = {
    content,
    song_name: song?.name || null,
    song_artist: song?.artist || null,
    song_url: song?.url || null,
    song_album_art: song?.album_art || null,
    song_preview: song?.preview || null,
  };
  const { error } = await supabase
    .from("friend_notes")
    .update(update)
    .eq("id", noteId)
    .eq("user_id", userId);
  return !error;
}

// Note Reactions
export interface NoteReaction {
  id: string;
  note_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export async function toggleReaction(
  userId: string,
  noteId: string,
  emoji: string
): Promise<boolean> {
  const supabase = getSupabase();
  const { data: existing } = await supabase
    .from("note_reactions")
    .select("id")
    .eq("note_id", noteId)
    .eq("user_id", userId)
    .eq("emoji", emoji)
    .maybeSingle();

  if (existing) {
    await supabase.from("note_reactions").delete().eq("id", existing.id);
    return false;
  } else {
    await supabase.from("note_reactions").insert({ note_id: noteId, user_id: userId, emoji });
    return true;
  }
}

export async function loadReactions(noteIds: string[], userId: string): Promise<{
  reactions: Record<string, { emoji: string; count: number; myReaction: boolean; users: string[] }[]>;
  usernames: Record<string, string>;
}> {
  if (noteIds.length === 0) return { reactions: {}, usernames: {} };
  const supabase = getSupabase();
  const { data: reactions } = await supabase
    .from("note_reactions")
    .select("*")
    .in("note_id", noteIds);
  if (!reactions || reactions.length === 0) return { reactions: {}, usernames: {} };

  const userIds = [...new Set(reactions.map((r) => r.user_id))];
  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, username")
    .in("user_id", userIds);

  const usernameMap: Record<string, string> = {};
  if (profiles) {
    profiles.forEach((p) => { usernameMap[p.user_id] = p.username || "Unknown"; });
  }

  const grouped: Record<string, { emoji: string; count: number; myReaction: boolean; users: string[] }[]> = {};
  for (const r of reactions) {
    if (!grouped[r.note_id]) grouped[r.note_id] = [];
    const existing = grouped[r.note_id].find((e) => e.emoji === r.emoji);
    const name = usernameMap[r.user_id] || "Unknown";
    if (existing) {
      existing.count++;
      existing.users.push(name);
      if (r.user_id === userId) existing.myReaction = true;
    } else {
      grouped[r.note_id].push({ emoji: r.emoji, count: 1, myReaction: r.user_id === userId, users: [name] });
    }
  }
  return { reactions: grouped, usernames: usernameMap };
}
