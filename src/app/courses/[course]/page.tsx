"use client";

import { use } from "react";
import Link from "next/link";
import { useCourseDetail } from "@/hooks/use-db";
import { ChevronRight } from "lucide-react";

export default function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseSlug } = use(params);
  const { course, modules, loading } = useCourseDetail(courseSlug);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/courses" className="text-sm text-muted-foreground hover:text-foreground">
          Courses
        </Link>
        <h1 className="text-3xl font-bold mt-2">{course.title}</h1>
        <p className="text-muted-foreground mt-2">{course.description}</p>
      </div>

      <div className="space-y-4">
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={`/courses/${course.id}/${mod.id}`}
            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-all group"
          >
            <div>
              <h2 className="font-semibold group-hover:text-primary transition-colors">
                {mod.title}
              </h2>
              <p className="text-sm text-muted-foreground">{mod.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
