"use client";

import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathRendererProps {
  content: string;
  inline?: boolean;
}

export function MathRenderer({ content, inline = false }: MathRendererProps) {
  const parts = React.useMemo(() => {
    const segments: { text: string; math?: string; display?: boolean }[] = [];
    let remaining = content;

    while (remaining.length > 0) {
      const doubleDollar = remaining.indexOf("$$");
      const singleDollar = remaining.indexOf("$");
      const doubleBracket = remaining.indexOf("\\[");
      const singleParen = remaining.indexOf("\\(");

      if (doubleDollar === -1 && singleDollar === -1 && doubleBracket === -1 && singleParen === -1) {
        segments.push({ text: remaining });
        break;
      }

      const candidates: { index: number; isDisplay: boolean; delimLen: number; endDelim: string }[] = [];
      if (doubleDollar !== -1) candidates.push({ index: doubleDollar, isDisplay: true, delimLen: 2, endDelim: "$$" });
      if (doubleBracket !== -1) candidates.push({ index: doubleBracket, isDisplay: true, delimLen: 2, endDelim: "\\]" });
      if (singleDollar !== -1) candidates.push({ index: singleDollar, isDisplay: false, delimLen: 1, endDelim: "$" });
      if (singleParen !== -1) candidates.push({ index: singleParen, isDisplay: false, delimLen: 2, endDelim: "\\)" });

      candidates.sort((a, b) => a.index - b.index);
      const next = candidates[0];

      if (next.index > 0) {
        segments.push({ text: remaining.slice(0, next.index) });
      }

      const mathStart = next.index + next.delimLen;
      const endIdx = remaining.indexOf(next.endDelim, mathStart);

      if (endIdx === -1) {
        segments.push({ text: remaining });
        break;
      }

      segments.push({
        text: "",
        math: remaining.slice(mathStart, endIdx),
        display: next.isDisplay,
      });

      remaining = remaining.slice(endIdx + next.endDelim.length);
    }

    return segments;
  }, [content]);

  const html = parts
    .map((part) => {
      if (!part.math) {
        return part.text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
      }

      return katex.renderToString(part.math, {
        throwOnError: false,
        displayMode: inline ? false : part.display,
      });
    })
    .join("");

  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}
