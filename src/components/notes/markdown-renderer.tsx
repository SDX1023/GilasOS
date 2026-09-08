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
      '<div class="notebook-callout notebook-callout-warn"><span class="callout-icon">⚠️</span><span class="callout-label">Warning</span>$1</div>'
    );
    processedContent = processedContent.replace(
      /^>\s*ℹ️\s+(.+)$/gm,
      '<div class="notebook-callout notebook-callout-info"><span class="callout-icon">ℹ️</span><span class="callout-label">Info</span>$1</div>'
    );
    processedContent = processedContent.replace(
      /^>\s*✅\s+(.+)$/gm,
      '<div class="notebook-callout notebook-callout-success"><span class="callout-icon">✅</span><span class="callout-label">Key Point</span>$1</div>'
    );
    processedContent = processedContent.replace(
      /^>\s*💡\s+(.+)$/gm,
      '<div class="notebook-callout notebook-callout-tip"><span class="callout-icon">💡</span><span class="callout-label">Tip</span>$1</div>'
    );
    processedContent = processedContent.replace(
      /^>\s*📝\s+(.+)$/gm,
      '<div class="notebook-callout notebook-callout-note"><span class="callout-icon">📝</span><span class="callout-label">Note</span>$1</div>'
    );
    processedContent = processedContent.replace(
      /^>\s*([^⚠️ℹ️✅💡📝\n]+)$/gm,
      '<div class="notebook-callout notebook-callout-default"><span class="callout-icon">📌</span>$1</div>'
    );

    // Highlight: ==text== (yellow)
    processedContent = processedContent.replace(/==([^=]+)==/g, '<mark class="nb-highlight">$1</mark>');
    // Important: !!text!! (red)
    processedContent = processedContent.replace(/!!([^!]+)!!/g, '<mark class="nb-highlight nb-important">$1</mark>');
    // Question: ??text?? (blue)
    processedContent = processedContent.replace(/\?\?([^?]+)\?\?/g, '<mark class="nb-highlight nb-question">$1</mark>');
    // Underline: __text__ (purple)
    processedContent = processedContent.replace(/__([^_]+)__/g, '<span class="nb-underline">$1</span>');

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
      className="prose prose-neutral dark:prose-invert max-w-none relative overflow-visible notebook-page"
    >
      <style>{`
        .notebook-page {
          background-color: rgba(255,255,255,0.025);
          background-image: linear-gradient(rgba(139,92,246,0.03) 1px, transparent 1px);
          background-size: 100% 32px;
          padding: 32px 40px;
          border-radius: 8px;
          position: relative;
        }
        .notebook-page p { margin: 4px 0; line-height: 1.75; color: var(--os-text-secondary); font-size: 14px; }
        .notebook-page h1 { font-size: 1.5rem; font-weight: 700; margin: 1.5em 0 0.5em; color: var(--os-text-primary); letter-spacing: -0.02em; }
        .notebook-page h2 { font-size: 1.15rem; font-weight: 600; margin: 1.4em 0 0.4em; padding-bottom: 0.3em; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--os-text-primary); }
        .notebook-page h3 { font-size: 0.95rem; font-weight: 600; margin: 1.2em 0 0.3em; color: var(--os-accent); }
        .notebook-page ul, .notebook-page ol { margin: 4px 0; padding-left: 1.4em; }
        .notebook-page li { margin: 2px 0; color: var(--os-text-secondary); line-height: 1.7; }
        .notebook-page li::marker { color: var(--os-accent); opacity: 0.4; }
        .notebook-page strong { color: var(--os-text-primary); font-weight: 600; }
        .notebook-page em { color: var(--os-accent); font-style: italic; }
        .notebook-page a { color: #60a5fa; text-decoration: none; border-bottom: 1px dashed rgba(96,165,250,0.35); }
        .notebook-page a:hover { border-bottom-color: #60a5fa; }
        .notebook-page blockquote { border-left: 2.5px solid var(--os-accent); padding: 8px 16px; margin: 10px 0; background: rgba(139,92,246,0.04); border-radius: 0 6px 6px 0; font-style: italic; color: var(--os-text-secondary); font-size: 13.5px; }
        .notebook-page code { color: #f472b6; background: rgba(255,255,255,0.05); padding: 2px 5px; border-radius: 4px; font-size: 0.85em; }
        .notebook-page pre { background: rgba(0,0,0,0.25); border-radius: 8px; padding: 14px 16px; overflow-x: auto; margin: 10px 0; }
        .notebook-page pre code { color: var(--os-text-primary); background: none; padding: 0; }
        .notebook-page hr { border: none; height: 1px; background: rgba(255,255,255,0.06); margin: 1.5em 0; }
        .notebook-page table { border-collapse: collapse; width: 100%; margin: 10px 0; font-size: 13px; }
        .notebook-page th, .notebook-page td { border: 1px solid rgba(255,255,255,0.06); padding: 7px 12px; text-align: left; }
        .notebook-page th { background: rgba(139,92,246,0.05); font-weight: 600; color: var(--os-accent); font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; }
        .notebook-page td { color: var(--os-text-secondary); }

        .nb-highlight { background: rgba(234,179,8,0.15); color: #fbbf24; padding: 1px 5px; border-radius: 3px; font-weight: 500; }
        .nb-highlight.nb-important { background: rgba(239,68,68,0.15); color: #f87171; }
        .nb-highlight.nb-question { background: rgba(59,130,246,0.15); color: #60a5fa; }
        .nb-underline { text-decoration: underline; text-decoration-color: rgba(139,92,246,0.4); text-underline-offset: 3px; }

        .notebook-callout {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 10px 14px; margin: 10px 0; border-radius: 6px;
          font-size: 13px; line-height: 1.6; color: var(--os-text-secondary);
          border-left: 2.5px solid; background: rgba(255,255,255,0.02);
        }
        .callout-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }
        .callout-label { font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px; }
        .notebook-callout-warn { border-color: #f59e0b; background: rgba(245,158,11,0.04); }
        .notebook-callout-warn .callout-label { color: #fbbf24; }
        .notebook-callout-info { border-color: #3b82f6; background: rgba(59,130,246,0.04); }
        .notebook-callout-info .callout-label { color: #60a5fa; }
        .notebook-callout-success { border-color: #22c55e; background: rgba(34,197,94,0.04); }
        .notebook-callout-success .callout-label { color: #4ade80; }
        .notebook-callout-tip { border-color: #a855f7; background: rgba(168,85,247,0.04); }
        .notebook-callout-tip .callout-label { color: #c084fc; }
        .notebook-callout-note { border-color: #64748b; background: rgba(100,116,139,0.04); }
        .notebook-callout-note .callout-label { color: #94a3b8; }
        .notebook-callout-default { border-color: rgba(255,255,255,0.1); }

        @media (max-width: 640px) {
          .notebook-page { padding: 20px 16px; }
        }
      `}</style>
      <div
        className="markdown-viewer"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
