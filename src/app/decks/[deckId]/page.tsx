"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Plus, Trash2, Pencil, Check, X, Play, RotateCcw, Bookmark, Shuffle, Search, Layers } from "lucide-react";

interface DeckCard {
  id: string;
  front: string;
  back: string;
  hint: string;
  sort_order: number;
  image_url?: string;
  card_type?: string;
}

export default function DeckStudyPage() {
  const { deckId } = useParams() as { deckId: string };
  const { user } = useAuth();
  const router = useRouter();
  const [deckTitle, setDeckTitle] = useState("");
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCard, setAddingCard] = useState(false);
  const [addFront, setAddFront] = useState("");
  const [addBack, setAddBack] = useState("");
  const [addHint, setAddHint] = useState("");
  const [addCardType, setAddCardType] = useState<"standard" | "image_label">("standard");
  const [addImageUrl, setAddImageUrl] = useState("");
  const [addLabels, setAddLabels] = useState<{ x: number; y: number; text: string }[]>([]);
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
  const [searchQuery, setSearchQuery] = useState("");
  const [labelAnswers, setLabelAnswers] = useState<string[]>([]);
  const [labelsRevealed, setLabelsRevealed] = useState(false);
  const [placing, setPlacing] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) { router.push("/login"); return; }
    fetchDeck();
  }, [user, deckId]);

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

  const handleAddCard = async () => {
    if (!user) return;
    if (addCardType === "image_label") {
      if (!addImageUrl || addLabels.length === 0) return;
      const supabase = getSupabase();
      const { data } = await supabase.from("custom_deck_cards").insert({
        id: crypto.randomUUID(),
        deck_id: deckId, user_id: user.id,
        front: addFront.trim() || "Label the image",
        back: addLabels.map(l => l.text).join(", "),
        hint: addHint.trim() || null,
        sort_order: cards.length,
        image_url: addImageUrl || null,
        card_type: "image_label",
      }).select().single();
      if (data) { const next = [...cards, data]; setCards(next); syncCount(next); }
      setAddFront(""); setAddBack(""); setAddHint(""); setAddCardType("standard"); setAddImageUrl(""); setAddLabels([]);
      setAddingCard(false);
      return;
    }
    if (!addFront.trim() || !addBack.trim()) return;
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
    setAddFront(""); setAddBack(""); setAddHint(""); setAddingCard(false);
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
    const q = shuffled ? [...cards].sort(() => Math.random() - 0.5) : [...cards];
    setQueue(q); setReviewIndex(0); setReviewFlipped(false); setReviewComplete(false);
    setKnownCount(0); setForgotCount(0); setLabelsRevealed(false); setLabelAnswers([]);
    setReviewMode(true);
  };

  const nextCard = (correct: boolean) => {
    if (correct) setKnownCount(k => k + 1); else setForgotCount(f => f + 1);
    const next = queue.filter((_, i) => i !== reviewIndex);
    if (next.length === 0) { setQueue([]); setReviewComplete(true); return; }
    setQueue(next); setReviewIndex(reviewIndex >= next.length ? 0 : reviewIndex);
    setReviewFlipped(false); setLabelsRevealed(false); setLabelAnswers([]);
  };

  const filtered = cards.filter(c => c.front.toLowerCase().includes(searchQuery.toLowerCase()) || c.back.toLowerCase().includes(searchQuery.toLowerCase()));

  if (loading) return <div className="page-container"><p className="text-secondary" style={{ textAlign: "center" }}>Loading...</p></div>;

  if (reviewMode) {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", background: "rgba(10,14,24,0.98)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span style={{ fontSize: "1rem", fontWeight: 500 }}>{reviewComplete ? "Done" : queue.length}</span>
            <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.875rem" }}>
              <span style={{ color: "#22c55e" }}>{knownCount}</span>
              <span style={{ color: "#ef4444" }}>{forgotCount}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => { setShuffled(!shuffled); }} className="glass-btn" style={shuffled ? { background: "var(--os-accent)", color: "#fff" } : {}}>
              <Shuffle size={16} />
            </button>
            <button onClick={() => { setReviewMode(false); setReviewComplete(false); }} className="glass-btn">Exit</button>
          </div>
        </div>
        <div style={{ padding: "0 1.25rem 0.75rem" }}>
          <div style={{ height: 6, background: "rgba(255,255,255,0.03)", borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--os-accent)", borderRadius: 9999, transition: "all 0.3s", width: `${cards.length > 0 ? ((knownCount + forgotCount) / cards.length) * 100 : 0}%` }} />
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          {reviewComplete ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "3.75rem", marginBottom: "1.5rem" }}>&#127881;</div>
              <h2 style={{ fontSize: "1.875rem", fontWeight: 700, marginBottom: "1rem" }}>All Done!</h2>
              <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "2rem", fontSize: "1.125rem" }}>
                <span style={{ color: "#22c55e" }}>{knownCount} known</span>
                <span style={{ color: "#ef4444" }}>{forgotCount} forgot</span>
              </div>
              <button onClick={() => { setReviewMode(false); setReviewComplete(false); }} className="glass-btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1.125rem", fontWeight: 500 }}>Back to Deck</button>
            </div>
          ) : queue[reviewIndex] ? (
            <>
              {queue[reviewIndex].card_type === "image_label" && queue[reviewIndex].image_url ? (
                <div style={{ width: "100%", maxWidth: 672, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                  <div style={{ position: "relative", width: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <img src={queue[reviewIndex].image_url} style={{ width: "100%", maxHeight: 350, objectFit: "contain", background: "#0a0e18" }} />
                    {(queue[reviewIndex].labels || []).map((label: any, i: number) => (
                      <div key={i} style={{ position: "absolute", left: `${label.x}%`, top: `${label.y}%`, transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2, zIndex: 2 }}>
                        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--os-accent)", border: "2px solid #fff", boxShadow: "0 1px 6px rgba(0,0,0,0.6)" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.7)", padding: "1px 5px", borderRadius: 4 }}>{i + 1}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 400 }}>
                    {(queue[reviewIndex].labels || []).map((label: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--os-accent)", width: 20, textAlign: "center" }}>{i + 1}</span>
                        {labelsRevealed ? (
                          <span style={{ flex: 1, fontSize: 14, color: (labelAnswers[i] || "").toLowerCase() === label.text.toLowerCase() ? "#4ade80" : "#f87171" }}>
                            {labelAnswers[i] || "(empty)"}
                            {(labelAnswers[i] || "").toLowerCase() !== label.text.toLowerCase() && <span style={{ marginLeft: 8, color: "#4ade80", fontWeight: 600 }}>→ {label.text}</span>}
                          </span>
                        ) : (
                          <input value={labelAnswers[i] || ""} onChange={(e) => { const next = [...labelAnswers]; next[i] = e.target.value; setLabelAnswers(next); }} onKeyDown={(e) => { if (e.key === "Enter" && i === (queue[reviewIndex].labels || []).length - 1) { const allCorrect = (queue[reviewIndex].labels || []).every((l: any, j: number) => (labelAnswers[j] || "").trim().toLowerCase() === l.text.toLowerCase()); setLabelsRevealed(true); setReviewFlipped(true); } }} placeholder={`Label ${i + 1}...`} autoFocus={i === 0} style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.35)", color: "var(--os-text-primary)", fontSize: 14, outline: "none" }} />
                        )}
                      </div>
                    ))}
                  </div>
                  {!labelsRevealed ? (
                    <button onClick={() => { const allCorrect = (queue[reviewIndex].labels || []).every((l: any, j: number) => (labelAnswers[j] || "").trim().toLowerCase() === l.text.toLowerCase()); setLabelsRevealed(true); setReviewFlipped(true); }} className="glass-btn-primary" style={{ padding: "0.6rem 2rem", fontSize: "1rem", fontWeight: 500 }}>Check Labels</button>
                  ) : (
                    <div style={{ display: "flex", gap: "1rem" }}>
                      <button onClick={() => nextCard(false)} style={{ padding: "0.75rem 1.5rem", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>Forgot</button>
                      <button onClick={() => nextCard(true)} style={{ padding: "0.75rem 1.5rem", background: "rgba(74,222,128,0.15)", color: "#4ade80", border: "1px solid rgba(74,222,128,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>Know</button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div onClick={() => setReviewFlipped(!reviewFlipped)} className="flashcard-study-card" style={{ width: "100%", maxWidth: 672, minHeight: 300, padding: "3rem", cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", background: "#1e293b", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}>
                    <div>
                      <p style={{ fontSize: "1.5rem", fontWeight: 500, lineHeight: 1.75, color: "var(--os-text-primary)" }}>
                        {reviewFlipped ? queue[reviewIndex].back : queue[reviewIndex].front}
                      </p>
                      {!reviewFlipped && queue[reviewIndex].hint && <p style={{ fontSize: "1rem", marginTop: "1.5rem", fontStyle: "italic", color: "var(--os-text-dim)" }}>Hint: {queue[reviewIndex].hint}</p>}
                    </div>
                  </div>
                  <div style={{ marginTop: "1rem", fontSize: 12, color: "var(--os-text-dim)" }}>
                    {!reviewFlipped ? "Space/Enter to flip" : "1 = Forgot  2 = Know"}
                  </div>
                  <div style={{ marginTop: "1rem", display: "flex", gap: "1rem" }}>
                    {!reviewFlipped ? (
                      <button onClick={() => setReviewFlipped(true)} className="glass-btn-primary" style={{ padding: "0.75rem 2rem", fontSize: "1.125rem", fontWeight: 500 }}>Show Answer</button>
                    ) : (
                      <>
                        <button onClick={() => nextCard(false)} style={{ padding: "0.75rem 1.5rem", background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, fontSize: "1rem", fontWeight: 500, cursor: "pointer" }}>I Forgot</button>
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

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 className="page-title"><Layers size={28} /> {deckTitle}</h1>
            <p className="page-subtitle">{cards.length} cards</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={startReview} disabled={cards.length === 0} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13, opacity: cards.length === 0 ? 0.4 : 1 }}>
              <Play size={15} /> Review
            </button>
            <button onClick={() => setAddingCard(!addingCard)} className="glass-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
              <Plus size={15} /> Add Card
            </button>
          </div>
        </div>

        {/* Add card form */}
        {addingCard && (
          <div className="glass-card" style={{ marginBottom: "1.5rem", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <h3 style={{ fontWeight: 500 }}>Add New Card</h3>
            <div style={{ display: "flex", gap: 6 }}>
              {(["standard", "image_label"] as const).map((t) => (
                <button key={t} onClick={() => setAddCardType(t)} style={{ padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", border: addCardType === t ? "1.5px solid var(--os-accent)" : "1px solid rgba(255,255,255,0.1)", background: addCardType === t ? "rgba(109,40,217,0.12)" : "rgba(255,255,255,0.03)", color: addCardType === t ? "var(--os-accent)" : "var(--os-text-secondary)" }}>
                  {t === "standard" ? "Flip Card" : "Image Label"}
                </button>
              ))}
            </div>
            {addCardType === "image_label" ? (
              <>
                <div><label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Prompt (optional)</label>
                  <textarea value={addFront} onChange={(e) => setAddFront(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} placeholder="e.g. Label the parts..." /></div>
                <div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    <button onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.accept = "image/*"; inp.onchange = () => { const f = inp.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setAddImageUrl(r.result as string); r.readAsDataURL(f); }; inp.click(); }} className="glass-btn" style={{ padding: "4px 10px", fontSize: 11 }}>Upload Image</button>
                    {addImageUrl && <button onClick={() => { setPlacing(!placing); }} className="glass-btn" style={{ padding: "4px 10px", fontSize: 11 }}>+ Add Label</button>}
                    <span style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{addLabels.length} labels</span>
                  </div>
                  {addImageUrl && (
                    <div ref={imgRef} onClick={(e) => { if (!imgRef.current) return; const rect = imgRef.current.getBoundingClientRect(); const x = ((e.clientX - rect.left) / rect.width) * 100; const y = ((e.clientY - rect.top) / rect.height) * 100; const text = prompt("Label text:"); if (text?.trim()) { setAddLabels([...addLabels, { x, y, text: text.trim() }]); } }} style={{ position: "relative", cursor: "crosshair", borderRadius: 8, overflow: "hidden", border: "1px solid var(--os-glass-border)" }}>
                      <img src={addImageUrl} style={{ width: "100%", maxHeight: 300, objectFit: "contain", background: "#000" }} />
                      {addLabels.map((l, i) => (
                        <div key={i} style={{ position: "absolute", left: `${l.x}%`, top: `${l.y}%`, transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--os-accent)", border: "2px solid #fff" }} />
                          <span style={{ fontSize: 9, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.7)", padding: "1px 4px", borderRadius: 3 }}>{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div><label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Question</label>
                  <textarea value={addFront} onChange={(e) => setAddFront(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} placeholder="Enter the question..." /></div>
                <div><label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Answer</label>
                  <textarea value={addBack} onChange={(e) => setAddBack(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} placeholder="Enter the answer..." /></div>
              </>
            )}
            <div><label className="text-xs text-secondary" style={{ marginBottom: "0.25rem", display: "block" }}>Hint (optional)</label>
              <input value={addHint} onChange={(e) => setAddHint(e.target.value)} className="glass-input" style={{ width: "100%" }} placeholder="Optional hint..." /></div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button onClick={handleAddCard} className="glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Check size={12} /> Add</button>
              <button onClick={() => { setAddingCard(false); setAddFront(""); setAddBack(""); setAddHint(""); setAddCardType("standard"); setAddImageUrl(""); setAddLabels([]); }} className="glass-btn"><X size={12} /> Cancel</button>
            </div>
          </div>
        )}

        {/* Search */}
        {cards.length > 0 && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--os-text-dim)" }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search cards..." style={{ width: "100%", padding: "10px 14px 10px 38px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }} />
          </div>
        )}

        {/* Card list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((card) => (
            <div key={card.id} className="glass-card" style={{ padding: "14px 18px" }}>
              {editingId === card.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <textarea value={editFront} onChange={(e) => setEditFront(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} />
                  <textarea value={editBack} onChange={(e) => setEditBack(e.target.value)} className="glass-input" style={{ width: "100%", resize: "none" }} rows={2} />
                  <input value={editHint} onChange={(e) => setEditHint(e.target.value)} placeholder="Hint..." className="glass-input" style={{ width: "100%" }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleSaveEdit(card.id)} className="glass-btn glass-btn-primary" style={{ padding: "5px 12px", fontSize: 12 }}><Check size={12} /> Save</button>
                    <button onClick={() => setEditingId(null)} className="glass-btn" style={{ padding: "5px 12px", fontSize: 12 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  {card.card_type === "image_label" && card.image_url && (
                    <img src={card.image_url} style={{ width: 60, height: 60, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "#000" }} />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "var(--os-text-primary)" }}>{card.front}</div>
                    <div style={{ fontSize: 13, color: "var(--os-text-dim)", marginTop: 4 }}>{card.back}</div>
                    {card.card_type === "image_label" && <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(109,40,217,0.12)", color: "#a78bfa", marginTop: 4, display: "inline-block" }}>Image Label</span>}
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