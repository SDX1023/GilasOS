"use client";

import { useState, useEffect } from "react";
import {
  getCourses as dbGetCourses,
  getModules as dbGetModules,
  getNotes as dbGetNotes,
  getNote as dbGetNote,
  getModuleContents as dbGetModuleContents,
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
  const [moduleContents, setModuleContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && moduleId) {
      Promise.all([
        dbGetCourses().then((courses) => courses.find((c) => c.id === courseId)),
        dbGetModules(courseId).then((mods) => mods.find((m) => m.id === moduleId)),
        dbGetNotes(courseId, moduleId),
        dbGetModuleContents(courseId, moduleId),
      ])
        .then(([courseData, modData, notesData, contentsData]) => {
          setCourse(courseData);
          setModule(modData);
          setNotes(notesData);
          setModuleContents(contentsData);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [courseId, moduleId]);

  return { course, module, notes, moduleContents, loading };
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

export function useModuleContents(courseId: string, moduleId: string) {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId && moduleId) {
      dbGetModuleContents(courseId, moduleId)
        .then(setContents)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [courseId, moduleId]);

  return { contents, loading };
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
