"use client";

import Link from "next/link";
import { useCustomReviewer } from "@/hooks/use-custom-content";
import { FlashcardStudy } from "@/components/flashcards/flashcard-study";
import { ChevronRight } from "lucide-react";

interface ReviewerStudyProps {
  courseId: string;
  moduleId: string;
  reviewerId: string;
  // Repo content (if found at build time)
  repoReviewer?: {
    title: string;
    cards: { id?: string; front: string; back: string; hint?: string }[];
  } | null;
}

export function ReviewerStudy({ courseId, moduleId, reviewerId, repoReviewer }: ReviewerStudyProps) {
  const customReviewer = useCustomReviewer(courseId, moduleId, reviewerId);

  const reviewer = customReviewer || repoReviewer;

  if (!reviewer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Reviewer not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/flashcards" className="hover:text-foreground">Flash Cards</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/subjects/${courseId}/${moduleId}`} className="hover:text-foreground">
            {moduleId}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">{reviewer.title}</h1>
          {customReviewer && (
            <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">Custom</span>
          )}
        </div>
        <p className="text-muted-foreground mt-2">{reviewer.cards.length} cards</p>
      </div>

      <FlashcardStudy cards={reviewer.cards} />
    </div>
  );
}
