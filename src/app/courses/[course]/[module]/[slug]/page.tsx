"use client";

import { use } from "react";
import { useNote, useAllNotesLinks } from "@/hooks/use-db";
import { NoteViewer } from "@/components/notes/note-viewer";

export default function NotePage({ params }: { params: Promise<{ course: string; module: string; slug: string }> }) {
  const { course: courseSlug, module: moduleSlug, slug } = use(params);
  const { note, loading } = useNote(courseSlug, moduleSlug, slug);
  const { linksMap } = useAllNotesLinks();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <NoteViewer
      courseId={courseSlug}
      moduleId={moduleSlug}
      slug={slug}
      repoNote={note ? { meta: { title: note.title, slug: note.slug }, content: note.content || "", links: [] } : null}
      repoLinksMap={linksMap}
      repoBacklinks={[]}
    />
  );
}
