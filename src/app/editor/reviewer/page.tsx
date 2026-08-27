"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReviewerEditor } from "@/components/admin/reviewer-editor";
import { getReviewerWithCards, createReviewer, updateReviewer, deleteFlashcardsByReviewer, createFlashcard } from "@/lib/db";

function ReviewerEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course") || "";
  const moduleId = searchParams.get("module") || "";
  const reviewerId = searchParams.get("id") || "";

  const [existingReviewer, setExistingReviewer] = useState<any>(null);
  const [loading, setLoading] = useState(!!reviewerId);

  useEffect(() => {
    if (reviewerId) {
      getReviewerWithCards(reviewerId).then((reviewer) => {
        setExistingReviewer(reviewer);
        setLoading(false);
      });
    }
  }, [reviewerId]);

  const handleSave = async (reviewer: { id: string; title: string; cards: { front: string; back: string; hint?: string }[] }) => {
    try {
      if (existingReviewer) {
        await updateReviewer(existingReviewer.id, { title: reviewer.title });
        await deleteFlashcardsByReviewer(existingReviewer.id);
        for (let i = 0; i < reviewer.cards.length; i++) {
          const card = reviewer.cards[i];
          await createFlashcard({
            id: `${existingReviewer.id}-card-${i}`,
            reviewer_id: existingReviewer.id,
            front: card.front,
            back: card.back,
            hint: card.hint,
            sort_order: i,
          });
        }
      } else {
        const newReviewer = await createReviewer({
          id: reviewer.id,
          course_id: courseId,
          module_id: moduleId,
          title: reviewer.title,
        });
        for (let i = 0; i < reviewer.cards.length; i++) {
          const card = reviewer.cards[i];
          await createFlashcard({
            id: `${newReviewer.id}-card-${i}`,
            reviewer_id: newReviewer.id,
            front: card.front,
            back: card.back,
            hint: card.hint,
            sort_order: i,
          });
        }
      }
    } catch (error) {
      console.error("Error saving reviewer:", error);
      alert("Error saving reviewer");
    }
  };

  const handleBack = () => {
    router.push("/reviewers");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!courseId || !moduleId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Missing course or module ID</p>
      </div>
    );
  }

  return (
    <ReviewerEditor
      courseId={courseId}
      moduleId={moduleId}
      reviewerId={existingReviewer?.id}
      initialTitle={existingReviewer?.title || ""}
      initialCards={existingReviewer?.flashcards || []}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}

export default function ReviewerEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <ReviewerEditorContent />
    </Suspense>
  );
}
