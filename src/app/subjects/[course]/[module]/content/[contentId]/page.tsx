"use client";

import { use, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useModuleContents } from "@/hooks/use-db";
import { MarkdownRenderer } from "@/components/notes/markdown-renderer";
import { isAdmin } from "@/lib/admin";
import { ChevronRight, Download, Pencil, Trash2 } from "lucide-react";
import { exportToPdf } from "@/lib/export-pdf";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteModuleContent } from "@/lib/db";

export default function ContentViewerPage({
  params,
}: {
  params: Promise<{ course: string; module: string; contentId: string }>;
}) {
  const { course: courseSlug, module: moduleSlug, contentId } = use(params);
  const router = useRouter();
  const { contents, loading } = useModuleContents(courseSlug, moduleSlug);
  const contentRef = useRef<HTMLDivElement>(null);
  const [admin, setAdmin] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { setAdmin(isAdmin()); }, []);

  const content = contents.find((c) => c.id === contentId);

  if (loading) {
    return <div className="page-container"><p className="text-secondary">Loading...</p></div>;
  }

  if (!content) {
    return <div className="page-container"><p className="text-secondary">Content not found.</p></div>;
  }

  const handleDelete = async () => {
    await deleteModuleContent(contentId);
    router.push(`/subjects/${courseSlug}/${moduleSlug}`);
  };

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
      <ConfirmDialog open={confirmDelete} title="Delete Content?" message={`Permanently delete "${content.title}"? This cannot be undone.`} confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setConfirmDelete(false)} />
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--os-text-dim)", marginBottom: 8 }}>
          <Link href="/subjects" style={{ color: "var(--os-text-dim)", textDecoration: "none" }}>Subjects</Link>
          <ChevronRight size={14} />
          <Link href={`/subjects/${courseSlug}`} style={{ color: "var(--os-text-dim)", textDecoration: "none" }}>{courseSlug}</Link>
          <ChevronRight size={14} />
          <Link href={`/subjects/${courseSlug}/${moduleSlug}`} style={{ color: "var(--os-text-dim)", textDecoration: "none" }}>{moduleSlug}</Link>
          <ChevronRight size={14} />
          <span>{content.title}</span>
        </div>
        <div className="flex-between">
          <h1 className="page-title">{content.title}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {admin && (
              <>
                <Link href={`/editor/content?course=${courseSlug}&module=${moduleSlug}&id=${content.id}`} className="glass-btn glass-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <Pencil size={14} /> Edit
                </Link>
                <button onClick={() => setConfirmDelete(true)} className="glass-btn" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#ef4444", borderColor: "rgba(239,68,68,0.3)" }}>
                  <Trash2 size={14} /> Delete
                </button>
              </>
            )}
            <button onClick={() => contentRef.current && exportToPdf(contentRef.current, content.title)} className="glass-btn glass-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Download size={14} /> Save PDF
            </button>
          </div>
        </div>
      </div>

      <div ref={contentRef} style={{
        background: "rgba(10, 14, 24, 0.6)",
        border: "1px solid rgba(255,255,255,0.05)",
        borderRadius: 6,
        padding: 0,
        backdropFilter: "blur(12px)",
        boxShadow: "0 2px 20px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)",
        overflow: "hidden",
      }}>
        <MarkdownRenderer content={content.content || ""} allLinksMap={{}} />
      </div>
    </div>
  );
}
