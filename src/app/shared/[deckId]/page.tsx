// app/shared/[deckId]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { saveReviewerToSupabase } from "@/lib/custom-content";
import { User, ArrowLeft, BookOpen, Save, Check, Trash2 } from "lucide-react";
import Link from "next/link";

interface SharedDeckData {
  id: string;
  user_id: string;
  title: string;
  card_count: number;
  course_id: string;
  module_id: string;
  reviewer_id: string;
  created_at: string;
  cards_json: { front: string; back: string; hint: string }[] | null;
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
}

export default function SharedDeckPage({ params }: { params: Promise<{ deckId: string }> }) {
  const { deckId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [deck, setDeck] = useState<SharedDeckData | null>(null);
  const [cards, setCards] = useState<DeckCard[]>([]);
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      const supabase = getSupabase();
      const { data: sharedDeck, error } = await supabase
        .from("shared_decks")
        .select("id, user_id, title, card_count, course_id, module_id, reviewer_id, created_at, cards_json, shared_with_user_id")
        .eq("id", deckId)
        .maybeSingle();

      if (error || !sharedDeck) {
        console.error("Shared deck fetch error:", error);
        setNotFound(true);
        setLoading(false);
        return;
      }

      console.log("Shared deck loaded:", sharedDeck.id, "cards_json type:", typeof sharedDeck.cards_json, "cards_json:", sharedDeck.cards_json);
      
      if (
        sharedDeck.shared_with_user_id &&
        sharedDeck.shared_with_user_id !== user?.id &&
        sharedDeck.user_id !== user?.id
      ) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      
      setDeck(sharedDeck);

      let loadedCards: DeckCard[] = [];

      let rawJson = sharedDeck.cards_json;
      if (typeof rawJson === "string") {
        try { rawJson = JSON.parse(rawJson); } catch { rawJson = null; }
      }
      if (rawJson && Array.isArray(rawJson) && rawJson.length > 0) {
        loadedCards = rawJson.map((c: any) => ({
          front: String(c.front || ""),
          back: String(c.back || ""),
          hint: String(c.hint || ""),
        }));
      } else if (sharedDeck.reviewer_id) {
        const { data: flashcards } = await supabase
          .from("flashcards")
          .select("front, back, hint")
          .eq("reviewer_id", sharedDeck.reviewer_id);

        if (flashcards && flashcards.length > 0) {
          loadedCards = flashcards.map((c: any) => ({
            front: c.front,
            back: c.back,
            hint: c.hint || "",
          }));
        } else {
          const stored = localStorage.getItem("gilasos_custom_content");
          if (stored) {
            try {
              const store = JSON.parse(stored);
              for (const c of store.courses || []) {
                for (const m of c.modules || []) {
                  const r = m.reviewers?.find((r: any) => r.id === sharedDeck.reviewer_id);
                  if (r && r.cards) {
                    loadedCards = r.cards.map((c: any) => ({
                      front: c.front,
                      back: c.back,
                      hint: c.hint || "",
                    }));
                    break;
                  }
                }
              }
            } catch {}
          }
        }
      }

      setCards(loadedCards);

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("username, avatar_url, bio, mood_text")
        .eq("user_id", sharedDeck.user_id)
        .maybeSingle();
      
      if (profile) setCreator(profile);

      setLoading(false);
    })();
  }, [deckId, user]);

  const handleSave = async () => {
    if (!user || !deck) return;
    setSaving(true);
    try {
      console.log("=== SAVING TO MY DECKS ===");
      console.log("Deck:", deck);
      console.log("Cards to save:", cards.length);
      
      const reviewer = {
        id: deck.id,
        courseId: deck.course_id || "My Decks",
        moduleId: deck.module_id || "shared",
        title: deck.title,
        cards: cards.map((c) => ({
          front: c.front,
          back: c.back,
          hint: c.hint || "",
        })),
      };

      console.log("Reviewer object:", reviewer);

      const result = await saveReviewerToSupabase(reviewer.courseId, reviewer.moduleId, reviewer);
      console.log("Save result:", result);
      
      setSaved(true);

      window.dispatchEvent(new CustomEvent("decksUpdated"));

      // Redirect to Study page with the deck ID
      setTimeout(() => {
        router.push(`/study?deck=${encodeURIComponent(deck.id)}`);
      }, 800);
    } catch (error) {
      console.error("Error saving deck:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!user || !deck || deck.user_id !== user.id || !confirm("Delete this shared deck?")) return;
    setDeleting(true);
    const supabase = getSupabase();
    await supabase.from("shared_decks").delete().eq("id", deck.id).eq("user_id", user.id);
    router.push("/shared");
  };

  if (!user) {
    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <div className="empty-state">
          <div className="empty-state-icon">
            <BookOpen size={32} style={{ color: "var(--os-text-dim)" }} />
          </div>
          <p className="text-secondary text-sm">Log in to view shared decks.</p>
          <Link href="/login" className="glass-btn glass-btn-primary" style={{ marginTop: 12 }}>
            Log In
          </Link>
        </div>
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
          <div className="empty-state-icon">
            <BookOpen size={32} style={{ color: "var(--os-text-dim)" }} />
          </div>
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
      <Link
        href="/shared"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 13,
          color: "var(--os-text-dim)",
          textDecoration: "none",
          marginBottom: 24,
        }}
      >
        <ArrowLeft size={14} /> Back to Shared Decks
      </Link>

      <div className="glass-panel" style={{ padding: 24, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--os-text-primary)",
                marginBottom: 4,
              }}
            >
              {deck.title}
            </h1>
            <p style={{ fontSize: 13, color: "var(--os-text-dim)" }}>{cards.length} cards</p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {user && user.id === deck.user_id && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="glass-btn"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(239,68,68,0.1)",
                  color: "#ef4444",
                  borderColor: "rgba(239,68,68,0.2)",
                }}
              >
                <Trash2 size={14} /> {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="glass-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                ...(saved
                  ? {
                      background: "rgba(34,197,94,0.1)",
                      color: "#22c55e",
                      borderColor: "rgba(34,197,94,0.3)",
                    }
                  : {}),
              }}
            >
              {saved ? <Check size={14} /> : <Save size={14} />}{" "}
              {saving ? "Saving..." : saved ? "Saved!" : "Save to My Decks"}
            </button>
          </div>
        </div>

        {creator && (
          <Link
            href={`/profile/${deck.user_id}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.35)",
              textDecoration: "none",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {creator.avatar_url ? (
                <img
                  src={creator.avatar_url}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <User size={18} style={{ color: "var(--os-text-dim)" }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, color: "var(--os-text-primary)", fontSize: 14 }}>
                {creator.username}
              </p>
              {creator.bio && (
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--os-text-dim)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {creator.bio}
                </p>
              )}
            </div>
            {creator.mood_text && (
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                {creator.mood_text
                  .split(" | ")
                  .map((m: string) => m.trim())
                  .filter(Boolean)
                  .slice(0, 3)
                  .map((mood: string, i: number) => (
                    <span
                      key={i}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 500,
                        background: "rgba(109,40,217,0.1)",
                        color: "var(--os-accent)",
                      }}
                    >
                      {mood}
                    </span>
                  ))}
              </div>
            )}
          </Link>
        )}
      </div>

      {cards.length === 0 ? (
        <div className="empty-state">
          <p className="text-secondary text-sm">No cards in this deck.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cards.map((card, i) => (
            <div
              key={i}
              onClick={() => setFlippedIndex(flippedIndex === i ? null : i)}
              className="glass-card"
              style={{ padding: 16, cursor: "pointer" }}
            >
              <p
                style={{
                  fontWeight: 500,
                  color: "var(--os-text-primary)",
                  marginBottom: flippedIndex === i ? 12 : 0,
                }}
              >
                {card.front}
              </p>
              {flippedIndex === i && (
                <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.35)" }}>
                  <p style={{ fontSize: 13, color: "var(--os-text-secondary)", lineHeight: 1.5 }}>
                    {card.back}
                  </p>
                  {card.hint && (
                    <p
                      style={{
                        fontSize: 12,
                        color: "var(--os-text-dim)",
                        marginTop: 8,
                        fontStyle: "italic",
                      }}
                    >
                      Hint: {card.hint}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}