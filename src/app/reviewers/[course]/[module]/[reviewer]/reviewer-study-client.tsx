"use client";

import { use } from "react";
import Link from "next/link";
import { loadCustomContent } from "@/lib/custom-content";
import { FlashcardStudy } from "@/components/flashcards/flashcard-study";
import { ChevronRight, Download } from "lucide-react";
import jsPDF from "jspdf";

function exportFlashcardsToPdf(title: string, cards: any[]) {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageW = 210;
  const margin = 20;
  const contentW = pageW - margin * 2;
  let y = margin;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text(title, margin, y);
  y += 10;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(120);
  pdf.text(`${cards.length} cards`, margin, y);
  y += 10;

  pdf.setDrawColor(200);
  pdf.line(margin, y, pageW - margin, y);
  y += 8;

  cards.forEach((card: any, i: number) => {
    if (y > 270) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(40);
    const qLines = pdf.splitTextToSize(`Q${i + 1}: ${card.front}`, contentW);
    pdf.text(qLines, margin, y);
    y += qLines.length * 5 + 3;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(80);
    const aLines = pdf.splitTextToSize(`A: ${card.back}`, contentW);
    pdf.text(aLines, margin, y);
    y += aLines.length * 5 + 2;

    if (card.hint) {
      pdf.setFontSize(9);
      pdf.setTextColor(140);
      const hLines = pdf.splitTextToSize(`Hint: ${card.hint}`, contentW);
      pdf.text(hLines, margin, y);
      y += hLines.length * 4 + 2;
    }

    y += 3;
    pdf.setDrawColor(220);
    pdf.line(margin, y, pageW - margin, y);
    y += 6;
  });

  pdf.save(`${title}.pdf`);
}

export default function ReviewerStudyClient({
  params,
}: {
  params: Promise<{ course: string; module: string; reviewer: string }>;
}) {
  const { course: courseSlug, module: moduleSlug, reviewer: reviewerSlug } = use(params);

  const customContent = loadCustomContent();
  const customCourse = customContent.courses.find((c) => c.id === courseSlug);
  const customModule = customCourse?.modules.find((m) => m.id === moduleSlug);
  const reviewer = customModule?.reviewers.find((r) => r.id === reviewerSlug || r.id.endsWith(reviewerSlug));

  if (!reviewer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Reviewer not found.</p>
      </div>
    );
  }

  const cards = reviewer.cards || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/reviewers" className="hover:text-foreground">Flash Cards</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/courses/${courseSlug}/${moduleSlug}`} className="hover:text-foreground">
            {moduleSlug}
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{reviewer.title}</h1>
            <p className="text-muted-foreground mt-2">{cards.length} cards</p>
          </div>
          <button
            onClick={() => exportFlashcardsToPdf(reviewer.title, cards)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-sm no-print"
          >
            <Download className="h-4 w-4" /> Save PDF
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {cards.map((card: any, i: number) => (
          <div key={i} className="p-4 rounded-lg border bg-card">
            <p className="font-medium">Q: {card.front}</p>
            <p className="mt-2 text-muted-foreground">A: {card.back}</p>
            {card.hint && <p className="mt-1 text-sm italic text-muted-foreground/70">Hint: {card.hint}</p>}
          </div>
        ))}
      </div>

      <div className="mt-8 no-print">
        <FlashcardStudy cards={cards} />
      </div>
    </div>
  );
}
