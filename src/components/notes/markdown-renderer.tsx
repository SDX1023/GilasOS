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

    let html = markdownToHtml(processedContent);

    html = html.replace(
      /<div\s+data-textbox=""([^>]*)>([\s\S]*?)<\/div>/g,
      (_m: string, attrs: string, inner: string) => {
        const width = attrs.match(/width="(\d+)"/)?.[1] || "280";
        const height = attrs.match(/height="(\d+)"/)?.[1] || "100";
        const color = attrs.match(/color="([^"]*)"/)?.[1] || "#3b82f6";
        const rawContent = inner.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, "").trim();
        return `<div style="width:${width}px;min-height:${height}px;border:2px solid ${color};background:rgba(15,21,35,0.9);border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);padding:8px;font-size:14px;white-space:pre-wrap;margin:8px 0;">${rawContent.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}</div>`;
      }
    );

    setHtmlContent(html);
  }, [content, allLinksMap]);

  return (
    <div
      className="prose prose-neutral dark:prose-invert max-w-none relative overflow-visible
        prose-headings:scroll-mt-20
        prose-a:text-blue-600 dark:prose-a:text-blue-400 hover:prose-a:underline
        prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg
        prose-code:text-pink-600 dark:prose-code:text-pink-400 prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-normal prose-code:before:content-none prose-code:after:content-none
        prose-strong:text-foreground
        prose-img:rounded-lg prose-img:shadow-md
        prose-li:my-0.5
        prose-ul:list-disc prose-ol:list-decimal
        prose-table:border prose-th:border prose-td:border
        prose-blockquote:border-l-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:bg-muted/50 prose-blockquote:rounded-r-lg"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
