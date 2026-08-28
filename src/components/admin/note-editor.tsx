"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, ArrowLeft, Eye, Edit3 } from "lucide-react";
import { InlineEditor, markdownToHtml } from "./inline-editor";

interface NoteEditorProps {
  courseId: string;
  moduleId: string;
  noteId?: string;
  initialTitle?: string;
  initialContent?: string;
  initialSlug?: string;
  onSave: (note: { id: string; title: string; slug: string; content: string }) => void;
  onBack: () => void;
}

export function NoteEditor({
  courseId,
  moduleId,
  noteId,
  initialTitle = "",
  initialContent = "",
  initialSlug = "",
  onSave,
  onBack,
}: NoteEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [slug, setSlug] = useState(initialSlug);
  const [content, setContent] = useState(initialContent);
  const [preview, setPreview] = useState("");
  const [mode, setMode] = useState<"edit" | "preview" | "split">("edit");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (!initialSlug && title) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
    }
  }, [title, initialSlug]);

  useEffect(() => {
    let html = markdownToHtml(content);
    html = html.replace(
      /<div\s+data-textbox=""([^>]*)>([\s\S]*?)<\/div>/g,
      (_m: string, attrs: string, inner: string) => {
        const x = attrs.match(/x="(\d+)"/)?.[1] || "100";
        const y = attrs.match(/y="(\d+)"/)?.[1] || "100";
        const width = attrs.match(/width="(\d+)"/)?.[1] || "200";
        const height = attrs.match(/height="(\d+)"/)?.[1] || "80";
        const color = attrs.match(/color="([^"]*)"/)?.[1] || "#3b82f6";
        const rawContent = inner.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").trim();
        return `<div style="position:absolute;left:${x}px;top:${y}px;width:${width}px;height:${height}px;border:2px solid ${color};background:${color}10;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:8px;font-size:14px;overflow:auto;pointer-events:auto;white-space:pre-wrap;">${rawContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</div>`;
      }
    );
    setPreview(html);
  }, [content]);

  const handleSave = useCallback(async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    const id = noteId || `${courseId}/${moduleId}/${slug}`;
    onSave({ id, title, slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), content });
    setLastSaved(new Date());
    setIsSaving(false);
  }, [title, slug, content, noteId, courseId, moduleId, onSave]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (title.trim()) handleSave();
    }, 30000);
    return () => clearInterval(interval);
  }, [title, handleSave]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave]);

  const previewClassName = [
    "p-4 sm:p-8 max-w-4xl mx-auto prose prose-neutral dark:prose-invert relative",
    "prose-headings:scroll-mt-20",
    "prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline",
    "prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg",
    "prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-code:before:content-none prose-code:after:content-none",
    "prose-strong:text-foreground",
    "prose-img:rounded-lg prose-img:shadow-md",
    "prose-li:my-0.5",
    "prose-ul:list-disc prose-ol:list-decimal",
    "prose-table:border prose-th:border prose-td:border",
    "prose-blockquote:border-l-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-muted/50 prose-blockquote:rounded-r-lg",
  ].join(" ");

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="hidden sm:inline">{courseId}</span>
            <span className="hidden sm:inline">/</span>
            <span className="hidden sm:inline">{moduleId}</span>
            {slug && (
              <>
                <span className="hidden sm:inline">/</span>
                <span>{slug}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastSaved && (
            <span className="text-xs text-muted-foreground">Saved {lastSaved.toLocaleTimeString()}</span>
          )}

          <div className="flex items-center border rounded-lg">
            <button onClick={() => setMode("edit")} className={`p-2 ${mode === "edit" ? "bg-muted" : ""}`} title="Edit">
              <Edit3 className="h-4 w-4" />
            </button>
            <button onClick={() => setMode("split")} className={`p-2 ${mode === "split" ? "bg-muted" : ""}`} title="Split view">
              <div className="flex gap-0.5">
                <div className="w-1.5 h-4 border rounded-sm" />
                <div className="w-1.5 h-4 border rounded-sm" />
              </div>
            </button>
            <button onClick={() => setMode("preview")} className={`p-2 ${mode === "preview" ? "bg-muted" : ""}`} title="Preview">
              <Eye className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0">
        <div className={`${mode === "split" ? "w-1/2 border-r" : mode === "edit" ? "w-full" : "hidden"} flex flex-col overflow-auto`}>
          <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              className="w-full text-2xl sm:text-4xl font-bold bg-transparent outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          <InlineEditor content={content} onChange={setContent} />
        </div>

        {(mode === "preview" || mode === "split") && (
          <div className={`${mode === "split" ? "w-1/2" : "w-full"} overflow-auto`}>
            <div className="px-4 sm:px-8 pt-4 sm:pt-6 pb-2">
              <h1 className="text-2xl sm:text-4xl font-bold">{title || "Untitled"}</h1>
            </div>
            <div
              className={previewClassName}
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
