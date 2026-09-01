"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Layers, Plus, Trash2, Pencil, Check, X, Play, Search } from "lucide-react";

interface CustomDeck {
  id: string;
  title: string;
  description: string;
  card_count: number;
  created_at: string;
}

export default function DecksPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<CustomDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchDecks();
  }, [user]);

  const fetchDecks = async () => {
    if (!user) return;
    const supabase = getSupabase();
    const { data } = await supabase.from("custom_decks").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    setDecks(data || []);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !user) return;
    const supabase = getSupabase();
    const { data } = await supabase.from("custom_decks").insert({
      user_id: user.id,
      title: newTitle.trim(),
      description: newDesc.trim(),
      card_count: 0,
    }).select().single();
    if (data) setDecks([data, ...decks]);
    setNewTitle(""); setNewDesc(""); setCreating(false);
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return;
    const supabase = getSupabase();
    await supabase.from("custom_decks").update({ title: editTitle.trim(), description: editDesc.trim(), updated_at: new Date().toISOString() }).eq("id", id);
    setDecks(decks.map(d => d.id === id ? { ...d, title: editTitle.trim(), description: editDesc.trim() } : d));
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this deck and all its cards?")) return;
    const supabase = getSupabase();
    await supabase.from("custom_deck_cards").delete().eq("deck_id", id);
    await supabase.from("custom_decks").delete().eq("id", id);
    setDecks(decks.filter(d => d.id !== id));
  };

  const filtered = decks.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon"><Layers size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>My Decks</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>Sign in to create and study custom flashcard decks</p>
          <Link href="/login" className="glass-btn glass-btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 className="page-title"><Layers size={28} /> My Decks</h1>
            <p className="page-subtitle">Custom flashcard decks outside of subjects</p>
          </div>
          {!creating && (
            <button onClick={() => setCreating(true)} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
              <Plus size={15} /> New Deck
            </button>
          )}
        </div>

        {/* Create form */}
        {creating && (
          <div className="glass-panel" style={{ marginBottom: 20 }}>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Deck name..." autoFocus style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-primary)", fontSize: 15, fontWeight: 600, marginBottom: 10, outline: "none" }} />
            <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)..." style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-primary)", fontSize: 13, marginBottom: 12, outline: "none" }} />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCreate} className="glass-btn glass-btn-primary" style={{ padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Check size={14} /> Create</button>
              <button onClick={() => { setCreating(false); setNewTitle(""); setNewDesc(""); }} className="glass-btn" style={{ padding: "8px 16px", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Search */}
        {decks.length > 0 && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--os-text-dim)" }} />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search decks..." style={{ width: "100%", padding: "10px 14px 10px 38px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }} />
          </div>
        )}

        {/* Loading */}
        {loading && <p className="text-secondary text-sm" style={{ textAlign: "center", padding: 40 }}>Loading decks...</p>}

        {/* Empty */}
        {!loading && decks.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--os-text-dim)" }}>
            <Layers size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 14, marginBottom: 8 }}>No decks yet</p>
            <p style={{ fontSize: 12 }}>Create your first deck to start studying</p>
          </div>
        )}

        {/* Deck list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map((deck) => (
            <div key={deck.id} className="glass-card" style={{ padding: "16px 20px" }}>
              {editingId === deck.id ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: "100%", padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 15, fontWeight: 600, outline: "none" }} />
                  <input value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Description..." style={{ width: "100%", padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }} />
                  <div style={{ display: "flex", gap: 6 }}>
                    <button onClick={() => handleUpdate(deck.id)} className="glass-btn glass-btn-primary" style={{ padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Save</button>
                    <button onClick={() => setEditingId(null)} className="glass-btn" style={{ padding: "5px 12px", fontSize: 12 }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(109,40,217,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Layers size={20} style={{ color: "var(--os-accent)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deck.title}</div>
                    <div style={{ fontSize: 12, color: "var(--os-text-dim)", marginTop: 2 }}>
                      {deck.card_count} cards · {new Date(deck.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <Link href={`/decks/${deck.id}`} className="glass-btn" style={{ padding: "6px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
                      <Play size={13} /> Study
                    </Link>
                    <button onClick={() => { setEditingId(deck.id); setEditTitle(deck.title); setEditDesc(deck.description); }} style={{ padding: 6, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 6, color: "var(--os-text-dim)", cursor: "pointer" }}><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(deck.id)} style={{ padding: 6, background: "rgba(239,68,68,0.08)", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
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
