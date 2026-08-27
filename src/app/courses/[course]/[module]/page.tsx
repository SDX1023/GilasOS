"use client";

import { use } from "react";
import Link from "next/link";
import { useModuleDetail } from "@/hooks/use-db";
import { ChevronRight, FileText, Brain, Plus, Pencil } from "lucide-react";

export default function ModulePage({ params }: { params: Promise<{ course: string; module: string }> }) {
  const { course: courseSlug, module: moduleSlug } = use(params);
  const { course, module: mod, notes, reviewers, loading } = useModuleDetail(courseSlug, moduleSlug);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!mod) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Module not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/courses" className="hover:text-foreground">Courses</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/courses/${courseSlug}`} className="hover:text-foreground">{courseSlug}</Link>
          <ChevronRight className="h-4 w-4" />
        </div>
        <h1 className="text-3xl font-bold">{mod.title}</h1>
        <p className="text-muted-foreground mt-2">{mod.description}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Notes
            <Link
              href={`/editor/note?course=${courseSlug}&module=${moduleSlug}`}
              className="ml-auto flex items-center gap-1 text-sm text-primary hover:underline font-normal"
            >
              <Plus className="h-4 w-4" /> New
            </Link>
          </h2>
          <div className="space-y-2">
            {notes.map((note) => (
              <div
                key={note.id}
                className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:shadow-md transition-all group"
              >
                <Link
                  href={`/courses/${course?.id || courseSlug}/${mod.id}/${note.slug}`}
                  className="flex-1 hover:text-primary transition-colors"
                >
                  {note.title}
                </Link>
                <Link
                  href={`/editor/note?course=${courseSlug}&module=${moduleSlug}&slug=${note.slug}`}
                  className="p-1.5 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Edit"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-sm text-muted-foreground">No notes yet.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Flash Cards
            <Link
              href={`/editor/reviewer?course=${courseSlug}&module=${moduleSlug}`}
              className="ml-auto flex items-center gap-1 text-sm text-primary hover:underline font-normal"
            >
              <Plus className="h-4 w-4" /> New
            </Link>
          </h2>
          <div className="space-y-2">
            {reviewers.map((reviewer) => (
              <Link
                key={reviewer.id}
                href={`/reviewers/${course?.id || courseSlug}/${mod.id}/${reviewer.id}`}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-md transition-all"
              >
                <span className="hover:text-primary transition-colors">{reviewer.title}</span>
                <span className="text-sm text-muted-foreground">
                  {reviewer.flashcards?.length || 0} cards
                </span>
              </Link>
            ))}
            {reviewers.length === 0 && (
              <p className="text-sm text-muted-foreground">No flash cards yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
