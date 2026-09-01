"use client";

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";
import { GripVertical, Plus, Trash2, Image as ImageIcon, Bold, Italic, Code, Heading1, Heading2, Heading3, List, ListOrdered, Quote, Minus, AlertCircle, Info, CheckCircle } from "lucide-react";

interface Block {
  id: string;
  type: "paragraph" | "heading1" | "heading2" | "heading3" | "bullet" | "numbered" | "quote" | "divider" | "image" | "code" | "callout" | "checkbox";
  content: string;
  src?: string;
  alt?: string;
  checked?: boolean;
  indent?: number;
  numbering?: number;
}

interface BlockEditorProps {
  content: string;
  onChange: (content: string) => void;
}

function uid() {
  return Math.random().toString(36).substring(2, 10);
}

function parseBlocks(md: string): Block[] {
  const lines = md.split("\n");
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === "") { i++; continue; }
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { blocks.push({ id: uid(), type: "divider", content: "" }); i++; continue; }
    const img = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) { blocks.push({ id: uid(), type: "image", content: img[1], src: img[2], alt: img[1] }); i++; continue; }
    if (line.startsWith("### ")) { blocks.push({ id: uid(), type: "heading3", content: line.substring(4) }); i++; continue; }
    if (line.startsWith("## ")) { blocks.push({ id: uid(), type: "heading2", content: line.substring(3) }); i++; continue; }
    if (line.startsWith("# ")) { blocks.push({ id: uid(), type: "heading1", content: line.substring(2) }); i++; continue; }
    const ck = line.match(/^(\s*)- \[([ x])\]\s(.*)$/);
    if (ck) { blocks.push({ id: uid(), type: "checkbox", content: ck[3], checked: ck[2] === "x", indent: Math.floor(ck[1].length / 2) }); i++; continue; }
    const bl = line.match(/^(\s*)([-*+])\s(.*)$/);
    if (bl) { blocks.push({ id: uid(), type: "bullet", content: bl[3], indent: Math.floor(bl[1].length / 2) }); i++; continue; }
    const nl = line.match(/^(\s*)(\d+)\.\s(.*)$/);
    if (nl) { blocks.push({ id: uid(), type: "numbered", content: nl[3], indent: Math.floor(nl[1].length / 2), numbering: parseInt(nl[2]) }); i++; continue; }
    if (line.startsWith("> ")) {
      const qc = line.substring(2);
      if (qc.startsWith("⚠️ ")) { blocks.push({ id: uid(), type: "callout", content: qc.substring(3), src: "warning" }); }
      else if (qc.startsWith("ℹ️ ")) { blocks.push({ id: uid(), type: "callout", content: qc.substring(3), src: "info" }); }
      else if (qc.startsWith("✅ ")) { blocks.push({ id: uid(), type: "callout", content: qc.substring(3), src: "success" }); }
      else if (qc.startsWith("💡 ")) { blocks.push({ id: uid(), type: "callout", content: qc.substring(3), src: "tip" }); }
      else if (qc.startsWith("📝 ")) { blocks.push({ id: uid(), type: "callout", content: qc.substring(3), src: "note" }); }
      else { blocks.push({ id: uid(), type: "quote", content: qc }); }
      i++; continue;
    }
    if (line.startsWith("```")) {
      const lang = line.substring(3).trim();
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) { code.push(lines[i]); i++; }
      i++;
      blocks.push({ id: uid(), type: "code", content: code.join("\n"), alt: lang });
      continue;
    }
    blocks.push({ id: uid(), type: "paragraph", content: line });
    i++;
  }
  return blocks;
}

function toMarkdown(blocks: Block[]): string {
  return blocks.map(b => {
    const ind = "  ".repeat(b.indent || 0);
    switch (b.type) {
      case "paragraph": return b.content;
      case "heading1": return `# ${b.content}`;
      case "heading2": return `## ${b.content}`;
      case "heading3": return `### ${b.content}`;
      case "bullet": return `${ind}- ${b.content}`;
      case "numbered": return `${ind}${b.numbering || 1}. ${b.content}`;
      case "checkbox": return `${ind}- [${b.checked ? "x" : " "}] ${b.content}`;
      case "quote": return `> ${b.content}`;
      case "callout": {
        const em: Record<string, string> = { warning: "⚠️", info: "ℹ️", success: "✅", tip: "💡", note: "📝" };
        return `> ${em[b.src || "note"] || "📝"} ${b.content}`;
      }
      case "divider": return "---";
      case "image": return `![${b.alt || b.content}](${b.src})`;
      case "code": return `\`\`\`${b.alt || ""}\n${b.content}\n\`\`\``;
      default: return b.content;
    }
  }).join("\n");
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code style="background:rgba(109,40,217,0.12);padding:1px 5px;border-radius:4px;color:#c084fc;font-size:0.9em">$1</code>')
    .replace(/\[\[([^\]]+)\]\]/g, '<span style="color:var(--os-accent);text-decoration:underline;text-decoration-style:dashed;cursor:pointer">[[$1]]</span>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#60a5fa;text-decoration:underline">$1</a>');
}

const BLOCK_TYPES = [
  { type: "paragraph" as const, icon: "¶", label: "Text", desc: "Plain text" },
  { type: "heading1" as const, icon: "H1", label: "Heading 1", desc: "Large heading" },
  { type: "heading2" as const, icon: "H2", label: "Heading 2", desc: "Medium heading" },
  { type: "heading3" as const, icon: "H3", label: "Heading 3", desc: "Small heading" },
  { type: "bullet" as const, icon: "•", label: "Bullet List", desc: "Unordered list" },
  { type: "numbered" as const, icon: "1.", label: "Numbered List", desc: "Ordered list" },
  { type: "checkbox" as const, icon: "☑", label: "Checkbox", desc: "Task list" },
  { type: "quote" as const, icon: "\"", label: "Quote", desc: "Blockquote" },
  { type: "callout" as const, icon: "💡", label: "Callout", desc: "Tip / Warning / Info" },
  { type: "code" as const, icon: "</>", label: "Code", desc: "Code block" },
  { type: "image" as const, icon: "🖼", label: "Image", desc: "Upload or embed" },
  { type: "divider" as const, icon: "—", label: "Divider", desc: "Horizontal line" },
];

export function BlockEditor({ content, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(content));
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [menuFilter, setMenuFilter] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [floatingToolbar, setFloatingToolbar] = useState<{ top: number; left: number } | null>(null);
  const refs = useRef<Map<string, HTMLDivElement>>(new Map());
  const menuInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const md = toMarkdown(blocks);
    if (md !== content) onChange(md);
  }, [blocks]);

  useEffect(() => {
    const nb = parseBlocks(content);
    if (JSON.stringify(nb.map(b => ({ t: b.type, c: b.content }))) !== JSON.stringify(blocks.map(b => ({ t: b.type, c: b.content })))) {
      setBlocks(nb);
    }
  }, [content]);

  const update = useCallback((id: string, u: Partial<Block>) => {
    setBlocks(p => p.map(b => b.id === id ? { ...b, ...u } : b));
  }, []);

  const remove = useCallback((id: string) => {
    setBlocks(p => {
      const idx = p.findIndex(b => b.id === id);
      if (p.length <= 1) return p;
      const next = p.filter(b => b.id !== id);
      setTimeout(() => {
        const el = refs.current.get(next[Math.min(idx - 1, next.length - 1)]?.id);
        el?.focus();
      }, 0);
      return next;
    });
  }, []);

  const addAfter = useCallback((afterId: string, type: Block["type"] = "paragraph") => {
    const nb: Block = { id: uid(), type, content: "" };
    setBlocks(p => {
      const idx = p.findIndex(b => b.id === afterId);
      const next = [...p];
      next.splice(idx + 1, 0, nb);
      return next;
    });
    setTimeout(() => refs.current.get(nb.id)?.focus(), 0);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (block.content === "" && ["bullet", "numbered", "checkbox", "quote"].includes(block.type)) {
        update(blockId, { type: "paragraph" });
        return;
      }
      addAfter(blockId);
      return;
    }

    if (e.key === "Backspace" && block.content === "" && block.type !== "paragraph") {
      e.preventDefault();
      update(blockId, { type: "paragraph" });
      return;
    }

    if (e.key === "Backspace" && block.type === "paragraph") {
      const sel = window.getSelection();
      if (sel && sel.getRangeAt(0).startOffset === 0 && blocks.findIndex(b => b.id === blockId) > 0) {
        e.preventDefault();
        remove(blockId);
        return;
      }
    }

    if (e.key === "Tab") {
      e.preventDefault();
      if (["bullet", "numbered", "checkbox"].includes(block.type)) {
        update(blockId, { indent: Math.max(0, (block.indent || 0) + (e.shiftKey ? -1 : 1)) });
      }
    }

    // Inline formatting shortcuts
    if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
      if (e.key === "b") { e.preventDefault(); document.execCommand("bold"); }
      if (e.key === "i") { e.preventDefault(); document.execCommand("italic"); }
      if (e.key === "e") { e.preventDefault(); document.execCommand("insertHTML", false, `<code style="background:rgba(109,40,217,0.12);padding:1px 5px;border-radius:4px;color:#c084fc;font-size:0.9em">${window.getSelection()?.toString() || ""}</code>`); }
    }

    // Markdown shortcuts
    const content = block.content;
    if (content === "" || content === "#") {
      const shortcuts: Record<string, Block["type"]> = {
        "# ": "heading1", "## ": "heading2", "### ": "heading3",
        "- ": "bullet", "* ": "bullet", "+ ": "bullet",
        "1. ": "numbered", "> ": "quote", "[] ": "checkbox",
      };
      for (const [sc, type] of Object.entries(shortcuts)) {
        if (content === sc) {
          e.preventDefault();
          update(blockId, { type, content: "" });
          return;
        }
      }
    }

    // Slash command
    if (e.key === "/" && block.content === "") {
      e.preventDefault();
      const el = refs.current.get(blockId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, left: rect.left });
        setShowMenu(blockId);
        setMenuFilter("");
        setTimeout(() => menuInputRef.current?.focus(), 0);
      }
    }
  }, [blocks, addAfter, remove, update]);

  // Floating toolbar on text selection
  useEffect(() => {
    const handler = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || sel.toString().trim() === "") {
        setFloatingToolbar(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setFloatingToolbar({ top: rect.top - 44, left: rect.left + rect.width / 2 - 80 });
    };
    document.addEventListener("mouseup", handler);
    document.addEventListener("keyup", handler);
    return () => {
      document.removeEventListener("mouseup", handler);
      document.removeEventListener("keyup", handler);
    };
  }, []);

  // Image paste
  const handlePaste = useCallback((e: React.ClipboardEvent, blockId: string) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          update(blockId, { type: "image", src: reader.result as string, alt: "pasted image" });
          addAfter(blockId);
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  }, [update, addAfter]);

  // Drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverId(id);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!dragId || dragId === targetId) { setDragId(null); setDragOverId(null); return; }
    setBlocks(prev => {
      const fromIdx = prev.findIndex(b => b.id === dragId);
      const toIdx = prev.findIndex(b => b.id === targetId);
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
    setDragId(null);
    setDragOverId(null);
  }, [dragId]);

  const insertBlock = useCallback((afterId: string, type: Block["type"]) => {
    setShowMenu(null);
    const nb: Block = { id: uid(), type, content: "" };
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, nb);
      return next;
    });
    setTimeout(() => refs.current.get(nb.id)?.focus(), 0);
  }, []);

  const filteredBlocks = BLOCK_TYPES.filter(b =>
    b.label.toLowerCase().includes(menuFilter.toLowerCase()) ||
    b.desc.toLowerCase().includes(menuFilter.toLowerCase())
  );

  const renderBlock = (block: Block) => {
    const isActive = activeBlock === block.id;
    const indentPx = (block.indent || 0) * 24;
    const isDragging = dragId === block.id;
    const isOver = dragOverId === block.id;

    const wrapperStyle: React.CSSProperties = {
      display: "flex", alignItems: "flex-start", gap: 8, padding: "4px 8px",
      marginLeft: indentPx, borderRadius: 8,
      background: isActive ? "rgba(255,255,255,0.04)" : isOver ? "rgba(59,130,246,0.08)" : "transparent",
      opacity: isDragging ? 0.4 : 1,
      borderLeft: isOver ? "2px solid var(--os-accent)" : "2px solid transparent",
      transition: "background 0.15s, border-color 0.15s",
    };

    const handle = (
      <div draggable onDragStart={(e) => handleDragStart(e, block.id)} onDragEnd={() => { setDragId(null); setDragOverId(null); }}
        style={{ display: "flex", alignItems: "center", gap: 2, paddingTop: 4, flexShrink: 0, cursor: "grab", opacity: isActive ? 0.6 : 0, transition: "opacity 0.15s" }}
        className="block-handle">
        <GripVertical size={14} style={{ color: "var(--os-text-dim)" }} />
        <button onClick={(e) => { e.stopPropagation(); const el = refs.current.get(block.id); if (el) { const r = el.getBoundingClientRect(); setMenuPos({ top: r.bottom + 4, left: r.left }); setShowMenu(block.id); setMenuFilter(""); } }}
          style={{ padding: 2, borderRadius: 4, background: "none", border: "none", cursor: "pointer", color: "var(--os-text-dim)", display: "flex" }}>
          <Plus size={12} />
        </button>
      </div>
    );

    const delBtn = (
      <button onClick={(e) => { e.stopPropagation(); remove(block.id); }}
        style={{ padding: 4, borderRadius: 4, background: "none", border: "none", cursor: "pointer", color: "var(--os-text-dim)", opacity: isActive ? 0.6 : 0, transition: "opacity 0.15s", flexShrink: 0, display: "flex" }}
        className="block-delete">
        <Trash2 size={12} />
      </button>
    );

    const editableProps = (cls: string) => ({
      ref: (el: HTMLDivElement | null) => { if (el) refs.current.set(block.id, el); },
      contentEditable: true,
      suppressContentEditableWarning: true,
      dangerouslySetInnerHTML: { __html: renderInline(block.content) },
      className: cls,
      style: { outline: "none", minHeight: "1.4em", flex: 1, wordBreak: "break-word" } as React.CSSProperties,
      onBlur: (e: React.FocusEvent<HTMLDivElement>) => update(block.id, { content: e.currentTarget.textContent || "" }),
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => handleKeyDown(e, block.id),
      onPaste: (e: React.ClipboardEvent) => handlePaste(e, block.id),
      onFocus: () => setActiveBlock(block.id),
    });

    // Show/hide handles on hover
    const hoverHandlers = {
      onMouseEnter: () => { setActiveBlock(block.id); },
    };

    switch (block.type) {
      case "heading1":
        return (
          <div style={wrapperStyle} {...hoverHandlers}>
            {handle}
            <div {...editableProps("flex-1")} style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.3, outline: "none", minHeight: "1.4em", flex: 1, wordBreak: "break-word" }} />
            {delBtn}
          </div>
        );
      case "heading2":
        return (
          <div style={wrapperStyle} {...hoverHandlers}>
            {handle}
            <div {...editableProps("flex-1")} style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.3, outline: "none", minHeight: "1.4em", flex: 1, wordBreak: "break-word" }} />
            {delBtn}
          </div>
        );
      case "heading3":
        return (
          <div style={wrapperStyle} {...hoverHandlers}>
            {handle}
            <div {...editableProps("flex-1")} style={{ fontSize: 20, fontWeight: 500, lineHeight: 1.3, outline: "none", minHeight: "1.4em", flex: 1, wordBreak: "break-word" }} />
            {delBtn}
          </div>
        );
      case "bullet":
        return (
          <div style={wrapperStyle} {...hoverHandlers}>
            {handle}
            <span style={{ color: "var(--os-text-dim)", marginTop: 4, flexShrink: 0 }}>•</span>
            <div {...editableProps("flex-1")} style={{ outline: "none", minHeight: "1.4em", flex: 1, wordBreak: "break-word" }} />
            {delBtn}
          </div>
        );
      case "numbered":
        return (
          <div style={wrapperStyle} {...hoverHandlers}>
            {handle}
            <span style={{ color: "var(--os-text-dim)", marginTop: 4, flexShrink: 0, width: 20, textAlign: "right" }}>{block.numbering || 1}.</span>
            <div {...editableProps("flex-1")} style={{ outline: "none", minHeight: "1.4em", flex: 1, wordBreak: "break-word" }} />
            {delBtn}
          </div>
        );
      case "checkbox":
        return (
          <div style={wrapperStyle} {...hoverHandlers}>
            {handle}
            <input type="checkbox" checked={block.checked} onChange={(e) => update(block.id, { checked: e.target.checked })}
              style={{ marginTop: 4, flexShrink: 0, accentColor: "var(--os-accent)" }} />
            <div {...editableProps("flex-1")} style={{ outline: "none", minHeight: "1.4em", flex: 1, wordBreak: "break-word", textDecoration: block.checked ? "line-through" : "none", opacity: block.checked ? 0.5 : 1 }} />
            {delBtn}
          </div>
        );
      case "quote":
        return (
          <div style={wrapperStyle} {...hoverHandlers}>
            {handle}
            <div style={{ borderLeft: "3px solid var(--os-accent)", paddingLeft: 12, flex: 1, fontStyle: "italic", color: "var(--os-text-secondary)" }}>
              <div {...editableProps("")} style={{ outline: "none", minHeight: "1.4em", wordBreak: "break-word" }} />
            </div>
            {delBtn}
          </div>
        );
      case "callout": {
        const colors: Record<string, { border: string; bg: string; icon: any }> = {
          warning: { border: "#eab308", bg: "rgba(234,179,8,0.08)", icon: AlertCircle },
          info: { border: "#3b82f6", bg: "rgba(59,130,246,0.08)", icon: Info },
          success: { border: "#22c55e", bg: "rgba(34,197,94,0.08)", icon: CheckCircle },
          tip: { border: "#a855f7", bg: "rgba(168,85,247,0.08)", icon: Info },
          note: { border: "#6b7280", bg: "rgba(107,114,128,0.08)", icon: Info },
        };
        const c = colors[block.src || "note"] || colors.note;
        const Icon = c.icon;
        return (
          <div style={wrapperStyle} {...hoverHandlers}>
            {handle}
            <div style={{ borderLeft: `3px solid ${c.border}`, background: c.bg, borderRadius: "0 8px 8px 0", padding: "10px 14px", flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Icon size={14} style={{ color: c.border }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: c.border, textTransform: "capitalize" }}>{block.src || "note"}</span>
              </div>
              <div {...editableProps("")} style={{ outline: "none", minHeight: "1.4em", wordBreak: "break-word" }} />
            </div>
            {delBtn}
          </div>
        );
      }
      case "divider":
        return (
          <div style={{ ...wrapperStyle, padding: "8px 8px" }} {...hoverHandlers}>
            {handle}
            <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--os-glass-border)", margin: "8px 0" }} />
            {delBtn}
          </div>
        );
      case "image":
        return (
          <div style={{ ...wrapperStyle, flexDirection: "column", alignItems: "stretch" }} {...hoverHandlers}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {handle}
              <ImageIcon size={14} style={{ color: "var(--os-text-dim)" }} />
              <span style={{ fontSize: 12, color: "var(--os-text-dim)" }}>Image</span>
              {delBtn}
            </div>
            {block.src ? (
              <div style={{ marginLeft: 30, marginTop: 8, position: "relative" }}>
                <img src={block.src} alt={block.alt || ""} style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }} />
              </div>
            ) : (
              <div style={{ marginLeft: 30, marginTop: 8, padding: "12px 16px", border: "1px dashed var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-dim)", fontSize: 13, cursor: "pointer" }}
                onClick={() => {
                  const input = document.createElement("input");
                  input.type = "file";
                  input.accept = "image/*";
                  input.onchange = () => {
                    const file = input.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => update(block.id, { src: reader.result as string, alt: file.name });
                    reader.readAsDataURL(file);
                  };
                  input.click();
                }}>
                Click to upload or paste an image
              </div>
            )}
          </div>
        );
      case "code":
        return (
          <div style={{ ...wrapperStyle, flexDirection: "column", alignItems: "stretch" }} {...hoverHandlers}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {handle}
              <Code size={14} style={{ color: "var(--os-text-dim)" }} />
              <span style={{ fontSize: 12, color: "var(--os-text-dim)" }}>{block.alt || "code"}</span>
              {delBtn}
            </div>
            <textarea value={block.content} onChange={(e) => update(block.id, { content: e.target.value })}
              style={{ marginLeft: 30, marginTop: 8, padding: 12, background: "rgba(0,0,0,0.3)", borderRadius: 8, fontFamily: "'SF Mono', monospace", fontSize: 13, color: "#c084fc", border: "1px solid var(--os-glass-border)", outline: "none", resize: "vertical", minHeight: 60, tabSize: 2 }}
              spellCheck={false} />
          </div>
        );
      default:
        return (
          <div style={wrapperStyle} {...hoverHandlers}>
            {handle}
            <div {...editableProps("flex-1")} style={{ outline: "none", minHeight: "1.4em", flex: 1, wordBreak: "break-word" }} data-placeholder="Type '/' for commands..." />
            {delBtn}
          </div>
        );
    }
  };

  return (
    <div style={{ position: "relative", padding: "0 16px 120px" }}>
      <style>{`
        .block-handle, .block-delete { opacity: 0 !important; }
        div:hover > .block-handle, div:hover > .block-delete { opacity: 0.5 !important; }
        div:hover > .block-handle:hover, div:hover > .block-delete:hover { opacity: 1 !important; }
        [data-placeholder]:empty::before { content: attr(data-placeholder); color: var(--os-text-dim); opacity: 0.5; pointer-events: none; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {blocks.map((block) => (
          <div key={block.id}
            onDragOver={(e) => handleDragOver(e, block.id)}
            onDrop={(e) => handleDrop(e, block.id)}>
            {renderBlock(block)}
          </div>
        ))}
      </div>

      <button onClick={() => {
        const last = blocks[blocks.length - 1];
        if (last && last.content === "" && last.type === "paragraph") refs.current.get(last.id)?.focus();
        else addAfter(blocks[blocks.length - 1]?.id || "", "paragraph");
      }}
        style={{ width: "100%", padding: "12px 8px", background: "none", border: "none", color: "var(--os-text-dim)", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8, textAlign: "left" }}>
        <Plus size={16} /> Add a block
      </button>

      {/* Floating toolbar */}
      {floatingToolbar && (
        <div style={{
          position: "fixed", top: floatingToolbar.top, left: floatingToolbar.left,
          display: "flex", gap: 2, padding: 4, borderRadius: 8,
          background: "var(--os-glass)", border: "1px solid var(--os-glass-border)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)", zIndex: 100,
        }}>
          {[
            { icon: <Bold size={14} />, cmd: "bold", title: "Bold" },
            { icon: <Italic size={14} />, cmd: "italic", title: "Italic" },
            { icon: <Code size={14} />, cmd: "code", title: "Code" },
          ].map((btn) => (
            <button key={btn.cmd} title={btn.title}
              onClick={() => {
                if (btn.cmd === "code") {
                  const sel = window.getSelection()?.toString() || "";
                  document.execCommand("insertHTML", false, `<code style="background:rgba(109,40,217,0.12);padding:1px 5px;border-radius:4px;color:#c084fc;font-size:0.9em">${sel}</code>`);
                } else {
                  document.execCommand(btn.cmd);
                }
              }}
              style={{ padding: "4px 8px", borderRadius: 4, background: "none", border: "none", cursor: "pointer", color: "var(--os-text-primary)", display: "flex" }}>
              {btn.icon}
            </button>
          ))}
        </div>
      )}

      {/* Slash command menu */}
      {showMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 40 }} onClick={() => setShowMenu(null)} />
          <div style={{
            position: "fixed", zIndex: 50, top: menuPos.top, left: menuPos.left,
            background: "var(--os-glass)", border: "1px solid var(--os-glass-border)",
            borderRadius: 12, boxShadow: "0 8px 32px rgba(0,0,0,0.4)", padding: 8, width: 260,
            maxHeight: 360, overflowY: "auto", backdropFilter: "blur(20px)",
          }}>
            <input ref={menuInputRef} value={menuFilter} onChange={(e) => setMenuFilter(e.target.value)}
              placeholder="Filter blocks..."
              style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--os-glass-border)", background: "rgba(0,0,0,0.2)", color: "var(--os-text-primary)", fontSize: 13, outline: "none", marginBottom: 6 }} />
            {filteredBlocks.map((item) => (
              <button key={item.type} onClick={() => insertBlock(showMenu, item.type)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 6, background: "none", border: "none", cursor: "pointer", color: "var(--os-text-primary)", textAlign: "left" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
                <span style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, background: "rgba(255,255,255,0.06)", fontSize: 13, fontWeight: 600, fontFamily: "monospace", flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{item.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
