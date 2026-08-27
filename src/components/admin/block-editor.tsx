"use client";

import { useState, useRef, useCallback, useEffect, KeyboardEvent } from "react";
import {
  GripVertical,
  Plus,
  Trash2,
  ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Code,
  Bold,
  Italic,
  AlertCircle,
  Info,
  CheckCircle,
} from "lucide-react";

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

function generateId() {
  return Math.random().toString(36).substring(2, 10);
}

function parseBlocks(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Divider
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      blocks.push({ id: generateId(), type: "divider", content: "" });
      i++;
      continue;
    }

    // Image
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) {
      blocks.push({ id: generateId(), type: "image", content: imgMatch[1], src: imgMatch[2], alt: imgMatch[1] });
      i++;
      continue;
    }

    // Heading 3
    if (line.startsWith("### ")) {
      blocks.push({ id: generateId(), type: "heading3", content: line.substring(4) });
      i++;
      continue;
    }

    // Heading 2
    if (line.startsWith("## ")) {
      blocks.push({ id: generateId(), type: "heading2", content: line.substring(3) });
      i++;
      continue;
    }

    // Heading 1
    if (line.startsWith("# ")) {
      blocks.push({ id: generateId(), type: "heading1", content: line.substring(2) });
      i++;
      continue;
    }

    // Checkbox
    const checkMatch = line.match(/^(\s*)- \[([ x])\]\s(.*)$/);
    if (checkMatch) {
      const indent = Math.floor(checkMatch[1].length / 2);
      blocks.push({
        id: generateId(),
        type: "checkbox",
        content: checkMatch[3],
        checked: checkMatch[2] === "x",
        indent,
      });
      i++;
      continue;
    }

    // Bullet list
    const bulletMatch = line.match(/^(\s*)([-*+])\s(.*)$/);
    if (bulletMatch) {
      const indent = Math.floor(bulletMatch[1].length / 2);
      blocks.push({ id: generateId(), type: "bullet", content: bulletMatch[3], indent });
      i++;
      continue;
    }

    // Numbered list
    const numberMatch = line.match(/^(\s*)(\d+)\.\s(.*)$/);
    if (numberMatch) {
      const indent = Math.floor(numberMatch[1].length / 2);
      blocks.push({ id: generateId(), type: "numbered", content: numberMatch[3], indent, numbering: parseInt(numberMatch[2]) });
      i++;
      continue;
    }

    // Quote
    if (line.startsWith("> ")) {
      const quoteContent = line.substring(2);
      // Check for callouts
      if (quoteContent.startsWith("⚠️ ")) {
        blocks.push({ id: generateId(), type: "callout", content: quoteContent.substring(3), src: "warning" });
      } else if (quoteContent.startsWith("ℹ️ ")) {
        blocks.push({ id: generateId(), type: "callout", content: quoteContent.substring(3), src: "info" });
      } else if (quoteContent.startsWith("✅ ")) {
        blocks.push({ id: generateId(), type: "callout", content: quoteContent.substring(3), src: "success" });
      } else if (quoteContent.startsWith("💡 ")) {
        blocks.push({ id: generateId(), type: "callout", content: quoteContent.substring(3), src: "tip" });
      } else if (quoteContent.startsWith("📝 ")) {
        blocks.push({ id: generateId(), type: "callout", content: quoteContent.substring(3), src: "note" });
      } else {
        blocks.push({ id: generateId(), type: "quote", content: quoteContent });
      }
      i++;
      continue;
    }

    // Code block
    if (line.startsWith("```")) {
      const lang = line.substring(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({ id: generateId(), type: "code", content: codeLines.join("\n"), alt: lang });
      continue;
    }

    // Default: paragraph
    blocks.push({ id: generateId(), type: "paragraph", content: line });
    i++;
  }

  return blocks;
}

function blocksToMarkdown(blocks: Block[]): string {
  const lines: string[] = [];

  for (const block of blocks) {
    const indent = "  ".repeat(block.indent || 0);

    switch (block.type) {
      case "paragraph":
        lines.push(block.content);
        break;
      case "heading1":
        lines.push(`# ${block.content}`);
        break;
      case "heading2":
        lines.push(`## ${block.content}`);
        break;
      case "heading3":
        lines.push(`### ${block.content}`);
        break;
      case "bullet":
        lines.push(`${indent}- ${block.content}`);
        break;
      case "numbered":
        lines.push(`${indent}${block.numbering || 1}. ${block.content}`);
        break;
      case "checkbox":
        lines.push(`${indent}- [${block.checked ? "x" : " "}] ${block.content}`);
        break;
      case "quote":
        lines.push(`> ${block.content}`);
        break;
      case "callout": {
        const emojiMap: Record<string, string> = { warning: "⚠️", info: "ℹ️", success: "✅", tip: "💡", note: "📝" };
        lines.push(`> ${emojiMap[block.src || "note"] || "📝"} ${block.content}`);
        break;
      }
      case "divider":
        lines.push("---");
        break;
      case "image":
        lines.push(`![${block.alt || block.content}](${block.src})`);
        break;
      case "code":
        lines.push(`\`\`\`${block.alt || ""}`);
        lines.push(block.content);
        lines.push("```");
        break;
    }
  }

  return lines.join("\n");
}

function renderInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-muted px-1 rounded text-pink-600 dark:text-pink-400">$1</code>')
    .replace(/\[\[([^\]]+)\]\]/g, '<span class="text-primary underline decoration-dashed cursor-pointer">[[$1]]</span>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 dark:text-blue-400 underline">$1</a>');
}

export function BlockEditor({ content, onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(() => parseBlocks(content));
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Sync blocks back to markdown
  useEffect(() => {
    const markdown = blocksToMarkdown(blocks);
    if (markdown !== content) {
      onChange(markdown);
    }
  }, [blocks]);

  // Re-parse when content changes externally
  useEffect(() => {
    const newBlocks = parseBlocks(content);
    if (JSON.stringify(newBlocks.map(b => ({ type: b.type, content: b.content }))) !==
        JSON.stringify(blocks.map(b => ({ type: b.type, content: b.content })))) {
      setBlocks(newBlocks);
    }
  }, [content]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  }, []);

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id);
      if (prev.length <= 1) return prev;
      const newBlocks = prev.filter(b => b.id !== id);
      // Focus previous block
      if (idx > 0) {
        setTimeout(() => {
          const prevBlock = blockRefs.current.get(newBlocks[Math.min(idx - 1, newBlocks.length - 1)].id);
          prevBlock?.focus();
        }, 0);
      }
      return newBlocks;
    });
  }, []);

  const addBlockAfter = useCallback((afterId: string, type: Block["type"] = "paragraph") => {
    const newBlock: Block = { id: generateId(), type, content: "" };
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterId);
      const newBlocks = [...prev];
      newBlocks.splice(idx + 1, 0, newBlock);
      return newBlocks;
    });
    setTimeout(() => {
      blockRefs.current.get(newBlock.id)?.focus();
    }, 0);
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>, blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;

    // Enter: create new block
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      // Empty block of certain types -> convert to paragraph or delete
      if (block.content === "" && ["bullet", "numbered", "checkbox", "quote"].includes(block.type)) {
        updateBlock(blockId, { type: "paragraph" });
        return;
      }

      addBlockAfter(blockId);
      return;
    }

    // Backspace on empty block: delete or convert to paragraph
    if (e.key === "Backspace" && block.content === "" && block.type !== "paragraph") {
      e.preventDefault();
      updateBlock(blockId, { type: "paragraph" });
      return;
    }

    // Backspace at start of paragraph: delete block
    if (e.key === "Backspace" && block.type === "paragraph") {
      const sel = window.getSelection();
      if (sel && sel.getRangeAt(0).startOffset === 0 && blocks.findIndex(b => b.id === blockId) > 0) {
        e.preventDefault();
        deleteBlock(blockId);
        return;
      }
    }

    // Tab: indent
    if (e.key === "Tab") {
      e.preventDefault();
      if (["bullet", "numbered", "checkbox"].includes(block.type)) {
        updateBlock(blockId, { indent: (block.indent || 0) + (e.shiftKey ? -1 : 1) });
      }
    }

    // Markdown shortcuts at start of line
    if (block.content === "" || block.content === "#") {
      const shortcuts: Record<string, Block["type"]> = {
        "# ": "heading1",
        "## ": "heading2",
        "### ": "heading3",
        "- ": "bullet",
        "* ": "bullet",
        "+ ": "bullet",
        "1. ": "numbered",
        "> ": "quote",
        "[] ": "checkbox",
      };

      for (const [shortcut, type] of Object.entries(shortcuts)) {
        if (block.content === shortcut.substring(0, block.content.length)) {
          // If full shortcut typed, convert
          if (block.content === shortcut) {
            e.preventDefault();
            updateBlock(blockId, { type, content: "" });
            return;
          }
        }
      }
    }

    // Slash command
    if (e.key === "/" && block.content === "") {
      e.preventDefault();
      const el = blockRefs.current.get(blockId);
      if (el) {
        const rect = el.getBoundingClientRect();
        setMenuPosition({ top: rect.bottom + 4, left: rect.left });
        setShowBlockMenu(blockId);
      }
    }
  }, [blocks, addBlockAfter, deleteBlock, updateBlock]);

  const insertBlock = useCallback((afterId: string, type: Block["type"]) => {
    setShowBlockMenu(null);
    const newBlock: Block = { id: generateId(), type, content: "" };
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterId);
      const newBlocks = [...prev];
      newBlocks.splice(idx + 1, 0, newBlock);
      return newBlocks;
    });
    setTimeout(() => {
      blockRefs.current.get(newBlock.id)?.focus();
    }, 0);
  }, []);

  const renderBlock = (block: Block) => {
    const isActive = activeBlock === block.id;
    const indentPadding = (block.indent || 0) * 24;

    const commonProps = {
      ref: (el: HTMLDivElement | null) => {
        if (el) blockRefs.current.set(block.id, el);
      },
      className: `group flex items-start gap-2 py-1 px-2 -mx-2 rounded-lg transition-colors ${isActive ? "bg-muted/50" : "hover:bg-muted/30"}`,
      onClick: () => setActiveBlock(block.id),
      onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => handleKeyDown(e, block.id),
    };

    const dragHandle = (
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1 shrink-0 cursor-grab">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            const el = blockRefs.current.get(block.id);
            if (el) {
              const rect = el.getBoundingClientRect();
              setMenuPosition({ top: rect.bottom + 4, left: rect.left });
              setShowBlockMenu(block.id);
            }
          }}
          className="p-0.5 hover:bg-muted rounded"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
    );

    const deleteBtn = (
      <button
        onClick={(e) => { e.stopPropagation(); deleteBlock(block.id); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded shrink-0"
      >
        <Trash2 className="h-3 w-3 text-muted-foreground" />
      </button>
    );

    switch (block.type) {
      case "heading1":
        return (
          <div {...commonProps} style={{ paddingLeft: indentPadding }}>
            {dragHandle}
            <div
              contentEditable
              suppressContentEditableWarning
              className="flex-1 text-3xl font-bold outline-none min-h-[1.5em]"
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }}
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
            />
            {deleteBtn}
          </div>
        );

      case "heading2":
        return (
          <div {...commonProps} style={{ paddingLeft: indentPadding }}>
            {dragHandle}
            <div
              contentEditable
              suppressContentEditableWarning
              className="flex-1 text-2xl font-semibold outline-none min-h-[1.5em]"
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }}
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
            />
            {deleteBtn}
          </div>
        );

      case "heading3":
        return (
          <div {...commonProps} style={{ paddingLeft: indentPadding }}>
            {dragHandle}
            <div
              contentEditable
              suppressContentEditableWarning
              className="flex-1 text-xl font-medium outline-none min-h-[1.5em]"
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }}
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
            />
            {deleteBtn}
          </div>
        );

      case "bullet":
        return (
          <div {...commonProps} style={{ paddingLeft: indentPadding }}>
            {dragHandle}
            <span className="text-foreground/60 mt-0.5 shrink-0">•</span>
            <div
              contentEditable
              suppressContentEditableWarning
              className="flex-1 outline-none min-h-[1.5em]"
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }}
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
            />
            {deleteBtn}
          </div>
        );

      case "numbered":
        return (
          <div {...commonProps} style={{ paddingLeft: indentPadding }}>
            {dragHandle}
            <span className="text-foreground/60 mt-0.5 shrink-0 w-5 text-right">{block.numbering || 1}.</span>
            <div
              contentEditable
              suppressContentEditableWarning
              className="flex-1 outline-none min-h-[1.5em]"
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }}
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
            />
            {deleteBtn}
          </div>
        );

      case "checkbox":
        return (
          <div {...commonProps} style={{ paddingLeft: indentPadding }}>
            {dragHandle}
            <input
              type="checkbox"
              checked={block.checked}
              onChange={(e) => updateBlock(block.id, { checked: e.target.checked })}
              className="mt-1 shrink-0"
            />
            <div
              contentEditable
              suppressContentEditableWarning
              className={`flex-1 outline-none min-h-[1.5em] ${block.checked ? "line-through text-muted-foreground" : ""}`}
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }}
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
            />
            {deleteBtn}
          </div>
        );

      case "quote":
        return (
          <div {...commonProps} style={{ paddingLeft: indentPadding }}>
            {dragHandle}
            <div className="border-l-4 border-foreground/30 pl-4 flex-1 italic text-muted-foreground">
              <div
                contentEditable
                suppressContentEditableWarning
                className="outline-none min-h-[1.5em]"
                dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }}
                onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
              />
            </div>
            {deleteBtn}
          </div>
        );

      case "callout": {
        const colors: Record<string, { border: string; bg: string; text: string; icon: any }> = {
          warning: { border: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-600", icon: AlertCircle },
          info: { border: "border-blue-500", bg: "bg-blue-500/10", text: "text-blue-600", icon: Info },
          success: { border: "border-green-500", bg: "bg-green-500/10", text: "text-green-600", icon: CheckCircle },
          tip: { border: "border-purple-500", bg: "bg-purple-500/10", text: "text-purple-600", icon: Info },
          note: { border: "border-gray-500", bg: "bg-gray-500/10", text: "text-gray-600", icon: Info },
        };
        const c = colors[block.src || "note"] || colors.note;
        const Icon = c.icon;
        return (
          <div {...commonProps} style={{ paddingLeft: indentPadding }}>
            {dragHandle}
            <div className={`border-l-4 ${c.border} ${c.bg} rounded-r-lg p-3 flex-1`}>
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`h-4 w-4 ${c.text}`} />
                <span className={`text-sm font-semibold ${c.text} capitalize`}>{block.src || "note"}</span>
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                className="outline-none min-h-[1.5em]"
                dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }}
                onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
              />
            </div>
            {deleteBtn}
          </div>
        );
      }

      case "divider":
        return (
          <div {...commonProps}>
            {dragHandle}
            <hr className="flex-1 border-border my-2" />
            {deleteBtn}
          </div>
        );

      case "image":
        return (
          <div {...commonProps} className="flex-col items-stretch">
            <div className="flex items-center gap-2">
              {dragHandle}
              <ImageIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Image</span>
              {deleteBtn}
            </div>
            {block.src ? (
              <div className="ml-6 mt-2 relative group/img">
                <img
                  src={block.src}
                  alt={block.alt || "image"}
                  className="max-w-full max-h-96 rounded-lg shadow-md mx-auto block"
                />
                <div className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const newAlt = prompt("Alt text:", block.alt || "");
                      if (newAlt !== null) updateBlock(block.id, { alt: newAlt, content: newAlt });
                    }}
                    className="p-1 bg-background/80 rounded backdrop-blur text-xs"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <div
                contentEditable
                suppressContentEditableWarning
                className="ml-6 mt-1 text-muted-foreground text-sm outline-none empty:before:content-['Paste_an_image_URL...'] empty:before:text-muted-foreground/50"
                onBlur={(e) => {
                  const text = e.currentTarget.textContent || "";
                  if (text.startsWith("http") || text.startsWith("data:image")) {
                    updateBlock(block.id, { src: text, alt: block.content || "image" });
                  }
                }}
              />
            )}
          </div>
        );

      case "code":
        return (
          <div {...commonProps} className="flex-col items-stretch">
            <div className="flex items-center gap-2">
              {dragHandle}
              <Code className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{block.alt || "code"}</span>
              {deleteBtn}
            </div>
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              className="ml-6 mt-1 p-3 bg-muted rounded-lg font-mono text-sm outline-none resize-none min-h-[80px]"
              spellCheck={false}
            />
          </div>
        );

      case "paragraph":
      default:
        return (
          <div {...commonProps} style={{ paddingLeft: indentPadding }}>
            {dragHandle}
            <div
              contentEditable
              suppressContentEditableWarning
              className="flex-1 outline-none min-h-[1.5em]"
              dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(block.content) }}
              onBlur={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || "" })}
              data-placeholder="Type '/' for commands..."
            />
            {deleteBtn}
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <div className="space-y-0.5">
        {blocks.map((block) => (
          <div key={block.id}>
            {renderBlock(block)}
          </div>
        ))}
      </div>

      {/* Add block button at bottom */}
      <button
        onClick={() => {
          const lastBlock = blocks[blocks.length - 1];
          if (lastBlock && lastBlock.content === "" && lastBlock.type === "paragraph") {
            blockRefs.current.get(lastBlock.id)?.focus();
          } else {
            addBlockAfter(blocks[blocks.length - 1]?.id || "", "paragraph");
          }
        }}
        className="w-full py-3 text-muted-foreground hover:text-foreground text-sm flex items-center gap-2 transition-colors"
      >
        <Plus className="h-4 w-4" />
        Add a block
      </button>

      {/* Block type menu */}
      {showBlockMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowBlockMenu(null)} />
          <div
            className="fixed z-50 bg-background border rounded-xl shadow-xl py-2 w-64"
            style={{ top: menuPosition.top, left: menuPosition.left }}
          >
            {[
              { type: "paragraph" as const, icon: "¶", label: "Text", desc: "Plain text" },
              { type: "heading1" as const, icon: "H1", label: "Heading 1", desc: "Large heading" },
              { type: "heading2" as const, icon: "H2", label: "Heading 2", desc: "Medium heading" },
              { type: "heading3" as const, icon: "H3", label: "Heading 3", desc: "Small heading" },
              { type: "bullet" as const, icon: "•", label: "Bullet List", desc: "Unordered list" },
              { type: "numbered" as const, icon: "1.", label: "Numbered List", desc: "Ordered list" },
              { type: "checkbox" as const, icon: "☑", label: "Checkbox", desc: "Task list" },
              { type: "quote" as const, icon: "\"", label: "Quote", desc: "Blockquote" },
              { type: "code" as const, icon: "</>", label: "Code", desc: "Code block" },
              { type: "image" as const, icon: "🖼", label: "Image", desc: "Upload or embed" },
              { type: "divider" as const, icon: "—", label: "Divider", desc: "Horizontal line" },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => insertBlock(showBlockMenu, item.type)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted text-left"
              >
                <span className="w-8 h-8 flex items-center justify-center bg-muted rounded text-sm font-mono">
                  {item.icon}
                </span>
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
