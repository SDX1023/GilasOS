// app/shared/page.tsx

"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Link as LinkIcon, User, BookOpen, ChevronRight, Trash2, Send, Inbox } from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface SharedDeck {
  id: string;
  user_id: string;
  title: string;
  card_count: number;
  course_id: string;
  created_at: string;
  username: string;
  avatar_url: string;
}

export default function SharedDecksPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<SharedDeck[]>([]);
  const [sentDecks, setSentDecks] = useState<SharedDeck[]>([]);
  const [tab, setTab] = useState<"received" | "sent">("received");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDelete = async (deckId: string) => {
    if (!user) return;
    setDeleting(deckId);
    const supabase = getSupabase();
    await supabase.from("shared_decks").delete().eq("id", deckId).eq("user_id", user.id);
    setDecks((prev) => prev.filter((d) => d.id !== deckId));
    setSentDecks((prev) => prev.filter((d) => d.id !== deckId));
    setDeleting(null);
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      try {
        const supabase = getSupabase();

        const { data: received, error: recvErr } = await supabase
          .from("shared_decks")
          .select("*")
          .or(`shared_with_user_id.is.null,shared_with_user_id.eq.${user.id}`)
          .neq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!recvErr && received) {
          const userIds = [...new Set(received.map((d: any) => d.user_id))];
          const { data: profiles } = await supabase.from("user_profiles").select("user_id, username, avatar_url").in("user_id", userIds);
          const profileMap: Record<string, { username: string; avatar_url: string }> = {};
          if (profiles) profiles.forEach((p: any) => { profileMap[p.user_id] = { username: p.username || "Unknown", avatar_url: p.avatar_url || "" }; });
          setDecks(received.map((d: any) => ({ ...d, username: profileMap[d.user_id]?.username || "Unknown", avatar_url: profileMap[d.user_id]?.avatar_url || "" })));
        }

        const { data: sent, error: sentErr } = await supabase
          .from("shared_decks")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!sentErr && sent) {
          const sharedWithIds = [...new Set(sent.filter((d: any) => d.shared_with_user_id).map((d: any) => d.shared_with_user_id))];
          const { data: recipients } = sharedWithIds.length > 0
            ? await supabase.from("user_profiles").select("user_id, username").in("user_id", sharedWithIds)
            : { data: [] };
          const recipMap: Record<string, string> = {};
          if (recipients) recipients.forEach((p: any) => { recipMap[p.user_id] = p.username || "Unknown"; });
          setSentDecks(sent.map((d: any) => ({
            ...d,
            username: recipMap[d.shared_with_user_id] || "Anyone with link",
            avatar_url: "",
          })));
        }
      } catch (error) {
        console.error("Error loading shared decks:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) {
    return (
      <div className="page-container" style={{ maxWidth: 640 }}>
        <div className="empty-state">
          <div className="empty-state-icon"><LinkIcon size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <p className="text-secondary text-sm">Log in to view shared decks.</p>
          <Link href="/login" className="glass-btn glass-btn-primary" style={{ marginTop: 12 }}>Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <ConfirmDialog open={!!confirmDeleteId} title="Delete Shared Deck?" message="This will permanently delete this shared deck." confirmLabel="Delete" danger onConfirm={() => { if (confirmDeleteId) { handleDelete(confirmDeleteId); setConfirmDeleteId(null); } }} onCancel={() => setConfirmDeleteId(null)} />
      <div style={{ marginBottom: 32 }}>
        <h1 className="page-title"><LinkIcon size={28} /> Shared Decks</h1>
        <p className="page-subtitle">Flashcard decks shared by the community</p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <button onClick={() => setTab("received")} className="glass-btn" style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, background: tab === "received" ? "rgba(109,40,217,0.2)" : "rgba(0,0,0,0.15)", border: tab === "received" ? "1px solid var(--os-accent)" : "1px solid var(--os-glass-border)", color: tab === "received" ? "var(--os-accent)" : "var(--os-text-secondary)" }}>
          <Inbox size={14} /> Shared with me
        </button>
        <button onClick={() => setTab("sent")} className="glass-btn" style={{ padding: "8px 14px", fontSize: 13, display: "flex", alignItems: "center", gap: 6, background: tab === "sent" ? "rgba(109,40,217,0.2)" : "rgba(0,0,0,0.15)", border: tab === "sent" ? "1px solid var(--os-accent)" : "1px solid var(--os-glass-border)", color: tab === "sent" ? "var(--os-accent)" : "var(--os-text-secondary)" }}>
          <Send size={14} /> Shared by me
        </button>
      </div>

        {loading ? (
        <p className="text-secondary text-sm">Loading shared decks...</p>
      ) : (tab === "received" ? decks : sentDecks).length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><LinkIcon size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <p className="text-secondary text-sm">
            {tab === "received" ? "No shared decks yet. Share a deck from the flashcard study page!" : "You haven't shared any decks yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(tab === "received" ? decks : sentDecks).map((deck) => (
            <Link key={deck.id} href={`/shared/${deck.id}`} style={{ textDecoration: "none" }}>
              <div className="glass-card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {tab === "sent" ? <Send size={18} style={{ color: "var(--os-accent)" }} /> : deck.avatar_url ? <img src={deck.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={20} style={{ color: "var(--os-text-dim)" }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontWeight: 500, color: "var(--os-text-primary)", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deck.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "var(--os-text-dim)" }}>
                    {tab === "sent" ? (
                      <>
                        <span>Shared with <strong style={{ color: "var(--os-text-primary)" }}>{deck.username}</strong></span>
                        <span>{deck.card_count} cards</span>
                      </>
                    ) : (
                      <>
                        <span>{deck.username}</span>
                        <span>{deck.card_count} cards</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight size={16} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />
                {user && user.id === deck.user_id && (
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDeleteId(deck.id); }}
                    disabled={deleting === deck.id}
                    style={{ padding: 6, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", cursor: deleting === deck.id ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: deleting === deck.id ? 0.5 : 1 }}
                    title="Delete shared deck"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}