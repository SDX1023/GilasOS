"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Upload, Loader2, Save, ChevronDown, Check, Layers } from "lucide-react";
import { saveReviewerToSupabase } from "@/lib/custom-content";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export default function ImportAnkiPage() {
  const { user } = useAuth();
  const [decks, setDecks] = useState<{ name: string; cards: { front: string; back: string; hint?: string }[] }[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [lastError, setLastError] = useState("");
  const [debug, setDebug] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [targetModule, setTargetModule] = useState("");
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [existingCategories, setExistingCategories] = useState<{ id: string; title: string }[]>([]);
  const [selectedDecks, setSelectedDecks] = useState<Set<number>>(new Set());
  const [savedDecks, setSavedDecks] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user) return;
    const supabase = getSupabase();
    supabase.from("deck_courses").select("id, title").eq("user_id", user.id).order("sort_order")
      .then(({ data }: { data: { id: string; title: string }[] | null }) => {
        setExistingCategories(data || []);
      });
  }, [user]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith(".apkg")) {
      setLastError("Please upload an Anki deck file (.apkg)");
      return;
    }
    setIsParsing(true); setLastError(""); setDecks([]); setSavedDecks(new Set());
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import-anki", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse Anki file");
      if (!data.decks || data.decks.length === 0) throw new Error("No decks with cards found in this file");
      setDecks(data.decks);
      setSelectedDecks(new Set(data.decks.map((_: any, i: number) => i)));
      setDebug(data.debug);
    } catch (err: any) {
      setLastError(err.message || "Failed to parse Anki file");
    } finally {
      setIsParsing(false);
      e.target.value = "";
    }
  };

  const toggleDeck = (index: number) => {
    setSelectedDecks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAll = () => setSelectedDecks(new Set(decks.map((_, i) => i)));
  const deselectAll = () => setSelectedDecks(new Set());

  const saveDecks = async () => {
    if (selectedDecks.size === 0 || saving) return;
    setSaving(true); setSaveMsg(""); setLastError("");
    try {
      const cat = existingCategories.find((c) => c.title === targetModule);
      const courseId = cat?.id || null;
      let saved = 0;
      for (const i of selectedDecks) {
        const deck = decks[i];
        if (!deck || savedDecks.has(i)) continue;
        await saveReviewerToSupabase(courseId, "custom", { title: deck.name, cards: deck.cards });
        saved++;
        setSavedDecks((prev) => new Set([...prev, i]));
      }
      setSaveMsg(`Saved ${saved} deck${saved !== 1 ? "s" : ""}!`);
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err: any) {
      setLastError(err.message || "Failed to save decks");
    } finally {
      setSaving(false);
    }
  };

  const totalCards = decks.reduce((sum, d) => sum + d.cards.length, 0);
  const selectedCards = decks.filter((_, i) => selectedDecks.has(i)).reduce((sum, d) => sum + d.cards.length, 0);

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon"><Layers size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Sign in required</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>Log in to import Anki decks.</p>
          <Link href="/login" className="glass-btn glass-btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><Layers size={28} /> Import Anki Deck</h1>
        <p className="page-subtitle">Import flashcards from Anki (.apkg) files</p>
      </div>

      <div className="grid-2">
        <div className="glass-panel">
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>Upload Anki File</h2>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "32px 16px", borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.1)", cursor: isParsing ? "wait" : "pointer", marginBottom: 16, position: "relative" }}>
            {isParsing ? <Loader2 size={20} style={{ color: "var(--os-text-dim)", animation: "spin 1s linear infinite" }} /> : <Upload size={20} style={{ color: "var(--os-text-dim)" }} />}
            <span className="text-secondary text-sm">{isParsing ? "Parsing file on server..." : "Upload .apkg file"}</span>
            <input type="file" accept=".apkg" onChange={handleFileUpload} disabled={isParsing}
              style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", top: 0, left: 0, cursor: isParsing ? "wait" : "pointer" }} />
          </label>

          {lastError && (
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 500 }}>{lastError}</p>
            </div>
          )}

          {debug && (
            <div style={{ padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid var(--os-glass-border)", marginBottom: 16, fontSize: 11, fontFamily: "monospace", color: "var(--os-text-dim)" }}>
              <p>Tables: {debug.tables?.join(", ")}</p>
              {debug.cards_count !== undefined && <p>Cards rows: {debug.cards_count} · Notes rows: {debug.note_count} · Join rows: {debug.join_rows}</p>}
            </div>
          )}

          {saveMsg && (
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#10b981", fontWeight: 500 }}>{saveMsg}</p>
            </div>
          )}

          {decks.length > 0 && (
            <div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                <span className="text-secondary text-sm">{decks.length} deck{decks.length !== 1 ? "s" : ""} found ({totalCards} cards)</span>
                <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                  <button onClick={selectAll} className="glass-btn" style={{ padding: "4px 8px", fontSize: 11 }}>Select all</button>
                  <button onClick={deselectAll} className="glass-btn" style={{ padding: "4px 8px", fontSize: 11 }}>Deselect all</button>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 200, overflowY: "auto", marginBottom: 16 }}>
                {decks.map((deck, i) => (
                  <label key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: selectedDecks.has(i) ? "rgba(109,40,217,0.08)" : "rgba(255,255,255,0.02)", border: "1px solid var(--os-glass-border)", cursor: "pointer", transition: "all 0.15s" }}>
                    <input type="checkbox" checked={selectedDecks.has(i)} onChange={() => toggleDeck(i)}
                      style={{ accentColor: "var(--os-accent)", width: 16, height: 16 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deck.name}</p>
                      <p className="text-dim text-xs">{deck.cards.length} cards</p>
                    </div>
                    {savedDecks.has(i) && <Check size={14} style={{ color: "#10b981", flexShrink: 0 }} />}
                  </label>
                ))}
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {showNewCategory ? (
                  <div style={{ display: "flex", gap: 4 }}>
                    <input className="glass-input" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Category name" style={{ width: 140 }} autoFocus onKeyDown={(e) => {
                      if (e.key === "Enter" && newCategory.trim()) { setTargetModule(newCategory.trim()); setShowNewCategory(false); }
                      if (e.key === "Escape") { setShowNewCategory(false); setNewCategory(""); }
                    }} />
                    <button onClick={async () => {
                      if (!newCategory.trim() || !user) return;
                      const supabase = getSupabase();
                      const { data } = await supabase.from("deck_courses").insert({ user_id: user.id, title: newCategory.trim() }).select("id, title").single();
                      if (data) setExistingCategories((prev) => [...prev, data]);
                      setTargetModule(newCategory.trim());
                      setShowNewCategory(false); setNewCategory("");
                    }} className="glass-btn glass-btn-primary" style={{ padding: "6px 10px", fontSize: 12 }}>Add</button>
                    <button onClick={() => { setShowNewCategory(false); setNewCategory(""); }} className="glass-btn" style={{ padding: "6px 10px", fontSize: 12 }}>Cancel</button>
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <select value={targetModule} onChange={(e) => {
                      if (e.target.value === "__new__") { setShowNewCategory(true); setNewCategory(""); }
                      else setTargetModule(e.target.value);
                    }} className="glass-input" style={{ width: 180, appearance: "none", paddingRight: 28, cursor: "pointer" }}>
                      <option value="">Uncategorized</option>
                      {existingCategories.map((cat) => (
                        <option key={cat.id} value={cat.title}>{cat.title}</option>
                      ))}
                      <option value="__new__">+ Create new category</option>
                    </select>
                    <ChevronDown size={14} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--os-text-dim)" }} />
                  </div>
                )}
                <button onClick={saveDecks} disabled={selectedDecks.size === 0 || saving}
                  className="glass-btn glass-btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", fontSize: 13, opacity: selectedDecks.size === 0 || saving ? 0.5 : 1 }}>
                  <Save size={12} /> {saving ? "Saving..." : `Save${selectedDecks.size > 0 ? ` ${selectedDecks.size}` : ""} Deck${selectedDecks.size !== 1 ? "s" : ""}`}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="glass-panel">
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>
            Card Preview {selectedCards > 0 && <span className="text-dim" style={{ fontWeight: 400, fontSize: 13 }}>({selectedCards} cards selected)</span>}
          </h2>
          {decks.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <Layers size={36} style={{ color: "var(--os-text-dim)", marginBottom: 12 }} />
              <p className="text-secondary text-sm">Upload an Anki .apkg file to preview cards</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: "32rem", overflowY: "auto" }}>
              {decks.filter((_, i) => selectedDecks.has(i)).map((deck, di) => (
                <div key={di}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: "var(--os-accent)" }}>{deck.name}</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {deck.cards.slice(0, 20).map((card, ci) => (
                      <div key={ci} className="glass-card" style={{ padding: 12 }}>
                        <p style={{ fontWeight: 500, fontSize: 13 }}>{card.front}</p>
                        <p className="text-secondary text-sm" style={{ marginTop: 4 }}>{card.back}</p>
                        {card.hint && <p className="text-dim text-xs" style={{ marginTop: 4, fontStyle: "italic" }}>Hint: {card.hint}</p>}
                      </div>
                    ))}
                    {deck.cards.length > 20 && (
                      <p className="text-dim text-xs" style={{ textAlign: "center", padding: 8 }}>...and {deck.cards.length - 20} more cards</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
