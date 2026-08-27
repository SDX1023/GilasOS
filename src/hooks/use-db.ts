"use client";

import { useState, useEffect } from "react";
import {
  getCourses as dbGetCourses,
  getModules as dbGetModules,
  getNotes as dbGetNotes,
  getNote as dbGetNote,
  getReviewers as dbGetReviewers,
  getAllReviewers as dbGetAllReviewers,
  getReviewerWithCards as dbGetReviewerWithCards,
  getAllNotes as dbGetAllNotes,
} from "@/lib/db";

export function useCourses() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dbGetCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { courses, loading };
}

export function useModules(courseId: string) {
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      dbGetModules(courseId)
        .then(setModules)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [courseId]);

  return { modules, loading };
}

export function useCourseDetail(courseId: string) {
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      Promise.all([
        dbGetCourses().then((courses) => courses.find((c) => c.id === courseId)),
        dbGetModules(courseId),
      ])
        .then(([courseData, modulesData]) => {
          setCourse(courseData);
          setModules(modulesData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [courseId]);

  return { course, modules, loading };
}

export function useModuleDetail(courseId: string, moduleId: string) {
  const [course, setCourse] = useState<any>(null);
  const [module, setModule] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && moduleId) {
      Promise.all([
        dbGetCourses().then((courses) => courses.find((c) => c.id === courseId)),
        dbGetModules(courseId).then((mods) => mods.find((m) => m.id === moduleId)),
        dbGetNotes(courseId, moduleId),
        dbGetReviewers(courseId, moduleId),
      ])
        .then(([courseData, modData, notesData, reviewersData]) => {
          setCourse(courseData);
          setModule(modData);
          setNotes(notesData);
          setReviewers(reviewersData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [courseId, moduleId]);

  return { course, module, notes, reviewers, loading };
}

export function useNote(courseId: string, moduleId: string, slug: string) {
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && moduleId && slug) {
      dbGetNote(courseId, moduleId, slug)
        .then(setNote)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [courseId, moduleId, slug]);

  return { note, loading };
}

export function useAllReviewersWithCards() {
  const [reviewers, setReviewers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dbGetAllReviewers()
      .then(setReviewers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { reviewers, loading };
}

export function useReviewer(reviewerId: string) {
  const [reviewer, setReviewer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (reviewerId) {
      dbGetReviewerWithCards(reviewerId)
        .then(setReviewer)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [reviewerId]);

  return { reviewer, loading };
}

export function useAllNotesLinks() {
  const [linksMap, setLinksMap] = useState<{ [slug: string]: { courseId: string; moduleId: string; slug: string } }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dbGetAllNotes()
      .then((notes) => {
        const map: { [slug: string]: { courseId: string; moduleId: string; slug: string } } = {};
        for (const note of notes) {
          map[note.slug] = { courseId: note.course_id, moduleId: note.module_id, slug: note.slug };
          map[note.id] = { courseId: note.course_id, moduleId: note.module_id, slug: note.slug };
        }
        setLinksMap(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { linksMap, loading };
}
