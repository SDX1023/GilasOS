"use client";

import Link from "next/link";
import { loadCustomContent } from "@/lib/custom-content";
import { Brain } from "lucide-react";

export default function ReviewersPage() {
  const customContent = loadCustomContent();
  const allReviewers: { courseId: string; moduleId: string; reviewer: any }[] = [];

  for (const course of customContent.courses) {
    for (const mod of course.modules) {
      for (const reviewer of mod.reviewers) {
        allReviewers.push({ courseId: course.id, moduleId: mod.id, reviewer });
      }
    }
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
                    <Link
                      key={reviewer.id}
                      href={`/reviewers/${cid}/${moduleId}/${reviewer.id}`}
                      className="p-4 rounded-lg border bg-card hover:shadow-lg transition-all group"
                    >
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
