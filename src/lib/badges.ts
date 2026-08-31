export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  criteria: string;
  category: "study" | "social" | "streak" | "milestone";
}

export const BADGES: Badge[] = [
  {
    id: "first-study",
    name: "First Steps",
    description: "Complete your first study session",
    icon: "🎓",
    criteria: "Complete at least 1 study session",
    category: "study",
  },
  {
    id: "cards-10",
    name: "Card Collector",
    description: "Study 10 flashcards",
    icon: "🃏",
    criteria: "Study at least 10 flashcards",
    category: "study",
  },
  {
    id: "cards-100",
    name: "Card Master",
    description: "Study 100 flashcards",
    icon: "🃏",
    criteria: "Study at least 100 flashcards",
    category: "study",
  },
  {
    id: "cards-500",
    name: "Card Legend",
    description: "Study 500 flashcards",
    icon: "👑",
    criteria: "Study at least 500 flashcards",
    category: "study",
  },
  {
    id: "quiz-ace",
    name: "Quiz Ace",
    description: "Score 100% on a quiz",
    icon: "🎯",
    criteria: "Get a perfect score on any quiz",
    category: "study",
  },
  {
    id: "streak-3",
    name: "On Fire",
    description: "3-day study streak",
    icon: "🔥",
    criteria: "Study for 3 consecutive days",
    category: "streak",
  },
  {
    id: "streak-7",
    name: "Week Warrior",
    description: "7-day study streak",
    icon: "⚡",
    criteria: "Study for 7 consecutive days",
    category: "streak",
  },
  {
    id: "streak-30",
    name: "Monthly Master",
    description: "30-day study streak",
    icon: "🏆",
    criteria: "Study for 30 consecutive days",
    category: "streak",
  },
  {
    id: "first-friend",
    name: "Making Friends",
    description: "Add your first friend",
    icon: "🤝",
    criteria: "Add at least 1 friend",
    category: "social",
  },
  {
    id: "quiz-share",
    name: "Knowledge Sharer",
    description: "Share a quiz with a friend",
    icon: "📤",
    criteria: "Share at least 1 quiz",
    category: "social",
  },
  {
    id: "pdf-master",
    name: "PDF Wizard",
    description: "Generate flashcards from 5 PDFs",
    icon: "📄",
    criteria: "Generate flashcards from at least 5 PDFs",
    category: "milestone",
  },
  {
    id: "deck-creator",
    name: "Deck Builder",
    description: "Create 10 flashcard decks",
    icon: "📦",
    criteria: "Create at least 10 flashcard decks",
    category: "milestone",
  },
  {
    id: "early-bird",
    name: "Early Bird",
    description: "Study before 7 AM",
    icon: "🐦",
    criteria: "Complete a study session before 7:00 AM",
    category: "milestone",
  },
  {
    id: "night-owl",
    name: "Night Owl",
    description: "Study after 11 PM",
    icon: "🦉",
    criteria: "Complete a study session after 11:00 PM",
    category: "milestone",
  },
  {
    id: "all-rounder",
    name: "All-Rounder",
    description: "Use all 4 tabs (Flashcards, Quiz, History, Study Log)",
    icon: "⭐",
    criteria: "Navigate to all 4 main study tabs",
    category: "milestone",
  },
];

export function getEarnedBadges(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("gilasos-badges");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function earnBadge(id: string): boolean {
  const earned = getEarnedBadges();
  if (earned.includes(id)) return false;
  earned.push(id);
  localStorage.setItem("gilasos-badges", JSON.stringify(earned));
  return true;
}

export function checkBadges(stats: {
  sessionsStudied: number;
  cardsStudied: number;
  streak: number;
  friends: number;
  quizesShared: number;
  pdfsGenerated: number;
  decksCreated: number;
}): string[] {
  const newlyEarned: string[] = [];

  const checks: { id: string; met: boolean }[] = [
    { id: "first-study", met: stats.sessionsStudied >= 1 },
    { id: "cards-10", met: stats.cardsStudied >= 10 },
    { id: "cards-100", met: stats.cardsStudied >= 100 },
    { id: "cards-500", met: stats.cardsStudied >= 500 },
    { id: "streak-3", met: stats.streak >= 3 },
    { id: "streak-7", met: stats.streak >= 7 },
    { id: "streak-30", met: stats.streak >= 30 },
    { id: "first-friend", met: stats.friends >= 1 },
    { id: "quiz-share", met: stats.quizesShared >= 1 },
    { id: "pdf-master", met: stats.pdfsGenerated >= 5 },
    { id: "deck-creator", met: stats.decksCreated >= 10 },
  ];

  for (const check of checks) {
    if (check.met && earnBadge(check.id)) {
      newlyEarned.push(check.id);
    }
  }

  return newlyEarned;
}

export async function retroactiveBadgeCheck(userId: string): Promise<string[]> {
  const { getSupabase } = await import("./supabase");
  const supabase = getSupabase();
  const newlyEarned: string[] = [];

  // Study sessions count + cards studied
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("session_type, cards_studied, known, created_at")
    .eq("user_id", userId);

  if (sessions && sessions.length > 0) {
    const totalSessions = sessions.length;
    const totalCards = sessions.reduce((s, x) => s + (x.cards_studied || 0), 0);

    if (totalSessions >= 1 && earnBadge("first-study")) newlyEarned.push("first-study");
    if (totalCards >= 10 && earnBadge("cards-10")) newlyEarned.push("cards-10");
    if (totalCards >= 100 && earnBadge("cards-100")) newlyEarned.push("cards-100");
    if (totalCards >= 500 && earnBadge("cards-500")) newlyEarned.push("cards-500");

    // Early bird / night owl
    for (const s of sessions) {
      const hour = new Date(s.created_at).getHours();
      if (hour < 7 && earnBadge("early-bird")) { newlyEarned.push("early-bird"); break; }
      if (hour >= 23 && earnBadge("night-owl")) { newlyEarned.push("night-owl"); break; }
    }
  }

  // Quiz history - check for perfect scores
  const { data: quizzes } = await supabase
    .from("quiz_history")
    .select("correct_answers, total_questions")
    .eq("user_id", userId);

  if (quizzes) {
    const hasPerfect = quizzes.some((q) => q.correct_answers === q.total_questions && q.total_questions > 0);
    if (hasPerfect && earnBadge("quiz-ace")) newlyEarned.push("quiz-ace");
  }

  // Study streak
  const { data: stats } = await supabase
    .from("study_stats")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (stats && stats.length > 0) {
    const dates = [...new Set(stats.map((s) => s.date))].sort().reverse();
    let streak = 0;
    const today = new Date().toDateString();
    let checkDate = new Date();

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toDateString();
      const dayIndex = i === 0 ? dates.indexOf(dateStr) : dates.indexOf(dateStr);

      if (dates.includes(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (i === 0) {
        // Today might not have a session yet, check yesterday
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      } else {
        break;
      }
    }

    if (streak >= 3 && earnBadge("streak-3")) newlyEarned.push("streak-3");
    if (streak >= 7 && earnBadge("streak-7")) newlyEarned.push("streak-7");
    if (streak >= 30 && earnBadge("streak-30")) newlyEarned.push("streak-30");
  }

  // Friends
  const { data: friendships } = await supabase
    .from("user_friends")
    .select("id")
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq("status", "accepted");

  if (friendships && friendships.length >= 1 && earnBadge("first-friend")) {
    newlyEarned.push("first-friend");
  }

  // Shared quizzes
  const { data: sharedQuizzes } = await supabase
    .from("saved_quizzes")
    .select("id")
    .eq("user_id", userId)
    .eq("shared", true);

  if (sharedQuizzes && sharedQuizzes.length >= 1 && earnBadge("quiz-share")) {
    newlyEarned.push("quiz-share");
  }

  // Decks created (reviewers)
  const { data: reviewers } = await supabase
    .from("reviewers")
    .select("id")
    .eq("user_id", userId);

  if (reviewers && reviewers.length >= 10 && earnBadge("deck-creator")) {
    newlyEarned.push("deck-creator");
  } else if (reviewers) {
    // Also count local custom decks
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("gilasos-custom-content");
        if (stored) {
          const data = JSON.parse(stored);
          const localDeckCount = (data.courses || []).reduce(
            (acc: number, c: any) => acc + (c.modules || []).reduce((acc2: number, m: any) => acc2 + (m.reviewers || []).length, 0),
            0
          );
          if ((reviewers.length + localDeckCount) >= 10 && earnBadge("deck-creator")) {
            newlyEarned.push("deck-creator");
          }
        }
      } catch {}
    }
  }

  return newlyEarned;
}
