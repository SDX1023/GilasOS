// app/decks/[deckId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface DeckData {
  id: string;
  title: string;
  description: string;
  card_count: number;
}

interface CardData {
  front: string;
  back: string;
  hint: string;
}

export default function DeckStudyPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [deck, setDeck] = useState<DeckData | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const supabase = getSupabase();
        
        // Fetch deck
        const { data: deckData, error: deckError } = await supabase
          .from("custom_decks")
          .select("*")
          .eq("id", deckId)
          .eq("user_id", user.id)
          .maybeSingle();

        if (deckError || !deckData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setDeck(deckData);

        // Fetch cards
        const { data: cardsData } = await supabase
          .from("custom_deck_cards")
          .select("front, back, hint")
          .eq("deck_id", deckId)
          .order("sort_order", { ascending: true });

        const cardsList = cardsData || [];
        setCards(cardsList);

        // Redirect to the existing flashcard study page
        // Format: /flashcards/[courseSlug]/[moduleSlug]/[reviewerSlug]
        // We need to extract the parts from the deck ID
        // deckId format: "My Decks/shared/el-fili-1st-term-exam"
        const parts = deckId.split('/');
        const courseSlug = parts[0] || "My Decks";
        const moduleSlug = parts[1] || "shared";
        const reviewerSlug = parts.slice(2).join('/') || deckId;

        // Also save to localStorage for the flashcard page to read
        const studyData = {
          id: deckData.id,
          title: deckData.title,
          cards: cardsList.map(c => ({
            front: c.front,
            back: c.back,
            hint: c.hint || ""
          }))
        };
        localStorage.setItem("current_study_deck", JSON.stringify(studyData));

        // Redirect to the existing flashcard page
        router.push(`/flashcards/${encodeURIComponent(courseSlug)}/${encodeURIComponent(moduleSlug)}/${encodeURIComponent(reviewerSlug)}`);

      } catch (error) {
        console.error("Error loading deck:", error);
        setNotFound(true);
        setLoading(false);
      }
    })();
  }, [deckId, user, router]);

  if (!user) {
    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <p className="text-secondary text-sm">Please log in to study.</p>
      </div>
    );
  }

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
          <p className="text-secondary text-sm">Deck not found.</p>
          <Link href="/decks" className="glass-btn glass-btn-ghost" style={{ marginTop: 12 }}>
            <ArrowLeft size={14} /> Back to My Decks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Link href="/decks" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--os-text-dim)", textDecoration: "none", marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to My Decks
      </Link>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4 }}>{deck.title}</h1>
        <p style={{ fontSize: 13, color: "var(--os-text-dim)" }}>{cards.length} cards</p>
        {deck.description && <p style={{ fontSize: 13, color: "var(--os-text-dim)", marginTop: 4 }}>{deck.description}</p>}
      </div>

      <div className="glass-card" style={{ padding: 20, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "var(--os-text-primary)", marginBottom: 16 }}>Ready to study {cards.length} cards?</p>
        <button
          onClick={() => {
            // Redirect to the existing flashcard page
            const parts = deck.id.split('/');
            const courseSlug = parts[0] || "My Decks";
            const moduleSlug = parts[1] || "shared";
            const reviewerSlug = parts.slice(2).join('/') || deck.id;
            
            router.push(`/flashcards/${encodeURIComponent(courseSlug)}/${encodeURIComponent(moduleSlug)}/${encodeURIComponent(reviewerSlug)}`);
          }}
          className="glass-btn glass-btn-primary"
          style={{ padding: "10px 24px", fontSize: 14 }}
        >
          Start Studying
        </button>
      </div>
    </div>
  );
}