"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadCustomContent, deleteReviewer, loadReviewersFromSupabase, deleteReviewerFromSupabase, saveReviewerToSupabase } from "@/lib/custom-content";
import { Brain, Trash2, ChevronRight, ChevronDown } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

interface ReviewerEntry {
  courseId: string;
  moduleId: string;
  reviewer: any;
}

interface ModuleGroup {
  moduleId: string;
  reviewers: ReviewerEntry[];
}

interface CourseGroup {
  courseId: string;
  modules: ModuleGroup[];
}

function groupReviewers(allReviewers: ReviewerEntry[]): CourseGroup[] {
  const courseMap = new Map<string, Map<string, ReviewerEntry[]>>();
  for (const r of allReviewers) {
    if (!courseMap.has(r.courseId)) courseMap.set(r.courseId, new Map());
    const modMap = courseMap.get(r.courseId)!;
    if (!modMap.has(r.moduleId)) modMap.set(r.moduleId, []);
    modMap.get(r.moduleId)!.push(r);
  }
  const result: CourseGroup[] = [];
  for (const [courseId, modMap] of courseMap) {
    const modules: ModuleGroup[] = [];
    for (const [moduleId, reviewers] of modMap) {
      modules.push({ moduleId, reviewers });
    }
    result.push({ courseId, modules });
  }
  return result;
}

export default function FlashcardsPage() {
  const [mounted, setMounted] = useState(false);
  const [allReviewers, setAllReviewers] = useState<ReviewerEntry[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ courseId: string; moduleId: string; reviewerId: string; title: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [openCourses, setOpenCourses] = useState<Set<string>>(new Set());
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const localReviewers: ReviewerEntry[] = [];
      const customContent = loadCustomContent();
      for (const course of customContent.courses) {
        for (const mod of course.modules) {
          for (const reviewer of mod.reviewers) {
            localReviewers.push({ courseId: course.id, moduleId: mod.id, reviewer });
          }
        }
      }

      if (user) {
        const cloudReviewers = await loadReviewersFromSupabase();
        const cloudIds = new Set(cloudReviewers.map((r) => r.reviewer.id));
        const missingFromCloud = localReviewers.filter((r) => !cloudIds.has(r.reviewer.id));
        for (const item of missingFromCloud) {
          saveReviewerToSupabase(item.courseId, item.moduleId, item.reviewer).catch(() => {});
        }
        setAllReviewers([...cloudReviewers, ...missingFromCloud]);
      } else {
        setAllReviewers(localReviewers);
      }
      setMounted(true);
    })();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    if (userId) {
      await deleteReviewerFromSupabase(deleteTarget.reviewerId);
      const cloudReviewers = await loadReviewersFromSupabase();
      setAllReviewers(cloudReviewers);
    } else {
      deleteReviewer(deleteTarget.courseId, deleteTarget.moduleId, deleteTarget.reviewerId);
      const customContent = loadCustomContent();
      const reviewers: ReviewerEntry[] = [];
      for (const course of customContent.courses) {
        for (const mod of course.modules) {
          for (const reviewer of mod.reviewers) {
            reviewers.push({ courseId: course.id, moduleId: mod.id, reviewer });
          }
        }
      }
      setAllReviewers(reviewers);
    }
    setDeleteTarget(null);
  }

  const grouped = mounted ? groupReviewers(allReviewers) : [];

  const toggleCourse = (id: string) => {
    setOpenCourses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!mounted) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title"><Brain size={28} /> Flash Cards</h1>
          <p className="page-subtitle">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><Brain size={28} /> Flash Cards</h1>
        <p className="page-subtitle">
          {allReviewers.length} decks across {grouped.length} courses
        </p>
      </div>

      {allReviewers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Brain size={32} style={{ color: "var(--os-text-dim)" }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>No flash cards yet</h2>
          <p className="text-secondary text-sm">Create decks from the PDF tool or study sections.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {grouped.map((course) => {
            const courseOpen = openCourses.has(course.courseId);
            const totalCards = course.modules.reduce((sum, m) => sum + m.reviewers.reduce((s, r) => s + (r.reviewer.cards?.length || 0), 0), 0);
            return (
              <div key={course.courseId} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                <button
                  onClick={() => toggleCourse(course.courseId)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                    background: "none", border: "none", cursor: "pointer", textAlign: "left",
                    fontFamily: "Inter, sans-serif",
                  }}
                >
                  {courseOpen ? <ChevronDown size={18} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} /> : <ChevronRight size={18} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600, fontSize: 16, color: "var(--os-text-primary)" }}>{course.courseId}</span>
                    <span className="text-xs" style={{ color: "var(--os-text-dim)", marginLeft: 8 }}>
                      {course.modules.length} modules &middot; {totalCards} cards
                    </span>
                  </div>
                </button>

                {courseOpen && (
                  <div style={{ borderTop: "1px solid var(--os-glass-border)", padding: "4px 0" }}>
                    {course.modules.map((mod) => {
                      const modKey = `${course.courseId}/${mod.moduleId}`;
                      const modOpen = openModules.has(modKey);
                      const modCards = mod.reviewers.reduce((s, r) => s + (r.reviewer.cards?.length || 0), 0);
                      return (
                        <div key={modKey}>
                          <button
                            onClick={() => toggleModule(modKey)}
                            style={{
                              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px 10px 46px",
                              background: "none", border: "none", cursor: "pointer", textAlign: "left",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            {modOpen ? <ChevronDown size={14} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <span className="text-sm" style={{ fontWeight: 500, color: "var(--os-text-secondary)" }}>{mod.moduleId}</span>
                              <span className="text-xs" style={{ color: "var(--os-text-dim)", marginLeft: 8 }}>
                                {mod.reviewers.length} decks &middot; {modCards} cards
                              </span>
                            </div>
                          </button>

                          {modOpen && (
                            <div style={{ padding: "0 16px 8px 62px", display: "flex", flexDirection: "column", gap: 6 }}>
                              {mod.reviewers.map(({ courseId: cid, moduleId, reviewer }) => (
                                <div
                                  key={reviewer.id}
                                  className="glass-card-link"
                                  style={{ position: "relative", padding: "10px 14px" }}
                                >
                                  <Link href={`/flashcards/${reviewer.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <span className="text-sm" style={{ fontWeight: 500, color: "var(--os-text-primary)" }}>{reviewer.title}</span>
                                      <span className="text-xs" style={{ color: "var(--os-text-dim)", marginLeft: 8 }}>
                                        {reviewer.cards?.length || 0} cards
                                      </span>
                                    </div>
                                    <ChevronRight size={14} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />
                                  </Link>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setDeleteTarget({ courseId: cid, moduleId, reviewerId: reviewer.id, title: reviewer.title });
                                    }}
                                    style={{ position: "absolute", top: 8, right: 8, padding: 4, borderRadius: 6, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", opacity: 0.4 }}
                                    title="Delete deck"
                                  >
                                    <Trash2 size={13} />
                                  </button>
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
      )}

      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="glass-panel" style={{ maxWidth: 380, width: "100%", margin: "0 16px" }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Delete Deck?</h3>
            <p className="text-secondary text-sm" style={{ marginBottom: 20 }}>
              Are you sure you want to delete &quot;{deleteTarget.title}&quot;? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} className="glass-btn glass-btn-ghost">Cancel</button>
              <button onClick={handleDelete} className="glass-btn" style={{ background: "#ef4444", color: "#fff" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
