"use client";

import Link from "next/link";
import { useAllReviewersWithCards } from "@/hooks/use-db";
import { Brain } from "lucide-react";

export default function ReviewersPage() {
  const { reviewers, loading } = useAllReviewersWithCards();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Flash Cards</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading flash cards...</div>
        </div>
      ) : reviewers.length === 0 ? (
        <div className="text-center py-12">
          <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No flash cards yet.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(new Set(reviewers.map((r) => r.course_id))).map((courseId) => {
            const courseReviewers = reviewers.filter((r) => r.course_id === courseId);

            return (
              <div key={courseId}>
                <h2 className="text-xl font-semibold mb-4">{courseId}</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {courseReviewers.map((reviewer) => (
                    <Link
                      key={reviewer.id}
                      href={`/reviewers/${reviewer.course_id}/${reviewer.module_id}/${reviewer.id}`}
                      className="p-4 rounded-lg border bg-card hover:shadow-lg transition-all group"
                    >
                      <h3 className="font-medium group-hover:text-primary transition-colors">
                        {reviewer.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {reviewer.module_id}
                      </p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {reviewer.flashcards?.length || 0} cards
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
