"use client";

import { use, useState } from "react";
import Link from "next/link";
import { loadCustomContent, saveCustomContent } from "@/lib/custom-content";
import { FlashcardStudy } from "@/components/flashcards/flashcard-study";
import { ChevronRight, Download, Pencil, Check, X } from "lucide-react";
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
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);

  const courseSlug = slug[0];
  const moduleSlug = slug[1];
  const reviewerSlug = slug.slice(2).join("/");

  const customContent = loadCustomContent();
  const customCourse = customContent.courses.find((c) => c.id === courseSlug);
  const customModule = customCourse?.modules.find((m) => m.id === moduleSlug);
  const reviewer = customModule?.reviewers.find((r) => {
    const rSlug = r.id.split("/").slice(2).join("/");
    return rSlug === reviewerSlug || r.id.endsWith(reviewerSlug);
  });

  const [cards, setCards] = useState(reviewer?.cards || []);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editHint, setEditHint] = useState("");

  if (!reviewer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Reviewer not found.</p>
      </div>
    );
  }

  const startEdit = (i: number) => {
    setEditingIndex(i);
    setEditFront(cards[i].front);
    setEditBack(cards[i].back);
    setEditHint(cards[i].hint || "");
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const updated = [...cards];
    updated[editingIndex] = { front: editFront, back: editBack, hint: editHint || undefined };
    setCards(updated);

    const store = loadCustomContent();
    const c = store.courses.find((c) => c.id === courseSlug);
    const m = c?.modules.find((m) => m.id === moduleSlug);
    const r = m?.reviewers.find((r) => {
      const rSlug = r.id.split("/").slice(2).join("/");
      return rSlug === reviewerSlug || r.id.endsWith(reviewerSlug);
    });
    if (r) {
      r.cards = updated;
      saveCustomContent(store);
    }

    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/reviewers" className="hover:text-foreground">Flash Cards</Link>
          <ChevronRight className="h-4 w-4" />
          <span>{reviewer.title}</span>
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
            {editingIndex === i ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Question</label>
                  <textarea
                    value={editFront}
                    onChange={(e) => setEditFront(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Answer</label>
                  <textarea
                    value={editBack}
                    onChange={(e) => setEditBack(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Hint (optional)</label>
                  <input
                    value={editHint}
                    onChange={(e) => setEditHint(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveEdit}
                    className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm"
                  >
                    <Check className="h-3 w-3" /> Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg border text-sm hover:bg-muted"
                  >
                    <X className="h-3 w-3" /> Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">Q: {card.front}</p>
                    <p className="mt-2 text-muted-foreground">A: {card.back}</p>
                    {card.hint && <p className="mt-1 text-sm italic text-muted-foreground/70">Hint: {card.hint}</p>}
                  </div>
                  <button
                    onClick={() => startEdit(i)}
                    className="ml-2 p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground no-print shrink-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 no-print">
        <FlashcardStudy cards={cards} />
      </div>
    </div>
  );
}
