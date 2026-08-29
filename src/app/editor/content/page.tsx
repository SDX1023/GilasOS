"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NoteEditor } from "@/components/admin/note-editor";
import { getModuleContent, createModuleContent, updateModuleContent } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

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
      router.push(`/subjects/${courseId}/${moduleId}/content/${id}`);
    } catch (error) {
      console.error("Error saving content:", error);
      alert("Error saving content");
    }
  };

  const handleBack = () => {
    router.push(`/subjects/${courseId}/${moduleId}`);
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="text-secondary animate-pulse">Loading...</p>
      </div>
    );
  }

  if (!admin) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="text-secondary">Access denied. Admin only.</p>
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
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p className="text-secondary animate-pulse">Loading...</p>
      </div>
    }>
      <ContentEditorContent />
    </Suspense>
  );
}
