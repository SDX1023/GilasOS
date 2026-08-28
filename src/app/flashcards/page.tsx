"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadCustomContent, deleteReviewer } from "@/lib/custom-content";
import { Brain, Trash2 } from "lucide-react";

export default function FlashcardsPage() {
  const [mounted, setMounted] = useState(false);
  const [allReviewers, setAllReviewers] = useState<{ courseId: string; moduleId: string; reviewer: any }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ courseId: string; moduleId: string; reviewerId: string; title: string } | null>(null);

  function refresh() {
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

  useEffect(() => {
    refresh();
    setMounted(true);
  }, []);

  function handleDelete() {
    if (!deleteTarget) return;
    deleteReviewer(deleteTarget.courseId, deleteTarget.moduleId, deleteTarget.reviewerId);
    refresh();
    setDeleteTarget(null);
  }

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Flash Cards</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Flash Cards</h1>

      {allReviewers.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No flash cards yet.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(new Set(allReviewers.map((r) => r.courseId))).map((courseId) => {
            const courseReviewers = allReviewers.filter((r) => r.courseId === courseId);

            return (
              <div key={courseId}>
                <h2 className="text-xl font-semibold mb-4">{courseId}</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courseReviewers.map(({ courseId: cid, moduleId, reviewer }) => (
                    <div
                      key={reviewer.id}
                      className="relative p-4 rounded-lg border bg-card hover:shadow-lg transition-all group"
                    >
                      <Link href={`/flashcards/${reviewer.id}`} className="block">
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {reviewer.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {moduleId}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          {reviewer.cards?.length || 0} cards
                        </p>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteTarget({ courseId: cid, moduleId, reviewerId: reviewer.id, title: reviewer.title });
                        }}
                        className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete deck"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
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
  );
}
