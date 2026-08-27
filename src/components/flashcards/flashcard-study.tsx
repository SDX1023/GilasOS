"use client";

import { useState, useCallback } from "react";
import { Flashcard } from "@/lib/content";
import { ChevronLeft, ChevronRight, RotateCcw, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FlashcardProps {
  cards: Flashcard[];
}

interface CardProgress {
  easeFactor: number;
  interval: number;
  repetitions: number;
  nextReview: number;
}

function getInitialProgress(): CardProgress {
  return { easeFactor: 2.5, interval: 1, repetitions: 0, nextReview: 0 };
}

function updateSM2(progress: CardProgress, quality: number): CardProgress {
  const { easeFactor, interval, repetitions } = progress;

  if (quality < 3) {
    return { ...getInitialProgress(), nextReview: Date.now() };
  }

  let newInterval: number;
  let newRepetitions = repetitions + 1;

  if (newRepetitions === 1) {
    newInterval = 1;
  } else if (newRepetitions === 2) {
    newInterval = 6;
  } else {
    newInterval = Math.round(interval * easeFactor);
  }

  const newEaseFactor = Math.max(1.3, easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReview: Date.now() + newInterval * 24 * 60 * 60 * 1000,
  };
}

function getStorageKey(): string {
  if (typeof window === "undefined") return "flashcard_progress";
  return "flashcard_progress";
}

function loadProgress(): { [cardId: string]: CardProgress } {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(getStorageKey());
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveProgress(progress: { [cardId: string]: CardProgress }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(getStorageKey(), JSON.stringify(progress));
}

export function FlashcardStudy({ cards }: FlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [progress, setProgress] = useState<{ [cardId: string]: CardProgress }>(() => loadProgress());
  const [studyMode, setStudyMode] = useState<"all" | "due">("all");

  // Generate stable IDs for cards that don't have them
  const cardsWithIds = cards.map((card, idx) => ({
    ...card,
    id: card.id || `card-${idx}-${card.front.slice(0, 20).replace(/\s/g, "-")}`,
  }));

  const cardsToStudy = studyMode === "due"
    ? cardsWithIds.filter((card) => {
        const p = progress[card.id!];
        return !p || p.nextReview <= Date.now();
      })
    : cardsWithIds;

  const currentCard = cardsToStudy[currentIndex];
  const cardProgress = currentCard ? progress[currentCard.id!] || getInitialProgress() : getInitialProgress();
  const isDue = cardProgress.nextReview <= Date.now();

  const handleRate = useCallback((quality: number) => {
    if (!currentCard) return;

    const newProgress = updateSM2(cardProgress, quality);
    const updated = { ...progress, [currentCard.id!]: newProgress };
    setProgress(updated);
    saveProgress(updated);

    setIsFlipped(false);
    setCurrentIndex((prev) => Math.min(prev + 1, cardsToStudy.length - 1));
  }, [currentCard, cardProgress, progress, cardsToStudy.length]);

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => Math.min(prev + 1, cardsToStudy.length - 1));
  };

  if (cardsToStudy.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          {studyMode === "due" ? "No cards due for review! Great job!" : "No cards to study."}
        </p>
        {studyMode === "due" && (
          <button
            onClick={() => setStudyMode("all")}
            className="mt-4 text-primary hover:underline"
          >
            Study all cards instead
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setStudyMode("all")}
            className={cn(
              "px-3 py-1 rounded-md text-sm",
              studyMode === "all" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            All ({cards.length})
          </button>
          <button
            onClick={() => setStudyMode("due")}
            className={cn(
              "px-3 py-1 rounded-md text-sm",
              studyMode === "due" ? "bg-primary text-primary-foreground" : "bg-muted"
            )}
          >
            Due ({cardsWithIds.filter((c) => {
              const p = progress[c.id!];
              return !p || p.nextReview <= Date.now();
            }).length})
          </button>
        </div>
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1} / {cardsToStudy.length}
        </span>
      </div>

      {currentCard && (
        <div className="space-y-4">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[200px] sm:min-h-[300px] p-4 sm:p-8 rounded-xl border-2 bg-card cursor-pointer select-none flex items-center justify-center text-center transition-all hover:border-primary"
          >
            <div>
              <p className="text-base sm:text-lg font-medium">{isFlipped ? currentCard.back : currentCard.front}</p>
              {!isFlipped && currentCard.hint && (
                <p className="text-sm text-muted-foreground mt-4 italic">Hint: {currentCard.hint}</p>
              )}
            </div>
          </div>

          {!isFlipped ? (
            <div className="flex justify-center">
              <button
                onClick={() => setIsFlipped(true)}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Show Answer
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <button
                onClick={() => handleRate(1)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 text-sm"
              >
                <X className="h-4 w-4" />
                Again
              </button>
              <button
                onClick={() => handleRate(3)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 text-sm"
              >
                <RotateCcw className="h-4 w-4" />
                Hard
              </button>
              <button
                onClick={() => handleRate(4)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 text-sm"
              >
                <Check className="h-4 w-4" />
                Good
              </button>
              <button
                onClick={() => handleRate(5)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 text-sm"
              >
                <ChevronRight className="h-4 w-4" />
                Easy
              </button>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-sm disabled:opacity-50 hover:bg-muted"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === cardsToStudy.length - 1}
              className="flex items-center gap-1 px-3 py-1 rounded-md text-sm disabled:opacity-50 hover:bg-muted"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
