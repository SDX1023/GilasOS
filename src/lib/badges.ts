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
