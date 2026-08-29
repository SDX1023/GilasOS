"use client";

import Link from "next/link";
import { useCourses } from "@/hooks/use-db";
import { BookOpen, ChevronRight } from "lucide-react";

export default function CoursesPage() {
  const { courses, loading } = useCourses();

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-7 w-7" /> Subjects
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? "Loading..." : `${courses.length} courses available`}
          </p>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 rounded-2xl border bg-card animate-pulse">
                <div className="h-5 bg-muted rounded w-1/2 mb-3" />
                <div className="h-4 bg-muted rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold mb-1">No courses yet</h2>
            <p className="text-sm text-muted-foreground">Courses will appear here once they are added.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course, i) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group p-5 rounded-2xl border bg-card hover:bg-muted/30 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold group-hover:text-primary transition-colors truncate">
                      {course.title}
                    </h2>
                    {course.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{course.description}</p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0 ml-2 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
