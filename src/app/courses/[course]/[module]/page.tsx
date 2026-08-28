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

  useEffect(() => {
    setAdmin(isAdmin());
  }, []);

  const customContent = loadCustomContent();
  const customCourse = customContent.courses.find((c) => c.id === courseSlug);
  const customModule = customCourse?.modules.find((m) => m.id === moduleSlug);
  const reviewers = customModule?.reviewers || [];

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

      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* Left: Content (admin only) */}
        <div className="flex-1 min-w-0">
          {admin && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Content
                <Link
                  href={`/editor/content?course=${courseSlug}&module=${moduleSlug}`}
                  className="ml-auto flex items-center gap-1 text-sm text-primary hover:underline font-normal"
                >
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New</span>
                </Link>
              </h2>
              <div className="space-y-2">
                {moduleContents.map((content) => (
                  <Link
                    key={content.id}
                    href={`/courses/${courseSlug}/${moduleSlug}/content/${content.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-md transition-all"
                  >
                    <span className="hover:text-primary transition-colors truncate">{content.title}</span>
                  </Link>
                ))}
                {moduleContents.length === 0 && (
                  <p className="text-sm text-muted-foreground">No content yet.</p>
                )}
              </div>
            </div>
          )}
          {!admin && (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a note or content from the sidebar to view it.</p>
            </div>
          )}
        </div>

        {/* Right: Notes + Flashcards */}
        <div className="w-full lg:w-80 shrink-0 space-y-6">
          {/* Notes */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
              <Link
                href={`/editor/note?course=${courseSlug}&module=${moduleSlug}`}
                className="ml-auto flex items-center gap-1 text-sm text-primary hover:underline font-normal"
              >
                <Plus className="h-4 w-4" /> <span className="hidden sm:inline">New</span>
              </Link>
            </h2>
            <div className="space-y-2">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center gap-2 p-3 rounded-lg border bg-card hover:shadow-md transition-all"
                >
                  <Link
                    href={`/courses/${courseSlug}/${moduleSlug}/${note.slug}`}
                    className="flex-1 hover:text-primary transition-colors min-w-0 truncate"
                  >
                    {note.title}
                  </Link>
                  <Link
                    href={`/editor/note?course=${courseSlug}&module=${moduleSlug}&slug=${note.slug}`}
                    className="p-1.5 rounded hover:bg-muted shrink-0"
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

          {/* Flash Cards */}
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Flash Cards
              <Link
                href={`/editor/reviewer?course=${courseSlug}&module=${moduleSlug}`}
                className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <Plus className="h-3 w-3" /> New
              </Link>
            </h2>
            <div className="space-y-2">
              {reviewers.map((reviewer) => (
                <Link
                  key={reviewer.id}
                  href={`/flashcards/${courseSlug}/${moduleSlug}/${reviewer.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:shadow-md transition-all"
                >
                  <span className="hover:text-primary transition-colors truncate">{reviewer.title}</span>
                  <span className="text-sm text-muted-foreground shrink-0 ml-2">
                    {reviewer.cards?.length || 0} cards
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
    </div>
  );
}
