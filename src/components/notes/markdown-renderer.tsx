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
      className="prose prose-neutral dark:prose-invert max-w-none relative overflow-visible
        prose-headings:scroll-mt-20
        prose-h1:text-3xl prose-h1:font-bold prose-h1:mb-6 prose-h1:mt-10 prose-h1:text-white
        prose-h2:text-2xl prose-h2:font-bold prose-h2:mb-4 prose-h2:mt-12 prose-h2:text-white prose-h2:border-b prose-h2:border-white/10 prose-h2:pb-2
        prose-h3:text-lg prose-h3:font-semibold prose-h3:mb-3 prose-h3:mt-8 prose-h3:text-purple-300
        prose-p:my-4 prose-p:leading-relaxed prose-p:text-gray-300
        prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline
        prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg
        prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
        prose-strong:text-white prose-strong:font-semibold
        prose-li:my-1.5 prose-li:text-gray-300
        prose-ul:list-disc prose-ul:my-5 prose-ol:list-decimal prose-ol:my-5
        prose-table:border prose-th:border prose-td:border prose-table:max-w-full
        prose-blockquote:border-l-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-muted/50 prose-blockquote:rounded-r-lg prose-blockquote:my-4"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
