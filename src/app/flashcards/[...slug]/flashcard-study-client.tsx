"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { loadCustomContent, saveCustomContent } from "@/lib/custom-content";
import { getSupabase } from "@/lib/supabase";
import { ChevronRight, Download, Pencil, Check, X, Play, Plus, Trash2, Search } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { saveUserFlashcard, saveStudyStats } from "@/lib/user-data";
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
    if (y > 270) { pdf.addPage(); y = margin; }
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

export default function FlashcardStudyClient({ slug }: { slug: string[] }) {
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
  const [forgotCount, setForgotCount] = useState(0);
  const [dontKnowCount, setDontKnowCount] = useState(0);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [addingCard, setAddingCard] = useState(false);
  const [addFront, setAddFront] = useState("");
  const [addBack, setAddBack] = useState("");
  const [addHint, setAddHint] = useState("");
  const [flashImage, setFlashImage] = useState<string | null>(null);
  const [flashVisible, setFlashVisible] = useState(false);
  const [flashImages, setFlashImages] = useState<Record<string, string[]>>({});
  const flashQueues = useRef<Record<string, string[]>>({});
  const flashIndex = useRef<Record<string, number>>({});
  const [cardLevels, setCardLevels] = useState<Record<number, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();

  const sessionKey = `flash-session-${courseSlug}-${moduleSlug}-${reviewerSlug}`;
  const levelsKey = `flash-levels-${courseSlug}-${moduleSlug}-${reviewerSlug}`;

  useEffect(() => {
    fetch("/api/flash-images").then((r) => r.json()).then(setFlashImages).catch(() => {});
  }, []);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      let found = false;

      if (user) {
        // Logged in: load from Supabase
        const { data: reviewers } = await supabase
          .from("reviewers")
          .select("*, flashcards(*)")
          .eq("user_id", user.id);

        if (reviewers) {
          for (const r of reviewers) {
            // Match by full ID or by slug portion
            if (r.id === `${courseSlug}/${moduleSlug}/${reviewerSlug}` || r.id.endsWith(`/${reviewerSlug}`)) {
              setReviewer({
                id: r.id,
                courseId: r.course_id,
                moduleId: r.module_id,
                title: r.title,
                cards: (r.flashcards || []).map((c: any) => ({
                  front: c.front,
                  back: c.back,
                  hint: c.hint || "",
                })),
              });
              setCards((r.flashcards || []).map((c: any) => ({
                front: c.front,
                back: c.back,
                hint: c.hint || "",
              })));
              found = true;
              break;
            }
          }
        }
      }

      // Fallback: load from localStorage
      if (!found) {
        const customContent = loadCustomContent();
        const customCourse = customContent.courses.find((c) => c.id === courseSlug);
        const customModule = customCourse?.modules.find((m) => m.id === moduleSlug);
        const localFound = customModule?.reviewers.find((r) => {
          const rSlug = r.id.split("/").slice(2).join("/");
          return rSlug === reviewerSlug || r.id.endsWith(reviewerSlug);
        });
        if (localFound) {
          setReviewer(localFound);
          setCards(localFound.cards || []);
        }
      }

      setMounted(true);
    })();
  }, [courseSlug, moduleSlug, reviewerSlug]);

  useEffect(() => {
    if (!reviewMode) return;
    localStorage.setItem(sessionKey, JSON.stringify({
      date: new Date().toDateString(), queue, queueIndex, knownCount, forgotCount, dontKnowCount,
    }));
  }, [queue, queueIndex, knownCount, forgotCount, dontKnowCount, reviewMode, sessionKey]);

  useEffect(() => {
    if (Object.keys(cardLevels).length === 0) return;
    localStorage.setItem(levelsKey, JSON.stringify(cardLevels));
  }, [cardLevels, levelsKey]);

  useEffect(() => {
    if (!reviewMode) return;
    const id = setInterval(() => {
      const stored = localStorage.getItem(sessionKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.date !== new Date().toDateString()) {
          localStorage.removeItem(sessionKey);
          setQueue([]); setQueueIndex(0); setKnownCount(0); setForgotCount(0);
          setDontKnowCount(0); setReviewMode(false); setReviewComplete(false);
        }
      }
    }, 60000);
    return () => clearInterval(id);
  }, [reviewMode, sessionKey]);

  const reviewCompleteRef = useRef(reviewComplete);
  reviewCompleteRef.current = reviewComplete;
  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    if (!reviewCompleteRef.current || !userRef.current) return;
    const total = knownCount + forgotCount + dontKnowCount;
    if (total === 0) return;
    saveStudyStats(userRef.current.id, knownCount, forgotCount, dontKnowCount, total).catch(() => {});
  }, [reviewComplete, knownCount, forgotCount, dontKnowCount]);

  useEffect(() => {
    if (!reviewMode || reviewComplete) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (!reviewFlipped) {
        if (e.key === " " || e.key === "Enter") { e.preventDefault(); setReviewFlipped(true); }
      } else {
        if (e.key === "1") { e.preventDefault(); document.getElementById("btn-forgot")?.click(); }
        if (e.key === "2") { e.preventDefault(); document.getElementById("btn-dontknow")?.click(); }
        if (e.key === "3") { e.preventDefault(); document.getElementById("btn-know")?.click(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reviewMode, reviewFlipped, reviewComplete]);

  function saveProgressIfNeeded() {
    const total = knownCount + forgotCount + dontKnowCount;
    if (total > 0 && user) {
      saveStudyStats(user.id, knownCount, forgotCount, dontKnowCount, total).catch(() => {});
    }
  }

  function exitReview() {
    saveProgressIfNeeded();
    setShowSummary(false);
    setReviewMode(false);
  }

  if (!mounted) {
    return <div className="container mx-auto px-4 py-8 max-w-2xl"><p className="text-muted-foreground">Loading...</p></div>;
  }
  if (!reviewer) {
    return <div className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Flashcard deck not found.</p></div>;
  }

  function shuffleArray(arr: any[]) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }

  function buildSpacedQueue(cardList: any[]) {
    const indexed = cardList.map((card, i) => ({ card, level: cardLevels[i] || 0 }));
    indexed.sort((a, b) => a.level - b.level);
    const result: any[] = [];
    const remaining = [...indexed];
    while (remaining.length > 0) {
      let r = Math.random() * remaining.reduce((sum, item) => sum + Math.max(1, 4 - item.level), 0);
      let picked = 0;
      for (let i = 0; i < remaining.length; i++) { r -= Math.max(1, 4 - remaining[i].level); if (r <= 0) { picked = i; break; } }
      result.push(remaining[picked].card);
      remaining.splice(picked, 1);
    }
    return result;
  }

  function findCardIndex(card: any): number {
    return cards.findIndex((c) => c.front === card.front && c.back === card.back);
  }

  function updateLevel(card: any, delta: number) {
    const idx = findCardIndex(card);
    if (idx === -1) return;
    setCardLevels((prev) => ({ ...prev, [idx]: Math.max(0, Math.min(3, (prev[idx] || 0) + delta)) }));
  }

  function pickRandom(type: string): string | null {
    const pool = flashImages[type] || [];
    if (!pool.length) return null;
    if (!flashQueues.current[type] || flashQueues.current[type].length === 0) {
      flashQueues.current[type] = shuffleArray(pool);
      flashIndex.current[type] = 0;
    }
    const q = flashQueues.current[type];
    const img = q[flashIndex.current[type] % q.length];
    flashIndex.current[type]++;
    if (flashIndex.current[type] >= q.length) { flashQueues.current[type] = shuffleArray(pool); flashIndex.current[type] = 0; }
    return img;
  }

  function showFlash(type: string) {
    const img = pickRandom(type);
    if (img) {
      setFlashImage(img);
      requestAnimationFrame(() => setFlashVisible(true));
      setTimeout(() => setFlashVisible(false), 2500);
      setTimeout(() => setFlashImage(null), 2800);
    }
  }

  function startReview() {
    const stored = localStorage.getItem(sessionKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.date === new Date().toDateString() && data.queue?.length > 0) {
          setQueue(data.queue); setQueueIndex(data.queueIndex || 0);
          setKnownCount(data.knownCount || 0); setForgotCount(data.forgotCount || 0);
          setDontKnowCount(data.dontKnowCount || 0); setShowSummary(false);
          setReviewFlipped(false); setSwapped(false); setReviewComplete(false); setReviewMode(true);
          return;
        }
      } catch {}
    }
    setQueue(buildSpacedQueue(cards)); setQueueIndex(0); setKnownCount(0); setForgotCount(0);
    setDontKnowCount(0); setShowSummary(false); setReviewFlipped(false); setSwapped(false);
    setReviewComplete(false); setReviewMode(true);
  }

  function handleKnow() {
    showFlash("know");
    const current = queue[queueIndex];
    updateLevel(current, 1);
    const newQueue = queue.filter((_, i) => i !== queueIndex);
    setKnownCount((k) => k + 1);
    if (newQueue.length === 0) { setQueue([]); setReviewComplete(true); }
    else { setQueue(newQueue); setQueueIndex(queueIndex >= newQueue.length ? 0 : queueIndex); }
    setReviewFlipped(false);
  }

  function handleDontKnow() {
    showFlash("dontknow");
    const current = queue[queueIndex];
    updateLevel(current, -1);
    const newQueue = queue.filter((_, i) => i !== queueIndex);
    setDontKnowCount((d) => d + 1);
    if (newQueue.length === 0) { setQueue([]); setReviewComplete(true); }
    else { setQueue(newQueue); setQueueIndex(queueIndex >= newQueue.length ? 0 : queueIndex); }
    setReviewFlipped(false);
  }

  function handleForgot() {
    showFlash("forgot");
    const current = queue[queueIndex];
    updateLevel(current, -1);
    const newQueue = queue.filter((_, i) => i !== queueIndex);
    setForgotCount((f) => f + 1);
    if (newQueue.length === 0) { setQueue([]); setReviewComplete(true); }
    else { setQueue(newQueue); setQueueIndex(queueIndex >= newQueue.length ? 0 : queueIndex); }
    setReviewFlipped(false);
  }

  async function syncToCloud(updatedCards: any[]) {
    if (user && reviewer) {
      await saveUserFlashcard(user.id, courseSlug, moduleSlug, reviewerSlug, reviewer.title, updatedCards);
      // Also save to Supabase reviewers/flashcards tables
      const supabase = getSupabase();
      const reviewerId = reviewer.id;
      await supabase.from("reviewers").upsert({
        id: reviewerId,
        user_id: user.id,
        course_id: courseSlug,
        module_id: moduleSlug,
        title: reviewer.title,
      }, { onConflict: "id" });
      await supabase.from("flashcards").delete().eq("reviewer_id", reviewerId);
      if (updatedCards.length > 0) {
        const rows = updatedCards.map((card, i) => ({
          id: `${reviewerId}/card-${i}-${Date.now()}`,
          reviewer_id: reviewerId,
          user_id: user.id,
          front: card.front,
          back: card.back,
          hint: card.hint || "",
        }));
        await supabase.from("flashcards").insert(rows);
      }
    }
  }

  function saveEdit() {
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
    if (r) { r.cards = updated; saveCustomContent(store); }
    syncToCloud(updated);
    setEditingIndex(null);
  }

  function addCard() {
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
    if (r) { r.cards = updated; saveCustomContent(store); }
    syncToCloud(updated);
    setAddFront(""); setAddBack(""); setAddHint(""); setAddingCard(false);
  }

  function deleteCard(i: number) {
    const updated = cards.filter((_, idx) => idx !== i);
    setCards(updated);
    const store = loadCustomContent();
    const c = store.courses.find((c) => c.id === courseSlug);
    const m = c?.modules.find((m) => m.id === moduleSlug);
    const r = m?.reviewers.find((r) => {
      const rSlug = r.id.split("/").slice(2).join("/");
      return rSlug === reviewerSlug || r.id.endsWith(reviewerSlug);
    });
    if (r) { r.cards = updated; saveCustomContent(store); }
    syncToCloud(updated);
  }

  const filteredCards = cards.filter((card) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return card.front.toLowerCase().includes(q) || card.back.toLowerCase().includes(q) || (card.hint && card.hint.toLowerCase().includes(q));
  });

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
            <button onClick={startReview} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-primary/10 text-sm">
              <Play className="h-4 w-4" /> Review
            </button>
            <button onClick={() => setAddingCard(!addingCard)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-sm">
              <Plus className="h-4 w-4" /> Add Card
            </button>
            <button onClick={() => exportFlashcardsToPdf(reviewer.title, cards)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-sm no-print">
              <Download className="h-4 w-4" /> Save PDF
            </button>
          </div>
        </div>
      </div>

      {reviewMode && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col">
          {flashImage && (
            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/80"
              style={{ opacity: flashVisible ? 1 : 0, transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}>
              <img src={flashImage} alt="" className="max-w-[80vw] max-h-[80vh] object-contain"
                style={{ transform: flashVisible ? "scale(1)" : "scale(0.85)", opacity: flashVisible ? 1 : 0, transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
          )}
          <div className="flex items-center justify-between p-5 border-b">
            <div className="flex items-center gap-4">
              <span className="text-base font-medium">{reviewComplete ? "Done" : queue.length}</span>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-green-600">{knownCount}</span>
                <span className="text-orange-600">{dontKnowCount}</span>
                <span className="text-red-600">{forgotCount}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setSwapped(!swapped); setReviewFlipped(false); }}
                className={`px-4 py-2 rounded-lg border text-base ${swapped ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                {swapped ? "Back→Front" : "Front→Back"}
              </button>
              <button onClick={exitReview} className="px-4 py-2 rounded-lg border text-base hover:bg-muted">
                Exit Review
              </button>
            </div>
          </div>
          <div className="px-5 pb-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${cards.length > 0 ? ((knownCount + dontKnowCount + forgotCount) / cards.length) * 100 : 0}%` }} />
            </div>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            {reviewComplete ? (
              <div className="text-center">
                <div className="text-6xl mb-6">&#127881;</div>
                <h2 className="text-3xl font-bold mb-4">All Done!</h2>
                <div className="flex justify-center gap-8 mb-6 text-lg">
                  <span className="text-green-600">{knownCount} known</span>
                  <span className="text-orange-600">{dontKnowCount} don&apos;t know</span>
                  <span className="text-red-600">{forgotCount} forgot</span>
                </div>
                <p className="text-muted-foreground mb-8">Great job! Keep up the good work.</p>
                <button onClick={exitReview} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-medium">
                  Back to Deck
                </button>
              </div>
            ) : (
              <>
                <div onClick={() => setReviewFlipped(!reviewFlipped)}
                  className="w-full max-w-2xl min-h-[350px] p-12 rounded-xl border-2 bg-card cursor-pointer select-none flex items-center justify-center text-center transition-all hover:border-primary">
                  <div>
                    <p className="text-2xl font-medium leading-relaxed">
                      {reviewFlipped ? (swapped ? queue[queueIndex].front : queue[queueIndex].back) : (swapped ? queue[queueIndex].back : queue[queueIndex].front)}
                    </p>
                    {!reviewFlipped && queue[queueIndex].hint && <p className="text-base text-muted-foreground mt-6 italic">Hint: {queue[queueIndex].hint}</p>}
                  </div>
                </div>
                <div className="mt-4 text-xs text-muted-foreground">
                  {!reviewFlipped ? "Space/Enter to flip" : "1 = Forgot  2 = Don't Know  3 = Know"}
                </div>
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                  {!reviewFlipped ? (
                    <button onClick={() => setReviewFlipped(true)} className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-lg font-medium">
                      Show Answer
                    </button>
                  ) : (
                    <>
                      <button id="btn-forgot" onClick={handleForgot} className="px-6 py-3 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 text-base font-medium">
                        I Forgot
                      </button>
                      <button id="btn-dontknow" onClick={handleDontKnow} className="px-6 py-3 rounded-lg bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 text-base font-medium">
                        I Don&apos;t Know
                      </button>
                      <button id="btn-know" onClick={handleKnow} className="px-6 py-3 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 text-base font-medium">
                        I Know
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
          {showSummary && (
            <div className="absolute inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-sm">
              <div className="text-center p-8 rounded-xl border bg-card max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-6">Session Summary</h2>
                <div className="flex justify-center gap-6 mb-8 text-lg">
                  <div className="text-center"><p className="text-3xl font-bold text-green-600">{knownCount}</p><p className="text-sm text-muted-foreground">Known</p></div>
                  <div className="text-center"><p className="text-3xl font-bold text-orange-600">{dontKnowCount}</p><p className="text-sm text-muted-foreground">Don&apos;t Know</p></div>
                  <div className="text-center"><p className="text-3xl font-bold text-red-600">{forgotCount}</p><p className="text-sm text-muted-foreground">Forgot</p></div>
                </div>
                <div className="flex gap-3 justify-center">
                  <button onClick={() => { saveProgressIfNeeded(); localStorage.removeItem(sessionKey); setShowSummary(false); startReview(); }}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">Review Again</button>
                  <button                     onClick={exitReview}
                    className="px-6 py-2 rounded-lg border hover:bg-muted">Back to Deck</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {addingCard && (
        <div className="mb-6 p-4 rounded-lg border bg-card space-y-3">
          <h3 className="font-medium">Add New Card</h3>
          <div><label className="text-xs text-muted-foreground mb-1 block">Question</label>
            <textarea value={addFront} onChange={(e) => setAddFront(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none" rows={2} placeholder="Enter the question..." /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Answer</label>
            <textarea value={addBack} onChange={(e) => setAddBack(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none" rows={2} placeholder="Enter the answer..." /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Hint (optional)</label>
            <input value={addHint} onChange={(e) => setAddHint(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Optional hint..." /></div>
          <div className="flex gap-2">
            <button onClick={addCard} className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm"><Check className="h-3 w-3" /> Add</button>
            <button onClick={() => { setAddingCard(false); setAddFront(""); setAddBack(""); setAddHint(""); }} className="flex items-center gap-1 px-3 py-1 rounded-lg border text-sm hover:bg-muted"><X className="h-3 w-3" /> Cancel</button>
          </div>
        </div>
      )}

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search cards..." className="w-full pl-9 pr-3 py-2 rounded-lg border bg-background text-sm" />
      </div>

      <div className="space-y-4">
        {filteredCards.map((card: any, i: number) => {
          const realIndex = cards.indexOf(card);
          return (
            <div key={realIndex} className="p-4 rounded-lg border bg-card">
              {editingIndex === realIndex ? (
                <div className="space-y-3">
                  <div><label className="text-xs text-muted-foreground mb-1 block">Question</label>
                    <textarea value={editFront} onChange={(e) => setEditFront(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none" rows={2} /></div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">Answer</label>
                    <textarea value={editBack} onChange={(e) => setEditBack(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none" rows={2} /></div>
                  <div><label className="text-xs text-muted-foreground mb-1 block">Hint (optional)</label>
                    <input value={editHint} onChange={(e) => setEditHint(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" /></div>
                  <div className="flex gap-2">
                    <button onClick={saveEdit} className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm"><Check className="h-3 w-3" /> Save</button>
                    <button onClick={() => setEditingIndex(null)} className="flex items-center gap-1 px-3 py-1 rounded-lg border text-sm hover:bg-muted"><X className="h-3 w-3" /> Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="relative pr-16">
                  <div className="absolute top-0 right-0 flex gap-1 no-print">
                    <button onClick={() => { setEditingIndex(realIndex); setEditFront(card.front); setEditBack(card.back); setEditHint(card.hint || ""); }}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => deleteCard(realIndex)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <p className="font-medium">Q: {card.front}</p>
                  <p className="mt-2 text-muted-foreground">A: {card.back}</p>
                  {card.hint && <p className="mt-1 text-sm italic text-muted-foreground/70">Hint: {card.hint}</p>}
                </div>
              )}
            </div>
          );
        })}
        {filteredCards.length === 0 && searchQuery && <p className="text-center text-muted-foreground py-8">No cards match &quot;{searchQuery}&quot;</p>}
      </div>
    </div>
  );
}
