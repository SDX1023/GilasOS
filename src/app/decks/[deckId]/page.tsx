"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Plus, Trash2, Pencil, Check, X, Play, Shuffle, Search, Layers, Eye, EyeOff, Timer, Sigma, Download } from "lucide-react";
import { ImageOcclusionCreator } from "@/components/image-occlusion-creator";
import { MathRenderer } from "@/components/math-renderer";
import { saveStudyStats, saveStudySession } from "@/lib/user-data";
import { earnBadge } from "@/lib/badges";

const formulaCache: Record<string, { formula: string; explanation: string } | null> = {};

async function fetchFormula(text: string): Promise<{ formula: string; explanation: string } | null> {
  if (text in formulaCache) return formulaCache[text];
  if (/\$|\\|\\\\|\\frac|\\sqrt|\\sum|\\int|\\alpha|\\beta|\\gamma|\\sigma|\\omega|\\theta|\\delta|\\epsilon|\\pi\b/i.test(text)) {
    formulaCache[text] = null;
    return null;
  }
  try {
    const res = await fetch("/api/generate-formula", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (data.detected && data.formula) {
      const result = { formula: data.formula, explanation: data.explanation || "" };
      formulaCache[text] = result;
      return result;
    }
  } catch {}
  formulaCache[text] = null;
  return null;
}

function FormulaLine({ text, showFormulas }: { text: string; showFormulas: boolean }) {
  const [result, setResult] = useState<{ formula: string; explanation: string } | null>(null);
  useEffect(() => {
    if (!showFormulas) return;
    if (text in formulaCache) { setResult(formulaCache[text]); return; }
    fetchFormula(text).then((r) => setResult(r));
  }, [showFormulas, text]);
  if (!showFormulas || !result) return <MathRenderer content={text} />;
  return (
    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
      <div style={{ flex: 1, minWidth: 0 }}><MathRenderer content={text} /></div>
      <div style={{ flexShrink: 0, maxWidth: "45%", padding: "8px 12px", borderRadius: 10, background: "rgba(109,40,217,0.08)", border: "1px solid rgba(109,40,217,0.2)", fontSize: 13, color: "#a78bfa" }}>
        <div><MathRenderer content={`$${result.formula}$`} /></div>
        {result.explanation && <div style={{ marginTop: 4, fontSize: 11, color: "#8b5cf6", fontStyle: "italic", lineHeight: 1.4 }}>{result.explanation}</div>}
      </div>
    </div>
  );
}

interface DeckCard {
  id: string;
  front: string;
  back: string;
  hint: string;
  sort_order: number;
  image_url?: string;
  card_type?: string;
  labels?: { x: number; y: number; w: number; h: number; text: string }[];
}

export default function DeckStudyPage() {
  const { deckId } = useParams() as { deckId: string };
  const { user } = useAuth();
  const router = useRouter();
  const [deckTitle, setDeckTitle] = useState("");
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCard, setAddingCard] = useState(false);
  const [addCardType, setAddCardType] = useState<"standard" | "image_card" | "image_occlusion">("standard");
  const [addFront, setAddFront] = useState("");
  const [addBack, setAddBack] = useState("");
  const [addHint, setAddHint] = useState("");
  const [addImageUrl, setAddImageUrl] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [editHint, setEditHint] = useState("");
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviewFlipped, setReviewFlipped] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [queue, setQueue] = useState<DeckCard[]>([]);
  const [knownCount, setKnownCount] = useState(0);
  const [forgotCount, setForgotCount] = useState(0);
  const [dontKnowCount, setDontKnowCount] = useState(0);
  const [swapped, setSwapped] = useState(false);
  const [showFormulas, setShowFormulas] = useState(false);
  const [reviewStudyMode, setReviewStudyMode] = useState<"flip" | "type-in">("flip");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [answerChecked, setAnswerChecked] = useState(false);
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetchDeck();
  }, [user, deckId]);

  const sessionKey = `deck-session-${deckId}`;

  useEffect(() => {
    document.querySelector<HTMLElement>("nav")?.style.setProperty("display", reviewMode ? "none" : "");
    document.querySelector<HTMLElement>(".taskbar")?.style.setProperty("display", reviewMode ? "none" : "");
    return () => {
      document.querySelector<HTMLElement>("nav")?.style.setProperty("display", "");
      document.querySelector<HTMLElement>(".taskbar")?.style.setProperty("display", "");
    };
  }, [reviewMode]);

  useEffect(() => {
    if (!reviewMode) return;
    localStorage.setItem(sessionKey, JSON.stringify({
      date: new Date().toDateString(), queue, reviewIndex, knownCount, forgotCount, dontKnowCount, swapped,
    }));
  }, [queue, reviewIndex, knownCount, forgotCount, dontKnowCount, reviewMode, sessionKey, swapped]);

  const sessionStartRef = useRef(Date.now());

  useEffect(() => {
    if (!reviewComplete || !user) return;
    const total = knownCount + forgotCount + dontKnowCount;
    if (total === 0) return;
    saveStudyStats(user.id, knownCount, forgotCount, dontKnowCount, total).catch(() => {});
    const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
    if (duration > 0) {
      saveStudySession(user.id, {
        session_type: "flashcards",
        subject: deckTitle,
        duration_seconds: duration,
        cards_studied: total,
        known: knownCount,
        forgot: forgotCount,
        dont_know: dontKnowCount,
      }).catch(() => {});
    }
    earnBadge("first-study");
    if (total >= 10) earnBadge("cards-10");
    if (total >= 100) earnBadge("cards-100");
    if (total >= 500) earnBadge("cards-500");
    localStorage.removeItem(sessionKey);
  }, [reviewComplete, knownCount, forgotCount, dontKnowCount]);

  useEffect(() => {
    if (!reviewMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); if (!reviewFlipped) setReviewFlipped(true); }
      if (reviewFlipped) {
        if (e.key === "1") nextCard(false);
        if (e.key === "2") nextCard(false, true);
        if (e.key === "3") nextCard(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [reviewMode, reviewFlipped, reviewIndex]);

  const fetchDeck = async () => {
    if (!user) return;
    const supabase = getSupabase();
    const { data: deck } = await supabase.from("custom_decks").select("title").eq("id", deckId).eq("user_id", user.id).single();
    if (!deck) { router.push("/decks"); return; }
    setDeckTitle(deck.title);
    const { data: cardData } = await supabase.from("custom_deck_cards").select("*").eq("deck_id", deckId).order("sort_order");
    setCards(cardData || []);
    setLoading(false);
  };

  const syncCount = async (newCards: DeckCard[]) => {
    const supabase = getSupabase();
    await supabase.from("custom_decks").update({ card_count: newCards.length, updated_at: new Date().toISOString() }).eq("id", deckId);
  };

  const handleAddStandard = async () => {
    if (!user || !addFront.trim() || !addBack.trim()) return;
    const supabase = getSupabase();
    const { data } = await supabase.from("custom_deck_cards").insert({
      id: crypto.randomUUID(),
      deck_id: deckId, user_id: user.id,
      front: addFront.trim(), back: addBack.trim(),
      hint: addHint.trim() || null,
      sort_order: cards.length,
      card_type: "standard",
    }).select().single();
    if (data) { const next = [...cards, data]; setCards(next); syncCount(next); }
    resetForm();
  };

  const handleAddImageCard = async () => {
    if (!user || !addFront.trim() || !addBack.trim() || !addImageUrl) return;
    const supabase = getSupabase();
    const { data } = await supabase.from("custom_deck_cards").insert({
      id: crypto.randomUUID(),
      deck_id: deckId, user_id: user.id,
      front: addFront.trim(), back: addBack.trim(),
      hint: addHint.trim() || null,
      sort_order: cards.length,
      card_type: "image_card",
      image_url: addImageUrl,
    }).select().single();
    if (data) { const next = [...cards, data]; setCards(next); syncCount(next); }
    resetForm();
  };

  const handleOcclusionGenerate = async (generatedCards: { front: string; back: string; image_url: string; labels: { x: number; y: number; w: number; h: number; text: string }[] }[]) => {
    if (!user) return;
    const supabase = getSupabase();
    const rows = generatedCards.map((c, i) => ({
      id: crypto.randomUUID(),
      deck_id: deckId, user_id: user.id,
      front: c.front, back: c.back,
      hint: null,
      sort_order: cards.length + i,
      card_type: "image_occlusion",
      image_url: c.image_url,
      labels: c.labels,
    }));
    const { data } = await supabase.from("custom_deck_cards").insert(rows).select();
    if (data) { const next = [...cards, ...data]; setCards(next); syncCount(next); }
    resetForm();
  };

  const resetForm = () => {
    setAddingCard(false);
    setAddCardType("standard");
    setAddFront(""); setAddBack(""); setAddHint(""); setAddImageUrl("");
  };

  const handleDeleteCard = async (id: string) => {
    const supabase = getSupabase();
    await supabase.from("custom_deck_cards").delete().eq("id", id);
    const next = cards.filter(c => c.id !== id);
    setCards(next);
    syncCount(next);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editFront.trim() || !editBack.trim()) return;
    const supabase = getSupabase();
    await supabase.from("custom_deck_cards").update({ front: editFront.trim(), back: editBack.trim(), hint: editHint.trim() }).eq("id", id);
    setCards(cards.map(c => c.id === id ? { ...c, front: editFront.trim(), back: editBack.trim(), hint: editHint.trim() } : c));
    setEditingId(null);
  };

  const startReview = () => {
    const stored = localStorage.getItem(sessionKey);
    if (stored && !shuffled) {
      try {
        const data = JSON.parse(stored);
        if (data.date === new Date().toDateString() && data.queue?.length > 0) {
          setQueue(data.queue); setReviewIndex(data.reviewIndex || 0);
          setKnownCount(data.knownCount || 0); setForgotCount(data.forgotCount || 0);
          setDontKnowCount(data.dontKnowCount || 0);
          if (data.swapped !== undefined) setSwapped(data.swapped);
          setReviewFlipped(false); setReviewComplete(false); setReviewMode(true);
          setTypedAnswer(""); setAnswerChecked(false); setAnswerCorrect(false);
          return;
        }
      } catch {}
    }
    const q = shuffled ? [...cards].sort(() => Math.random() - 0.5) : [...cards];
    setQueue(q); setReviewIndex(0); setReviewFlipped(false); setReviewComplete(false);
    setKnownCount(0); setForgotCount(0); setDontKnowCount(0);
    setTypedAnswer(""); setAnswerChecked(false);
    setReviewMode(true);
  };

  const nextCard = (correct: boolean, dontKnow = false) => {
    if (dontKnow) setDontKnowCount(d => d + 1); else if (correct) setKnownCount(k => k + 1); else setForgotCount(f => f + 1);
    const next = queue.filter((_, i) => i !== reviewIndex);
    if (next.length === 0) { setQueue([]); setReviewComplete(true); return; }
    setQueue(next); setReviewIndex(reviewIndex >= next.length ? 0 : reviewIndex);
    setReviewFlipped(false); setTypedAnswer(""); setAnswerChecked(false); setAnswerCorrect(false);
  };

  const filtered = cards.filter(c => c.front.toLowerCase().includes(searchQuery.toLowerCase()) || c.back.toLowerCase().includes(searchQuery.toLowerCase()));

  const cardTypeLabel = (t: string) => {
    if (t === "image_occlusion") return "Occlusion";
    if (t === "image_card") return "Image";
    return "Flip";
  };

  if (loading) return <div className="page-container"><p className="text-secondary" style={{ textAlign: "center" }}>Loading...</p></div>;

  if (reviewMode) {
    const card = queue[reviewIndex];
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", background: "rgba(10,14,24,0.98)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "1rem", fontWeight: 500 }}>{reviewComplete ? "Done" : queue.length}</span>
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.875rem" }}>
              <span style={{ color: "#22c55e" }}>{knownCount}</span>
              <span style={{ color: "#f97316" }}>{dontKnowCount}</span>
              <span style={{ color: "#ef4444" }}>{forgotCount}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button onClick={() => setShuffled(!shuffled)} className="glass-btn" style={shuffled ? { background: "var(--os-accent)", color: "#fff" } : {}}>
              <Shuffle size={16} />
            </button>
            <button onClick={() => { setSwapped(!swapped); setReviewFlipped(false); setTypedAnswer(""); setAnswerChecked(false); }}
              className="glass-btn"
              style={swapped ? { background: "var(--os-accent)", color: "#fff" } : {}}
            >
              {swapped ? "Back→Front" : "Front→Back"}
            </button>
            <button onClick={() => setReviewStudyMode(reviewStudyMode === "flip" ? "type-in" : "flip")}
              className="glass-btn"
              style={reviewStudyMode !== "flip" ? { background: "var(--os-accent)", color: "#fff" } : {}}
            >
              {reviewStudyMode === "flip" ? "Flip" : "Type-in"}
            </button>
            <button onClick={() => setShowFormulas(!showFormulas)}
              className="glass-btn"
              style={showFormulas ? { background: "rgba(109,40,217,0.15)", color: "#a78bfa", borderColor: "rgba(109,40,217,0.3)" } : {}}
            >
              {showFormulas ? "Σ On" : "Σ Off"}
            </button>
            <button onClick={() => {
              if (timerRunning) { clearInterval(timerRef.current!); setTimerRunning(false); }
              else { setTimerRunning(true); timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000); }
            }} className="glass-btn" style={timerRunning ? { background: "rgba(34,197,94,0.1)", color: "#22c55e", borderColor: "rgba(34,197,94,0.3)" } : {}}>
              <Timer size={16} /> {Math.floor(timerSeconds / 60).toString().padStart(2, "0")}:{(timerSeconds % 60).toString().padStart(2, "0")}
            </button>
            <button onClick={async () => {
              const total = knownCount + forgotCount + dontKnowCount;
              if (total > 0 && user) {
                try {
                  await saveStudyStats(user.id, knownCount, forgotCount, dontKnowCount, total);
                  const duration = Math.round((Date.now() - sessionStartRef.current) / 1000);
                  if (duration > 0) {
                    await saveStudySession(user.id, {
                      session_type: "flashcards",
                      subject: deckTitle,
                      duration_seconds: duration,
                      cards_studied: total,
                      known: knownCount,
                      forgot: forgotCount,
                      dont_know: dontKnowCount,
                    });
                  }
                } catch (err) {
                  console.error("Failed to save study stats:", err);
                }
              }
              localStorage.removeItem(sessionKey);
              setReviewMode(false); setReviewComplete(false);
              if (timerRef.current) clearInterval(timerRef.current); setTimerRunning(false); setTimerSeconds(0);
            }} className="glass-btn">Exit</button>
          </div>
        </div>
        <div style={{ padding: "0 1.25rem 0.75rem" }}>
          <div style={{ height: 6, background: "rgba(255,255,255,0.03)", borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--os-accent)", borderRadius: 9999, transition: "all 0.3s", width: `${cards.length > 0 ? ((knownCount + forgotCount) / cards.length) * 100 : 0}%` }} />
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem", overflowY: "auto" }}>
          {reviewComplete ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3.75rem", marginBottom: "1.5rem" }}>&#127881;</div>
              <h2 style={{ fontSize: "1.875rem", fontWeight: 700, marginBottom: "1rem" }}>All Done!</h2>
              <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "2rem", fontSize: "1.125rem" }}>
                <span style={{ color: "#22c55e" }}>{knownCount} known</span>
                <span style={{ color: "#f97316" }}>{dontKnowCount} don&apos;t know</span>
                <span style={{ color: "#ef4444" }}>{forgotCount} forgot</span>
              </div>
              <button onClick={() => { localStorage.removeItem(sessionKey); setReviewMode(false); setReviewComplete(false); }} className="glass-btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1.125rem", fontWeight: 500 }}>Back to Deck</button>
            </div>
          ) : card ? (
            <>
              {card.card_type === "image_occlusion" && card.image_url && card.labels ? (
                <div style={{ width: "100%", maxWidth: 672, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <img src={card.image_url} style={{ width: "100%", maxHeight: 400, objectFit: "contain", background: "#0a0e18", display: "block" }} />
                    {card.labels.map((label, i) => {
                      const isOccluded = label.text === card.back;
                      return (
                        <div key={i} style={{
                          position: "absolute",
                          left: `${label.x}%`, top: `${label.y}%`,
                          width: `${label.w}%`, height: `${label.h}%`,
                          background: isOccluded && !reviewFlipped ? "#6d28d9" : isOccluded && reviewFlipped ? "rgba(74,222,128,0.3)" : "transparent",
                          border: isOccluded ? "2px solid rgba(109,40,217,0.9)" : "none",
                          borderRadius: 4,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.3s ease",
                        }}>
                          {isOccluded && reviewFlipped && (
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80", background: "rgba(0,0,0,0.7)", padding: "2px 8px", borderRadius: 4 }}>{label.text}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ fontSize: 14, color: "var(--os-text-dim)", textAlign: "center" }}>
                    {reviewFlipped ? `Answer: ${card.back}` : "What is hidden here?"}
                  </div>
                  <div style={{ marginTop: "0.5rem", fontSize: 12, color: "var(--os-text-dim)" }}>
                    {!reviewFlipped ? "Space/Enter to reveal" : "1 = Forgot  2 = Don't Know  3 = Know"}
                  </div>
                  <div style={{ marginTop: "0.5rem", display: "flex", gap: "1rem" }}>
                    {!reviewFlipped ? (
                      <button onClick={() => setReviewFlipped(true)} className="glass-btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1.125rem", fontWeight: 500 }}>Reveal</button>
                    ) : (
                      <>
                        <button onClick={() => nextCard(false)} style={{ padding: "0.75rem 1.5rem", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Forgot</button>
                        <button onClick={() => nextCard(false, true)} style={{ padding: "0.75rem 1.5rem", background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Don&apos;t Know</button>
                        <button onClick={() => nextCard(true)} style={{ padding: "0.75rem 1.5rem", background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Know</button>
                      </>
                    )}
                  </div>
                </div>
              ) : card.card_type === "image_card" && card.image_url ? (
                <div style={{ width: "100%", maxWidth: 672, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div onClick={() => setReviewFlipped(!reviewFlipped)} style={{ width: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer" }}>
                    <img src={card.image_url} style={{ width: "100%", maxHeight: 400, objectFit: "contain", background: "#0a0e18", display: "block" }} />
                  </div>
                  <div style={{ width: "100%", maxWidth: 672, maxHeight: "40vh", overflowY: "auto", minHeight: 100, padding: "1.5rem", cursor: "pointer", textAlign: "center", background: "#1e293b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }} onClick={() => setReviewFlipped(!reviewFlipped)}>
                    <p style={{ fontSize: "1.1rem", fontWeight: 500, color: "var(--os-text-primary)" }}>
                      {reviewFlipped ? <FormulaLine text={swapped ? card.front : card.back} showFormulas={showFormulas} /> : <FormulaLine text={swapped ? card.back : card.front} showFormulas={showFormulas} />}
                    </p>
                    {!reviewFlipped && card.hint && !swapped && <p style={{ fontSize: "0.9rem", marginTop: "1rem", fontStyle: "italic", color: "var(--os-text-dim)" }}>Hint: {card.hint}</p>}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--os-text-dim)" }}>
                    {!reviewFlipped ? "Space/Enter to flip" : "1 = Forgot  2 = Don't Know  3 = Know"}
                  </div>
                  <div style={{ display: "flex", gap: "1rem" }}>
                    {!reviewFlipped ? (
                      <button onClick={() => setReviewFlipped(true)} className="glass-btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1.125rem", fontWeight: 500 }}>Show Answer</button>
                    ) : (
                      <>
                        <button onClick={() => nextCard(false)} style={{ padding: "0.75rem 1.5rem", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Forgot</button>
                        <button onClick={() => nextCard(false, true)} style={{ padding: "0.75rem 1.5rem", background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Don&apos;t Know</button>
                        <button onClick={() => nextCard(true)} style={{ padding: "0.75rem 1.5rem", background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Know</button>
                      </>
                    )}
                  </div>
                </div>
              ) : reviewStudyMode === "type-in" ? (
                /* Type-in mode */
                <>
                  <div style={{ width: "100%", maxWidth: 672, maxHeight: "55vh", overflowY: "auto", padding: "2rem", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", background: "#1e293b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                    <div style={{ width: "100%" }}>
                      <p style={{ fontSize: "1.15rem", fontWeight: 500, lineHeight: 1.7, color: "var(--os-text-primary)", marginBottom: "1rem" }}>
                        <FormulaLine text={swapped ? card.back : card.front} showFormulas={showFormulas} />
                      </p>
                      {card.hint && !swapped && <p style={{ fontSize: "0.9rem", marginBottom: "1rem", fontStyle: "italic", color: "var(--os-text-dim)" }}>Hint: {card.hint}</p>}
                      {!answerChecked ? (
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                          <input
                            type="text"
                            value={typedAnswer}
                            onChange={(e) => setTypedAnswer(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter" && typedAnswer.trim()) { const correct = typedAnswer.trim().toLowerCase() === (swapped ? card.front : card.back).toLowerCase(); setAnswerCorrect(correct); setAnswerChecked(true); setReviewFlipped(true); } }}
                            placeholder="Type your answer..."
                            autoFocus
                            style={{ width: "100%", maxWidth: 400, padding: "12px 16px", borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.35)", color: "var(--os-text-primary)", fontSize: "1rem", outline: "none", textAlign: "center", fontFamily: "Inter, sans-serif" }}
                          />
                          <button
                            onClick={() => { if (typedAnswer.trim()) { const correct = typedAnswer.trim().toLowerCase() === (swapped ? card.front : card.back).toLowerCase(); setAnswerCorrect(correct); setAnswerChecked(true); setReviewFlipped(true); } }}
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
                              Correct answer: {swapped ? card.front : card.back}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ marginTop: "0.75rem", fontSize: 12, color: "var(--os-text-dim)" }}>
                    {!answerChecked ? "Type answer, then press Enter or click Check" : "1 = Forgot  2 = Don't Know  3 = Know"}
                  </div>
                  {answerChecked && (
                    <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "1rem" }}>
                      <button onClick={() => nextCard(false)} style={{ padding: "0.75rem 1.5rem", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Forgot</button>
                      <button onClick={() => nextCard(false, true)} style={{ padding: "0.75rem 1.5rem", background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Don&apos;t Know</button>
                      <button onClick={() => nextCard(true)} style={{ padding: "0.75rem 1.5rem", background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Know</button>
                    </div>
                  )}
                </>
              ) : (
                /* Flip mode */
                <>
                  <div onClick={() => setReviewFlipped(!reviewFlipped)} style={{ width: "100%", maxWidth: 672, maxHeight: "55vh", overflowY: "auto", padding: "2rem", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", background: "#1e293b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                    <div style={{ width: "100%" }}>
                      <p style={{ fontSize: "1.15rem", fontWeight: 500, lineHeight: 1.7, color: "var(--os-text-primary)" }}>
                        {reviewFlipped
                          ? <FormulaLine text={swapped ? card.front : card.back} showFormulas={showFormulas} />
                          : <FormulaLine text={swapped ? card.back : card.front} showFormulas={showFormulas} />}
                      </p>
                      {!reviewFlipped && card.hint && !swapped && <p style={{ fontSize: "0.9rem", marginTop: "1rem", fontStyle: "italic", color: "var(--os-text-dim)" }}>Hint: {card.hint}</p>}
                    </div>
                  </div>
                  <div style={{ marginTop: "0.75rem", fontSize: 12, color: "var(--os-text-dim)" }}>
                    {!reviewFlipped ? "Space/Enter to flip" : "1 = Forgot  2 = Don't Know  3 = Know"}
                  </div>
                  <div style={{ marginTop: "0.75rem", display: "flex", gap: "1rem" }}>
                    {!reviewFlipped ? (
                      <button onClick={() => setReviewFlipped(true)} className="glass-btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1.125rem", fontWeight: 500 }}>Show Answer</button>
                    ) : (
                      <>
                        <button onClick={() => nextCard(false)} style={{ padding: "0.75rem 1.5rem", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Forgot</button>
                        <button onClick={() => nextCard(false, true)} style={{ padding: "0.75rem 1.5rem", background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Don&apos;t Know</button>
                        <button onClick={() => nextCard(true)} style={{ padding: "0.75rem 1.5rem", background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Know</button>
                      </>
                    )}
                  </div>
                </>
              )}
            </>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <Link href="/decks" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "var(--os-text-dim)", textDecoration: "none", marginBottom: 16 }}>
          <ArrowLeft size={14} /> My Decks
        </Link>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="page-title"><Layers size={28} /> {deckTitle}</h1>
            <p className="page-subtitle">{cards.length} cards</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button onClick={() => setShowFormulas(!showFormulas)}
              className="glass-btn"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, ...(showFormulas ? { background: "rgba(109,40,217,0.15)", color: "#a78bfa", borderColor: "rgba(109,40,217,0.3)" } : {}) }}
            >
              <Sigma size={15} /> {showFormulas ? "Σ On" : "Σ Off"}
            </button>
            <button onClick={() => setShuffled(!shuffled)}
              className="glass-btn"
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13, ...(shuffled ? { background: "rgba(0,212,255,0.1)", color: "var(--os-accent)", borderColor: "rgba(0,212,255,0.3)" } : {}) }}
            >
              <Shuffle size={15} /> {shuffled ? "Shuffled" : "Shuffle"}
            </button>
            <button onClick={startReview} disabled={cards.length === 0} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13, opacity: cards.length === 0 ? 0.4 : 1 }}>
              <Play size={15} /> Review
            </button>
            <button onClick={() => setAddingCard(!addingCard)} className="glass-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
              <Plus size={15} /> Add Card
            </button>
          </div>
        </div>

        {addingCard && (
          <div className="glass-card" style={{ marginBottom: "1.5rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h3 style={{ fontWeight: 500 }}>Add New Card</h3>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {([["standard", "Flip Card"], ["image_card", "Image Card"], ["image_occlusion", "Image Occlusion"]] as const).map(([t, label]) => (
                <button key={t} onClick={() => setAddCardType(t)} style={{ padding: "6px 14px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: addCardType === t ? "1.5px solid var(--os-accent)" : "1px solid rgba(255,255,255,0.1)", background: addCardType === t ? "rgba(109,40,217,0.12)" : "rgba(255,255,255,0.03)", color: addCardType === t ? "var(--os-accent)" : "var(--os-text-secondary)" }}>
                  {label}
                </button>
              ))}
            </div>

            {addCardType === "image_occlusion" ? (
              <ImageOcclusionCreator
                onGenerate={handleOcclusionGenerate}
                onCancel={resetForm}
              />
            ) : addCardType === "image_card" ? (
              <>
                <div>
                  <label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Question</label>
                  <textarea value={addFront} onChange={(e) => setAddFront(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} placeholder="e.g. What painting is this?" />
                </div>
                <div>
                  <label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Answer</label>
                  <textarea value={addBack} onChange={(e) => setAddBack(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} placeholder="e.g. Starry Night by Van Gogh" />
                </div>
                <div>
                  <label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Image</label>
                  {addImageUrl ? (
                    <div style={{ position: "relative", display: "inline-block" }}>
                      <img src={addImageUrl} style={{ maxHeight: 150, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }} />
                      <button onClick={() => setAddImageUrl("")} style={{ position: "absolute", top: 4, right: 4, padding: 2, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: 4, cursor: "pointer", color: "#ef4444" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => fileInputRef.current?.click()} className="glass-btn" style={{ padding: "6px 14px", fontSize: 12 }}>Upload Image</button>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                    const f = e.target.files?.[0]; if (!f) return;
                    const r = new FileReader(); r.onload = () => setAddImageUrl(r.result as string); r.readAsDataURL(f);
                  }} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={handleAddImageCard} className="glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Check size={12} /> Add</button>
                  <button onClick={resetForm} className="glass-btn"><X size={12} /> Cancel</button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Question</label>
                  <textarea value={addFront} onChange={(e) => setAddFront(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} placeholder="Enter the question..." />
                </div>
                <div>
                  <label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Answer</label>
                  <textarea value={addBack} onChange={(e) => setAddBack(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} placeholder="Enter the answer..." />
                </div>
                <div>
                  <label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Hint (optional)</label>
                  <input value={addHint} onChange={(e) => setAddHint(e.target.value)} className="glass-input" style={{ width: "100%" }} placeholder="Optional hint..." />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={handleAddStandard} className="glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Check size={12} /> Add</button>
                  <button onClick={resetForm} className="glass-btn"><X size={12} /> Cancel</button>
                </div>
              </>
            )}
          </div>
        )}

        {cards.length > 0 && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--os-text-dim)" }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search cards..." style={{ width: "100%", padding: "10px 14px 10px 38px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }} />
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((card) => (
            <div key={card.id} className="glass-card" style={{ padding: "14px 18px" }}>
              {editingId === card.id ? (
                card.card_type === "image_occlusion" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <ImageOcclusionCreator
                      onGenerate={(newCards) => {
                        if (newCards.length > 0) {
                          const c = newCards[0];
                          getSupabase().from("custom_deck_cards").update({ front: c.front, back: c.back, image_url: c.image_url, labels: c.labels }).eq("id", card.id).then(() => {
                            setCards(cards.map(x => x.id === card.id ? { ...x, front: c.front, back: c.back, image_url: c.image_url, labels: c.labels } : x));
                            setEditingId(null);
                          });
                        }
                      }}
                      onCancel={() => setEditingId(null)}
                      initialImageUrl={card.image_url}
                      initialLabels={card.labels}
                    />
                  </div>
                ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <textarea value={editFront} onChange={(e) => setEditFront(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} />
                  <textarea value={editBack} onChange={(e) => setEditBack(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} />
                  <input value={editHint} onChange={(e) => setEditHint(e.target.value)} placeholder="Hint..." className="glass-input" style={{ width: "100%" }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleSaveEdit(card.id)} className="glass-btn glass-btn-primary" style={{ padding: "5px 12px", fontSize: 12 }}><Check size={12} /> Save</button>
                    <button onClick={() => setEditingId(null)} className="glass-btn" style={{ padding: "5px 12px", fontSize: 12 }}>Cancel</button>
                  </div>
                </div>
                )
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {card.image_url && (
                    <img src={card.image_url} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "#000" }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--os-text-primary)" }}>{card.front}</div>
                    <div style={{ fontSize: 13, color: "var(--os-text-dim)", marginTop: 4 }}>{card.back}</div>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: card.card_type === "image_occlusion" ? "rgba(109,40,217,0.12)" : card.card_type === "image_card" ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.06)", color: card.card_type === "image_occlusion" ? "#a78bfa" : card.card_type === "image_card" ? "#60a5fa" : "var(--os-text-dim)", marginTop: 4, display: "inline-block" }}>
                      {cardTypeLabel(card.card_type || "standard")}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    <button onClick={() => { setEditingId(card.id); setEditFront(card.front); setEditBack(card.back); setEditHint(card.hint || ""); }} style={{ padding: 5, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 5, color: "var(--os-text-dim)", cursor: "pointer" }}><Pencil size={13} /></button>
                    <button onClick={() => handleDeleteCard(card.id)} style={{ padding: 5, background: "rgba(239,68,68,0.08)", border: "none", borderRadius: 5, color: "#ef4444", cursor: "pointer" }}><Trash2 size={13} /></button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
