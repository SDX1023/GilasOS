"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  getCourses,
  getModules,
  getNotes,
  getModuleContents,
  createCourse,
  deleteCourse,
  createModule,
  deleteModule,
  createNote,
  deleteNote,
  createModuleContent,
  deleteModuleContent,
} from "@/lib/db";
import { loadCustomContent, addReviewer, deleteReviewer as deleteLocalReviewer } from "@/lib/custom-content";
import { Plus, Trash2, ChevronDown, ChevronRight, FileText, Brain, BookOpen, ExternalLink } from "lucide-react";

interface Course {
  id: string;
  title: string;
  description: string;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string;
}

interface Note {
  id: string;
  title: string;
  slug: string;
}

interface ContentItem {
  id: string;
  title: string;
}

interface Reviewer {
  id: string;
  title: string;
  cards?: { front: string; back: string; hint?: string }[];
}

export function AdminDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesByCourse, setModulesByCourse] = useState<{ [courseId: string]: Module[] }>({});
  const [notesByModule, setNotesByModule] = useState<{ [moduleId: string]: Note[] }>({});
  const [contentsByModule, setContentsByModule] = useState<{ [moduleId: string]: ContentItem[] }>({});
  const [reviewersByModule, setReviewersByModule] = useState<{ [moduleId: string]: Reviewer[] }>({});
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showCourseForm, setShowCourseForm] = useState(false);
  const [courseName, setCourseName] = useState("");
  const [courseDesc, setCourseDesc] = useState("");

  const [showModuleForm, setShowModuleForm] = useState<string | null>(null);
  const [moduleName, setModuleName] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");

  const [showContentForm, setShowContentForm] = useState<string | null>(null);
  const [contentName, setContentName] = useState("");

  const refresh = async () => {
    try {
      const coursesData = await getCourses();
      setCourses(coursesData);

      const modulesMap: { [courseId: string]: Module[] } = {};
      const notesMap: { [moduleId: string]: Note[] } = {};
      const contentsMap: { [moduleId: string]: ContentItem[] } = {};
      const reviewersMap: { [moduleId: string]: Reviewer[] } = {};

      const customContent = loadCustomContent();

      for (const course of coursesData) {
        try {
          const modulesData = await getModules(course.id);
          modulesMap[course.id] = modulesData;

          for (const mod of modulesData) {
            try {
              const [notesData, contentsData] = await Promise.all([
                getNotes(course.id, mod.id).catch(() => []),
                getModuleContents(course.id, mod.id).catch(() => []),
              ]);
              notesMap[mod.id] = notesData;
              contentsMap[mod.id] = contentsData;

              const customCourse = customContent.courses.find((c) => c.id === course.id);
              const customModule = customCourse?.modules.find((m) => m.id === mod.id);
              reviewersMap[mod.id] = customModule?.reviewers || [];
            } catch {}
          }
        } catch {}
      }

      setModulesByCourse(modulesMap);
      setNotesByModule(notesMap);
      setContentsByModule(contentsMap);
      setReviewersByModule(reviewersMap);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleAddCourse = async () => {
    if (!courseName.trim()) return;
    try {
      const id = courseName.toLowerCase().replace(/\s+/g, "-");
      await createCourse({ id, title: courseName, description: courseDesc || "" });
      setCourseName("");
      setCourseDesc("");
      setShowCourseForm(false);
      await refresh();
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course: " + (error as Error).message);
    }
  };

  const handleAddModule = async (courseId: string) => {
    if (!moduleName.trim()) return;
    const id = moduleName.toLowerCase().replace(/\s+/g, "-");
    await createModule({ id, course_id: courseId, title: moduleName, description: moduleDesc });
    setModuleName("");
    setModuleDesc("");
    setShowModuleForm(null);
    refresh();
  };

  const handleAddContent = async (courseId: string, moduleId: string) => {
    if (!contentName.trim()) return;
    const id = `${courseId}/${moduleId}/${contentName.toLowerCase().replace(/\s+/g, "-")}`;
    await createModuleContent({ id, course_id: courseId, module_id: moduleId, title: contentName });
    setContentName("");
    setShowContentForm(null);
    refresh();
  };

  const handleDeleteReviewer = async (courseId: string, moduleId: string, reviewerId: string) => {
    deleteLocalReviewer(courseId, moduleId, reviewerId);
    refresh();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your courses, notes, and flash cards</p>
        </div>
        <button
          onClick={() => setShowCourseForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Course
        </button>
      </div>

      {showCourseForm && (
        <div className="mb-6 p-4 rounded-xl border bg-card space-y-3">
          <h3 className="font-semibold">New Course</h3>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Course name"
            className="w-full px-3 py-2 rounded-lg border bg-background"
            autoFocus
          />
          <textarea
            value={courseDesc}
            onChange={(e) => setCourseDesc(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 rounded-lg border bg-background h-20 resize-none"
          />
          <div className="flex gap-2">
            <button onClick={handleAddCourse} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              Create
            </button>
            <button onClick={() => setShowCourseForm(false)} className="px-4 py-2 bg-muted rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {courses.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            No courses yet. Click "New Course" to get started.
          </div>
        )}

        {courses.map((course) => {
          const modules = modulesByCourse[course.id] || [];
          const isExpanded = expandedCourse === course.id;

          return (
            <div key={course.id} className="rounded-xl border bg-card">
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                  className="flex items-center gap-2 flex-1 text-left min-w-0"
                >
                  {isExpanded ? <ChevronDown className="h-5 w-5 shrink-0" /> : <ChevronRight className="h-5 w-5 shrink-0" />}
                  <BookOpen className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{course.title}</p>
                    {course.description && <p className="text-sm text-muted-foreground truncate">{course.description}</p>}
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-muted-foreground hidden sm:inline">{modules.length} modules</span>
                  <button
                    onClick={() => setShowModuleForm(course.id)}
                    className="p-1 hover:bg-muted rounded"
                    title="Add module"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={async () => { await deleteCourse(course.id); refresh(); }}
                    className="p-1 hover:bg-muted rounded text-red-500"
                    title="Delete course"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t p-4 space-y-3">
                  {showModuleForm === course.id && (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2 mb-3">
                      <input
                        type="text"
                        value={moduleName}
                        onChange={(e) => setModuleName(e.target.value)}
                        placeholder="Module name"
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                        autoFocus
                      />
                      <textarea
                        value={moduleDesc}
                        onChange={(e) => setModuleDesc(e.target.value)}
                        placeholder="Description"
                        className="w-full px-3 py-2 rounded-lg border bg-background text-sm h-16 resize-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleAddModule(course.id)} className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                          Create
                        </button>
                        <button onClick={() => setShowModuleForm(null)} className="px-3 py-1 bg-muted rounded text-sm">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {modules.map((mod) => {
                    const notes = notesByModule[mod.id] || [];
                    const contents = contentsByModule[mod.id] || [];
                    const reviewers = reviewersByModule[mod.id] || [];
                    const isModExpanded = expandedModule === mod.id;

                    return (
                      <div key={mod.id} className="rounded-lg border">
                        <div className="flex items-center justify-between p-3 bg-muted/30">
                          <button
                            onClick={() => setExpandedModule(isModExpanded ? null : mod.id)}
                            className="flex items-center gap-2 flex-1 text-left min-w-0"
                          >
                            {isModExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                            <span className="font-medium text-sm truncate">{mod.title}</span>
                            <span className="text-xs text-muted-foreground hidden sm:inline">
                              {notes.length} notes, {contents.length} content, {reviewers.length} reviewers
                            </span>
                          </button>
                          <button
                            onClick={async () => { await deleteModule(mod.id); refresh(); }}
                            className="p-1 hover:bg-muted rounded text-red-500 shrink-0"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        {isModExpanded && (
                          <div className="p-3 space-y-3">
                            {/* Notes Section */}
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Notes</p>
                              <Link
                                href={`/editor/note?course=${course.id}&module=${mod.id}`}
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Plus className="h-3 w-3" /> New Note
                              </Link>
                            </div>

                            {notes.map((note) => (
                              <div key={note.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 group">
                                <div className="flex items-center gap-2 min-w-0">
                                  <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-sm truncate">{note.title}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0 ml-2">
                                  <Link
                                    href={`/editor/note?course=${course.id}&module=${mod.id}&slug=${note.slug}`}
                                    className="p-1 hover:bg-muted rounded"
                                    title="Edit"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                  <button
                                    onClick={async () => { await deleteNote(note.id); refresh(); }}
                                    className="p-1 hover:bg-muted rounded text-red-500"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Standardized Content Section */}
                            <div className="flex items-center justify-between pt-2 border-t">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Standardized Content</p>
                              <button
                                onClick={() => setShowContentForm(showContentForm === mod.id ? null : mod.id)}
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Plus className="h-3 w-3" /> New Content
                              </button>
                            </div>

                            {showContentForm === mod.id && (
                              <div className="flex gap-2 mb-2">
                                <input
                                  type="text"
                                  value={contentName}
                                  onChange={(e) => setContentName(e.target.value)}
                                  placeholder="Content title"
                                  className="flex-1 px-3 py-1 rounded-lg border bg-background text-sm"
                                  autoFocus
                                />
                                <button onClick={() => handleAddContent(course.id, mod.id)} className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm">
                                  Create
                                </button>
                                <button onClick={() => { setShowContentForm(null); setContentName(""); }} className="px-3 py-1 bg-muted rounded text-sm">
                                  Cancel
                                </button>
                              </div>
                            )}

                            {contents.map((content) => (
                              <div key={content.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 group">
                                <div className="flex items-center gap-2 min-w-0">
                                  <BookOpen className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-sm truncate">{content.title}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0 ml-2">
                                  <Link
                                    href={`/editor/content?course=${course.id}&module=${mod.id}&id=${content.id}`}
                                    className="p-1 hover:bg-muted rounded"
                                    title="Edit"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                  <button
                                    onClick={async () => { await deleteModuleContent(content.id); refresh(); }}
                                    className="p-1 hover:bg-muted rounded text-red-500"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Reviewers Section */}
                            <div className="flex items-center justify-between pt-2 border-t">
                              <p className="text-xs font-semibold text-muted-foreground uppercase">Flash Cards</p>
                              <Link
                                href={`/editor/reviewer?course=${course.id}&module=${mod.id}`}
                                className="flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                <Plus className="h-3 w-3" /> New Reviewer
                              </Link>
                            </div>

                            {reviewers.map((reviewer) => (
                              <div key={reviewer.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50 group">
                                <div className="flex items-center gap-2 min-w-0">
                                  <Brain className="h-3 w-3 text-muted-foreground shrink-0" />
                                  <span className="text-sm truncate">{reviewer.title}</span>
                                  <span className="text-xs text-muted-foreground">
                                    ({reviewer.cards?.length || 0} cards)
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 shrink-0 ml-2">
                                  <Link
                                    href={`/editor/reviewer?course=${course.id}&module=${mod.id}&id=${reviewer.id}`}
                                    className="p-1 hover:bg-muted rounded"
                                    title="Edit"
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Link>
                                  <button
                                    onClick={() => handleDeleteReviewer(course.id, mod.id, reviewer.id)}
                                    className="p-1 hover:bg-muted rounded text-red-500"
                                    title="Delete"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
