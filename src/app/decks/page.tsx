"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Layers, Plus, Trash2, Pencil, Check, Play, Search, ChevronRight, ChevronDown, FolderOpen, FolderPlus } from "lucide-react";

interface DeckCourse {
  id: string;
  title: string;
  sort_order: number;
  created_at: string;
}

interface CustomDeck {
  id: string;
  title: string;
  description: string;
  card_count: number;
  course_id: string | null;
  created_at: string;
}

export default function DecksPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<CustomDeck[]>([]);
  const [courses, setCourses] = useState<DeckCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCourseId, setNewCourseId] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCourseId, setEditCourseId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCourses, setExpandedCourses] = useState<Record<string, boolean>>({});
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editCourseTitle, setEditCourseTitle] = useState("");

  const fetchData = async () => {
    if (!user) return;
    try {
      const supabase = getSupabase();

      const [coursesResult, decksResult] = await Promise.all([
        supabase.from("deck_courses").select("*").eq("user_id", user.id).order("sort_order"),
        supabase.from("custom_decks").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }),
      ]);

      if (coursesResult.error) {
        console.warn("deck_courses table may not exist yet:", coursesResult.error.message);
        setCourses([]);
      } else {
        setCourses(coursesResult.data || []);
      }

      const decksData = decksResult.data || [];

      const decksWithCount = await Promise.all(
        decksData.map(async (deck: any) => {
          const { count } = await supabase
            .from("custom_deck_cards")
            .select("*", { count: "exact", head: true })
            .eq("deck_id", deck.id);
          return { ...deck, card_count: count || 0 };
        })
      );

      setDecks(decksWithCount);
    } catch (error) {
      console.error("Error fetching data:", error);
      setDecks([]);
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    fetchData();
  }, [user]);

  useEffect(() => {
    const handleDeckUpdate = () => fetchData();
    window.addEventListener("decksUpdated", handleDeckUpdate);
    return () => window.removeEventListener("decksUpdated", handleDeckUpdate);
  }, [user]);

  const handleCreateDeck = async () => {
    if (!newTitle.trim() || !user) return;
    const supabase = getSupabase();
    const deckId = crypto.randomUUID();
    const { data, error } = await supabase
      .from("custom_decks")
      .insert({
        id: deckId,
        user_id: user.id,
        title: newTitle.trim(),
        description: newDesc.trim(),
        card_count: 0,
        course_id: newCourseId || null,
      })
      .select()
      .single();

    if (error) { console.error("Error creating deck:", error); return; }
    if (data) setDecks([data, ...decks]);
    setNewTitle(""); setNewDesc(""); setNewCourseId(""); setCreating(false);
  };

  const handleUpdateDeck = async (id: string) => {
    if (!editTitle.trim()) return;
    const supabase = getSupabase();
    const { error } = await supabase
      .from("custom_decks")
      .update({ title: editTitle.trim(), description: editDesc.trim(), course_id: editCourseId || null, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) { console.error("Error updating deck:", error); return; }
    setDecks(decks.map(d => d.id === id ? { ...d, title: editTitle.trim(), description: editDesc.trim(), course_id: editCourseId || null } : d));
    setEditingId(null);
  };

  const handleDeleteDeck = async (id: string) => {
    if (!confirm("Delete this deck and all its cards?")) return;
    const supabase = getSupabase();
    await supabase.from("custom_deck_cards").delete().eq("deck_id", id);
    await supabase.from("custom_decks").delete().eq("id", id);
    setDecks(decks.filter(d => d.id !== id));
  };

  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim() || !user) return;
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("deck_courses")
      .insert({ id: crypto.randomUUID(), user_id: user.id, title: newCourseTitle.trim(), sort_order: courses.length })
      .select()
      .single();
    if (error) { console.error("Error creating course:", error); return; }
    if (data) setCourses([...courses, data]);
    setNewCourseTitle(""); setCreatingCourse(false);
  };

  const handleUpdateCourse = async (id: string) => {
    if (!editCourseTitle.trim()) return;
    const supabase = getSupabase();
    await supabase.from("deck_courses").update({ title: editCourseTitle.trim() }).eq("id", id);
    setCourses(courses.map(c => c.id === id ? { ...c, title: editCourseTitle.trim() } : c));
    setEditingCourseId(null);
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Delete this category? Decks will become uncategorized.")) return;
    const supabase = getSupabase();
    await supabase.from("deck_courses").delete().eq("id", id);
    await supabase.from("custom_decks").update({ course_id: null }).eq("course_id", id);
    setCourses(courses.filter(c => c.id !== id));
    setDecks(decks.map(d => d.course_id === id ? { ...d, course_id: null } : d));
  };

  const filtered = decks.filter(d => d.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const ungrouped = filtered.filter(d => !d.course_id);
  const grouped = courses.map(c => ({ ...c, decks: filtered.filter(d => d.course_id === c.id) })).filter(c => c.decks.length > 0 || !searchQuery);

  const toggleCourse = (id: string) => setExpandedCourses(prev => ({ ...prev, [id]: prev[id] === false ? true : false }));

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
            <p className="page-subtitle">{decks.length} decks · {courses.length} categories</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!creating && (
              <button onClick={() => setCreatingCourse(true)} className="glass-btn" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", fontSize: 13 }}>
                <FolderPlus size={15} /> Category
              </button>
            )}
            {!creating && (
              <button onClick={() => setCreating(true)} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
                <Plus size={15} /> New Deck
              </button>
            )}
          </div>
        </div>

        {creatingCourse && (
          <div className="glass-panel" style={{ marginBottom: 16, padding: "12px 16px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <FolderPlus size={16} style={{ color: "var(--os-accent)", flexShrink: 0 }} />
              <input
                value={newCourseTitle}
                onChange={(e) => setNewCourseTitle(e.target.value)}
                placeholder="Category name..."
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreateCourse()}
                style={{ flex: 1, padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }}
              />
              <button onClick={handleCreateCourse} className="glass-btn glass-btn-primary" style={{ padding: "6px 12px", fontSize: 12 }}><Check size={12} /></button>
              <button onClick={() => { setCreatingCourse(false); setNewCourseTitle(""); }} className="glass-btn" style={{ padding: "6px 12px", fontSize: 12 }}>Cancel</button>
            </div>
          </div>
        )}

        {creating && (
          <div className="glass-panel" style={{ marginBottom: 20 }}>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Deck name..."
              autoFocus
              style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-primary)", fontSize: 15, fontWeight: 600, marginBottom: 10, outline: "none" }}
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)..."
              style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-primary)", fontSize: 13, marginBottom: 10, outline: "none" }}
            />
            {courses.length > 0 && (
              <select
                value={newCourseId}
                onChange={(e) => setNewCourseId(e.target.value)}
                style={{ width: "100%", padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-primary)", fontSize: 13, marginBottom: 12, outline: "none" }}
              >
                <option value="">No category</option>
                {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleCreateDeck} className="glass-btn glass-btn-primary" style={{ padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                <Check size={14} /> Create
              </button>
              <button onClick={() => { setCreating(false); setNewTitle(""); setNewDesc(""); setNewCourseId(""); }} className="glass-btn" style={{ padding: "8px 16px", fontSize: 13 }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {decks.length > 0 && (
          <div style={{ position: "relative", marginBottom: 16 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, color: "var(--os-text-dim)" }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search decks..."
              style={{ width: "100%", padding: "10px 14px 10px 38px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }}
            />
          </div>
        )}

        {loading && <p className="text-secondary text-sm" style={{ textAlign: "center", padding: 40 }}>Loading decks...</p>}

        {!loading && decks.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--os-text-dim)" }}>
            <Layers size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 14, marginBottom: 8 }}>No decks yet</p>
            <p style={{ fontSize: 12 }}>Create your first deck to start studying</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {grouped.map((course) => (
            <div key={course.id} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                onClick={() => toggleCourse(course.id)}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", background: "rgba(109,40,217,0.06)", borderBottom: expandedCourses[course.id] !== false ? "1px solid rgba(255,255,255,0.06)" : "none" }}
              >
                {expandedCourses[course.id] !== false ? <ChevronDown size={16} style={{ color: "var(--os-accent)", flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />}
                <FolderOpen size={16} style={{ color: "var(--os-accent)" }} />
                {editingCourseId === course.id ? (
                  <input
                    value={editCourseTitle}
                    onChange={(e) => setEditCourseTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleUpdateCourse(course.id); if (e.key === "Escape") setEditingCourseId(null); }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                    style={{ flex: 1, padding: "4px 8px", background: "rgba(0,0,0,0.3)", border: "1px solid var(--os-glass-border)", borderRadius: 6, color: "var(--os-text-primary)", fontSize: 13, fontWeight: 600, outline: "none" }}
                  />
                ) : (
                  <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "var(--os-text-primary)" }}>{course.title}</span>
                )}
                <span style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{course.decks.length} decks</span>
                <div style={{ display: "flex", gap: 2 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => { setEditingCourseId(course.id); setEditCourseTitle(course.title); }}
                    style={{ padding: 4, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", borderRadius: 4 }}
                  ><Pencil size={12} /></button>
                  <button
                    onClick={() => handleDeleteCourse(course.id)}
                    style={{ padding: 4, background: "none", border: "none", color: "#ef4444", cursor: "pointer", borderRadius: 4 }}
                  ><Trash2 size={12} /></button>
                </div>
              </div>
              {expandedCourses[course.id] !== false && (
                <div style={{ padding: "6px" }}>
                  {course.decks.map((deck) => (
                    <DeckRow
                      key={deck.id}
                      deck={deck}
                      courses={courses}
                      editingId={editingId}
                      editTitle={editTitle}
                      editDesc={editDesc}
                      editCourseId={editCourseId}
                      setEditTitle={setEditTitle}
                      setEditDesc={setEditDesc}
                      setEditCourseId={setEditCourseId}
                      setEditingId={setEditingId}
                      handleUpdateDeck={handleUpdateDeck}
                      handleDeleteDeck={handleDeleteDeck}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {ungrouped.length > 0 && (
            <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                onClick={() => toggleCourse("__ungrouped__")}
                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer", background: "rgba(255,255,255,0.02)", borderBottom: expandedCourses["__ungrouped__"] !== false ? "1px solid rgba(255,255,255,0.06)" : "none" }}
              >
                {expandedCourses["__ungrouped__"] !== false ? <ChevronDown size={16} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />}
                <Layers size={16} style={{ color: "var(--os-text-dim)" }} />
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: "var(--os-text-secondary)" }}>Uncategorized</span>
                <span style={{ fontSize: 11, color: "var(--os-text-dim)" }}>{ungrouped.length} decks</span>
              </div>
              {expandedCourses["__ungrouped__"] !== false && (
                <div style={{ padding: "6px" }}>
                  {ungrouped.map((deck) => (
                    <DeckRow
                      key={deck.id}
                      deck={deck}
                      courses={courses}
                      editingId={editingId}
                      editTitle={editTitle}
                      editDesc={editDesc}
                      editCourseId={editCourseId}
                      setEditTitle={setEditTitle}
                      setEditDesc={setEditDesc}
                      setEditCourseId={setEditCourseId}
                      setEditingId={setEditingId}
                      handleUpdateDeck={handleUpdateDeck}
                      handleDeleteDeck={handleDeleteDeck}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeckRow({ deck, courses, editingId, editTitle, editDesc, editCourseId, setEditTitle, setEditDesc, setEditCourseId, setEditingId, handleUpdateDeck, handleDeleteDeck }: {
  deck: CustomDeck;
  courses: DeckCourse[];
  editingId: string | null;
  editTitle: string;
  editDesc: string;
  editCourseId: string;
  setEditTitle: (v: string) => void;
  setEditDesc: (v: string) => void;
  setEditCourseId: (v: string) => void;
  setEditingId: (v: string | null) => void;
  handleUpdateDeck: (id: string) => void;
  handleDeleteDeck: (id: string) => void;
}) {
  if (editingId === deck.id) {
    return (
      <div style={{ padding: "10px 14px", margin: "4px 8px", background: "rgba(0,0,0,0.15)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 8 }}>
        <input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          style={{ width: "100%", padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 14, fontWeight: 600, outline: "none" }}
        />
        <input
          value={editDesc}
          onChange={(e) => setEditDesc(e.target.value)}
          placeholder="Description..."
          style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 12, outline: "none" }}
        />
        {courses.length > 0 && (
          <select
            value={editCourseId}
            onChange={(e) => setEditCourseId(e.target.value)}
            style={{ width: "100%", padding: "6px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 12, outline: "none" }}
          >
            <option value="">No category</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => handleUpdateDeck(deck.id)} className="glass-btn glass-btn-primary" style={{ padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
            <Check size={12} /> Save
          </button>
          <button onClick={() => setEditingId(null)} className="glass-btn" style={{ padding: "5px 12px", fontSize: 12 }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 14px", margin: "2px 8px", borderRadius: 10, transition: "background 0.15s" }}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(109,40,217,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Layers size={16} style={{ color: "var(--os-accent)" }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deck.title}</div>
        <div style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 1 }}>
          {deck.card_count} cards · {new Date(deck.created_at).toLocaleDateString()}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <Link href={`/decks/${deck.id}`} className="glass-btn" style={{ padding: "5px 12px", fontSize: 11, display: "flex", alignItems: "center", gap: 4, textDecoration: "none" }}>
          <Play size={12} /> Study
        </Link>
        <button
          onClick={() => { setEditingId(deck.id); setEditTitle(deck.title); setEditDesc(deck.description || ""); setEditCourseId(deck.course_id || ""); }}
          style={{ padding: 5, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 5, color: "var(--os-text-dim)", cursor: "pointer" }}
        ><Pencil size={13} /></button>
        <button
          onClick={() => handleDeleteDeck(deck.id)}
          style={{ padding: 5, background: "rgba(239,68,68,0.08)", border: "none", borderRadius: 5, color: "#ef4444", cursor: "pointer" }}
        ><Trash2 size={13} /></button>
      </div>
    </div>
  );
}
