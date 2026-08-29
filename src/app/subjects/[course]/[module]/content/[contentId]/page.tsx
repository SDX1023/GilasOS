"use client";

import { use, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useModuleContents } from "@/hooks/use-db";
import { MarkdownRenderer } from "@/components/notes/markdown-renderer";
import { isAdmin } from "@/lib/admin";
import { ChevronRight, Download, Pencil } from "lucide-react";
import { exportToPdf } from "@/lib/export-pdf";

export default function ContentViewerPage({
  params,
}: {
  params: Promise<{ course: string; module: string; contentId: string }>;
}) {
  const { course: courseSlug, module: moduleSlug, contentId } = use(params);
  const { contents, loading } = useModuleContents(courseSlug, moduleSlug);
  const contentRef = useRef<HTMLDivElement>(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => { setAdmin(isAdmin()); }, []);

  const content = contents.find((c) => c.id === contentId);

  if (loading) {
    return <div className="page-container"><p className="text-secondary">Loading...</p></div>;
  }

  if (!content || !admin) {
    return <div className="page-container"><p className="text-secondary">Content not found.</p></div>;
  }

  return (
    <div className="page-container" style={{ maxWidth: 800 }}>
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
            <Link href={`/editor/content?course=${courseSlug}&module=${moduleSlug}&id=${content.id}`} className="glass-btn glass-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Pencil size={14} /> Edit
            </Link>
            <button onClick={() => contentRef.current && exportToPdf(contentRef.current, content.title)} className="glass-btn glass-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <Download size={14} /> Save PDF
            </button>
          </div>
        </div>
      </div>

      <div ref={contentRef}>
        <MarkdownRenderer content={content.content || ""} allLinksMap={{}} />
      </div>
    </div>
  );
}
