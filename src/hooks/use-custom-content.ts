"use client";

import { useState, useEffect } from "react";
import { loadCustomContent, type CustomCourse, type CustomNote, type CustomReviewer } from "@/lib/custom-content";

export interface CourseWithSource extends CustomCourse {
  source: "repo" | "custom";
}

export function useAllCourses() {
  const [courses, setCourses] = useState<CourseWithSource[]>([]);

  useEffect(() => {
    const custom = loadCustomContent();
    const customCourses: CourseWithSource[] = custom.courses.map((c) => ({ ...c, source: "custom" }));
    setCourses(customCourses);
  }, []);

  return courses;
}

export function useAllNotes() {
  const [notes, setNotes] = useState<(CustomNote & { source: "custom" })[]>([]);

  useEffect(() => {
    const custom = loadCustomContent();
    const allNotes: (CustomNote & { source: "custom" })[] = [];
    for (const course of custom.courses) {
      for (const mod of course.modules) {
        for (const note of mod.notes) {
          allNotes.push({ ...note, source: "custom" });
        }
      }
    }
    setNotes(allNotes);
  }, []);

  return notes;
}

export function useAllReviewers() {
  const [reviewers, setReviewers] = useState<(CustomReviewer & { source: "custom" })[]>([]);

  useEffect(() => {
    const custom = loadCustomContent();
    const allReviewers: (CustomReviewer & { source: "custom" })[] = [];
    for (const course of custom.courses) {
      for (const mod of course.modules) {
        for (const reviewer of mod.reviewers) {
          allReviewers.push({ ...reviewer, source: "custom" });
        }
      }
    }
    setReviewers(allReviewers);
  }, []);

  return reviewers;
}

export function useCustomLinksMap() {
  const [linksMap, setLinksMap] = useState<{ [slug: string]: { courseId: string; moduleId: string; slug: string } }>({});

  useEffect(() => {
    const custom = loadCustomContent();
    const map: { [slug: string]: { courseId: string; moduleId: string; slug: string } } = {};
    for (const course of custom.courses) {
      for (const mod of course.modules) {
        for (const note of mod.notes) {
          map[note.slug] = { courseId: course.id, moduleId: mod.id, slug: note.slug };
          map[note.id] = { courseId: course.id, moduleId: mod.id, slug: note.slug };
        }
      }
    }
    setLinksMap(map);
  }, []);

  return linksMap;
}

export function useCustomNote(courseId: string, moduleId: string, slug: string) {
  const [note, setNote] = useState<CustomNote | null>(null);

  useEffect(() => {
    const custom = loadCustomContent();
    for (const course of custom.courses) {
      for (const mod of course.modules) {
        const found = mod.notes.find((n) => n.slug === slug && n.courseId === courseId && n.moduleId === moduleId);
        if (found) {
          setNote(found);
          return;
        }
      }
    }
    setNote(null);
  }, [courseId, moduleId, slug]);

  return note;
}

export function useCustomReviewer(courseId: string, moduleId: string, reviewerId: string) {
  const [reviewer, setReviewer] = useState<CustomReviewer | null>(null);

  useEffect(() => {
    const custom = loadCustomContent();
    for (const course of custom.courses) {
      for (const mod of course.modules) {
        const found = mod.reviewers.find((r) => r.id === reviewerId || r.id.endsWith(reviewerId));
        if (found) {
          setReviewer(found);
          return;
        }
      }
    }
    setReviewer(null);
  }, [courseId, moduleId, reviewerId]);

  return reviewer;
}
