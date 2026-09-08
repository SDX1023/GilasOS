"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Layers, Play, RotateCcw, Trophy, Clock, Zap, ArrowLeft, ChevronRight, Shuffle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";

interface Card {
  id: string;
  front: string;
  back: string;
}

interface Deck {
  id: string;
  title: string;
  card_count: number;
  cards_json: Card[];
}

interface FlipCard {
  uniqueId: string;
  cardId: string;
  content: string;
  type: "front" | "back";
  matched: boolean;
  flipped: boolean;
}

type Phase = "select" | "playing" | "finished";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function MatchGamePage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("select");
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [gridSize, setGridSize] = useState(4);
  const [cards, setCards] = useState<FlipCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [totalPairs, setTotalPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [lockBoard, setLockBoard] = useState(false);
  const [bestTime, setBestTime] = useState<Record<string, number>>({});
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase
        .from("custom_decks")
        .select("id, title, card_count, cards_json")
        .eq("user_id", user.id)
        .gt("card_count", 1)
        .order("title");
      if (data) setDecks(data as Deck[]);

      const saved = localStorage.getItem("match-best-times");
      if (saved) setBestTime(JSON.parse(saved));
      setLoading(false);
    })();
  }, [user]);

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => setElapsed((p) => p + 100), 100);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase]);

  const startGame = useCallback((deck: Deck) => {
    const pairsNeeded = gridSize === 4 ? 8 : gridSize === 6 ? 18 : 12;
    const available = shuffle(deck.cards_json).slice(0, pairsNeeded);
    const pairs: FlipCard[] = [];
    available.forEach((card, i) => {
      pairs.push({ uniqueId: `f-${i}`, cardId: card.id, content: card.front, type: "front", matched: false, flipped: false });
      pairs.push({ uniqueId: `b-${i}`, cardId: card.id, content: card.back, type: "back", matched: false, flipped: false });
    });
    setCards(shuffle(pairs));
    setFlippedIndices([]);
    setMatchedPairs(0);
    setTotalPairs(available.length);
    setMoves(0);
    setElapsed(0);
    setSelectedDeck(deck);
    setPhase("playing");
  }, [gridSize]);

  const handleCardClick = useCallback((index: number) => {
    if (lockBoard || cards[index].matched || flippedIndices.includes(index)) return;

    const newFlipped = [...flippedIndices, index];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((m) => m + 1);
      setLockBoard(true);
      const [first, second] = newFlipped;
      const c1 = cards[first];
      const c2 = cards[second];

      if (c1.cardId === c2.cardId && c1.type !== c2.type) {
        setTimeout(() => {
          setCards((prev) => prev.map((c) =>
            c.cardId === c1.cardId ? { ...c, matched: true } : c
          ));
          setMatchedPairs((p) => {
            const next = p + 1;
            if (next >= totalPairs) {
              if (timerRef.current) clearInterval(timerRef.current);
              setTimeout(() => setPhase("finished"), 400);
            }
            return next;
          });
          setFlippedIndices([]);
          setLockBoard(false);
        }, 400);
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
          setLockBoard(false);
        }, 700);
      }
    }
  }, [cards, flippedIndices, lockBoard, totalPairs]);

  useEffect(() => {
    if (phase === "finished" && selectedDeck) {
      const key = `${selectedDeck.id}-${gridSize}`;
      const saved = localStorage.getItem("match-best-times");
      const times = saved ? JSON.parse(saved) : {};
      if (!times[key] || elapsed < times[key]) {
        times[key] = elapsed;
        localStorage.setItem("match-best-times", JSON.stringify(times));
        setBestTime(times);
      }
    }
  }, [phase, selectedDeck, gridSize, elapsed]);

  const accuracy = moves > 0 ? Math.round((totalPairs / moves) * 100) : 0;
  const cols = gridSize;

  return (
    <div style={{ minHeight: "100%", position: "relative" }}>
      <div className="os-background">
        <div className="os-orb os-orb--1" />
        <div className="os-orb os-orb--2" />
        <div className="os-orb os-orb--3" />
        <div className="os-grid" />
      </div>

      <style>{`
        @keyframes mgSlide { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes mgFlip { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(180deg); } }
        @keyframes mgMatch { 0% { transform: scale(1); } 50% { transform: scale(1.08); } 100% { transform: scale(1); } }
        @keyframes mgShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .mg-card {
          perspective: 800px; cursor: pointer; transition: transform 0.15s ease;
        }
        .mg-card:hover { transform: scale(1.03); }
        .mg-card:active { transform: scale(0.97); }
        .mg-inner {
          position: relative; width: 100%; height: 100%;
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          transform-style: preserve-3d;
        }
        .mg-inner.flipped { transform: rotateY(180deg); }
        .mg-face {
          position: absolute; inset: 0; backface-visibility: hidden;
          border-radius: 12px; display: flex; align-items: center; justify-content: center;
          padding: 8px; text-align: center;
        }
        .mg-front { background: linear-gradient(135deg, #7c3aed, #a855f7); }
        .mg-back {
          background: rgba(255,255,255,0.03); border: 1.5px solid rgba(255,255,255,0.08);
          transform: rotateY(180deg);
        }
        .mg-matched .mg-inner { transform: rotateY(180deg); }
        .mg-matched .mg-back {
          border-color: rgba(52,211,153,0.3); background: rgba(52,211,153,0.06);
          animation: mgMatch 0.4s ease;
        }
        .mg-deck-card {
          transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
        }
        .mg-deck-card:hover {
          transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.3);
          border-color: rgba(255,255,255,0.12);
        }
      `}</style>

      <div className="os-window" style={{ maxWidth: 720, margin: "0 auto" }}>
        <div className="os-window-header">
          <div className="os-window-title">
            <span className="icon">🧩</span>
            <span>Match Game</span>
          </div>
          <div className="os-window-controls">
            <button className="close" title="Close" onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase("select"); }}>✕</button>
          </div>
        </div>

        <div className="os-window-body" style={{ padding: 0, overflow: "hidden" }}>

          {/* ============ SELECT ============ */}
          {phase === "select" && (
            <div style={{ padding: "28px 28px 24px", animation: "mgSlide 0.3s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 6px 24px rgba(124,58,237,0.35)",
                }}>
                  <Layers size={26} color="#fff" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4 }}>Match Game</h2>
                <p style={{ fontSize: 13, color: "var(--os-text-dim)" }}>Match terms with their definitions</p>
              </div>

              {/* Grid Size */}
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Grid Size</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {([4, 6] as const).map((s) => (
                    <button key={s} onClick={() => setGridSize(s)}
                      style={{
                        flex: 1, padding: "10px 4px", borderRadius: 10, cursor: "pointer",
                        border: `1.5px solid ${gridSize === s ? "var(--os-accent)" : "rgba(255,255,255,0.06)"}`,
                        background: gridSize === s
                          ? "linear-gradient(180deg, rgba(109,40,217,0.25), rgba(109,40,217,0.12))"
                          : "rgba(255,255,255,0.02)",
                        color: gridSize === s ? "#fff" : "var(--os-text-dim)",
                        fontSize: 13, fontWeight: gridSize === s ? 700 : 500,
                        boxShadow: gridSize === s ? "0 2px 12px rgba(109,40,217,0.25)" : "none",
                        transition: "all 0.15s ease",
                      }}>
                      {s === 4 ? "4×4 (8 pairs)" : "6×4 (12 pairs)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Deck List */}
              {loading ? (
                <p style={{ fontSize: 13, color: "var(--os-text-dim)", textAlign: "center", padding: 20 }}>Loading decks...</p>
              ) : decks.length === 0 ? (
                <div style={{ textAlign: "center", padding: 32 }}>
                  <Layers size={28} color="var(--os-text-dim)" style={{ marginBottom: 8, opacity: 0.5 }} />
                  <p style={{ fontSize: 13, color: "var(--os-text-dim)" }}>No decks found. Create a custom deck first!</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
                  {decks.map((deck) => {
                    const key = `${deck.id}-${gridSize}`;
                    const bt = bestTime[key];
                    return (
                      <button key={deck.id} onClick={() => startGame(deck)} className="mg-deck-card"
                        style={{
                          display: "flex", alignItems: "center", gap: 14, padding: "12px 16px", borderRadius: 12,
                          border: "1.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)",
                          cursor: "pointer", textAlign: "left", width: "100%",
                        }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                          background: "rgba(109,40,217,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Layers size={16} color="#a78bfa" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deck.title}</div>
                          <div style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 2 }}>{deck.card_count} cards</div>
                        </div>
                        {bt && (
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: "#34d399", fontFamily: "monospace",
                            padding: "2px 8px", borderRadius: 6, background: "rgba(52,211,153,0.1)",
                          }}>Best: {formatTime(bt)}</span>
                        )}
                        <ChevronRight size={14} color="var(--os-text-dim)" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============ PLAYING ============ */}
          {phase === "playing" && (
            <div style={{ padding: "16px 20px 20px", animation: "mgSlide 0.2s ease" }}>
              {/* Top bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase("select"); }}
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.03)", color: "var(--os-text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 500 }}>
                  <ArrowLeft size={14} /> Exit
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "var(--os-text-dim)" }}>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    <Zap size={12} style={{ display: "inline", marginRight: 3, verticalAlign: -1 }} color="#fbbf24" />
                    {matchedPairs}/{totalPairs}
                  </span>
                  <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                    <span style={{ color: "var(--os-text-dim)" }}>{moves} moves</span>
                  </span>
                  <span style={{
                    fontFamily: "monospace", fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                    background: "rgba(96,165,250,0.1)", color: "#60a5fa",
                  }}>
                    <Clock size={11} style={{ display: "inline", marginRight: 3, verticalAlign: -1 }} />
                    {formatTime(elapsed)}
                  </span>
                </div>
              </div>

              {/* Progress */}
              <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.04)", marginBottom: 16 }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  width: `${totalPairs > 0 ? (matchedPairs / totalPairs) * 100 : 0}%`,
                  background: "linear-gradient(90deg, #7c3aed, #a855f7)",
                  transition: "width 0.3s ease",
                }} />
              </div>

              {/* Grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cols}, 1fr)`,
                gap: 8,
              }}>
                {cards.map((card, i) => {
                  const isFlipped = flippedIndices.includes(i) || card.matched;
                  const cardHeight = cols === 6 ? 70 : 85;
                  return (
                    <div key={card.uniqueId} className={`mg-card${card.matched ? " mg-matched" : ""}`}
                      onClick={() => handleCardClick(i)}
                      style={{ height: cardHeight }}>
                      <div className={`mg-inner${isFlipped ? " flipped" : ""}`}>
                        <div className="mg-face mg-front">
                          <span style={{ fontSize: 20, opacity: 0.6 }}>?</span>
                        </div>
                        <div className="mg-face mg-back" style={{
                          fontSize: cols === 6 ? 10 : 11, fontWeight: 500,
                          color: card.type === "front" ? "#a78bfa" : "#34d399",
                          lineHeight: 1.4, overflow: "hidden",
                        }}>
                          {card.content.length > (cols === 6 ? 40 : 60) ? card.content.slice(0, cols === 6 ? 40 : 60) + "..." : card.content}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============ FINISHED ============ */}
          {phase === "finished" && (
            <div style={{ padding: "28px 28px 24px", animation: "mgSlide 0.3s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", margin: "0 auto 12px",
                  background: "linear-gradient(135deg, #34d399, #22c55e)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 6px 24px rgba(52,211,153,0.35)",
                }}>
                  <Trophy size={28} color="#fff" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4 }}>
                  {accuracy >= 80 ? "Perfect Memory!" : accuracy >= 50 ? "Great Match!" : "Keep Practicing!"}
                </h2>
                <p style={{ fontSize: 12, color: "var(--os-text-dim)" }}>{selectedDeck?.title}</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 24 }}>
                {[
                  { label: "Time", value: formatTime(elapsed), color: "#60a5fa" },
                  { label: "Moves", value: `${moves}`, color: "#a78bfa" },
                  { label: "Accuracy", value: `${accuracy}%`, color: "#34d399" },
                ].map((s) => (
                  <div key={s.label} style={{
                    padding: "14px 10px", borderRadius: 12, textAlign: "center",
                    background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
                    <div style={{ fontSize: 9, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3, fontWeight: 600 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => selectedDeck && startGame(selectedDeck)}
                  style={{
                    flex: 1, padding: "12px 16px", borderRadius: 12, border: "none", cursor: "pointer",
                    background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff",
                    fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                    boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
                  }}>
                  <RotateCcw size={15} /> Play Again
                </button>
                <button onClick={() => setPhase("select")}
                  style={{
                    flex: 1, padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)",
                    cursor: "pointer", background: "rgba(255,255,255,0.04)", color: "var(--os-text-secondary)",
                    fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  }}>
                  <Shuffle size={15} /> New Deck
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "block" };
