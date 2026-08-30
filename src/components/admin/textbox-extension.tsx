"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import React, { useRef, useState } from "react";
import { Trash2, GripVertical } from "lucide-react";

const COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Red", value: "#ef4444" },
];

function TextboxNodeView({ node, updateAttributes, deleteNode }: any) {
  const { width, height, color, content } = node.attrs;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = width;
    const startH = height;
    const onMove = (ev: MouseEvent) => {
      updateAttributes({
        width: Math.max(120, startW + ev.clientX - startX),
        height: Math.max(60, startH + ev.clientY - startY),
      });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    deleteNode();
  };

  const handleColorChange = (colorValue: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updateAttributes({ color: colorValue });
  };

  const handleTextareaMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <NodeViewWrapper as="div">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          width: `${width}px`,
          minHeight: `${height}px`,
          borderColor: color,
          border: `2px solid ${color}`,
          borderRadius: 8,
          background: `rgba(15,21,35,0.9)`,
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          position: "relative",
          margin: "8px 0",
          transition: "box-shadow 0.2s",
        }}
      >
        {/* Top toolbar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "4px 8px", borderBottom: `1px solid ${color}33`,
          opacity: hovered ? 1 : 0, transition: "opacity 0.2s",
        }}>
          <div style={{ display: "flex", gap: 3 }}>
            {COLORS.map((c) => (
              <button
                key={c.value}
                onMouseDown={handleColorChange(c.value)}
                style={{
                  width: 12, height: 12, borderRadius: 6,
                  background: c.value, border: "1px solid rgba(255,255,255,0.2)",
                  cursor: "pointer", padding: 0,
                }}
              />
            ))}
          </div>
          <div style={{ flex: 1 }} />
          <button
            onMouseDown={handleDelete}
            style={{
              width: 20, height: 20,
              background: "#ef4444", color: "#fff", borderRadius: 10,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "none", cursor: "pointer", padding: 0,
            }}
          >
            <Trash2 size={12} />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content || ""}
          onChange={(e) => updateAttributes({ content: e.target.value })}
          onMouseDown={handleTextareaMouseDown}
          placeholder="Type here..."
          style={{
            width: "100%", height: `${height - 32}px`, padding: 8, fontSize: 14,
            background: "transparent", border: "none", outline: "none",
            resize: "none", color: "var(--os-text-primary)", fontFamily: "Inter, sans-serif",
          }}
        />

        {/* Resize handle */}
        <div
          onMouseDown={handleResizeStart}
          style={{
            position: "absolute", bottom: -6, right: -6, width: 12, height: 12,
            background: color, borderRadius: 3, cursor: "se-resize",
            opacity: hovered ? 1 : 0, transition: "opacity 0.2s", zIndex: 10,
          }}
        />
      </div>
    </NodeViewWrapper>
  );
}

export const Textbox = Node.create({
  name: "textbox",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      width: { default: 280 },
      height: { default: 100 },
      color: { default: "#3b82f6" },
      content: { default: "" },
    };
  },

  parseHTML() {
    return [{
      tag: "div[data-textbox]",
      getAttrs: (el) => ({
        width: parseInt(el.getAttribute("width") || "280"),
        height: parseInt(el.getAttribute("height") || "100"),
        color: el.getAttribute("color") || "#3b82f6",
        content: (el as HTMLElement).innerHTML.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, ""),
      }),
    }];
  },

  renderHTML({ HTMLAttributes }) {
    const { content, ...rest } = HTMLAttributes;
    const safeContent = (content || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    return ["div", mergeAttributes(rest, { "data-textbox": "" }), safeContent];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TextboxNodeView);
  },
});
