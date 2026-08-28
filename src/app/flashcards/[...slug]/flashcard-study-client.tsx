"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { loadCustomContent, saveCustomContent } from "@/lib/custom-content";
import { FlashcardStudy } from "@/components/flashcards/flashcard-study";
import { ChevronRight, Download, Pencil, Check, X, Play, Plus, Trash2 } from "lucide-react";
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

export default function FlashcardStudyClient({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);

  const courseSlug = slug[0];
  const moduleSlug = slug[1];
  const reviewerSlug = slug.slice(2).join("/");

  const [mounted, setMounted] = useState(false);
  const [reviewer, setReviewer] = useState<any>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editHint, setEditHint] = useState("");
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewFlipped, setReviewFlipped] = useState(false);
  const [swapped, setSwapped] = useState(false);
  const [queue, setQueue] = useState<any[]>([]);
  const [queueIndex, setQueueIndex] = useState(0);
  const [knownCount, setKnownCount] = useState(0);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [addFront, setAddFront] = useState("");
  const [addBack, setAddBack] = useState("");
  const [addHint, setAddHint] = useState("");
  const [flashImage, setFlashImage] = useState<string | null>(null);
  const [flashVisible, setFlashVisible] = useState(false);
  const [flashImages, setFlashImages] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch("/api/flash-images").then((r) => r.json()).then(setFlashImages).catch(() => {});
  }, []);

  useEffect(() => {
    const customContent = loadCustomContent();
    const customCourse = customContent.courses.find((c) => c.id === courseSlug);
    const customModule = customCourse?.modules.find((m) => m.id === moduleSlug);
    const found = customModule?.reviewers.find((r) => {
      const rSlug = r.id.split("/").slice(2).join("/");
      return rSlug === reviewerSlug || r.id.endsWith(reviewerSlug);
    });
    if (found) {
      setReviewer(found);
      setCards(found.cards || []);
    }
    setMounted(true);
  }, [courseSlug, moduleSlug, reviewerSlug]);

  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!reviewer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Flashcard deck not found.</p>
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

  const addCard = () => {
    if (!addFront.trim() || !addBack.trim()) return;
    const newCard = { front: addFront.trim(), back: addBack.trim(), hint: addHint.trim() || undefined };
    const updated = [...cards, newCard];
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

    setAddFront("");
    setAddBack("");
    setAddHint("");
    setAddingCard(false);
  };

  const deleteCard = (i: number) => {
    const updated = cards.filter((_, idx) => idx !== i);
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
  };

  function shuffleArray(arr: any[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function startReview() {
    setQueue(shuffleArray(cards));
    setQueueIndex(0);
    setKnownCount(0);
    setReviewFlipped(false);
    setSwapped(false);
    setReviewComplete(false);
    setReviewMode(true);
  }

  function showFlash(img: string) {
    setFlashImage(img);
    requestAnimationFrame(() => setFlashVisible(true));
    setTimeout(() => setFlashVisible(false), 3200);
    setTimeout(() => setFlashImage(null), 3500);
  }

  function pickRandom(arr: string[]): string | null {
    if (!arr.length) return null;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function handleKnow() {
    const img = pickRandom(flashImages.know || []);
    if (img) showFlash(img);
    const newQueue = queue.filter((_, i) => i !== queueIndex);
    setKnownCount((k) => k + 1);
    if (newQueue.length === 0) {
      setQueue([]);
      setReviewComplete(true);
    } else {
      setQueue(newQueue);
      setQueueIndex(Math.floor(Math.random() * newQueue.length));
    }
    setReviewFlipped(false);
  }

  function handleDontKnow() {
    const img = pickRandom(flashImages.dontknow || []);
    if (img) showFlash(img);
    const newQueueIndex = queueIndex >= queue.length - 1 ? 0 : queueIndex + 1;
    setQueueIndex(newQueueIndex);
    setReviewFlipped(false);
  }

  function handleForgot() {
    const img = pickRandom(flashImages.forgot || []);
    if (img) showFlash(img);
    const newQueueIndex = queueIndex >= queue.length - 1 ? 0 : queueIndex + 1;
    setQueueIndex(newQueueIndex);
    setReviewFlipped(false);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Link href="/flashcards" className="hover:text-foreground">Flash Cards</Link>
          <ChevronRight className="h-4 w-4" />
          <span>{reviewer.title}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{reviewer.title}</h1>
            <p className="text-muted-foreground mt-2">{cards.length} cards</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={startReview}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/10 text-sm"
            >
              <Play className="h-4 w-4" /> Review
            </button>
            <button
              onClick={() => setAddingCard(!addingCard)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-sm"
            >
              <Plus className="h-4 w-4" /> Add Card
            </button>
            <button
              onClick={() => exportFlashcardsToPdf(reviewer.title, cards)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-sm no-print"
            >
              <Download className="h-4 w-4" /> Save PDF
            </button>
          </div>
        </div>
      </div>

      {reviewMode && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {flashImage && (
            <div
              className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80"
              style={{
                opacity: flashVisible ? 1 : 0,
                transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <img
                src={flashImage}
                alt=""
                className="max-w-[80vw] max-h-[80vh] object-contain"
                style={{
                  transform: flashVisible ? "scale(1)" : "scale(0.85)",
                  opacity: flashVisible ? 1 : 0,
                  transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          )}
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-4">
              <span className="text-base text-muted-foreground">
                {reviewComplete ? "Done" : `${queue.length} remaining`}
              </span>
              <span className="text-sm text-green-600">{knownCount} known</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setSwapped(!swapped); setReviewFlipped(false); }}
                className={`px-4 py-2 rounded-lg border text-base ${swapped ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
              >
                {swapped ? "Back→Front" : "Front→Back"}
              </button>
              <button
                onClick={() => setReviewMode(false)}
                className="px-4 py-2 rounded-lg border text-base hover:bg-muted"
              >
                Exit Review
              </button>
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            {reviewComplete ? (
              <div className="text-center">
                <div className="text-6xl mb-6">&#127881;</div>
                <h2 className="text-3xl font-bold mb-4">All Done!</h2>
                <p className="text-xl text-muted-foreground mb-2">
                  You knew all {cards.length} cards.
                </p>
                <p className="text-muted-foreground mb-8">
                  Great job! Keep up the good work.
                </p>
                <button
                  onClick={() => setReviewMode(false)}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-medium"
                >
                  Back to Deck
                </button>
              </div>
            ) : (
              <>
                <div
                  onClick={() => setReviewFlipped(!reviewFlipped)}
                  className="w-full max-w-2xl min-h-[350px] p-12 rounded-xl border-2 bg-card cursor-pointer select-none flex items-center justify-center text-center transition-all hover:border-primary"
                >
                  <div>
                    <p className="text-2xl font-medium leading-relaxed">
                      {reviewFlipped
                        ? (swapped ? queue[queueIndex].front : queue[queueIndex].back)
                        : (swapped ? queue[queueIndex].back : queue[queueIndex].front)
                      }
                    </p>
                    {!reviewFlipped && queue[queueIndex].hint && (
                      <p className="text-base text-muted-foreground mt-6 italic">Hint: {queue[queueIndex].hint}</p>
                    )}
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  {!reviewFlipped ? (
                    <button
                      onClick={() => setReviewFlipped(true)}
                      className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-medium"
                    >
                      Show Answer
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={handleForgot}
                        className="px-6 py-3 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 text-base font-medium"
                      >
                        I Forgot
                      </button>
                      <button
                        onClick={handleDontKnow}
                        className="px-6 py-3 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 text-base font-medium"
                      >
                        I Don&apos;t Know
                      </button>
                      <button
                        onClick={handleKnow}
                        className="px-6 py-3 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 text-base font-medium"
                      >
                        I Know
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {addingCard && (
        <div className="mb-6 p-4 rounded-lg border bg-card space-y-3">
          <h3 className="font-medium">Add New Card</h3>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Question</label>
            <textarea
              value={addFront}
              onChange={(e) => setAddFront(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none"
              rows={2}
              placeholder="Enter the question..."
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Answer</label>
            <textarea
              value={addBack}
              onChange={(e) => setAddBack(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none"
              rows={2}
              placeholder="Enter the answer..."
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Hint (optional)</label>
            <input
              value={addHint}
              onChange={(e) => setAddHint(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              placeholder="Optional hint..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addCard}
              className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm"
            >
              <Check className="h-3 w-3" /> Add
            </button>
            <button
              onClick={() => { setAddingCard(false); setAddFront(""); setAddBack(""); setAddHint(""); }}
              className="flex items-center gap-1 px-3 py-1 rounded-lg border text-sm hover:bg-muted"
            >
              <X className="h-3 w-3" /> Cancel
            </button>
          </div>
        </div>
      )}

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
              <div className="relative pr-16">
                <div className="absolute top-0 right-0 flex gap-1 no-print">
                  <button
                    onClick={() => startEdit(i)}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteCard(i)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-medium">Q: {card.front}</p>
                <p className="mt-2 text-muted-foreground">A: {card.back}</p>
                {card.hint && <p className="mt-1 text-sm italic text-muted-foreground/70">Hint: {card.hint}</p>}
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
