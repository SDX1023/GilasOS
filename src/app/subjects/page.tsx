"use client";

import Link from "next/link";
import { useCourses } from "@/hooks/use-db";
import { BookOpen, ChevronRight } from "lucide-react";

export default function CoursesPage() {
  const { courses, loading } = useCourses();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">
          <BookOpen size={28} /> Subjects
        </h1>
        <p className="page-subtitle">
          {loading ? "Loading..." : `${courses.length} courses available`}
        </p>
      </div>

      {loading ? (
        <div className="grid-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card" style={{ opacity: 0.5 }}>
              <div style={{ height: 20, background: "rgba(255,255,255,0.05)", borderRadius: 8, width: "50%", marginBottom: 12 }} />
              <div style={{ height: 16, background: "rgba(255,255,255,0.03)", borderRadius: 8, width: "70%" }} />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={32} style={{ color: "var(--os-text-dim)" }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>No courses yet</h2>
          <p className="text-secondary text-sm">Courses will appear here once they are added.</p>
        </div>
      ) : (
        <div className="grid-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/subjects/${course.id}`}
              className="glass-card-link"
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--os-text-primary)", marginBottom: 4 }}>
                  {course.title}
                </h2>
                {course.description && (
                  <p className="text-secondary text-sm" style={{ lineHeight: 1.5 }}>
                    {course.description}
                  </p>
                )}
              </div>
              <ChevronRight size={18} style={{ color: "var(--os-text-dim)", flexShrink: 0, marginLeft: 12 }} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
