"use client";

import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Image } from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import React, { useRef, useState, useMemo } from "react";
import { Trash2, Crop } from "lucide-react";
import { Textbox } from "./textbox-extension";

interface InlineEditorProps {
  content: string;
  onChange: (html: string) => void;
}

function CropModal({ src, onCrop, onClose }: { src: string; onCrop: (d: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [cs, setCs] = useState({ w: 0, h: 0 });
  const [action, setAction] = useState<"move" | "tl" | "tr" | "bl" | "br" | null>(null);
  const sr = useRef({ mx: 0, my: 0, c: { x: 0, y: 0, w: 0, h: 0 } });

  React.useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      const maxW = Math.min(580, img.width);
      const r = img.height / img.width;
      setCs({ w: maxW, h: maxW * r });
      setCrop({ x: maxW * 0.1, y: maxW * r * 0.1, w: maxW * 0.8, h: maxW * r * 0.8 });
    };
    img.src = src;
  }, [src]);

  React.useEffect(() => {
    const cv = canvasRef.current;
    const img = imgRef.current;
    if (!cv || !img || !cs.w) return;
    cv.width = cs.w;
    cv.height = cs.h;
    const ctx = cv.getContext("2d")!;
    ctx.drawImage(img, 0, 0, cs.w, cs.h);
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, cs.w, cs.h);
    ctx.clearRect(crop.x, crop.y, crop.w, crop.h);
    const scaleX = img.naturalWidth / cs.w;
    const scaleY = img.naturalHeight / cs.h;
    ctx.drawImage(img, crop.x * scaleX, crop.y * scaleY, crop.w * scaleX, crop.h * scaleY, crop.x, crop.y, crop.w, crop.h);
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    ctx.setLineDash([]);
    const thirdW = crop.w / 3;
    const thirdH = crop.h / 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(crop.x + thirdW * i, crop.y); ctx.lineTo(crop.x + thirdW * i, crop.y + crop.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(crop.x, crop.y + thirdH * i); ctx.lineTo(crop.x + crop.w, crop.y + thirdH * i); ctx.stroke();
    }
    ctx.fillStyle = "#fff";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${Math.round(crop.w)} × ${Math.round(crop.h)}`, crop.x + crop.w / 2, crop.y + crop.h / 2 + 4);
    [[crop.x, crop.y], [crop.x + crop.w, crop.y], [crop.x, crop.y + crop.h], [crop.x + crop.w, crop.y + crop.h]].forEach(([cx, cy]) => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(cx - 5, cy - 5, 10, 10);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 5, cy - 5, 10, 10);
    });
  }, [crop, cs]);

  const gp = (e: React.MouseEvent) => {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const hc = (p: { x: number; y: number }): "tl" | "tr" | "bl" | "br" | null => {
    const m = 12;
    if (Math.abs(p.x - crop.x) < m && Math.abs(p.y - crop.y) < m) return "tl";
    if (Math.abs(p.x - (crop.x + crop.w)) < m && Math.abs(p.y - crop.y) < m) return "tr";
    if (Math.abs(p.x - crop.x) < m && Math.abs(p.y - (crop.y + crop.h)) < m) return "bl";
    if (Math.abs(p.x - (crop.x + crop.w)) < m && Math.abs(p.y - (crop.y + crop.h)) < m) return "br";
    return null;
  };

  const md = (e: React.MouseEvent) => {
    const p = gp(e);
    const c = hc(p);
    if (c) { setAction(c); sr.current = { mx: p.x, my: p.y, c: { ...crop } }; }
    else if (p.x >= crop.x && p.x <= crop.x + crop.w && p.y >= crop.y && p.y <= crop.y + crop.h) {
      setAction("move");
      sr.current = { mx: p.x - crop.x, my: p.y - crop.y, c: { ...crop } };
    }
  };

  const mm = (e: React.MouseEvent) => {
    if (!action) return;
    const p = gp(e);
    const s = sr.current;
    const min = 20;
    let c = { ...s.c };
    if (action === "move") { c.x = Math.max(0, Math.min(cs.w - c.w, p.x - s.mx)); c.y = Math.max(0, Math.min(cs.h - c.h, p.y - s.my)); }
    else if (action === "br") { c.w = Math.max(min, Math.min(cs.w - c.x, p.x - c.x)); c.h = Math.max(min, Math.min(cs.h - c.y, p.y - c.y)); }
    else if (action === "bl") { const nx = Math.min(p.x, c.x + c.w - min); c.w += c.x - nx; c.x = nx; c.h = Math.max(min, Math.min(cs.h - c.y, p.y - c.y)); }
    else if (action === "tr") { c.w = Math.max(min, Math.min(cs.w - c.x, p.x - c.x)); const ny = Math.min(p.y, c.y + c.h - min); c.h += c.y - ny; c.y = ny; }
    else if (action === "tl") { const nx = Math.min(p.x, c.x + c.w - min); const ny = Math.min(p.y, c.y + c.h - min); c.w += c.x - nx; c.h += c.y - ny; c.x = nx; c.y = ny; }
    setCrop(c);
  };

  const apply = () => {
    const img = imgRef.current;
    if (!img) return;
    const sx = img.naturalWidth / cs.w;
    const sy = img.naturalHeight / cs.h;
    const out = document.createElement("canvas");
    out.width = crop.w * sx;
    out.height = crop.h * sy;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(img, crop.x * sx, crop.y * sy, crop.w * sx, crop.h * sy, 0, 0, out.width, out.height);
    onCrop(out.toDataURL("image/png"));
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div style={{ background: "var(--os-bg-secondary)", borderRadius: 12, padding: 24, maxWidth: 650, width: "100%", margin: "0 16px" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ fontWeight: 600, marginBottom: 16, fontSize: 16, color: "var(--os-text-primary)" }}>Crop Image</h3>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <canvas
            ref={canvasRef}
            style={{ borderRadius: 10, cursor: action === "move" ? "move" : action ? "nwse-resize" : "default", maxWidth: "100%" }}
            onMouseDown={md}
            onMouseMove={mm}
            onMouseUp={() => setAction(null)}
            onMouseLeave={() => setAction(null)}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={{ padding: "8px 16px", background: "rgba(255,255,255,0.06)", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer", color: "var(--os-text-secondary)", fontFamily: "Inter, sans-serif" }}>Cancel</button>
          <button onClick={apply} style={{ padding: "8px 16px", background: "var(--os-accent)", color: "#fff", borderRadius: 8, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Apply Crop</button>
        </div>
      </div>
    </div>
  );
}

function ImageNodeView(props: any) {
  const { node, updateAttributes, editor } = props;
  const { src, alt, style, x, y } = node.attrs;
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [hovered, setHovered] = useState(false);
  const resizeRef = useRef({ startX: 0, startY: 0, startW: 0, startH: 0, corner: "" });

  const deleteImage = () => {
    let found: number | null = null;
    editor.view.state.doc.descendants((n: any, p: number) => {
      if (found !== null) return false;
      if (n.type.name === "image" && n.attrs.src === src) { found = p; return false; }
    });
    if (found === null) return;
    const n = editor.view.state.doc.nodeAt(found);
    if (!n) return;
    editor.view.dispatch(editor.view.state.tr.delete(found, found + n.nodeSize));
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = x || 0;
    const origY = y || 0;
    const onMove = (ev: MouseEvent) => {
      updateAttributes({
        x: Math.max(0, origX + ev.clientX - startX),
        y: Math.max(0, origY + ev.clientY - startY),
      });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const startResize = (corner: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const img = imgRef.current;
    if (!img) return;
    const rect = img.getBoundingClientRect();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, startW: rect.width, startH: rect.height, corner };
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - resizeRef.current.startX;
      const dy = ev.clientY - resizeRef.current.startY;
      let newW = resizeRef.current.startW;
      let newH = resizeRef.current.startH;
      if (corner.includes("e")) newW = Math.max(80, resizeRef.current.startW + dx);
      if (corner.includes("w")) newW = Math.max(80, resizeRef.current.startW - dx);
      if (corner.includes("s")) newH = Math.max(60, resizeRef.current.startH + dy);
      if (corner.includes("n")) newH = Math.max(60, resizeRef.current.startH - dy);
      if (ev.shiftKey) { const r = resizeRef.current.startW / resizeRef.current.startH; newH = newW / r; }
      img.style.width = `${newW}px`;
      img.style.height = `${newH}px`;
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      const img = imgRef.current;
      if (img) updateAttributes({ style: `width: ${img.style.width}; height: ${img.style.height};` });
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const applyCrop = (dataUrl: string) => {
    updateAttributes({ src: dataUrl, style: "" });
    setShowCrop(false);
  };

  const parsedStyle: React.CSSProperties = {};
  if (style) {
    style.split(";").filter(Boolean).forEach((s: string) => {
      const [k, v] = s.split(":").map((p: string) => p.trim());
      if (k && v) (parsedStyle as any)[k] = v;
    });
  }

  const isSelected = editor.isActive("image", { src });

  return (
    <NodeViewWrapper
      as="div"
      ref={wrapperRef}
      className="pm-abs"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "absolute",
        left: x != null ? `${x}px` : "50px",
        top: y != null ? `${y}px` : "50px",
        zIndex: isSelected ? 50 : hovered ? 40 : 10,
        cursor: "grab",
      }}
    >
      {(isSelected || hovered) && (
        <div className="image-toolbar" style={{ position: "absolute", bottom: "100%", left: 0, marginBottom: 4, whiteSpace: "nowrap", opacity: hovered || isSelected ? 1 : 0, transition: "opacity 0.15s" }}>
          <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); deleteImage(); }} className="image-toolbar-btn image-toolbar-btn-delete" title="Delete"><Trash2 size={14} /></button>
          <div className="image-toolbar-divider" />
          <button onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setShowCrop(true); }} className="image-toolbar-btn" title="Crop"><Crop size={14} /></button>
        </div>
      )}
      <div style={{ position: "relative", display: "inline-block" }}>
        {isSelected && (
          <>
            <div onMouseDown={startResize("nw")} className="image-handle" style={{ top: -4, left: -4, cursor: "nwse-resize" }} />
            <div onMouseDown={startResize("ne")} className="image-handle" style={{ top: -4, right: -4, cursor: "nesw-resize" }} />
            <div onMouseDown={startResize("sw")} className="image-handle" style={{ bottom: -4, left: -4, cursor: "nesw-resize" }} />
            <div onMouseDown={startResize("se")} className="image-handle" style={{ bottom: -4, right: -4, cursor: "nwse-resize" }} />
          </>
        )}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="tiptap-image"
          style={{ ...parsedStyle, cursor: isSelected ? "grab" : undefined, display: "block" }}
          draggable="false"
          onMouseDown={(e) => { if (isSelected) startDrag(e); }}
        />
      </div>
      {showCrop && <CropModal src={src} onCrop={applyCrop} onClose={() => setShowCrop(false)} />}
    </NodeViewWrapper>
  );
}

const CustomImage = Image.extend({
  addAttributes() {
    return {
      src: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute("src"), renderHTML: (attrs: any) => (attrs.src ? { src: attrs.src } : {}) },
      alt: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute("alt"), renderHTML: (attrs: any) => (attrs.alt ? { alt: attrs.alt } : {}) },
      title: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute("title"), renderHTML: (attrs: any) => (attrs.title ? { title: attrs.title } : {}) },
      style: { default: null, parseHTML: (el: HTMLElement) => el.getAttribute("style"), renderHTML: (attrs: any) => (attrs.style ? { style: attrs.style } : {}) },
      x: { default: 50, parseHTML: (el: HTMLElement) => parseInt(el.getAttribute("data-x") || "50"), renderHTML: (attrs: any) => (attrs.x != null ? { "data-x": String(attrs.x) } : {}) },
      y: { default: 50, parseHTML: (el: HTMLElement) => parseInt(el.getAttribute("data-y") || "50"), renderHTML: (attrs: any) => (attrs.y != null ? { "data-y": String(attrs.y) } : {}) },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function markdownToHtml(md: string): string {
  let html = md;

  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt, src) => {
    const sm = alt.match(/<!--(style:.*?)-->/);
    const pm = alt.match(/<!--pos:([^,]+),([^>]+)-->/);
    const cleanAlt = alt.replace(/<!--.*?-->/g, "").trim();
    const baseStyle = sm ? sm[1].replace("style:", "") : "";
    const posAttrs = pm ? ` data-x="${pm[1]}" data-y="${pm[2]}"` : "";
    if (baseStyle) return `<img src="${src}" alt="${cleanAlt}" style="${baseStyle}"${posAttrs}>`;
    return `<img src="${src}" alt="${cleanAlt}"${posAttrs}>`;
  });

  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
  html = html.replace(/`(.+?)`/g, "<code>$1</code>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>");
  html = html.replace(/^---$/gm, "<hr>");
  html = html.replace(/^:::(\w+)\n([\s\S]*?)^:::$/gm, '<div class="callout callout-$1">$2</div>');
  html = html.replace(/\[fs:(\d+px)\]([^\[]+)\[\/fs\]/g, '<span style="font-size: $1">$2</span>');
  html = html.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");
  html = html.replace(/^[-*+] (.+)$/gm, "<li>$1</li>");
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>");
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/\[\[([^\]]+)\]\]/g, '<span class="wiki-link">[[$1]]</span>');

  const lines = html.split("\n");
  const processed: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (
      t.startsWith("<h") || t.startsWith("<ul") || t.startsWith("<ol") || t.startsWith("<li") ||
      t.startsWith("<blockquote") || t.startsWith("<hr") || t.startsWith("<img") ||
      t.startsWith("</") || t.startsWith("<div") || t.startsWith("<span") || t === ""
    ) {
      processed.push(line);
    } else {
      processed.push(`<p>${t}</p>`);
    }
  }
  return processed.join("\n");
}

export function htmlToMarkdown(html: string): string {
  let md = html;

  md = md.replace(/<div class="callout callout-(\w+)">(.*?)<\/div>/gs, "::$1\n$2\n::");

  const textboxes: string[] = [];
  md = md.replace(/<div\s[^>]*data-textbox=""[^>]*>([\s\S]*?)<\/div>/g, (_match, inner) => {
    const divTag = _match.match(/<div[^>]*>/)?.[0] || "";
    const x = divTag.match(/x="(\d+)"/)?.[1] || "100";
    const y = divTag.match(/y="(\d+)"/)?.[1] || "100";
    const width = divTag.match(/width="(\d+)"/)?.[1] || "280";
    const height = divTag.match(/height="(\d+)"/)?.[1] || "100";
    const color = divTag.match(/color="([^"]*)"/)?.[1] || "#3b82f6";
    const attrContent = divTag.match(/content="([^"]*)"/)?.[1];
    const text = attrContent || inner.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").trim();
    const safeText = escapeHtml(text).replace(/\n/g, "<br>");
    textboxes.push(`<div data-textbox="" x="${x}" y="${y}" width="${width}" height="${height}" color="${color}">${safeText}</div>`);
    return `%%TEXTBOX_${textboxes.length - 1}%%`;
  });

  md = md.replace(/<div[^>]*>/g, "");
  md = md.replace(/<\/div>/g, "");

  md = md.replace(/<img([^>]*)>/g, (_m, attrs) => {
    const src = attrs.match(/src="([^"]*)"/)?.[1] || "";
    const alt = attrs.match(/alt="([^"]*)"/)?.[1] || "";
    const style = attrs.match(/style="([^"]*)"/)?.[1];
    const dx = attrs.match(/data-x="([^"]*)"/)?.[1];
    const dy = attrs.match(/data-y="([^"]*)"/)?.[1];
    const styleTag = style ? `<!--style:${style}-->` : "";
    const posTag = (dx && dy) ? `<!--pos:${dx},${dy}-->` : "";
    const altParts = [alt, styleTag, posTag].filter(Boolean).join("");
    return `![${altParts}](${src})`;
  });
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gs, "$1");
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/g, "# $1");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/g, "## $1");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/g, "### $1");
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/g, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/g, "*$1*");
  md = md.replace(/<code[^>]*>(.*?)<\/code>/g, "`$1`");
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/g, "[$2]($1)");
  md = md.replace(/<span class="wiki-link">\[\[([^\]]*)\]\]<\/span>/g, "[[$1]]");
  md = md.replace(/<span style="font-size: (\d+px)">([^<]+)<\/span>/g, "[fs:$1]$2[/fs]");
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/g, "> $1");
  md = md.replace(/<hr[^>]*>/g, "---");
  md = md.replace(/<ul[^>]*>/g, "");
  md = md.replace(/<\/ul>/g, "");
  md = md.replace(/<ol[^>]*>/g, "");
  md = md.replace(/<\/ol>/g, "");
  md = md.replace(/<li[^>]*>(.*?)<\/li>/g, "- $1");
  md = md.replace(/<[^>]+>/g, "");
  md = md.replace(/&amp;/g, "&");
  md = md.replace(/&lt;/g, "<");
  md = md.replace(/&gt;/g, ">");
  md = md.replace(/&nbsp;/g, " ");
  md = md.replace(/\n{3,}/g, "\n\n");

  textboxes.forEach((tb, i) => {
    md = md.replace(`%%TEXTBOX_${i}%%`, tb);
  });

  return md.trim();
}

export function docToMarkdown(editor: any): string {
  const json = editor.getJSON();
  const lines: string[] = [];
  const textboxes: any[] = [];

  function processNode(node: any): string {
    if (node.type === "heading") {
      const level = node.attrs.level || 1;
      const text = node.content ? node.content.map(processInline).join("") : "";
      return "#".repeat(level) + " " + text;
    }
    if (node.type === "paragraph") {
      const text = node.content ? node.content.map(processInline).join("") : "";
      return text;
    }
    if (node.type === "bulletList") {
      return (node.content || []).map((li: any) => {
        return (li.content || []).map((p: any) => "- " + (p.content ? p.content.map(processInline).join("") : "")).join("\n");
      }).join("\n");
    }
    if (node.type === "orderedList") {
      return (node.content || []).map((li: any, i: number) => {
        return (li.content || []).map((p: any) => `${i + 1}. ` + (p.content ? p.content.map(processInline).join("") : "")).join("\n");
      }).join("\n");
    }
    if (node.type === "blockquote") {
      return (node.content || []).map((p: any) => "> " + (p.content ? p.content.map(processInline).join("") : "")).join("\n");
    }
    if (node.type === "horizontalRule") return "---";
    if (node.type === "codeBlock") {
      const text = node.content ? node.content.map((n: any) => n.text || "").join("") : "";
      return "```\n" + text + "\n```";
    }
    if (node.type === "image") {
      const src = node.attrs.src || "";
      const alt = node.attrs.alt || "";
      const style = node.attrs.style || "";
      const x = node.attrs.x;
      const y = node.attrs.y;
      const styleTag = style ? `<!--style:${style}-->` : "";
      const posTag = (x != null && y != null) ? `<!--pos:${x},${y}-->` : "";
      const altParts = [alt, styleTag, posTag].filter(Boolean).join("");
      return `![${altParts}](${src})`;
    }
    if (node.type === "textbox") {
      const idx = textboxes.length;
      textboxes.push(node.attrs);
      return `%%TEXTBOX_${idx}%%`;
    }
    if (node.type === "hardBreak") return "\n";
    if (node.content) {
      return node.content.map(processNode).join("\n");
    }
    return "";
  }

  function processInline(node: any): string {
    if (node.type === "text") {
      let text = node.text || "";
      if (node.marks) {
        for (const mark of node.marks) {
          if (mark.type === "bold") text = `**${text}**`;
          if (mark.type === "italic") text = `*${text}*`;
          if (mark.type === "code") text = `\`${text}\``;
          if (mark.type === "link") text = `[${text}](${mark.attrs?.href || ""})`;
        }
      }
      return text;
    }
    if (node.type === "hardBreak") return "\n";
    if (node.type === "image") {
      const src = node.attrs.src || "";
      const alt = node.attrs.alt || "";
      const style = node.attrs.style || "";
      const x = node.attrs.x;
      const y = node.attrs.y;
      const styleTag = style ? `<!--style:${style}-->` : "";
      const posTag = (x != null && y != null) ? `<!--pos:${x},${y}-->` : "";
      const altParts = [alt, styleTag, posTag].filter(Boolean).join("");
      return `![${altParts}](${src})`;
    }
    if (node.content) {
      return node.content.map(processInline).join("");
    }
    return "";
  }

  const content = json.content || [];
  const result: string[] = [];
  for (const node of content) {
    const md = processNode(node);
    if (md) result.push(md);
  }

  let md = result.join("\n\n");

  for (let i = 0; i < textboxes.length; i++) {
    const tb = textboxes[i];
    const safeContent = (tb.content || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const tbHtml = `<div data-textbox="" x="${tb.x || 100}" y="${tb.y || 100}" width="${tb.width || 280}" height="${tb.height || 100}" color="${tb.color || "#3b82f6"}">${safeContent}</div>`;
    md = md.replace(`%%TEXTBOX_${i}%%`, tbHtml);
  }

  return md.trim();
}

export function InlineEditor({ content, onChange }: InlineEditorProps) {
  const lastExternalContentRef = useRef(content);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const isUpdatingFromEffect = useRef(false);
  const contentRef = useRef(content);
  contentRef.current = content;

  const initialContent = useMemo(() => markdownToHtml(content), []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      CustomImage.configure({ inline: true, allowBase64: true, HTMLAttributes: { class: "tiptap-image" } }),
      Textbox,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: initialContent,
    editorProps: { attributes: { class: "ProseMirror" } },
    onUpdate: ({ editor }) => {
      if (isUpdatingFromEffect.current) return;
      const md = docToMarkdown(editor);
      lastExternalContentRef.current = md;
      onChangeRef.current(md);
    },
  });

  React.useEffect(() => {
    if (editor && content !== lastExternalContentRef.current) {
      lastExternalContentRef.current = content;
      isUpdatingFromEffect.current = true;
      editor.commands.setContent(markdownToHtml(content));
      isUpdatingFromEffect.current = false;
    }
  }, [content, editor]);

  React.useEffect(() => {
    if (!editor) return;
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;
    const poll = setInterval(() => {
      if (isUpdatingFromEffect.current) return;
      const md = docToMarkdown(editor);
      if (md !== lastExternalContentRef.current) {
        lastExternalContentRef.current = md;
        onChangeRef.current(md);
      }
    }, 500);
    return () => clearInterval(poll);
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          e.preventDefault();
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => { editor.chain().focus().setImage({ src: ev.target?.result as string, alt: "pasted image" }).run(); };
            reader.readAsDataURL(file);
          }
          return;
        }
      }
    };
    const handleDrop = (e: DragEvent) => {
      const files = e.dataTransfer?.files;
      if (!files) return;
      for (let i = 0; i < files.length; i++) {
        if (files[i].type.startsWith("image/")) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = (ev) => { editor.chain().focus().setImage({ src: ev.target?.result as string, alt: "dropped image" }).run(); };
          reader.readAsDataURL(files[i]);
          return;
        }
      }
    };
    const el = editor.view.dom;
    el.addEventListener("paste", handlePaste);
    el.addEventListener("drop", handleDrop as any);
    return () => { el.removeEventListener("paste", handlePaste); el.removeEventListener("drop", handleDrop as any); };
  }, [editor]);

  if (!editor) return null;

  const toolbarBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: 6, borderRadius: 6, background: active ? "var(--os-glass-hover)" : "transparent",
    border: "none", cursor: "pointer", color: active ? "var(--os-text-primary)" : "var(--os-text-secondary)",
    fontFamily: "Inter, sans-serif", transition: "background 0.15s",
  });

  return (
    <div style={{ position: "relative" }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 2, padding: "6px 8px",
        borderBottom: "1px solid var(--os-glass-border)", background: "rgba(255,255,255,0.02)",
        flexWrap: "wrap", position: "sticky", top: 0, zIndex: 10,
      }}>
        <select onChange={(e) => { const v = e.target.value; if (v === "p") editor.chain().focus().setParagraph().run(); else editor.chain().focus().toggleHeading({ level: parseInt(v) as 1 | 2 | 3 }).run(); e.target.value = "p"; }} defaultValue="p" style={{
          padding: "4px 6px", borderRadius: 6, fontSize: 12, background: "var(--os-bg-secondary)",
          border: "1px solid var(--os-glass-border)", cursor: "pointer", color: "var(--os-text-primary)",
          fontFamily: "Inter, sans-serif",
        }}>
          <option value="p">Normal</option><option value="1">H1</option><option value="2">H2</option><option value="3">H3</option>
        </select>
        <select onChange={(e) => { const s = e.target.value; if (s === "normal") return; const { from, to } = editor.state.selection; const sel = editor.state.doc.textBetween(from, to); if (sel) editor.chain().focus().deleteRange({ from, to }).insertContent("[fs:" + s + "]" + sel + "[/fs]").run(); e.target.value = "normal"; }} defaultValue="normal" style={{
          padding: "4px 6px", borderRadius: 6, fontSize: 12, background: "var(--os-bg-secondary)",
          border: "1px solid var(--os-glass-border)", cursor: "pointer", color: "var(--os-text-primary)",
          fontFamily: "Inter, sans-serif",
        }}>
          <option value="normal">Font Size</option><option value="12px">12</option><option value="14px">14</option><option value="16px">16</option><option value="18px">18</option><option value="20px">20</option><option value="24px">24</option><option value="28px">28</option><option value="32px">32</option>
        </select>
        <div style={{ width: 1, height: 20, background: "var(--os-glass-border)", margin: "0 4px" }} />
        <button onClick={() => editor.chain().focus().toggleBold().run()} style={{ ...toolbarBtnStyle(editor.isActive("bold")), fontWeight: 700, fontSize: 14 }}>B</button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} style={{ ...toolbarBtnStyle(editor.isActive("italic")), fontStyle: "italic", fontSize: 14 }}>I</button>
        <button onClick={() => editor.chain().focus().toggleCode().run()} style={{ ...toolbarBtnStyle(editor.isActive("code")), fontFamily: "monospace", fontSize: 12 }}>{"></>"}</button>
        <div style={{ width: 1, height: 20, background: "var(--os-glass-border)", margin: "0 4px" }} />
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} style={toolbarBtnStyle(editor.isActive("bulletList"))}>• List</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} style={toolbarBtnStyle(editor.isActive("orderedList"))}>1. List</button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} style={toolbarBtnStyle(editor.isActive("blockquote"))}>" Quote</button>
        <div style={{ width: 1, height: 20, background: "var(--os-glass-border)", margin: "0 4px" }} />
        <button onClick={() => {
          editor.chain().focus().insertContentAt(editor.state.selection.$from.pos, {
            type: "textbox",
            attrs: { x: 100, y: 100, width: 280, height: 100, color: "#3b82f6", content: "" },
          }).run();
        }} style={{ ...toolbarBtnStyle(false), fontSize: 12, fontWeight: 500 }} title="Draggable text box">📝 Box</button>
        <div style={{ width: 1, height: 20, background: "var(--os-glass-border)", margin: "0 4px" }} />
        <button onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) { const r = new FileReader(); r.onload = (ev) => { editor.chain().focus().setImage({ src: ev.target?.result as string, alt: f.name }).run(); }; r.readAsDataURL(f); } }; i.click(); }} style={toolbarBtnStyle(false)} title="Insert image">🖼</button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} style={toolbarBtnStyle(false)} title="Divider">—</button>
        <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--os-text-dim)" }}>Paste, drag, or click 🖼 to insert images</div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
