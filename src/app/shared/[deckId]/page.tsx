"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { saveReviewerToSupabase } from "@/lib/custom-content";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { User, ArrowLeft, BookOpen, Save, Check, Trash2, ChevronDown, ChevronRight, FolderOpen } from "lucide-react";
import Link from "next/link";

interface DeckCard {
  front: string;
  back: string;
  hint: string;
}

interface CategoryDeck {
  title: string;
  cards: DeckCard[];
}

interface SharedDeckData {
  id: string;
  user_id: string;
  title: string;
  card_count: number;
  course_id: string;
  module_id: string;
  reviewer_id: string;
  created_at: string;
  cards_json: any;
  shared_with_user_id: string | null;
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
  const [categoryDecks, setCategoryDecks] = useState<CategoryDeck[]>([]);
  const [isCategory, setIsCategory] = useState(false);
  const [categoryTitle, setCategoryTitle] = useState("");
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingAll, setSavingAll] = useState(false);
  const [savedAll, setSavedAll] = useState(false);
  const [savedDecks, setSavedDecks] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedDecks, setExpandedDecks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const supabase = getSupabase();
      const { data: sharedDeck, error } = await supabase
        .from("shared_decks")
        .select("id, user_id, title, card_count, course_id, module_id, reviewer_id, created_at, cards_json, shared_with_user_id")
        .eq("id", deckId)
        .maybeSingle();

      if (error || !sharedDeck) { setNotFound(true); setLoading(false); return; }

      if (sharedDeck.shared_with_user_id && sharedDeck.shared_with_user_id !== user?.id && sharedDeck.user_id !== user?.id) {
        setNotFound(true); setLoading(false); return;
      }

      setDeck(sharedDeck);

      let rawJson = sharedDeck.cards_json;
      if (typeof rawJson === "string") { try { rawJson = JSON.parse(rawJson); } catch { rawJson = null; } }

      if (rawJson && typeof rawJson === "object" && !Array.isArray(rawJson) && rawJson.is_category) {
        setIsCategory(true);
        setCategoryTitle(rawJson.category_title || sharedDeck.title);
        const decks: CategoryDeck[] = (rawJson.decks || []).map((d: any) => ({
          title: d.title || "Untitled",
          cards: (d.cards || []).map((c: any) => ({ front: String(c.front || ""), back: String(c.back || ""), hint: String(c.hint || "") })),
        }));
        setCategoryDecks(decks);
      } else if (rawJson && Array.isArray(rawJson) && rawJson.length > 0) {
        setCards(rawJson.map((c: any) => ({ front: String(c.front || ""), back: String(c.back || ""), hint: String(c.hint || "") })));
      } else if (sharedDeck.reviewer_id && !sharedDeck.reviewer_id.startsWith("__category__")) {
        const { data: flashcards } = await supabase.from("flashcards").select("front, back, hint").eq("reviewer_id", sharedDeck.reviewer_id);
        if (flashcards && flashcards.length > 0) {
          setCards(flashcards.map((c: any) => ({ front: c.front, back: c.back, hint: c.hint || "" })));
        }
      }

      const { data: profile } = await supabase.from("user_profiles").select("username, avatar_url, bio, mood_text").eq("user_id", sharedDeck.user_id).maybeSingle();
      if (profile) setCreator(profile);
      setLoading(false);
    })();
  }, [deckId, user]);

  const handleSave = async () => {
    if (!user || !deck) return;
    setSaving(true);
    try {
      const reviewer = {
        id: deck.reviewer_id || deck.id,
        courseId: deck.course_id || "My Decks",
        moduleId: deck.module_id || "shared",
        title: deck.title,
        cards: cards.map((c) => ({ front: c.front, back: c.back, hint: c.hint || "" })),
      };
      const result = await saveReviewerToSupabase(reviewer.courseId, reviewer.moduleId, reviewer);
      setSaved(true);
      window.dispatchEvent(new CustomEvent("decksUpdated"));
      setTimeout(() => { router.push(`/flashcards/${result.deckId}`); }, 800);
    } catch (error) {
      console.error("Error saving deck:", error);
    } finally { setSaving(false); }
  };

  const handleSaveAll = async () => {
    if (!user || !deck || !isCategory) return;
    setSavingAll(true);
    try {
      const supabase = getSupabase();
      const { data: existingCourse } = await supabase.from("deck_courses").select("id").eq("user_id", user.id).eq("title", categoryTitle).maybeSingle();
      let courseId = existingCourse?.id;
      if (!courseId) {
        const { data: newCourse } = await supabase.from("deck_courses").insert({ user_id: user.id, title: categoryTitle }).select("id").single();
        courseId = newCourse?.id;
      }
      for (const d of categoryDecks) {
        await saveReviewerToSupabase(courseId || "", "custom", { title: d.title, cards: d.cards });
      }
      setSavedAll(true);
      window.dispatchEvent(new CustomEvent("decksUpdated"));
    } catch (error) {
      console.error("Error saving category:", error);
    } finally { setSavingAll(false); }
  };

  const handleSaveIndividual = async (deckIndex: number) => {
    if (!user || !deck || !isCategory) return;
    const d = categoryDecks[deckIndex];
    const supabase = getSupabase();
    const { data: existingCourse } = await supabase.from("deck_courses").select("id").eq("user_id", user.id).eq("title", categoryTitle).maybeSingle();
    let courseId = existingCourse?.id;
    if (!courseId) {
      const { data: newCourse } = await supabase.from("deck_courses").insert({ user_id: user.id, title: categoryTitle }).select("id").single();
      courseId = newCourse?.id;
    }
    await saveReviewerToSupabase(courseId || "", "custom", { title: d.title, cards: d.cards });
    setSavedDecks((prev) => new Set(prev).add(deckIndex));
    window.dispatchEvent(new CustomEvent("decksUpdated"));
  };

  const handleDelete = async () => {
    if (!user || !deck || deck.user_id !== user.id) return;
    setDeleting(true);
    const supabase = getSupabase();
    await supabase.from("shared_decks").delete().eq("id", deck.id).eq("user_id", user.id);
    router.push("/shared");
  };

  const toggleDeck = (i: number) => setExpandedDecks((prev) => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; });

  if (!user) {
    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <p className="text-secondary text-sm">Log in to view shared decks.</p>
          <Link href="/login" className="glass-btn glass-btn-primary" style={{ marginTop: 12 }}>Log In</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="page-container" style={{ maxWidth: 700 }}><p className="text-secondary text-sm">Loading deck...</p></div>;
  if (notFound || !deck) {
    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <div className="empty-state">
          <div className="empty-state-icon"><BookOpen size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <p className="text-secondary text-sm">Shared deck not found.</p>
          <Link href="/shared" className="glass-btn glass-btn-ghost" style={{ marginTop: 12 }}><ArrowLeft size={14} /> Back to Shared Decks</Link>
        </div>
      </div>
    );
  }

  const totalCategoryCards = categoryDecks.reduce((sum, d) => sum + d.cards.length, 0);

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <ConfirmDialog open={showDeleteConfirm} title="Delete Shared Deck?" message="This will permanently delete this shared deck." confirmLabel="Delete" danger onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />
      <Link href="/shared" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--os-text-dim)", textDecoration: "none", marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to Shared Decks
      </Link>

      <div className="glass-panel" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              {isCategory && <FolderOpen size={22} style={{ color: "var(--os-accent)" }} />}
              {isCategory ? categoryTitle : deck.title}
            </h1>
            <p style={{ fontSize: 13, color: "var(--os-text-dim)" }}>
              {isCategory ? `${categoryDecks.length} decks · ${totalCategoryCards} cards` : `${cards.length} cards`}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {user.id === deck.user_id && (
              <button onClick={() => setShowDeleteConfirm(true)} disabled={deleting} className="glass-btn" style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(239,68,68,0.1)", color: "#ef4444", borderColor: "rgba(239,68,68,0.2)" }}>
                <Trash2 size={14} /> {deleting ? "Deleting..." : "Delete"}
              </button>
            )}
            {isCategory ? (
              <button onClick={handleSaveAll} disabled={savingAll || savedAll} className="glass-btn" style={{ display: "flex", alignItems: "center", gap: 6, ...(savedAll ? { background: "rgba(34,197,94,0.1)", color: "#22c55e", borderColor: "rgba(34,197,94,0.3)" } : {}) }}>
                {savedAll ? <Check size={14} /> : <Save size={14} />} {savingAll ? "Saving..." : savedAll ? "All Saved!" : "Save All"}
              </button>
            ) : (
              <button onClick={handleSave} disabled={saving || saved} className="glass-btn" style={{ display: "flex", alignItems: "center", gap: 6, ...(saved ? { background: "rgba(34,197,94,0.1)", color: "#22c55e", borderColor: "rgba(34,197,94,0.3)" } : {}) }}>
                {saved ? <Check size={14} /> : <Save size={14} />} {saving ? "Saving..." : saved ? "Saved!" : "Save to My Decks"}
              </button>
            )}
          </div>
        </div>

        {creator && (
          <Link href={`/profile/${deck.user_id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.35)", textDecoration: "none" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {creator.avatar_url ? <img src={creator.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={18} style={{ color: "var(--os-text-dim)" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, color: "var(--os-text-primary)", fontSize: 14 }}>{creator.username}</p>
              {creator.bio && <p style={{ fontSize: 12, color: "var(--os-text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{creator.bio}</p>}
            </div>
          </Link>
        )}
      </div>

      {isCategory ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {categoryDecks.map((d, i) => {
            const expanded = expandedDecks.has(i);
            const deckSaved = savedDecks.has(i);
            return (
              <div key={i} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer" }} onClick={() => toggleDeck(i)}>
                  {expanded ? <ChevronDown size={16} style={{ color: "var(--os-accent)", flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 500, fontSize: 14, color: "var(--os-text-primary)" }}>{d.title}</span>
                    <span className="text-xs" style={{ color: "var(--os-text-dim)", marginLeft: 8 }}>{d.cards.length} cards</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleSaveIndividual(i); }}
                    disabled={deckSaved}
                    className="glass-btn"
                    style={{ padding: "4px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, flexShrink: 0, ...(deckSaved ? { background: "rgba(34,197,94,0.1)", color: "#22c55e", borderColor: "rgba(34,197,94,0.3)" } : {}) }}
                  >
                    {deckSaved ? <Check size={12} /> : <Save size={12} />} {deckSaved ? "Saved" : "Save"}
                  </button>
                </div>
                {expanded && (
                  <div style={{ padding: "0 16px 12px 42px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {d.cards.map((card, ci) => (
                      <div key={ci} className="glass-card" style={{ padding: 12 }}>
                        <p style={{ fontWeight: 500, fontSize: 13 }}>{card.front}</p>
                        <p style={{ fontSize: 12, color: "var(--os-text-secondary)", marginTop: 4 }}>{card.back}</p>
                        {card.hint && <p style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 4, fontStyle: "italic" }}>Hint: {card.hint}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : cards.length === 0 ? (
        <div className="empty-state"><p className="text-secondary text-sm">No cards in this deck.</p></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cards.map((card, i) => (
            <div key={i} onClick={() => setFlippedIndex(flippedIndex === i ? null : i)} className="glass-card" style={{ padding: 16, cursor: "pointer" }}>
              <p style={{ fontWeight: 500, color: "var(--os-text-primary)", marginBottom: flippedIndex === i ? 12 : 0 }}>{card.front}</p>
              {flippedIndex === i && (
                <div style={{ paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.35)" }}>
                  <p style={{ fontSize: 13, color: "var(--os-text-secondary)", lineHeight: 1.5 }}>{card.back}</p>
                  {card.hint && <p style={{ fontSize: 12, color: "var(--os-text-dim)", marginTop: 8, fontStyle: "italic" }}>Hint: {card.hint}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
