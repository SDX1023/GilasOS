"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { getSupabase } from "@/lib/supabase";
import { User, Music, ArrowLeft, BookOpen, ChevronRight } from "lucide-react";
import Link from "next/link";

interface SharedDeckData {
  id: string;
  user_id: string;
  title: string;
  card_count: number;
  course_id: string;
  created_at: string;
}

interface DeckCard {
  front: string;
  back: string;
  hint: string;
}

interface CreatorProfile {
  username: string;
  avatar_url: string;
  bio: string;
  mood_text: string;
  mood_emoji: string;
}

export default function SharedDeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);
  const [deck, setDeck] = useState<SharedDeckData | null>(null);
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data: sharedDeck } = await supabase.from("shared_decks").select("*").eq("id", deckId).maybeSingle();
      if (!sharedDeck) { setNotFound(true); setLoading(false); return; }
      setDeck(sharedDeck);

      const { data: flashcards } = await supabase.from("flashcards").select("front, back, hint").eq("reviewer_id", sharedDeck.reviewer_id).order("sort_order");
      if (flashcards) setCards(flashcards.map((c: any) => ({ front: c.front, back: c.back, hint: c.hint || "" })));

      const { data: profile } = await supabase.from("user_profiles").select("username, avatar_url, bio, mood_text, mood_emoji").eq("user_id", sharedDeck.user_id).maybeSingle();
      if (profile) setCreator(profile);

      setLoading(false);
    })();
  }, [deckId]);

  if (loading) {
    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <p className="text-secondary text-sm">Loading deck...</p>
      </div>
    );
  }

  if (notFound || !deck) {
    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <p className="text-secondary text-sm">Shared deck not found.</p>
          <Link href="/shared" className="glass-btn glass-btn-ghost" style={{ marginTop: 12 }}>
            <ArrowLeft size={14} /> Back to Shared Decks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Link href="/shared" style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13,
        color: "var(--os-text-dim)", textDecoration: "none", marginBottom: 24,
      }}>
        <ArrowLeft size={14} /> Back to Shared Decks
      </Link>

      {/* Deck Header */}
      <div className="glass-panel" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4 }}>{deck.title}</h1>
            <p style={{ fontSize: 13, color: "var(--os-text-dim)" }}>{cards.length} cards</p>
          </div>
        </div>

        {/* Creator Info */}
        {creator && (
          <Link href={`/profile/${deck.user_id}`} style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12,
            background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
            textDecoration: "none", transition: "background 0.15s",
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0,
              border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <User size={18} style={{ color: "var(--os-text-dim)" }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, color: "var(--os-text-primary)", fontSize: 14 }}>{creator.username}</p>
              {creator.bio && <p style={{ fontSize: 12, color: "var(--os-text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{creator.bio}</p>}
            </div>
            {(creator.mood_emoji || creator.mood_text) && (
              <span style={{ fontSize: 13, color: "var(--os-text-secondary)", flexShrink: 0 }}>
                {creator.mood_emoji} {creator.mood_text}
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {cards.map((card, i) => (
          <div
            key={i}
            onClick={() => setFlippedIndex(flippedIndex === i ? null : i)}
            className="glass-card"
            style={{ padding: 16, cursor: "pointer", transition: "all 0.2s" }}
          >
            <p style={{ fontWeight: 500, color: "var(--os-text-primary)", marginBottom: flippedIndex === i ? 12 : 0 }}>{card.front}</p>
            {flippedIndex === i && (
              <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 13, color: "var(--os-text-secondary)", lineHeight: 1.5 }}>{card.back}</p>
                {card.hint && (
                  <p style={{ fontSize: 12, color: "var(--os-text-dim)", marginTop: 8, fontStyle: "italic" }}>Hint: {card.hint}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
