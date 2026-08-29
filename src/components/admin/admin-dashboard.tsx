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
      <div className="page-container" style={{ textAlign: "center", paddingTop: 64, paddingBottom: 64 }}>
        <div className="animate-pulse" style={{ color: "var(--os-text-secondary)" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 700 }}>Admin Dashboard</h1>
          <p style={{ color: "var(--os-text-secondary)", marginTop: 4 }}>Manage your courses, notes, modules, and flash cards</p>
        </div>
        <button
          onClick={() => setShowCourseForm(true)}
          className="glass-btn glass-btn-primary"
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10 }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          New Course
        </button>
      </div>

      {showCourseForm && (
        <div className="glass-card" style={{ marginBottom: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ fontWeight: 600 }}>New Course</h3>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Course name"
            className="glass-input"
            autoFocus
          />
          <textarea
            value={courseDesc}
            onChange={(e) => setCourseDesc(e.target.value)}
            placeholder="Description (optional)"
            className="glass-input"
            style={{ height: 80, resize: "none" }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleAddCourse} className="glass-btn glass-btn-primary" style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13 }}>
              Create
            </button>
            <button onClick={() => setShowCourseForm(false)} className="glass-btn glass-btn-ghost" style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {courses.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 0", color: "var(--os-text-secondary)" }}>
            No courses yet. Click &quot;New Course&quot; to get started.
          </div>
        )}

        {courses.map((course) => {
          const modules = modulesByCourse[course.id] || [];
          const isExpanded = expandedCourse === course.id;

          return (
            <div key={course.id} className="glass-card" style={{ padding: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
                <button
                  onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                  style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, textAlign: "left", minWidth: 0, background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
                >
                  {isExpanded ? <ChevronDown style={{ width: 20, height: 20, flexShrink: 0 }} /> : <ChevronRight style={{ width: 20, height: 20, flexShrink: 0 }} />}
                  <BookOpen style={{ width: 20, height: 20, color: "var(--os-accent)", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course.title}</p>
                    {course.description && <p style={{ fontSize: 13, color: "var(--os-text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{course.description}</p>}
                  </div>
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, marginLeft: 8 }}>
                  <span className="text-xs text-dim" style={{ display: "none" }}>{modules.length} modules</span>
                  <button
                    onClick={() => setShowModuleForm(course.id)}
                    style={{ padding: 4, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "inherit" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    title="Add module"
                  >
                    <Plus style={{ width: 16, height: 16 }} />
                  </button>
                  <button
                    onClick={async () => { await deleteCourse(course.id); refresh(); }}
                    style={{ padding: 4, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    title="Delete course"
                  >
                    <Trash2 style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                  {showModuleForm === course.id && (
                    <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                      <input
                        type="text"
                        value={moduleName}
                        onChange={(e) => setModuleName(e.target.value)}
                        placeholder="Module name"
                        className="glass-input"
                        style={{ fontSize: 13 }}
                        autoFocus
                      />
                      <textarea
                        value={moduleDesc}
                        onChange={(e) => setModuleDesc(e.target.value)}
                        placeholder="Description"
                        className="glass-input"
                        style={{ fontSize: 13, height: 64, resize: "none" }}
                      />
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => handleAddModule(course.id)} className="glass-btn glass-btn-primary" style={{ padding: "6px 12px", borderRadius: 6, fontSize: 13 }}>
                          Create
                        </button>
                        <button onClick={() => setShowModuleForm(null)} className="glass-btn glass-btn-ghost" style={{ padding: "6px 12px", borderRadius: 6, fontSize: 13 }}>
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
                      <div key={mod.id} style={{ borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 12, background: "rgba(255,255,255,0.06)" }}>
                          <button
                            onClick={() => setExpandedModule(isModExpanded ? null : mod.id)}
                            style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, textAlign: "left", minWidth: 0, background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}
                          >
                            {isModExpanded ? <ChevronDown style={{ width: 16, height: 16, flexShrink: 0 }} /> : <ChevronRight style={{ width: 16, height: 16, flexShrink: 0 }} />}
                            <span style={{ fontWeight: 500, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mod.title}</span>
                            <span className="text-xs text-dim" style={{ display: "none" }}>
                              {notes.length} notes, {contents.length} content, {reviewers.length} reviewers
                            </span>
                          </button>
                          <button
                            onClick={async () => { await deleteModule(mod.id); refresh(); }}
                            style={{ padding: 4, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "#ef4444", flexShrink: 0 }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                          >
                            <Trash2 style={{ width: 12, height: 12 }} />
                          </button>
                        </div>

                        {isModExpanded && (
                          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 12 }}>
                            {/* Notes Section */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--os-text-secondary)", textTransform: "uppercase" }}>Notes</p>
                              <Link
                                href={`/editor/note?course=${course.id}&module=${mod.id}`}
                                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-accent)", textDecoration: "underline" }}
                              >
                                <Plus style={{ width: 12, height: 12 }} /> New Note
                              </Link>
                            </div>

                            {notes.map((note) => (
                              <NoteRow
                                key={note.id}
                                note={note}
                                courseId={course.id}
                                moduleId={mod.id}
                                onDelete={async () => { await deleteNote(note.id); refresh(); }}
                              />
                            ))}

                            {/* Standardized Content Section */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--os-text-secondary)", textTransform: "uppercase" }}>Module Content</p>
                              <button
                                onClick={() => setShowContentForm(showContentForm === mod.id ? null : mod.id)}
                                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-accent)", textDecoration: "underline", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                              >
                                <Plus style={{ width: 12, height: 12 }} /> New Content
                              </button>
                            </div>

                            {showContentForm === mod.id && (
                              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                                <input
                                  type="text"
                                  value={contentName}
                                  onChange={(e) => setContentName(e.target.value)}
                                  placeholder="Content title"
                                  className="glass-input"
                                  style={{ flex: 1, fontSize: 13, padding: "6px 12px" }}
                                  autoFocus
                                />
                                <button onClick={() => handleAddContent(course.id, mod.id)} className="glass-btn glass-btn-primary" style={{ padding: "6px 12px", borderRadius: 6, fontSize: 13 }}>
                                  Create
                                </button>
                                <button onClick={() => { setShowContentForm(null); setContentName(""); }} className="glass-btn glass-btn-ghost" style={{ padding: "6px 12px", borderRadius: 6, fontSize: 13 }}>
                                  Cancel
                                </button>
                              </div>
                            )}

                            {contents.map((content) => (
                              <ContentRow
                                key={content.id}
                                content={content}
                                courseId={course.id}
                                moduleId={mod.id}
                                onDelete={async () => { await deleteModuleContent(content.id); refresh(); }}
                              />
                            ))}

                            {/* Reviewers Section */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                              <p style={{ fontSize: 12, fontWeight: 600, color: "var(--os-text-secondary)", textTransform: "uppercase" }}>Flash Cards</p>
                              <Link
                                href={`/editor/reviewer?course=${course.id}&module=${mod.id}`}
                                style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-accent)", textDecoration: "underline" }}
                              >
                                <Plus style={{ width: 12, height: 12 }} /> New Reviewer
                              </Link>
                            </div>

                            {reviewers.map((reviewer) => (
                              <ReviewerRow
                                key={reviewer.id}
                                reviewer={reviewer}
                                courseId={course.id}
                                moduleId={mod.id}
                                onDelete={() => handleDeleteReviewer(course.id, mod.id, reviewer.id)}
                              />
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

function NoteRow({ note, courseId, moduleId, onDelete }: { note: Note; courseId: string; moduleId: string; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", borderRadius: 6, background: hovered ? "rgba(255,255,255,0.03)" : "transparent", transition: "background 0.15s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <FileText style={{ width: 12, height: 12, color: "var(--os-text-secondary)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{note.title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, opacity: hovered ? 1 : 0, flexShrink: 0, marginLeft: 8, transition: "opacity 0.15s" }}>
        <Link
          href={`/editor/note?course=${courseId}&module=${moduleId}&slug=${note.slug}`}
          style={{ padding: 4, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "inherit", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          title="Edit"
        >
          <ExternalLink style={{ width: 12, height: 12 }} />
        </Link>
        <button
          onClick={onDelete}
          style={{ padding: 4, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          title="Delete"
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}

function ContentRow({ content, courseId, moduleId, onDelete }: { content: ContentItem; courseId: string; moduleId: string; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", borderRadius: 6, background: hovered ? "rgba(255,255,255,0.03)" : "transparent", transition: "background 0.15s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <BookOpen style={{ width: 12, height: 12, color: "var(--os-text-secondary)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{content.title}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, opacity: hovered ? 1 : 0, flexShrink: 0, marginLeft: 8, transition: "opacity 0.15s" }}>
        <Link
          href={`/editor/content?course=${courseId}&module=${moduleId}&id=${content.id}`}
          style={{ padding: 4, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "inherit", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          title="Edit"
        >
          <ExternalLink style={{ width: 12, height: 12 }} />
        </Link>
        <button
          onClick={onDelete}
          style={{ padding: 4, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          title="Delete"
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}

function ReviewerRow({ reviewer, courseId, moduleId, onDelete }: { reviewer: Reviewer; courseId: string; moduleId: string; onDelete: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px", borderRadius: 6, background: hovered ? "rgba(255,255,255,0.03)" : "transparent", transition: "background 0.15s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Brain style={{ width: 12, height: 12, color: "var(--os-text-secondary)", flexShrink: 0 }} />
        <span style={{ fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reviewer.title}</span>
        <span className="text-xs text-dim">
          ({reviewer.cards?.length || 0} cards)
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, opacity: hovered ? 1 : 0, flexShrink: 0, marginLeft: 8, transition: "opacity 0.15s" }}>
        <Link
          href={`/editor/reviewer?course=${courseId}&module=${moduleId}&id=${reviewer.id}`}
          style={{ padding: 4, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "inherit", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          title="Edit"
        >
          <ExternalLink style={{ width: 12, height: 12 }} />
        </Link>
        <button
          onClick={onDelete}
          style={{ padding: 4, borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          title="Delete"
        >
          <Trash2 style={{ width: 12, height: 12 }} />
        </button>
      </div>
    </div>
  );
}
