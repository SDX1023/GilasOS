"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Target, AlertTriangle, BookOpen } from "lucide-react";
import { loadWeakCards } from "@/lib/user-data";
import { getSupabase } from "@/lib/supabase";

interface DeckWithWeak {
  deck_id: string;
  deck_title: string;
  weak_count: number;
  total_forgot: number;
  total_known: number;
}

export function CramTab({ userId }: { userId: string }) {
  const [decks, setDecks] = useState<DeckWithWeak[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const weak = await loadWeakCards(userId);
      if (weak.length === 0) { setLoading(false); return; }

      const deckMap = new Map<string, DeckWithWeak>();
      for (const card of weak) {
        const id = card.deck_id;
        if (!deckMap.has(id)) {
          deckMap.set(id, { deck_id: id, deck_title: "", weak_count: 0, total_forgot: 0, total_known: 0 });
        }
        const d = deckMap.get(id)!;
        d.weak_count++;
        d.total_forgot += card.forgot + card.dont_know;
        d.total_known += card.known;
      }

      const supabase = getSupabase();
      const deckIds = Array.from(deckMap.keys());
      const { data: deckRows } = await supabase.from("custom_decks").select("id, title").in("id", deckIds);
      if (deckRows) {
        for (const row of deckRows) {
          const d = deckMap.get(row.id);
          if (d) d.deck_title = row.title;
        }
      }

      setDecks(Array.from(deckMap.values()).sort((a, b) => b.weak_count - a.weak_count));
      setLoading(false);
    }
    load();
  }, [userId]);

  if (loading) {
    return <p className="text-secondary" style={{ textAlign: "center", padding: "2rem" }}>Loading weak cards...</p>;
  }

  if (decks.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(34,197,94,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <BookOpen size={28} style={{ color: "#22c55e" }} />
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--os-text-primary)", marginBottom: 4 }}>No weak cards</h3>
        <p className="text-sm text-secondary">Start reviewing decks to build your card performance data.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>
        {decks.length} deck{decks.length !== 1 ? "s" : ""} with weak cards — focus on what you keep getting wrong
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {decks.map((deck) => (
          <Link
            key={deck.deck_id}
            href={`/decks/${deck.deck_id}?cram=true`}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "12px 16px",
              borderRadius: 12, background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(239,68,68,0.2)", textDecoration: "none",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(239,68,68,0.06)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
          >
            <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(239,68,68,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Target size={20} style={{ color: "#f87171" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {deck.deck_title || "Untitled Deck"}
              </p>
              <p className="text-xs text-secondary">
                {deck.weak_count} weak card{deck.weak_count !== 1 ? "s" : ""} · {deck.total_forgot} wrong / {deck.total_known} correct
              </p>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#f87171", background: "rgba(239,68,68,0.1)", padding: "4px 10px", borderRadius: 8 }}>
              Cram
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
