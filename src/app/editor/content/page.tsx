"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NoteEditor } from "@/components/admin/note-editor";
import { getModuleContent, createModuleContent, updateModuleContent } from "@/lib/db";
import { isAdmin } from "@/app/admin/page";

function ContentEditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course") || "";
  const moduleId = searchParams.get("module") || "";
  const contentId = searchParams.get("id") || "";
  const [admin, setAdmin] = useState(false);

  const [existingContent, setExistingContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const adminStatus = isAdmin();
    setAdmin(adminStatus);
    if (!adminStatus) {
      setLoading(false);
      return;
    }
    if (contentId) {
      getModuleContent(courseId, moduleId, contentId).then((content) => {
        setExistingContent(content);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [contentId, courseId, moduleId]);

  const handleSave = async (data: { title: string; slug: string; content: string }) => {
    try {
      const id = contentId || `${courseId}/${moduleId}/${data.title.toLowerCase().replace(/\s+/g, "-")}`;
      if (existingContent) {
        await updateModuleContent(existingContent.id, { title: data.title, content: data.content });
      } else {
        await createModuleContent({
          id,
          course_id: courseId,
          module_id: moduleId,
          title: data.title,
          content: data.content,
        });
      }
      router.push(`/courses/${courseId}/${moduleId}/content/${id}`);
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Error saving content");
    }
  };

  const handleBack = () => {
    router.push(`/courses/${courseId}/${moduleId}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Access denied. Admin only.</p>
      </div>
    );
  }

  if (!courseId || !moduleId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Missing course or module ID</p>
      </div>
    );
  }

  return (
    <NoteEditor
      courseId={courseId}
      moduleId={moduleId}
      initialTitle={existingContent?.title || ""}
      initialSlug={contentId || ""}
      initialContent={existingContent?.content || ""}
      onSave={handleSave}
      onBack={handleBack}
    />
  );
}

export default function ContentEditorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <ContentEditorContent />
    </Suspense>
  );
}
