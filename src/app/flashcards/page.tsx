"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadCustomContent, deleteReviewer, loadReviewersFromSupabase, deleteReviewerFromSupabase, saveReviewerToSupabase } from "@/lib/custom-content";
import { Brain, Trash2, Layers, ChevronRight } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function FlashcardsPage() {
  const [mounted, setMounted] = useState(false);
  const [allReviewers, setAllReviewers] = useState<{ courseId: string; moduleId: string; reviewer: any }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ courseId: string; moduleId: string; reviewerId: string; title: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const localReviewers: { courseId: string; moduleId: string; reviewer: any }[] = [];
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
      const reviewers: { courseId: string; moduleId: string; reviewer: any }[] = [];
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

  const groupedByCourse = mounted
    ? Array.from(new Set(allReviewers.map((r) => r.courseId))).map((courseId) => ({
        courseId,
        reviewers: allReviewers.filter((r) => r.courseId === courseId),
      }))
    : [];

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
          {allReviewers.length} decks across {groupedByCourse.length} courses
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
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {groupedByCourse.map(({ courseId, reviewers }) => (
            <div key={courseId}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Layers size={16} style={{ color: "var(--os-text-dim)" }} />
                <h2 className="text-xs" style={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--os-text-dim)" }}>
                  {courseId}
                </h2>
              </div>
              <div className="grid-3">
                {reviewers.map(({ courseId: cid, moduleId, reviewer }) => (
                  <div key={reviewer.id} className="glass-card-link" style={{ position: "relative" }}>
                    <Link href={`/flashcards/${reviewer.id}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h3 style={{ fontWeight: 500, color: "var(--os-text-primary)", marginBottom: 4 }}>{reviewer.title}</h3>
                          <p className="text-xs text-dim">{moduleId}</p>
                        </div>
                        <ChevronRight size={16} style={{ color: "var(--os-text-dim)", flexShrink: 0, marginTop: 2 }} />
                      </div>
                      <div style={{ marginTop: 12 }}>
                        <span style={{ fontSize: 12, padding: "2px 10px", borderRadius: 20, background: "rgba(0,212,255,0.12)", color: "var(--os-accent)", fontWeight: 500 }}>
                          {reviewer.cards?.length || 0} cards
                        </span>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteTarget({ courseId: cid, moduleId, reviewerId: reviewer.id, title: reviewer.title });
                      }}
                      style={{ position: "absolute", top: 12, right: 12, padding: 6, borderRadius: 8, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", opacity: 0.5 }}
                      title="Delete deck"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
