"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NoteEditor } from "@/components/admin/note-editor";
import { getNote, createNote, updateNote } from "@/lib/db";

function NoteEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course") || "";
  const moduleId = searchParams.get("module") || "";
  const slug = searchParams.get("slug") || "";

  const [existingNote, setExistingNote] = useState<any>(null);
  const [loading, setLoading] = useState(!!slug);

  useEffect(() => {
    if (slug && courseId && moduleId) {
      getNote(courseId, moduleId, slug).then((note) => {
        setExistingNote(note);
        setLoading(false);
      });
    }
  }, [slug, courseId, moduleId]);

  const handleSave = async (note: { id: string; title: string; slug: string; content: string }) => {
    try {
      if (existingNote) {
        await updateNote(existingNote.id, {
          title: note.title,
          slug: note.slug,
          content: note.content,
        });
      } else {
        const saved = await createNote({
          id: note.id,
          course_id: courseId,
          module_id: moduleId,
          title: note.title,
          slug: note.slug,
          content: note.content,
        });
        if (saved) {
          setExistingNote(saved);
        }
      }
    } catch (error) {
      console.error("Error saving note:", error);
      alert("Error saving note");
    }
  };

  const handleBack = () => {
    router.push("/courses");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="text-secondary animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!courseId || !moduleId) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="text-secondary">Missing course or module ID</p>
      </div>
    );
  }

  return (
    <NoteEditor
      courseId={courseId}
      moduleId={moduleId}
      noteId={existingNote?.id}
      initialTitle={existingNote?.title || ""}
      initialContent={existingNote?.content || ""}
      initialSlug={existingNote?.slug || slug}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}

export default function NoteEditorPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="text-secondary animate-pulse">Loading...</p>
      </div>
    }>
      <NoteEditorContent />
    </Suspense>
  );
}
