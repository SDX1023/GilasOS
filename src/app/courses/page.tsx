"use client";

import Link from "next/link";
import { useCourses } from "@/hooks/use-db";
import { BookOpen } from "lucide-react";

export default function CoursesPage() {
  const { courses, loading } = useCourses();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Courses</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-pulse text-muted-foreground">Loading courses...</div>
        </div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No courses found.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className="p-6 rounded-lg border bg-card hover:shadow-lg transition-all group"
            >
              <h2 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                {course.title}
              </h2>
              <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
