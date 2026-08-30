"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { loadCustomContent, saveCustomContent } from "@/lib/custom-content";
import { getSupabase } from "@/lib/supabase";
import { ChevronRight, Download, Pencil, Check, X, Play, Plus, Trash2, Search, Bookmark, Shuffle, Timer, Share2, Copy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { saveUserFlashcard, saveStudyStats, toggleBookmark, loadBookmarkedCards, saveStudySession } from "@/lib/user-data";
import { usePomodoroSafe } from "@/components/pomodoro/pomodoro-context";
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
  const sessionStartRef = useRef<number>(0);
  const flashIndex = useRef<Record<string, number>>({});
  const [cardLevels, setCardLevels] = useState<Record<number, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [shuffled, setShuffled] = useState(false);
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState(false);
  const [shared, setShared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareRecipient, setShareRecipient] = useState("");
  const [shareError, setShareError] = useState("");
  const [friends, setFriends] = useState<{ user_id: string; username: string }[]>([]);
  const [typedAnswer, setTypedAnswer] = useState("");
  const [answerChecked, setAnswerChecked] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [reviewStudyMode, setReviewStudyMode] = useState<"flip" | "type-in">("flip");
  const { user } = useAuth();
  const pomodoro = usePomodoroSafe();

  const sessionKey = `flash-session-${courseSlug}-${moduleSlug}-${reviewerSlug}`;
  const levelsKey = `flash-levels-${courseSlug}-${moduleSlug}-${reviewerSlug}`;

  useEffect(() => {
    fetch("/api/flash-images").then((r) => r.json()).then(setFlashImages).catch(() => {});
  }, []);

  useEffect(() => {
    if (!showShareModal || !user) return;
    (async () => {
      const supabase = getSupabase();
      const { data: allFriendships } = await supabase.from("user_friends").select("*").or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq("status", "accepted");
      if (!allFriendships || allFriendships.length === 0) { setFriends([]); return; }
      const otherIds = allFriendships.map((f: any) => f.requester_id === user.id ? f.addressee_id : f.requester_id);
      const { data: profiles } = await supabase.from("user_profiles").select("user_id, username").in("user_id", otherIds);
      if (profiles) setFriends(profiles.map((p: any) => ({ user_id: p.user_id, username: p.username })));
    })();
  }, [showShareModal, user]);

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
                  card_type: c.card_type || "standard",
                })),
              });
              setCards((r.flashcards || []).map((c: any) => ({
                front: c.front,
                back: c.back,
                hint: c.hint || "",
                card_type: c.card_type || "standard",
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
    if (!user) return;
    loadBookmarkedCards(user.id).then((cards) => {
      const set = new Set<string>();
      cards.forEach((c) => set.add(`${c.deck_id}:::${c.card_front}`));
      setBookmarked(set);
    }).catch(() => {});
  }, [user]);

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
    const duration = sessionStartRef.current > 0 ? Math.round((Date.now() - sessionStartRef.current) / 1000) : 0;
    if (duration > 0) {
      saveStudySession(userRef.current.id, {
        session_type: "flashcards",
        subject: courseSlug || "Custom",
        module: moduleSlug || undefined,
        deck_title: reviewer?.title || undefined,
        duration_seconds: duration,
        cards_studied: total,
        known: knownCount,
        forgot: forgotCount,
        dont_know: dontKnowCount,
      }).catch(() => {});
    }
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
  }, [reviewMode, reviewFlipped, reviewComplete, typedAnswer, answerChecked]);

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
    return <div className="page-container"><p className="text-secondary">Loading...</p></div>;
  }
  if (!reviewer) {
    return <div className="page-container"><p className="text-secondary">Flashcard deck not found.</p></div>;
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

  async function handleToggleBookmark(card: any) {
    if (!user) return;
    const deckId = reviewer?.id || `${courseSlug}/${moduleSlug}/${reviewerSlug}`;
    const key = `${deckId}:::${card.front}`;
    const wasBookmarked = bookmarked.has(key);
    setBookmarked((prev) => {
      const next = new Set(prev);
      if (wasBookmarked) next.delete(key);
      else next.add(key);
      return next;
    });
    await toggleBookmark(user.id, deckId, reviewer?.title || "", card.front, card.back, card.hint || "");
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
    sessionStartRef.current = Date.now();
    const stored = localStorage.getItem(sessionKey);
    if (stored && !shuffled) {
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
    const queueCards = shuffled ? shuffleArray(cards) : buildSpacedQueue(cards);
    setQueue(queueCards); setQueueIndex(0); setKnownCount(0); setForgotCount(0);
    setDontKnowCount(0); setShowSummary(false); setReviewFlipped(false); setSwapped(false);
    setTypedAnswer(""); setAnswerChecked(false); setAnswerCorrect(false);
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
    setTypedAnswer(""); setAnswerChecked(false);
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
    setTypedAnswer(""); setAnswerChecked(false);
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
    setTypedAnswer(""); setAnswerChecked(false);
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
          id: `${reviewerId.replace(/\//g, "-")}-card-${Date.now()}-${i}`,
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

  async function handleShare() {
    if (!user || !reviewer) return;
    setSharing(true);
    setShareError("");
    const supabase = getSupabase();

    let sharedWithId: string | null = null;
    if (shareRecipient.trim()) {
      const { data: recipient } = await supabase.from("user_profiles").select("user_id").eq("username", shareRecipient.trim()).maybeSingle();
      if (!recipient) { setShareError("User not found"); setSharing(false); return; }
      sharedWithId = recipient.user_id;
    }

    const reviewerId = reviewer.id;
    const { data: existing } = await supabase.from("shared_decks").select("id").eq("reviewer_id", reviewerId).eq("user_id", user.id).eq("shared_with_user_id", sharedWithId).maybeSingle();
    if (existing) {
      const link = `${window.location.origin}/shared/${existing.id}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      setSharing(false);
      setShared(true);
      setShowShareModal(false);
      return;
    }
    const { data, error } = await supabase.from("shared_decks").insert({
      user_id: user.id,
      reviewer_id: reviewerId,
      course_id: courseSlug,
      module_id: moduleSlug,
      title: reviewer.title,
      card_count: cards.length,
      cards_json: cards.map((c: any) => ({ front: c.front, back: c.back, hint: c.hint || "" })),
      shared_with_user_id: sharedWithId,
    }).select().single();
    if (error || !data) {
      const { data: fallbackData } = await supabase.from("shared_decks").insert({
        user_id: user.id,
        reviewer_id: reviewerId,
        course_id: courseSlug,
        module_id: moduleSlug,
        title: reviewer.title,
        card_count: cards.length,
        cards_json: cards.map((c: any) => ({ front: c.front, back: c.back, hint: c.hint || "" })),
      }).select().single();
      if (fallbackData) {
        const link = `${window.location.origin}/shared/${fallbackData.id}`;
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } else {
      const link = `${window.location.origin}/shared/${data.id}`;
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    setSharing(false);
    setShared(true);
    setShowShareModal(false);
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
    <div className="page-container">
      {showShareModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)" }} onClick={() => setShowShareModal(false)}>
          <div className="glass-panel" style={{ width: 400, padding: 24 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Share Deck</h3>
            {friends.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: "var(--os-text-dim)", display: "block", marginBottom: 6 }}>Share with a friend</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {friends.map((f) => (
                    <button key={f.user_id} onClick={() => setShareRecipient(shareRecipient === f.username ? "" : f.username)} style={{
                      padding: "4px 10px", borderRadius: 8, fontSize: 12, cursor: "pointer",
                      background: shareRecipient === f.username ? "var(--os-accent)" : "rgba(255,255,255,0.05)",
                      border: shareRecipient === f.username ? "1px solid var(--os-accent)" : "1px solid rgba(255,255,255,0.1)",
                      color: shareRecipient === f.username ? "#fff" : "var(--os-text-secondary)",
                    }}>{f.username}</button>
                  ))}
                </div>
              </div>
            )}
            <label style={{ fontSize: 12, color: "var(--os-text-dim)", display: "block", marginBottom: 6 }}>Or enter username manually</label>
            <input className="glass-input" value={shareRecipient} onChange={(e) => setShareRecipient(e.target.value)} placeholder="Leave empty for anyone with link" />
            {shareError && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4 }}>{shareError}</p>}
            {shared && copied && <p style={{ fontSize: 12, color: "#22c55e", marginTop: 4 }}>Link copied to clipboard!</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={() => setShowShareModal(false)} className="glass-btn glass-btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={handleShare} disabled={sharing || shared} className="glass-btn glass-btn-primary" style={{ flex: 1 }}>
                {sharing ? "Sharing..." : shared ? "Shared!" : "Share"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }} className="text-sm text-secondary">
          <Link href="/flashcards" style={{ color: "inherit" }}>Flash Cards</Link>
          <ChevronRight style={{ width: 16, height: 16 }} />
          <span>{reviewer.title}</span>
        </div>
        <div className="flashcard-header">
          <div style={{ minWidth: 0, flex: 1 }}>
            <h1 style={{ fontSize: "1.875rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{reviewer.title}</h1>
            <p className="text-secondary" style={{ marginTop: "0.5rem" }}>{cards.length} cards</p>
          </div>
          <div className="flashcard-actions">
            <button onClick={() => setShuffled(!shuffled)}
              className="glass-btn"
              style={shuffled ? { background: "rgba(0,212,255,0.1)", color: "var(--os-accent)", borderColor: "rgba(0,212,255,0.3)" } : {}}
            >
              <Shuffle style={{ width: 16, height: 16 }} /> {shuffled ? "Shuffled" : "Shuffle"}
            </button>
            <button onClick={startReview} className="glass-btn" style={{ color: "var(--os-accent)", borderColor: "var(--os-accent)" }}>
              <Play style={{ width: 16, height: 16 }} /> Review
            </button>
            <button onClick={() => setAddingCard(!addingCard)} className="glass-btn">
              <Plus style={{ width: 16, height: 16 }} /> Add Card
            </button>
            <button onClick={() => exportFlashcardsToPdf(reviewer.title, cards)} className="glass-btn no-print">
              <Download style={{ width: 16, height: 16 }} /> Save PDF
            </button>
            {user && (
              <button onClick={() => { setShowShareModal(true); setShareRecipient(""); setShareError(""); setShared(false); setCopied(false); }} className="glass-btn">
                <Share2 style={{ width: 16, height: 16 }} /> Share
              </button>
            )}
          </div>
        </div>
      </div>

      {reviewMode && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "rgba(10,14,24,0.98)" }}>
          {flashImage && (
            <div style={{ position: "absolute", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", opacity: flashVisible ? 1 : 0, transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}>
              <img src={flashImage} alt="" style={{ maxWidth: "80vw", maxHeight: "80vh", objectFit: "contain", transform: flashVisible ? "scale(1)" : "scale(0.85)", opacity: flashVisible ? 1 : 0, transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem", borderBottom: "1px solid var(--os-border)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ fontSize: "1rem", fontWeight: 500 }}>{reviewComplete ? "Done" : queue.length}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }} className="text-sm">
                <span style={{ color: "#22c55e" }}>{knownCount}</span>
                <span style={{ color: "#f97316" }}>{dontKnowCount}</span>
                <span style={{ color: "#ef4444" }}>{forgotCount}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end" }}>
              {pomodoro && (
                <button onClick={() => { if (!pomodoro.isRunning) pomodoro.start(); }}
                  className="glass-btn"
                  style={pomodoro.isRunning ? { background: "rgba(34,197,94,0.1)", color: "#22c55e", borderColor: "rgba(34,197,94,0.3)" } : {}}
                >
                  <Timer style={{ width: 16, height: 16 }} />
                  {pomodoro.isRunning ? pomodoro.formatTime(pomodoro.timeLeft) : "Start Timer"}
                </button>
              )}
              {!reviewComplete && queue[queueIndex] && (
                <button onClick={() => handleToggleBookmark(queue[queueIndex])}
                  className="glass-btn"
                  style={bookmarked.has(`${reviewer?.id || ""}:::${queue[queueIndex]?.front}`) ? { background: "rgba(234,179,8,0.1)", color: "#eab308", borderColor: "rgba(234,179,8,0.3)" } : {}}
                >
                  <Bookmark style={{ width: 16, height: 16 }} />
                </button>
              )}
              <button onClick={() => { setSwapped(!swapped); setReviewFlipped(false); setTypedAnswer(""); setAnswerChecked(false); }}
                className="glass-btn"
                style={swapped ? { background: "var(--os-accent)", color: "#fff" } : {}}
              >
                {swapped ? "Back→Front" : "Front→Back"}
              </button>
              <button onClick={() => { setReviewStudyMode(reviewStudyMode === "flip" ? "type-in" : "flip"); setReviewFlipped(false); setTypedAnswer(""); setAnswerChecked(false); }}
                className="glass-btn"
                style={reviewStudyMode === "type-in" ? { background: "var(--os-accent)", color: "#fff" } : {}}
              >
                {reviewStudyMode === "flip" ? "📝 Type-in" : "🔄 Flip"}
              </button>
              <button onClick={exitReview} className="glass-btn">
                Exit
              </button>
            </div>
          </div>
          <div style={{ padding: "0 1.25rem 0.75rem" }}>
            <div style={{ height: 6, background: "rgba(255,255,255,0.03)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--os-accent)", borderRadius: 9999, transition: "all 0.3s", width: `${cards.length > 0 ? ((knownCount + dontKnowCount + forgotCount) / cards.length) * 100 : 0}%` }} />
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
            {reviewComplete ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "3.75rem", marginBottom: "1.5rem" }}>&#127881;</div>
                <h2 style={{ fontSize: "1.875rem", fontWeight: 700, marginBottom: "1rem" }}>All Done!</h2>
                <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "1.5rem", fontSize: "1.125rem" }}>
                  <span style={{ color: "#22c55e" }}>{knownCount} known</span>
                  <span style={{ color: "#f97316" }}>{dontKnowCount} don&apos;t know</span>
                  <span style={{ color: "#ef4444" }}>{forgotCount} forgot</span>
                </div>
                <p className="text-secondary" style={{ marginBottom: "2rem" }}>Great job! Keep up the good work.</p>
                <button onClick={exitReview} className="glass-btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1.125rem", fontWeight: 500 }}>
                  Back to Deck
                </button>
              </div>
            ) : (
              <>
                {/* Standard card: flip to reveal */}
                {reviewStudyMode === "flip" ? (
                  <>
                    <div onClick={() => setReviewFlipped(!reviewFlipped)}
                      className="flashcard-study-card"
                      style={{ width: "100%", maxWidth: 672, minHeight: 350, padding: "3rem", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", transition: "all 0.3s", background: "#1e293b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                      <div>
                        <p style={{ fontSize: "1.5rem", fontWeight: 500, lineHeight: 1.75, color: "var(--os-text-primary)" }}>
                          {reviewFlipped ? (swapped ? queue[queueIndex].front : queue[queueIndex].back) : (swapped ? queue[queueIndex].back : queue[queueIndex].front)}
                        </p>
                        {!reviewFlipped && queue[queueIndex].hint && <p style={{ fontSize: "1rem", marginTop: "1.5rem", fontStyle: "italic", color: "var(--os-text-dim)" }}>Hint: {queue[queueIndex].hint}</p>}
                      </div>
                    </div>
                    <div style={{ marginTop: "1rem", fontSize: 12, color: "var(--os-text-dim)" }}>
                      {!reviewFlipped ? "Space/Enter to flip" : "1 = Forgot  2 = Don't Know  3 = Know"}
                    </div>
                    <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
                      {!reviewFlipped ? (
                        <button onClick={() => setReviewFlipped(true)} className="glass-btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1.125rem", fontWeight: 500 }}>
                          Show Answer
                        </button>
                      ) : (
                        <>
                          <button id="btn-forgot" onClick={handleForgot} style={{ padding: "0.75rem 1.5rem", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                            I Forgot
                          </button>
                          <button id="btn-dontknow" onClick={handleDontKnow} style={{ padding: "0.75rem 1.5rem", background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                            I Don&apos;t Know
                          </button>
                          <button id="btn-know" onClick={handleKnow} style={{ padding: "0.75rem 1.5rem", background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                            I Know
                          </button>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  /* Identification card: type answer */
                  <>
                    <div className="flashcard-study-card"
                      style={{ width: "100%", maxWidth: 672, minHeight: 350, padding: "3rem", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", transition: "all 0.3s", background: "#1e293b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                      <div style={{ width: "100%" }}>
                        <p style={{ fontSize: "1.5rem", fontWeight: 500, lineHeight: 1.75, color: "var(--os-text-primary)", marginBottom: "1.5rem" }}>
                          {swapped ? queue[queueIndex].back : queue[queueIndex].front}
                        </p>
                        {!swapped && queue[queueIndex].hint && <p style={{ fontSize: "1rem", marginBottom: "1.5rem", fontStyle: "italic", color: "var(--os-text-dim)" }}>Hint: {queue[queueIndex].hint}</p>}
                        {!answerChecked ? (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                            <input
                              type="text"
                              value={typedAnswer}
                              onChange={(e) => setTypedAnswer(e.target.value)}
                              onKeyDown={(e) => { if (e.key === "Enter" && typedAnswer.trim()) { const correct = typedAnswer.trim().toLowerCase() === queue[queueIndex].back.toLowerCase(); setAnswerCorrect(correct); setAnswerChecked(true); setReviewFlipped(true); } }}
                              placeholder="Type your answer..."
                              autoFocus
                              style={{ width: "100%", maxWidth: 400, padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.15)", color: "var(--os-text-primary)", fontSize: "1rem", outline: "none", textAlign: "center", fontFamily: "Inter, sans-serif" }}
                            />
                            <button
                              onClick={() => { if (typedAnswer.trim()) { const correct = typedAnswer.trim().toLowerCase() === queue[queueIndex].back.toLowerCase(); setAnswerCorrect(correct); setAnswerChecked(true); setReviewFlipped(true); } }}
                              disabled={!typedAnswer.trim()}
                              className="glass-btn-primary"
                              style={{ padding: "0.6rem 2rem", fontSize: "1rem", fontWeight: 500, opacity: typedAnswer.trim() ? 1 : 0.4 }}
                            >
                              Check
                            </button>
                          </div>
                        ) : (
                          <div>
                            <p style={{ fontSize: "1rem", marginBottom: 8, color: answerCorrect ? "#4ade80" : "#f87171" }}>
                              {answerCorrect ? "Correct!" : `Your answer: ${typedAnswer}`}
                            </p>
                            {!answerCorrect && (
                              <p style={{ fontSize: "1.1rem", fontWeight: 600, color: "var(--os-text-primary)" }}>
                                Correct answer: {queue[queueIndex].back}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ marginTop: "1rem", fontSize: 12, color: "var(--os-text-dim)" }}>
                      {!answerChecked ? "Type answer, then press Enter or click Check" : "1 = Forgot  2 = Don't Know  3 = Know"}
                    </div>
                    {answerChecked && (
                      <div style={{ marginTop: "1rem", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
                        <button id="btn-forgot" onClick={handleForgot} style={{ padding: "0.75rem 1.5rem", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                          I Forgot
                        </button>
                        <button id="btn-dontknow" onClick={handleDontKnow} style={{ padding: "0.75rem 1.5rem", background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                          I Don&apos;t Know
                        </button>
                        <button id="btn-know" onClick={handleKnow} style={{ padding: "0.75rem 1.5rem", background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
                          I Know
                        </button>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
          {showSummary && (
            <div style={{ position: "absolute", inset: 0, zIndex: 70, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,21,35,0.95)", backdropFilter: "blur(4px)" }}>
              <div className="glass-card" style={{ textAlign: "center", padding: "2rem", maxWidth: 448, width: "100%", margin: "0 1rem" }}>
                <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1.5rem" }}>Session Summary</h2>
                <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "2rem", fontSize: "1.125rem" }}>
                  <div style={{ textAlign: "center" }}><p style={{ fontSize: "1.875rem", fontWeight: 700, color: "#22c55e" }}>{knownCount}</p><p className="text-sm text-secondary">Known</p></div>
                  <div style={{ textAlign: "center" }}><p style={{ fontSize: "1.875rem", fontWeight: 700, color: "#f97316" }}>{dontKnowCount}</p><p className="text-sm text-secondary">Don&apos;t Know</p></div>
                  <div style={{ textAlign: "center" }}><p style={{ fontSize: "1.875rem", fontWeight: 700, color: "#ef4444" }}>{forgotCount}</p><p className="text-sm text-secondary">Forgot</p></div>
                </div>
                <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
                  <button onClick={() => { saveProgressIfNeeded(); localStorage.removeItem(sessionKey); setShowSummary(false); startReview(); }}
                    className="glass-btn-primary" style={{ padding: "0.5rem 1.5rem" }}>Review Again</button>
                  <button onClick={exitReview}
                    className="glass-btn" style={{ padding: "0.5rem 1.5rem" }}>Back to Deck</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {addingCard && (
        <div className="glass-card" style={{ marginBottom: "1.5rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <h3 style={{ fontWeight: 500 }}>Add New Card</h3>
          <div><label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Question</label>
            <textarea value={addFront} onChange={(e) => setAddFront(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} placeholder="Enter the question..." /></div>
          <div><label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Answer</label>
            <textarea value={addBack} onChange={(e) => setAddBack(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} placeholder="Enter the answer..." /></div>
          <div><label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Hint (optional)</label>
            <input value={addHint} onChange={(e) => setAddHint(e.target.value)} className="glass-input" style={{ width: "100%" }} placeholder="Optional hint..." /></div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={addCard} className="glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Check style={{ width: 12, height: 12 }} /> Add</button>
            <button onClick={() => { setAddingCard(false); setAddFront(""); setAddBack(""); setAddHint(""); }} className="glass-btn" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><X style={{ width: 12, height: 12 }} /> Cancel</button>
          </div>
        </div>
      )}

      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <Search style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", width: 16, height: 16 }} className="text-secondary" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search cards..." className="glass-input" style={{ width: "100%", paddingLeft: "2.25rem" }} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {filteredCards.map((card: any, i: number) => {
          const realIndex = cards.indexOf(card);
          return (
            <div key={realIndex} className="glass-card">
              {editingIndex === realIndex ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <div><label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Question</label>
                    <textarea value={editFront} onChange={(e) => setEditFront(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} /></div>
                  <div><label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Answer</label>
                    <textarea value={editBack} onChange={(e) => setEditBack(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} /></div>
                  <div><label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Hint (optional)</label>
                    <input value={editHint} onChange={(e) => setEditHint(e.target.value)} className="glass-input" style={{ width: "100%" }} /></div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={saveEdit} className="glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Check style={{ width: 12, height: 12 }} /> Save</button>
                    <button onClick={() => setEditingIndex(null)} className="glass-btn" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><X style={{ width: 12, height: 12 }} /> Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flashcard-card-content">
                  <div className="flashcard-card-actions no-print">
                    {user && (
                      <button onClick={() => handleToggleBookmark(card)}
                        className="glass-btn-ghost"
                        style={{ padding: "0.375rem", borderRadius: "0.5rem" }}>
                        <Bookmark style={{ width: 16, height: 16 }} fill={bookmarked.has(`${reviewer?.id || ""}:::${card.front}`) ? "currentColor" : "none"} />
                      </button>
                    )}
                    <button onClick={() => { setEditingIndex(realIndex); setEditFront(card.front); setEditBack(card.back); setEditHint(card.hint || ""); }}
                      className="glass-btn-ghost" style={{ padding: "0.375rem", borderRadius: "0.5rem" }}><Pencil style={{ width: 16, height: 16 }} /></button>
                    <button onClick={() => deleteCard(realIndex)}
                      className="glass-btn-ghost" style={{ padding: "0.375rem", borderRadius: "0.5rem" }}><Trash2 style={{ width: 16, height: 16 }} /></button>
                  </div>
                  <p style={{ fontWeight: 500, wordBreak: "break-word" }}>Q: {card.front}</p>
                  <p style={{ marginTop: "0.5rem", wordBreak: "break-word" }} className="text-secondary">A: {card.back}</p>
                  {card.hint && <p style={{ marginTop: "0.25rem", fontSize: "0.875rem", fontStyle: "italic" }} className="text-secondary">Hint: {card.hint}</p>}
                </div>
              )}
            </div>
          );
        })}
        {filteredCards.length === 0 && searchQuery && <p style={{ textAlign: "center" }} className="text-secondary">No cards match &quot;{searchQuery}&quot;</p>}
      </div>
    </div>
  );
}
