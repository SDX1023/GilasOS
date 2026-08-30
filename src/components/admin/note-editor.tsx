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
        const width = attrs.match(/width="(\d+)"/)?.[1] || "280";
        const height = attrs.match(/height="(\d+)"/)?.[1] || "100";
        const color = attrs.match(/color="([^"]*)"/)?.[1] || "#3b82f6";
        const rawContent = inner.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").trim();
        return `<div style="position:absolute;left:${x}px;top:${y}px;width:${width}px;min-height:${height}px;border:2px solid ${color};background:rgba(15,21,35,0.9);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:8px;font-size:14px;white-space:pre-wrap;z-index:10;">${rawContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</div>`;
      }
    );
    html = html.replace(
      /<img([^>]*data-x="[^"]*"[^>]*)>/g,
      (_m: string, attrs: string) => {
        const src = attrs.match(/src="([^"]*)"/)?.[1] || "";
        const alt = attrs.match(/alt="([^"]*)"/)?.[1] || "";
        const x = attrs.match(/data-x="([^"]*)"/)?.[1] || "50";
        const y = attrs.match(/data-y="([^"]*)"/)?.[1] || "50";
        const style = attrs.match(/style="([^"]*)"/)?.[1] || "";
        const posStyle = `position:absolute;left:${x}px;top:${y}px;`;
        return `<img src="${src}" alt="${alt}" style="${posStyle}${style}" />`;
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

  const modeBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: 6, borderRadius: 6, background: active ? "rgba(255,255,255,0.08)" : "transparent",
    border: "none", cursor: "pointer", color: "var(--os-text-secondary)",
    display: "flex", alignItems: "center", justifyContent: "center",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 16px", borderBottom: "1px solid var(--os-glass-border)", background: "var(--os-bg-secondary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onBack} style={{ padding: 6, borderRadius: 8, background: "none", border: "none", cursor: "pointer", color: "var(--os-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ArrowLeft size={16} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--os-text-dim)" }}>
            <span>{courseId}</span>
            <span>/</span>
            <span>{moduleId}</span>
            {slug && (<><span>/</span><span>{slug}</span></>)}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {lastSaved && (
            <span style={{ fontSize: 12, color: "var(--os-text-dim)" }}>Saved {lastSaved.toLocaleTimeString()}</span>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 2, padding: 2, borderRadius: 8, border: "1px solid var(--os-glass-border)" }}>
            <button onClick={() => setMode("edit")} style={modeBtnStyle(mode === "edit")} title="Edit">
              <Edit3 size={14} />
            </button>
            <button onClick={() => setMode("split")} style={modeBtnStyle(mode === "split")} title="Split view">
              <div style={{ display: "flex", gap: 2 }}>
                <div style={{ width: 6, height: 16, border: "1px solid var(--os-text-dim)", borderRadius: 2 }} />
                <div style={{ width: 6, height: 16, border: "1px solid var(--os-text-dim)", borderRadius: 2 }} />
              </div>
            </button>
            <button onClick={() => setMode("preview")} style={modeBtnStyle(mode === "preview")} title="Preview">
              <Eye size={14} />
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "6px 14px",
              background: "var(--os-accent)", opacity: (!title.trim() || isSaving) ? 0.5 : 1,
              border: "none", borderRadius: 8, color: "#fff", fontSize: 13, fontWeight: 500,
              cursor: (!title.trim() || isSaving) ? "not-allowed" : "pointer",
              fontFamily: "Inter, sans-serif",
            }}
          >
            <Save size={14} />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="editor-wrapper" style={{ flex: 1, display: "flex", minHeight: 0 }}>
        {/* Editor */}
        <div style={{
          width: mode === "split" ? "50%" : mode === "edit" ? "100%" : 0,
          display: mode === "preview" ? "none" : "flex", flexDirection: "column",
          overflow: "auto", borderRight: mode === "split" ? "2px solid rgba(109,40,217,0.4)" : undefined,
        }}>
          <div style={{ padding: "16px 16px 8px" }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled"
              style={{
                width: "100%", fontSize: 28, fontWeight: 700, background: "transparent",
                border: "none", outline: "none", color: "var(--os-text-primary)",
                fontFamily: "Inter, sans-serif",
              }}
            />
          </div>
          <InlineEditor content={content} onChange={setContent} />
        </div>

        {/* Preview */}
        {(mode === "preview" || mode === "split") && (
          <div style={{ width: mode === "split" ? "50%" : "100%", overflow: "visible", background: mode === "split" ? "rgba(255,255,255,0.015)" : "transparent" }}>
            {mode === "split" && <div style={{ padding: "16px 16px 0", fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: 1 }}>Preview</div>}
            <div style={{ height: mode === "split" ? 8 : 100 }} />
            <div
              style={{ padding: "0 32px 32px", maxWidth: 800, margin: "0 auto", color: "var(--os-text-secondary)", lineHeight: 1.7, position: "relative", minHeight: 400 }}
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          </div>
        )}
      </div>
    </div>
  );
}