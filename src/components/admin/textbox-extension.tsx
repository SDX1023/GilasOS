"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import React, { useRef } from "react";
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

  const handleDragStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = x;
    const origY = y;
    const onMove = (ev: MouseEvent) => {
      updateAttributes({ x: origX + ev.clientX - startX, y: origY + ev.clientY - startY });
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
    <NodeViewWrapper as="div">
      <div
        ref={wrapperRef}
        className="group rounded-lg shadow-lg border-2 transition-shadow"
        style={{ left: x, top: y, width, height, borderColor: color, backgroundColor: `${color}10`, position: "absolute" }}
      >
        <div
          onMouseDown={handleDragStart}
          className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-3 bg-card border rounded-md cursor-move flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
        >
          <div className="w-4 h-1 bg-muted-foreground/30 rounded-full" />
        </div>

        <div
          onMouseDown={handleResizeStart}
          className="absolute -bottom-2 -right-2 w-4 h-4 bg-card border rounded cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity z-10"
        />

        <button
          onMouseDown={handleDelete}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600"
        >
          <Trash2 className="h-3 w-3" />
        </button>

        <div className="absolute -top-5 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10" style={{ transform: "translateX(-50%) translateY(-20px)" }}>
          {COLORS.map((c) => (
            <button
              key={c.value}
              onMouseDown={handleColorChange(c.value)}
              className="w-3 h-3 rounded-full border border-border hover:scale-125 transition-transform"
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        <textarea
          ref={textareaRef}
          className="w-full h-full p-2 text-sm bg-transparent border-none outline-none resize-none focus:outline-none"
          value={content || ""}
          onChange={(e) => updateAttributes({ content: e.target.value })}
          onMouseDown={handleTextareaMouseDown}
          placeholder="Type here..."
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
      x: { default: 100 },
      y: { default: 100 },
      width: { default: 200 },
      height: { default: 80 },
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
        width: parseInt(el.getAttribute("width") || "200"),
        height: parseInt(el.getAttribute("height") || "80"),
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
