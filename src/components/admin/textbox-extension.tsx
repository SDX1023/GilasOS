"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import React, { useRef, useState } from "react";
import { Trash2 } from "lucide-react";

const COLORS = [
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#a855f7" },
  { name: "Green", value: "#22c55e" },
  { name: "Yellow", value: "#eab308" },
  { name: "Red", value: "#ef4444" },
];

function TextboxNodeView({ node, updateAttributes, deleteNode, editor }: any) {
  const { x, y, width, height, color, content } = node.attrs;
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = x || 0;
    const origY = y || 0;
    const onMove = (ev: MouseEvent) => {
      updateAttributes({ x: Math.max(0, origX + ev.clientX - startX), y: Math.max(0, origY + ev.clientY - startY) });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

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
    <NodeViewWrapper
      as="div"
      className="pm-abs"
      style={{
        position: "absolute",
        left: x != null ? `${x}px` : "100px",
        top: y != null ? `${y}px` : "100px",
        width: `${width}px`,
        minHeight: `${height}px`,
        border: `2px solid ${color}`,
        borderRadius: 8,
        background: `rgba(15,21,35,0.95)`,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 20,
      }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleDragStart}
        style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          width: 32, height: 12, background: "var(--os-bg-secondary)",
          border: "1px solid var(--os-glass-border)", borderRadius: 6,
          cursor: "move", display: "flex", alignItems: "center", justifyContent: "center",
          opacity: hovered ? 1 : 0, transition: "opacity 0.2s", zIndex: 10,
        }}
      >
        <div style={{ width: 16, height: 3, background: "rgba(255,255,255,0.2)", borderRadius: 2 }} />
      </div>

      {/* Resize handle */}
      <div
        onMouseDown={handleResizeStart}
        style={{
          position: "absolute", bottom: -8, right: -8, width: 16, height: 16,
          background: color, border: "none",
          borderRadius: 4, cursor: "se-resize",
          opacity: hovered ? 1 : 0, transition: "opacity 0.2s", zIndex: 10,
        }}
      />

      {/* Delete button */}
      <button
        onMouseDown={handleDelete}
        style={{
          position: "absolute", top: -8, right: -8, width: 20, height: 20,
          background: "#ef4444", color: "#fff", borderRadius: 10,
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "none", cursor: "pointer",
          opacity: hovered ? 1 : 0, transition: "opacity 0.2s", zIndex: 10,
          padding: 0,
        }}
      >
        <Trash2 size={12} />
      </button>

      {/* Color picker */}
      <div style={{
        position: "absolute", top: -28, left: "50%", transform: "translateX(-50%)",
        display: "flex", gap: 4,
        opacity: hovered ? 1 : 0, transition: "opacity 0.2s", zIndex: 10,
      }}>
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
      x: { default: 100 },
      y: { default: 100 },
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
        x: parseInt(el.getAttribute("x") || "100"),
        y: parseInt(el.getAttribute("y") || "100"),
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
