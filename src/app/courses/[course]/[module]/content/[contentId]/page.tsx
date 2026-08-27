"use client";

import { use } from "react";
import Link from "next/link";
import { useModuleContents } from "@/hooks/use-db";
import { MarkdownRenderer } from "@/components/notes/markdown-renderer";
import { isAdmin } from "@/app/admin/page";
import { ChevronRight, Download, Pencil } from "lucide-react";
import { exportToPdf } from "@/lib/export-pdf";
import { useRef } from "react";

export default function ContentViewerPage({
  params,
}: {
  params: Promise<{ course: string; module: string; contentId: string }>;
}) {
  const { course: courseSlug, module: moduleSlug, contentId } = use(params);
  const { contents, loading } = useModuleContents(courseSlug, moduleSlug);
  const contentRef = useRef<HTMLDivElement>(null);
  const admin = isAdmin();

  const content = contents.find((c) => c.id === contentId);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!content || !admin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Content not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/courses" className="hover:text-foreground">Courses</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/courses/${courseSlug}`} className="hover:text-foreground">{courseSlug}</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/courses/${courseSlug}/${moduleSlug}`} className="hover:text-foreground">{moduleSlug}</Link>
          <ChevronRight className="h-4 w-4" />
          <span>{content.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{content.title}</h1>
          <div className="flex items-center gap-2">
            <Link
              href={`/editor/content?course=${courseSlug}&module=${moduleSlug}&id=${content.id}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-sm no-print"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <button
              onClick={() => contentRef.current && exportToPdf(contentRef.current, content.title)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-sm no-print"
            >
              <Download className="h-4 w-4" /> Save PDF
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
