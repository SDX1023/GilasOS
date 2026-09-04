"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadCustomContent, deleteReviewer, loadReviewersFromSupabase, deleteReviewerFromSupabase, saveReviewerToSupabase, addModule } from "@/lib/custom-content";
import { Brain, Trash2, ChevronRight, ChevronDown, Plus, Pencil, Check, X, GripVertical } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

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
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [allReviewers, setAllReviewers] = useState<ReviewerEntry[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ courseId: string; moduleId: string; reviewerId: string; title: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [openCourses, setOpenCourses] = useState<Set<string>>(new Set());
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [showCreateDeck, setShowCreateDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckModule, setNewDeckModule] = useState("");
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dragOverModule, setDragOverModule] = useState<string | null>(null);
  const [addingModuleTo, setAddingModuleTo] = useState<string | null>(null);
  const [newModuleName, setNewModuleName] = useState("");

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

  const addModuleToCourse = async (courseId: string) => {
    if (!newModuleName.trim()) return;
    const moduleId = newModuleName.trim().toLowerCase().replace(/\s+/g, "-");
    addModule(courseId, { id: moduleId, courseId, title: newModuleName.trim(), description: "" });
    if (userId) {
      const reviewerId = `${courseId}/${moduleId}/_placeholder_${Date.now()}`;
      const placeholder = { id: reviewerId, moduleId, courseId, title: newModuleName.trim(), cards: [] };
      await saveReviewerToSupabase(courseId, moduleId, placeholder);
    }
    const cloudReviewers = await loadReviewersFromSupabase();
    setAllReviewers(cloudReviewers);
    setAddingModuleTo(null);
    setNewModuleName("");
    const next = new Set(openModules);
    next.add(`${courseId}/${moduleId}`);
    setOpenModules(next);
  };

  const createDeck = async () => {
    if (!newDeckName.trim() || !userId) return;
    setCreating(true);
    const courseId = newDeckModule.trim() || "My Decks";
    const moduleId = "custom";
    const reviewerId = `${courseId}/${moduleId}/${Date.now()}`;
    const reviewer = { id: reviewerId, moduleId, courseId, title: newDeckName.trim(), cards: [] };
    await saveReviewerToSupabase(courseId, moduleId, reviewer);
    const cloudReviewers = await loadReviewersFromSupabase();
    setAllReviewers(cloudReviewers);
    setNewDeckName("");
    setNewDeckModule("");
    setShowCreateDeck(false);
    setCreating(false);
  };

  const handleRename = async (reviewerId: string) => {
    if (!renamingTitle.trim() || !userId) return;
    await getSupabase().from("reviewers").update({ title: renamingTitle.trim() }).eq("id", reviewerId);
    setRenamingId(null);
    setRenamingTitle("");
    const cloudReviewers = await loadReviewersFromSupabase();
    setAllReviewers(cloudReviewers);
  };

  const handleDragStart = (e: React.DragEvent, reviewerId: string) => {
    setDraggedId(reviewerId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", reviewerId);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDragOverModule(null);
  };

  const handleDrop = async (newCourseId: string, newModuleId: string) => {
    if (!draggedId) return;
    await getSupabase().from("reviewers").update({ course_id: newCourseId, module_id: newModuleId }).eq("id", draggedId);
    setDraggedId(null);
    setDragOverModule(null);
    const cloudReviewers = await loadReviewersFromSupabase();
    setAllReviewers(cloudReviewers);
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

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon"><Brain size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Sign in required</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>Log in to access your flashcard decks.</p>
          <Link href="/login" className="glass-btn glass-btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1 className="page-title"><Brain size={28} /> Flash Cards</h1>
          <p className="page-subtitle">
            {allReviewers.length} decks across {grouped.length} courses
          </p>
        </div>
        <button onClick={() => setShowCreateDeck(true)} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <Plus size={16} /> Create Deck
        </button>
      </div>

      {allReviewers.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Brain size={32} style={{ color: "var(--os-text-dim)" }} />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>No flash cards yet</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>Create a deck manually or generate from a PDF.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            <button onClick={() => setShowCreateDeck(true)} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Plus size={14} /> Create Deck
            </button>
            <Link href="/pdf-to-cards" className="glass-btn" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Brain size={14} /> Generate from PDF
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {grouped.map((course) => {
            const courseOpen = openCourses.has(course.courseId);
            const totalCards = course.modules.reduce((sum, m) => sum + m.reviewers.reduce((s, r) => s + (r.reviewer.cards?.length || 0), 0), 0);
            return (
              <div key={course.courseId} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button
                    onClick={() => toggleCourse(course.courseId)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
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
                  <button
                    onClick={(e) => { e.stopPropagation(); setAddingModuleTo(course.courseId); if (!openCourses.has(course.courseId)) toggleCourse(course.courseId); }}
                    style={{ padding: "6px 10px", marginRight: 12, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-accent)", fontFamily: "Inter, sans-serif", borderRadius: 6, flexShrink: 0 }}
                    title="Add Module"
                  >
                    <Plus size={14} /> Module
                  </button>
                </div>

                {courseOpen && (
                  <div style={{ borderTop: "1px solid var(--os-glass-border)", padding: "4px 0" }}>
                    {course.modules.map((mod) => {
                      const modKey = `${course.courseId}/${mod.moduleId}`;
                      const modOpen = openModules.has(modKey);
                      const modCards = mod.reviewers.reduce((s, r) => s + (r.reviewer.cards?.length || 0), 0);
                      return (
                        <div key={modKey}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverModule(modKey); }}
                          onDrop={(e) => { e.preventDefault(); handleDrop(course.courseId, mod.moduleId); }}
                          style={dragOverModule === modKey ? { outline: "2px dashed var(--os-accent)", outlineOffset: 2, borderRadius: 8, background: "rgba(59,130,246,0.05)" } : undefined}>
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
                              {mod.reviewers.map(({ courseId: cid, moduleId, reviewer }) => {
                                const isRenaming = renamingId === reviewer.id;
                                return (
                                  <div
                                    key={reviewer.id}
                                    className="glass-card-link"
                                    draggable={!isRenaming}
                                    onDragStart={(e) => handleDragStart(e, reviewer.id)}
                                    onDragEnd={handleDragEnd}
                                    style={{ position: "relative", padding: "10px 14px", opacity: draggedId === reviewer.id ? 0.4 : 1, display: "flex", alignItems: "center", gap: 8 }}
                                  >
                                    <GripVertical size={14} style={{ color: "var(--os-text-dim)", cursor: "grab", flexShrink: 0, opacity: 0.4 }} />
                                    <Link href={isRenaming ? "#" : `/flashcards/${reviewer.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flex: 1, minWidth: 0 }} onClick={(e) => isRenaming && e.preventDefault()}>
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        {isRenaming ? (
                                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <input
                                              autoFocus
                                              className="glass-input"
                                              value={renamingTitle}
                                              onChange={(e) => setRenamingTitle(e.target.value)}
                                              onKeyDown={(e) => { if (e.key === "Enter") handleRename(reviewer.id); if (e.key === "Escape") { setRenamingId(null); setRenamingTitle(""); } }}
                                              style={{ flex: 1, padding: "2px 6px", fontSize: 13 }}
                                              onClick={(e) => e.stopPropagation()}
                                            />
                                            <button onClick={(e) => { e.preventDefault(); handleRename(reviewer.id); }} style={{ background: "var(--os-accent)", border: "none", borderRadius: 4, color: "#fff", padding: "2px 6px", cursor: "pointer", flexShrink: 0 }}><Check size={12} /></button>
                                            <button onClick={(e) => { e.preventDefault(); setRenamingId(null); setRenamingTitle(""); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 4, color: "var(--os-text-secondary)", padding: "2px 6px", cursor: "pointer", flexShrink: 0 }}><X size={12} /></button>
                                          </div>
                                        ) : (
                                          <>
                                            <span className="text-sm" style={{ fontWeight: 500, color: "var(--os-text-primary)" }}>{reviewer.title}</span>
                                            <span className="text-xs" style={{ color: "var(--os-text-dim)", marginLeft: 8 }}>
                                              {reviewer.cards?.length || 0} cards
                                            </span>
                                          </>
                                        )}
                                      </div>
                                      {!isRenaming && <ChevronRight size={14} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />}
                                    </Link>
                                    {!isRenaming && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setRenamingId(reviewer.id);
                                          setRenamingTitle(reviewer.title);
                                        }}
                                        style={{ padding: 4, borderRadius: 6, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", opacity: 0.4, flexShrink: 0 }}
                                        title="Rename deck"
                                      >
                                        <Pencil size={13} />
                                      </button>
                                    )}
                                    {!isRenaming && (
                                      <button
                                        onClick={(e) => {
                                          e.preventDefault();
                                          setDeleteTarget({ courseId: cid, moduleId, reviewerId: reviewer.id, title: reviewer.title });
                                        }}
                                        style={{ padding: 4, borderRadius: 6, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", opacity: 0.4, flexShrink: 0 }}
                                        title="Delete deck"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div style={{ padding: "4px 16px 8px 46px" }}>
                      {addingModuleTo === course.courseId ? (
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input
                            className="glass-input"
                            value={newModuleName}
                            onChange={(e) => setNewModuleName(e.target.value)}
                            placeholder="Module name"
                            autoFocus
                            style={{ flex: 1, padding: "6px 10px", fontSize: 13 }}
                            onKeyDown={(e) => { if (e.key === "Enter") addModuleToCourse(course.courseId); if (e.key === "Escape") { setAddingModuleTo(null); setNewModuleName(""); } }}
                          />
                          <button onClick={() => addModuleToCourse(course.courseId)} className="glass-btn glass-btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}>Add</button>
                          <button onClick={() => { setAddingModuleTo(null); setNewModuleName(""); }} className="glass-btn" style={{ padding: "6px 12px", fontSize: 12 }}>Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingModuleTo(course.courseId)}
                          className="btn-tab"
                          style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", fontSize: 12, borderRadius: 8, color: "var(--os-accent)" }}
                        >
                          <Plus size={12} /> Add Module
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreateDeck && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="glass-panel" style={{ maxWidth: 380, width: "100%", margin: "0 16px" }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Create New Deck</h3>
            <input className="glass-input" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} placeholder="Deck name" autoFocus style={{ width: "100%", marginBottom: 10 }} onKeyDown={(e) => { if (e.key === "Enter") createDeck(); }} />
            <input className="glass-input" value={newDeckModule} onChange={(e) => setNewDeckModule(e.target.value)} placeholder="Course (optional, defaults to My Decks)" style={{ width: "100%", marginBottom: 16 }} onKeyDown={(e) => { if (e.key === "Enter") createDeck(); }} />
            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <button onClick={() => { setShowCreateDeck(false); setNewDeckName(""); setNewDeckModule(""); }} className="glass-btn glass-btn-ghost">Cancel</button>
              <button onClick={createDeck} disabled={!newDeckName.trim() || creating} className="glass-btn glass-btn-primary" style={{ opacity: !newDeckName.trim() || creating ? 0.5 : 1 }}>
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
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
