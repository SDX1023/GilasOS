"use client";

import Link from "next/link";
import { useRef } from "react";
import { useCustomNote, useCustomLinksMap } from "@/hooks/use-custom-content";
import { MarkdownRenderer } from "@/components/notes/markdown-renderer";
import { BacklinksPanel } from "@/components/notes/backlinks-panel";
import { ChevronRight, Download, Pencil } from "lucide-react";
import { exportToPdf } from "@/lib/export-pdf";

interface NoteViewerProps {
  courseId: string;
  moduleId: string;
  slug: string;
  repoNote?: {
    meta: { title: string; slug: string };
    content: string;
    links: string[];
  } | null;
  repoLinksMap?: { [slug: string]: { courseId: string; moduleId: string; slug: string } };
  repoBacklinks?: { id: string; courseId: string; moduleId: string; slug: string; title: string }[];
}

export function NoteViewer({ courseId, moduleId, slug, repoNote, repoLinksMap, repoBacklinks }: NoteViewerProps) {
  const customNote = useCustomNote(courseId, moduleId, slug);
  const customLinksMap = useCustomLinksMap();
  const contentRef = useRef<HTMLDivElement>(null);

  const note = customNote || (repoNote ? { content: repoNote.content, title: repoNote.meta.title } : null);
  const linksMap = { ...repoLinksMap, ...customLinksMap };

  if (!note) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Note not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/subjects" className="hover:text-foreground">Subjects</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/subjects/${courseId}`} className="hover:text-foreground">{courseId}</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/subjects/${courseId}/${moduleId}`} className="hover:text-foreground">{moduleId}</Link>
          <ChevronRight className="h-4 w-4" />
          <span>{slug}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">{note.title}</h1>
            {customNote && (
              <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">Custom</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/editor/note?course=${courseId}&module=${moduleId}&slug=${slug}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-sm no-print"
            >
              <Pencil className="h-4 w-4" /> Edit
            </Link>
            <button
              onClick={() => contentRef.current && exportToPdf(contentRef.current, note.title)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-sm no-print"
            >
              <Download className="h-4 w-4" /> Save PDF
            </button>
          </div>
        </div>
      </div>

      <div ref={contentRef}>
        <MarkdownRenderer content={note.content} allLinksMap={linksMap} />
      </div>

      {repoBacklinks && repoBacklinks.length > 0 && <BacklinksPanel backlinks={repoBacklinks} />}
    </div>
  );
}
