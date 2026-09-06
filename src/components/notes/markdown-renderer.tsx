"use client";

import { useEffect, useState } from "react";
import { markdownToHtml } from "@/components/admin/inline-editor";

interface MarkdownRendererProps {
  content: string;
  allLinksMap: { [slug: string]: { courseId: string; moduleId: string; slug: string } };
}

export function MarkdownRenderer({ content, allLinksMap }: MarkdownRendererProps) {
  const [htmlContent, setHtmlContent] = useState("");

  useEffect(() => {
    let processedContent = content;

    processedContent = processedContent.replace(
      /\[\[([^\]]+)\]\]/g,
      (match, linkText) => {
        const note = allLinksMap[linkText];
        if (note) {
          return `[${linkText}](/subjects/${note.courseId}/${note.moduleId}/${note.slug})`;
        }
        return `<span class="text-muted-foreground underline decoration-dashed cursor-not-allowed">${linkText}</span>`;
      }
    );

    processedContent = processedContent.replace(
      /(?<!\()(https?:\/\/[^\s<)>"]+)/g,
      (url) => `[link](${url})`
    );

    processedContent = processedContent.replace(
      /^>\s*⚠️\s+(.+)$/gm,
      '<div class="border-l-4 border-yellow-500 bg-yellow-500/10 p-4 rounded-r-lg my-2"><span class="font-semibold text-yellow-600">⚠️ Warning:</span> $1</div>'
    );
    processedContent = processedContent.replace(
      /^>\s*ℹ️\s+(.+)$/gm,
      '<div class="border-l-4 border-blue-500 bg-blue-500/10 p-4 rounded-r-lg my-2"><span class="font-semibold text-blue-600">ℹ️ Info:</span> $1</div>'
    );
    processedContent = processedContent.replace(
      /^>\s*✅\s+(.+)$/gm,
      '<div class="border-l-4 border-green-500 bg-green-500/10 p-4 rounded-r-lg my-2"><span class="font-semibold text-green-600">✅ Success:</span> $1</div>'
    );
    processedContent = processedContent.replace(
      /^>\s*💡\s+(.+)$/gm,
      '<div class="border-l-4 border-purple-500 bg-purple-500/10 p-4 rounded-r-lg my-2"><span class="font-semibold text-purple-600">💡 Tip:</span> $1</div>'
    );
    processedContent = processedContent.replace(
      /^>\s*📝\s+(.+)$/gm,
      '<div class="border-l-4 border-gray-500 bg-gray-500/10 p-4 rounded-r-lg my-2"><span class="font-semibold text-gray-600">📝 Note:</span> $1</div>'
    );

    // Ensure blank lines between blocks for proper paragraph spacing
    processedContent = processedContent.replace(/^(#{1,3}\s.+)$/gm, "\n$1\n");
    processedContent = processedContent.replace(/\n{3,}/g, "\n\n");

    let html = markdownToHtml(processedContent);

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

    setHtmlContent(html);
  }, [content, allLinksMap]);

  return (
    <div
      className="prose prose-neutral dark:prose-invert max-w-none relative overflow-visible"
      style={{
        "--tw-prose-headings": "white",
      } as React.CSSProperties}
    >
      <style>{`
        .markdown-viewer p { margin: 0.7em 0; line-height: 1.7; color: #d1d5db; }
        .markdown-viewer h1 { font-size: 1.75rem; font-weight: 700; margin: 1.5em 0 0.8em; color: white; }
        .markdown-viewer h2 { font-size: 1.35rem; font-weight: 700; margin: 1.8em 0 0.6em; padding-bottom: 0.4em; border-bottom: 1px solid rgba(255,255,255,0.08); color: white; }
        .markdown-viewer h3 { font-size: 1.1rem; font-weight: 600; margin: 1.4em 0 0.5em; color: #c4b5fd; }
        .markdown-viewer ul { margin: 0.8em 0; padding-left: 1.5em; }
        .markdown-viewer ol { margin: 0.8em 0; padding-left: 1.5em; }
        .markdown-viewer li { margin: 0.35em 0; color: #d1d5db; }
        .markdown-viewer strong { color: white; font-weight: 600; }
        .markdown-viewer a { color: #60a5fa; }
        .markdown-viewer a:hover { text-decoration: underline; }
        .markdown-viewer blockquote { border-left: 3px solid #8b5cf6; padding: 0.6em 1em; margin: 0.8em 0; background: rgba(139,92,246,0.08); border-radius: 0 8px 8px 0; font-style: italic; }
        .markdown-viewer code { color: #f472b6; background: rgba(255,255,255,0.06); padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
        .markdown-viewer hr { border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 1.5em 0; }
        .markdown-viewer table { border-collapse: collapse; width: 100%; margin: 0.8em 0; font-size: 14px; }
        .markdown-viewer th, .markdown-viewer td { border: 1px solid rgba(255,255,255,0.08); padding: 8px 12px; text-align: left; }
        .markdown-viewer th { background: rgba(255,255,255,0.03); font-weight: 600; }
      `}</style>
      <div
        className="markdown-viewer"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
