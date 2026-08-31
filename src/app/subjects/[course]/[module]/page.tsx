"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useModuleDetail } from "@/hooks/use-db";
import { loadCustomContent } from "@/lib/custom-content";
import { isAdmin } from "@/lib/admin";
import { ChevronRight, FileText, Brain, BookOpen, Plus, Pencil } from "lucide-react";

export default function ModulePage({ params }: { params: Promise<{ course: string; module: string }> }) {
  const { course: courseSlug, module: moduleSlug } = use(params);
  const { course, module: mod, notes, moduleContents, loading } = useModuleDetail(courseSlug, moduleSlug);
  const [admin, setAdmin] = useState(false);

  useEffect(() => { setAdmin(isAdmin()); }, []);

  const customContent = loadCustomContent();
  const customCourse = customContent.courses.find((c) => c.id === courseSlug);
  const customModule = customCourse?.modules.find((m) => m.id === moduleSlug);
  const reviewers = customModule?.reviewers || [];

  if (loading) {
    return <div className="page-container"><p className="text-secondary">Loading...</p></div>;
  }

  if (!mod) {
    return <div className="page-container"><p className="text-secondary">Module not found.</p></div>;
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--os-text-dim)", marginBottom: 8 }}>
          <Link href="/subjects" style={{ color: "var(--os-text-dim)", textDecoration: "none" }}>Subjects</Link>
          <ChevronRight size={14} />
          <Link href={`/subjects/${courseSlug}`} style={{ color: "var(--os-text-dim)", textDecoration: "none" }}>{courseSlug}</Link>
          <ChevronRight size={14} />
        </div>
        <h1 className="page-title">{mod.title}</h1>
        <p className="text-secondary">{mod.description}</p>
      </div>

      <div className="module-layout" style={{ display: "flex", gap: 32 }}>
        {/* Left: Content (admin only) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {admin && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <BookOpen size={20} /> Content
                <Link href={`/editor/content?course=${courseSlug}&module=${moduleSlug}`} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--os-accent)", textDecoration: "none" }}>
                  <Plus size={14} /> <span>New</span>
                </Link>
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {moduleContents.map((content) => (
                  <Link key={content.id} href={`/subjects/${courseSlug}/${moduleSlug}/content/${content.id}`} className="glass-card-link" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{content.title}</span>
                  </Link>
                ))}
                {moduleContents.length === 0 && <p className="text-secondary text-sm">No content yet.</p>}
              </div>
            </div>
          )}
          {!admin && (
            <div className="empty-state">
              <BookOpen size={32} style={{ color: "var(--os-text-dim)", marginBottom: 12, opacity: 0.5 }} />
              <p className="text-secondary text-sm">Select a note or content from the sidebar to view it.</p>
            </div>
          )}
        </div>

        {/* Right: Notes + Flashcards */}
        <div className="module-sidebar" style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Notes */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <FileText size={20} /> Notes
              <Link href={`/editor/note?course=${courseSlug}&module=${moduleSlug}`} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--os-accent)", textDecoration: "none" }}>
                <Plus size={14} /> <span>New</span>
              </Link>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {notes.map((note) => (
                <div key={note.id} className="glass-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 8 }}>
                   <Link href={`/subjects/${courseSlug}/${moduleSlug}/${note.slug}`} style={{ flex: 1, color: "var(--os-text-primary)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {note.title}
                  </Link>
                  <Link href={`/editor/note?course=${courseSlug}&module=${moduleSlug}&slug=${note.slug}`} style={{ padding: 6, borderRadius: 6, flexShrink: 0, color: "var(--os-text-dim)" }} title="Edit">
                    <Pencil size={14} />
                  </Link>
                </div>
              ))}
              {notes.length === 0 && <p className="text-secondary text-sm">No notes yet.</p>}
            </div>
          </div>

          {/* Flash Cards */}
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <Brain size={20} /> Flash Cards
              <Link href={`/editor/reviewer?course=${courseSlug}&module=${moduleSlug}`} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-text-dim)", textDecoration: "none" }}>
                <Plus size={12} /> New
              </Link>
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {reviewers.map((reviewer) => (
                <Link key={reviewer.id} href={`/flashcards/${courseSlug}/${moduleSlug}/${reviewer.id}`} className="glass-card-link" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reviewer.title}</span>
                  <span className="text-sm text-dim" style={{ flexShrink: 0, marginLeft: 8 }}>{reviewer.cards?.length || 0} cards</span>
                </Link>
              ))}
              {reviewers.length === 0 && <p className="text-secondary text-sm">No flash cards yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
