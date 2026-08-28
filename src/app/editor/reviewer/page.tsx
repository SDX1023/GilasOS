"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReviewerEditor } from "@/components/admin/reviewer-editor";
import { loadCustomContent, addReviewer, updateReviewer, saveReviewerToSupabase } from "@/lib/custom-content";
import { getSupabase } from "@/lib/supabase";

function ReviewerEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course") || "";
  const moduleId = searchParams.get("module") || "";
  const reviewerId = searchParams.get("id") || "";

  const [existingReviewer, setExistingReviewer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Load from Supabase
        const { data: reviewers } = await supabase
          .from("reviewers")
          .select("*, flashcards(*)")
          .eq("user_id", user.id)
          .eq("course_id", courseId)
          .eq("module_id", moduleId);

        if (reviewers) {
          const found = reviewers.find((r: any) => r.id === reviewerId || r.id.endsWith(reviewerId));
          if (found) {
            setExistingReviewer({
              id: found.id,
              courseId: found.course_id,
              moduleId: found.module_id,
              title: found.title,
              cards: (found.flashcards || []).map((c: any) => ({
                front: c.front,
                back: c.back,
                hint: c.hint || "",
              })),
            });
          }
        }
      } else {
        // Load from localStorage
        const custom = loadCustomContent();
        const course = custom.courses.find((c) => c.id === courseId);
        const mod = course?.modules.find((m) => m.id === moduleId);
        if (mod) {
          const reviewer = mod.reviewers.find((r) => r.id === reviewerId || r.id.endsWith(reviewerId));
          setExistingReviewer(reviewer || null);
        }
      }
      setLoading(false);
    })();
  }, [courseId, moduleId, reviewerId]);

  const handleSave = async (reviewer: { id: string; title: string; cards: { front: string; back: string; hint?: string }[] }) => {
    try {
      if (existingReviewer) {
        updateReviewer(courseId, moduleId, existingReviewer.id, {
          title: reviewer.title,
          cards: reviewer.cards,
        });
      } else {
        addReviewer(courseId, moduleId, {
          title: reviewer.title,
          cards: reviewer.cards,
        });
      }
      // Also save to Supabase if logged in
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const reviewerId = existingReviewer?.id || `${courseId}/${moduleId}/${reviewer.title.toLowerCase().replace(/\s+/g, "-")}`;
        await saveReviewerToSupabase(courseId, moduleId, {
          id: reviewerId,
          courseId,
          moduleId,
          title: reviewer.title,
          cards: reviewer.cards,
        });
      }
      router.push(`/courses/${courseId}/${moduleId}`);
    } catch (error) {
      console.error("Error saving reviewer:", error);
      alert("Error saving reviewer");
    }
  };

  const handleBack = () => {
    router.push(`/courses/${courseId}/${moduleId}`);
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
      initialCards={existingReviewer?.cards || []}
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
