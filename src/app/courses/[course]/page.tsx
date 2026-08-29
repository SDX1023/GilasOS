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
      <div className="page-container">
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page-container">
        <p className="text-secondary">Course not found.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 32 }}>
        <Link href="/courses" style={{ fontSize: 13, color: "var(--os-text-dim)", textDecoration: "none" }}>Courses</Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{course.title}</h1>
        <p className="text-secondary">{course.description}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={`/courses/${course.id}/${mod.id}`}
            className="glass-card-link"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--os-text-primary)", marginBottom: 4 }}>{mod.title}</h2>
              <p className="text-secondary text-sm">{mod.description}</p>
            </div>
            <ChevronRight size={20} style={{ color: "var(--os-text-dim)", flexShrink: 0, marginLeft: 12 }} />
          </Link>
        ))}
      </div>
    </div>
  );
}
