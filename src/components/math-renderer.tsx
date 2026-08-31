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

      if (doubleDollar === -1 && singleDollar === -1) {
        segments.push({ text: remaining });
        break;
      }

      let nextIndex: number;
      let isDisplay: boolean;

      if (
        doubleDollar !== -1 &&
        (singleDollar === -1 || doubleDollar <= singleDollar)
      ) {
        nextIndex = doubleDollar;
        isDisplay = true;
      } else {
        nextIndex = singleDollar;
        isDisplay = false;
      }

      if (nextIndex > 0) {
        segments.push({ text: remaining.slice(0, nextIndex) });
      }

      const delimiter = isDisplay ? "$$" : "$";
      const end = remaining.indexOf(delimiter, nextIndex + delimiter.length);

      if (end === -1) {
        segments.push({ text: remaining });
        break;
      }

      segments.push({
        text: "",
        math: remaining.slice(nextIndex + delimiter.length, end),
        display: isDisplay,
      });

      remaining = remaining.slice(end + delimiter.length);
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
