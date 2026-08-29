"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadCustomContent, deleteReviewer, loadReviewersFromSupabase, deleteReviewerFromSupabase, saveReviewerToSupabase } from "@/lib/custom-content";
import { Brain, Trash2, Layers, ChevronRight } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function FlashcardsPage() {
  const [mounted, setMounted] = useState(false);
  const [allReviewers, setAllReviewers] = useState<{ courseId: string; moduleId: string; reviewer: any }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ courseId: string; moduleId: string; reviewerId: string; title: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const localReviewers: { courseId: string; moduleId: string; reviewer: any }[] = [];
      const customContent = loadCustomContent();
      for (const course of customContent.courses) {
        for (const mod of course.modules) {
          for (const reviewer of mod.reviewers) {
            localReviewers.push({ courseId: course.id, moduleId: mod.id, reviewer });
          }
        }
      }

      if (user) {
        const cloudReviewers = await loadReviewersFromSupabase();
        const cloudIds = new Set(cloudReviewers.map((r) => r.reviewer.id));
        const missingFromCloud = localReviewers.filter((r) => !cloudIds.has(r.reviewer.id));

        for (const item of missingFromCloud) {
          saveReviewerToSupabase(item.courseId, item.moduleId, item.reviewer).catch(() => {});
        }

        setAllReviewers([...cloudReviewers, ...missingFromCloud]);
      } else {
        setAllReviewers(localReviewers);
      }
      setMounted(true);
    })();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    if (userId) {
      await deleteReviewerFromSupabase(deleteTarget.reviewerId);
      const cloudReviewers = await loadReviewersFromSupabase();
      setAllReviewers(cloudReviewers);
    } else {
      deleteReviewer(deleteTarget.courseId, deleteTarget.moduleId, deleteTarget.reviewerId);
      const customContent = loadCustomContent();
      const reviewers: { courseId: string; moduleId: string; reviewer: any }[] = [];
      for (const course of customContent.courses) {
        for (const mod of course.modules) {
          for (const reviewer of mod.reviewers) {
            reviewers.push({ courseId: course.id, moduleId: mod.id, reviewer });
          }
        }
      }
      setAllReviewers(reviewers);
    }
    setDeleteTarget(null);
  }

  const groupedByCourse = mounted
    ? Array.from(new Set(allReviewers.map((r) => r.courseId))).map((courseId) => ({
        courseId,
        reviewers: allReviewers.filter((r) => r.courseId === courseId),
      }))
    : [];

  if (!mounted) {
    return (
      <div className="min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Brain className="h-7 w-7" /> Flash Cards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <Brain className="h-7 w-7" /> Flash Cards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {allReviewers.length} decks across {groupedByCourse.length} courses
          </p>
        </div>

        {allReviewers.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Brain className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1">No flash cards yet</h2>
            <p className="text-sm text-muted-foreground">Create decks from the PDF tool or study sections.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {groupedByCourse.map(({ courseId, reviewers }) => (
              <div key={courseId}>
                <div className="flex items-center gap-2 mb-3">
                  <Layers className="h-4 w-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{courseId}</h2>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {reviewers.map(({ courseId: cid, moduleId, reviewer }) => (
                    <div
                      key={reviewer.id}
                      className="group relative p-4 rounded-2xl border bg-card hover:bg-muted/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <Link href={`/flashcards/${reviewer.id}`} className="block">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium group-hover:text-primary transition-colors truncate">
                              {reviewer.title}
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{moduleId}</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2 mt-0.5" />
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            {reviewer.cards?.length || 0} cards
                          </span>
                        </div>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteTarget({ courseId: cid, moduleId, reviewerId: reviewer.id, title: reviewer.title });
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete deck"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete Modal */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-card border rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <h3 className="text-lg font-semibold mb-2">Delete Deck?</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Are you sure you want to delete &quot;{deleteTarget.title}&quot;? This cannot be undone.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
