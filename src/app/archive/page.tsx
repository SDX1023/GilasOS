"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Archive, Plus, Trash2, Pencil, Check, X, Calendar, ExternalLink, Link as LinkIcon, FolderOpen, FolderPlus } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface ArchiveEntry {
  id: string;
  competition: string;
  competition_url: string;
  links: string[];
  link_labels: string[];
  type: string;
  year: string;
  category_id: string | null;
}

interface ArchiveCategory {
  id: string;
  title: string;
  sort_order: number;
  user_id: string;
}

function LinksInput({ links, labels, setLinks, setLabels }: { links: string[]; labels: string[]; setLinks: (v: string[]) => void; setLabels: (v: string[]) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {links.map((link, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input className="glass-input" value={labels[i] || ""} onChange={(e) => { const updated = [...labels]; updated[i] = e.target.value; setLabels(updated); }} placeholder={`Label ${i + 1}`} style={{ width: 100, fontSize: 13, flexShrink: 0 }} />
          <input className="glass-input" value={link} onChange={(e) => { const updated = [...links]; updated[i] = e.target.value; setLinks(updated); }} placeholder={`Link ${i + 1}`} style={{ flex: 1, fontSize: 13 }} />
          {links.length > 1 && (
            <button onClick={() => { setLinks(links.filter((_, j) => j !== i)); setLabels(labels.filter((_, j) => j !== i)); }} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, flexShrink: 0 }}><X size={14} /></button>
          )}
        </div>
      ))}
      <button onClick={() => { setLinks([...links, ""]); setLabels([...labels, ""]); }} style={{ background: "none", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 8, color: "var(--os-text-dim)", cursor: "pointer", padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, alignSelf: "flex-start" }}>
        <Plus size={12} /> Add Link
      </button>
    </div>
  );
}

function renderLinks(entry: ArchiveEntry) {
  const allLinks: string[] = [];
  const allLabels: string[] = [];
  if (entry.competition_url && !entry.links?.includes(entry.competition_url)) {
    allLinks.push(entry.competition_url);
    allLabels.push("");
  }
  if (entry.links?.length) {
    entry.links.forEach((l, i) => {
      if (!allLinks.includes(l)) {
        allLinks.push(l);
        allLabels.push(entry.link_labels?.[i] || "");
      }
    });
  }
  const unique = [...new Set(allLinks)].filter(Boolean);
  if (unique.length === 0) return <span>{entry.competition}</span>;
  if (unique.length === 1) {
    const label = allLabels[0];
    return (
      <a href={unique[0]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--os-accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
        {entry.competition} {label && <span style={{ fontSize: 11, color: "var(--os-text-dim)" }}>({label})</span>} <ExternalLink size={12} />
      </a>
    );
  }
  return (
    <div>
      <p style={{ marginBottom: 4 }}>{entry.competition}</p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {unique.map((link, i) => {
          const idx = allLinks.indexOf(link);
          const label = allLabels[idx] || `Link ${i + 1}`;
          return (
            <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--os-accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, padding: "3px 10px", borderRadius: 6, background: "rgba(109,40,217,0.15)", border: "1px solid rgba(109,40,217,0.4)" }}>
              <LinkIcon size={10} /> {label}
            </a>
          );
        })}
      </div>
    </div>
  );
}

function getAllLinks(entry: ArchiveEntry): string[] {
  const links: string[] = [];
  if (entry.competition_url && !entry.links?.includes(entry.competition_url)) links.push(entry.competition_url);
  if (entry.links?.length) links.push(...entry.links);
  return [...new Set(links)].filter(Boolean);
}

function getAllLabels(entry: ArchiveEntry): string[] {
  const labels: string[] = [];
  if (entry.competition_url && !entry.links?.includes(entry.competition_url)) labels.push("");
  if (entry.links?.length) entry.links.forEach((l, i) => {
    if (!labels.includes(l)) labels.push(entry.link_labels?.[i] || "");
  });
  const links = getAllLinks(entry);
  return links.map((l) => {
    const idx = entry.links?.indexOf(l);
    return idx !== undefined && idx >= 0 ? (entry.link_labels?.[idx] || "") : "";
  });
}

export default function ArchivePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [categories, setCategories] = useState<ArchiveCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ competition: "", type: "", year: "" });
  const [newLinks, setNewLinks] = useState<string[]>([""]);
  const [newLabels, setNewLabels] = useState<string[]>([""]);
  const [editValues, setEditValues] = useState({ competition: "", type: "", year: "" });
  const [editLinks, setEditLinks] = useState<string[]>([]);
  const [editLabels, setEditLabels] = useState<string[]>([]);
  const [typeSort, setTypeSort] = useState<"asc" | "desc" | "">("");
  const [yearSort, setYearSort] = useState<"asc" | "desc" | "">("desc");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [newCatTitle, setNewCatTitle] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatTitle, setEditCatTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteCat, setConfirmDeleteCat] = useState<string | null>(null);

  useEffect(() => {
    const password = sessionStorage.getItem("archive_admin");
    setIsAdmin(password === "SDX102310");
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const supabase = getSupabase();
    const [{ data: catData }, { data: entryData }] = await Promise.all([
      supabase.from("archive_categories").select("*").order("sort_order"),
      supabase.from("archive_entries").select("*").order("year", { ascending: false }),
    ]);
    setCategories((catData || []) as ArchiveCategory[]);
    setEntries((entryData || []).map((e: any) => ({
      ...e,
      links: e.links || (e.competition_url ? [e.competition_url] : []),
      link_labels: e.link_labels || [],
    })) as ArchiveEntry[]);
    setLoading(false);
  }

  const handleAdminLogin = () => {
    const password = prompt("Enter admin password:");
    if (password === "SDX102310") { sessionStorage.setItem("archive_admin", "SDX102310"); setIsAdmin(true); }
  };

  const addEntry = async () => {
    if (!newEntry.competition.trim()) return;
    const supabase = getSupabase();
    const filteredLinks = newLinks.filter((l) => l.trim());
    const filteredLabels = newLabels.slice(0, filteredLinks.length);
    const { error } = await supabase.from("archive_entries").insert({
      competition: newEntry.competition,
      competition_url: filteredLinks[0] || "",
      links: filteredLinks,
      link_labels: filteredLabels,
      type: newEntry.type,
      year: newEntry.year,
      category_id: selectedCategoryId,
    });
    if (!error) {
      setNewEntry({ competition: "", type: "", year: "" });
      setNewLinks([""]);
      setNewLabels([""]);
      setShowAddForm(false);
      loadData();
    }
  };

  const deleteEntry = async (id: string) => {
    const supabase = getSupabase();
    await supabase.from("archive_entries").delete().eq("id", id);
    loadData();
  };

  const startEdit = (entry: ArchiveEntry) => {
    setEditingId(entry.id);
    setEditValues({ competition: entry.competition, type: entry.type, year: entry.year });
    const allLinks = getAllLinks(entry);
    const allLabels = getAllLabels(entry);
    setEditLinks(allLinks.length > 0 ? allLinks : [""]);
    setEditLabels(allLabels.length > 0 ? allLabels : [""]);
  };

  const saveEdit = async (id: string) => {
    const supabase = getSupabase();
    const filteredLinks = editLinks.filter((l) => l.trim());
    const filteredLabels = editLabels.slice(0, filteredLinks.length);
    await supabase.from("archive_entries").update({
      competition: editValues.competition,
      competition_url: filteredLinks[0] || "",
      links: filteredLinks,
      link_labels: filteredLabels,
      type: editValues.type,
      year: editValues.year,
    }).eq("id", id);
    setEditingId(null);
    loadData();
  };

  const addCategory = async () => {
    if (!newCatTitle.trim() || !user) return;
    const supabase = getSupabase();
    await supabase.from("archive_categories").insert({ title: newCatTitle.trim(), user_id: user.id, sort_order: categories.length });
    setNewCatTitle("");
    setShowNewCat(false);
    loadData();
  };

  const updateCategory = async (id: string) => {
    if (!editCatTitle.trim()) return;
    const supabase = getSupabase();
    await supabase.from("archive_categories").update({ title: editCatTitle.trim() }).eq("id", id);
    setEditingCatId(null);
    loadData();
  };

  const deleteCategory = async (id: string) => {
    const supabase = getSupabase();
    await supabase.from("archive_categories").delete().eq("id", id);
    await supabase.from("archive_entries").update({ category_id: null }).eq("category_id", id);
    if (selectedCategoryId === id) setSelectedCategoryId(null);
    loadData();
  };

  const filteredEntries = entries
    .filter(e => {
      if (selectedCategoryId !== null && e.category_id !== selectedCategoryId) return false;
      if (selectedType !== "all" && (e.type || "").toLowerCase() !== selectedType.toLowerCase()) return false;
      return true;
    })
    .sort((a, b) => {
      if (typeSort) {
        const cmp = (a.type || "").localeCompare(b.type || "");
        if (cmp !== 0) return typeSort === "asc" ? cmp : -cmp;
      }
      if (yearSort) {
        const diff = (parseInt(a.year) || 0) - (parseInt(b.year) || 0);
        if (diff !== 0) return yearSort === "asc" ? diff : -diff;
      }
      return 0;
    });

  const entriesForCategory = selectedCategoryId === null ? entries : entries.filter(e => e.category_id === selectedCategoryId);
  const uniqueTypes = [...new Set(entriesForCategory.map(e => e.type).filter(Boolean))].sort();
  const uncategorizedCount = entries.filter(e => !e.category_id).length;

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon"><Archive size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Sign in required</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>Log in to view the archive.</p>
          <Link href="/login" className="glass-btn glass-btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <ConfirmDialog open={!!confirmDeleteId} title="Delete Entry?" message="This will permanently delete this archive entry." confirmLabel="Delete" danger onConfirm={() => { if (confirmDeleteId) { deleteEntry(confirmDeleteId); setConfirmDeleteId(null); } }} onCancel={() => setConfirmDeleteId(null)} />
      <ConfirmDialog open={!!confirmDeleteCat} title="Delete Category?" message="Entries in this category will become uncategorized." confirmLabel="Delete" danger onConfirm={() => { if (confirmDeleteCat) { deleteCategory(confirmDeleteCat); setConfirmDeleteCat(null); } }} onCancel={() => setConfirmDeleteCat(null)} />
      <div className="flex-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title"><Archive size={28} /> Archive</h1>
          <p className="page-subtitle">Competition history and records</p>
        </div>
        {isAdmin ? (
          <button onClick={() => setShowAddForm(true)} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} /> Add Entry
          </button>
        ) : (
          <button onClick={handleAdminLogin} className="glass-btn glass-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Pencil size={14} /> Admin
          </button>
        )}
      </div>

      {/* Main category tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button onClick={() => { setSelectedCategoryId(null); setSelectedType("all"); }} className="glass-btn" style={{ padding: "6px 14px", fontSize: 12, background: selectedCategoryId === null ? "rgba(109,40,217,0.2)" : "rgba(0,0,0,0.15)", border: selectedCategoryId === null ? "1px solid var(--os-accent)" : "1px solid var(--os-glass-border)", color: selectedCategoryId === null ? "var(--os-accent)" : "var(--os-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
            <Archive size={12} /> COMPETITIONS
          </button>
        {categories.map(cat => (
          <div key={cat.id} style={{ display: "flex", alignItems: "center" }}>
            {editingCatId === cat.id ? (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input value={editCatTitle} onChange={(e) => setEditCatTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") updateCategory(cat.id); if (e.key === "Escape") setEditingCatId(null); }} autoFocus style={{ padding: "6px 10px", fontSize: 12, background: "rgba(0,0,0,0.3)", border: "1px solid var(--os-accent)", borderRadius: 8, color: "var(--os-text-primary)", outline: "none", width: 120 }} />
                <button onClick={() => updateCategory(cat.id)} style={{ padding: 4, background: "none", border: "none", color: "#10b981", cursor: "pointer" }}><Check size={14} /></button>
                <button onClick={() => setEditingCatId(null)} style={{ padding: 4, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}><X size={14} /></button>
              </div>
            ) : (
              <>
                <button onClick={() => { setSelectedCategoryId(cat.id); setSelectedType("all"); }} className="glass-btn" style={{ padding: "6px 14px", fontSize: 12, background: selectedCategoryId === cat.id ? "rgba(109,40,217,0.2)" : "rgba(0,0,0,0.15)", border: selectedCategoryId === cat.id ? "1px solid var(--os-accent)" : "1px solid var(--os-glass-border)", color: selectedCategoryId === cat.id ? "var(--os-accent)" : "var(--os-text-secondary)", display: "flex", alignItems: "center", gap: 6, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}>
                  <FolderOpen size={12} /> {cat.title}
                </button>
                {isAdmin && (
                  <div style={{ display: "flex", border: "1px solid var(--os-glass-border)", borderLeft: "none", borderRadius: "0 8px 8px 0", overflow: "hidden" }}>
                    <button onClick={() => { setEditingCatId(cat.id); setEditCatTitle(cat.title); }} style={{ padding: "6px 6px", background: "rgba(0,0,0,0.15)", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}><Pencil size={10} /></button>
                    <button onClick={() => setConfirmDeleteCat(cat.id)} style={{ padding: "6px 6px", background: "rgba(0,0,0,0.15)", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={10} /></button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {isAdmin && (
          <>
            {showNewCat ? (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <input value={newCatTitle} onChange={(e) => setNewCatTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") addCategory(); if (e.key === "Escape") setShowNewCat(false); }} placeholder="Category name" autoFocus style={{ padding: "6px 10px", fontSize: 12, background: "rgba(0,0,0,0.3)", border: "1px solid var(--os-accent)", borderRadius: 8, color: "var(--os-text-primary)", outline: "none", width: 120 }} />
                <button onClick={addCategory} style={{ padding: 4, background: "none", border: "none", color: "#10b981", cursor: "pointer" }}><Check size={14} /></button>
                <button onClick={() => setShowNewCat(false)} style={{ padding: 4, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => setShowNewCat(true)} className="glass-btn glass-btn-ghost" style={{ padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <FolderPlus size={12} /> New Category
              </button>
            )}
          </>
        )}
      </div>

      {/* Sub-tabs: type filter */}
      {uniqueTypes.length > 0 && (
        <div style={{ display: "flex", gap: 4, marginBottom: 20, flexWrap: "wrap", paddingLeft: 4 }}>
          <button onClick={() => setSelectedType("all")} style={{ padding: "4px 10px", fontSize: 11, background: selectedType === "all" ? "rgba(109,40,217,0.15)" : "none", border: "none", borderRadius: 6, color: selectedType === "all" ? "var(--os-accent)" : "var(--os-text-dim)", cursor: "pointer" }}>
            All types
          </button>
          {uniqueTypes.map(type => (
            <button key={type} onClick={() => setSelectedType(type)} style={{ padding: "4px 10px", fontSize: 11, background: selectedType === type ? "rgba(109,40,217,0.15)" : "none", border: "none", borderRadius: 6, color: selectedType === type ? "var(--os-accent)" : "var(--os-text-dim)", cursor: "pointer" }}>
              {type}
            </button>
          ))}
        </div>
      )}

      {showAddForm && (
        <div className="glass-panel" style={{ marginBottom: 24 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600 }}>New Entry {selectedCategoryId && <span style={{ fontSize: 12, color: "var(--os-accent)", fontWeight: 400 }}>in {categories.find(c => c.id === selectedCategoryId)?.title}</span>}</h3>
            <button onClick={() => setShowAddForm(false)} style={{ background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}><X size={18} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
            <input className="glass-input" value={newEntry.competition} onChange={(e) => setNewEntry({ ...newEntry, competition: e.target.value })} placeholder="Competition" autoFocus />
            <input className="glass-input" value={newEntry.type} onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })} placeholder="Type" />
            <input className="glass-input" type="number" min="2000" max="2099" value={newEntry.year} onChange={(e) => setNewEntry({ ...newEntry, year: e.target.value })} placeholder="Year" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: "var(--os-text-dim)", display: "block", marginBottom: 6 }}>Links</label>
            <LinksInput links={newLinks} labels={newLabels} setLinks={setNewLinks} setLabels={setNewLabels} />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addEntry} className="glass-btn glass-btn-primary">Add</button>
            <button onClick={() => setShowAddForm(false)} className="glass-btn glass-btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="empty-state">
          <p className="text-secondary text-sm">Loading...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Archive size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>No entries found</h2>
          <p className="text-secondary text-sm">{entries.length === 0 ? "Add your first archive entry." : "No entries match this filter."}</p>
        </div>
      ) : (
        <div className="glass-panel archive-table-wrap" style={{ padding: 0, overflow: "hidden", maxWidth: 900, margin: "0 auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.35)" }}>
                <th style={{ textAlign: "left", padding: "14px 12px", fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Competition</th>
                <th onClick={() => setTypeSort(typeSort === "asc" ? "desc" : typeSort === "desc" ? "" : "asc")} style={{ textAlign: "left", padding: "14px 12px", fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                  Type {typeSort === "asc" ? "↑" : typeSort === "desc" ? "↓" : "↕"}
                </th>
                <th onClick={() => setYearSort(yearSort === "asc" ? "desc" : yearSort === "desc" ? "" : "asc")} style={{ textAlign: "left", padding: "14px 12px", fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>
                  Year {yearSort === "asc" ? "↑" : yearSort === "desc" ? "↓" : "↕"}
                </th>
                {isAdmin && <th style={{ width: 60 }}></th>}
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {editingId === entry.id ? (
                    <td colSpan={isAdmin ? 4 : 3} style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 10 }}>
                          <input className="glass-input" value={editValues.competition} onChange={(e) => setEditValues({ ...editValues, competition: e.target.value })} placeholder="Competition" />
                          <input className="glass-input" value={editValues.type} onChange={(e) => setEditValues({ ...editValues, type: e.target.value })} placeholder="Type" />
                          <input className="glass-input" type="number" min="2000" max="2099" value={editValues.year} onChange={(e) => setEditValues({ ...editValues, year: e.target.value })} placeholder="Year" />
                        </div>
                        <div>
                          <label style={{ fontSize: 12, color: "var(--os-text-dim)", display: "block", marginBottom: 6 }}>Links</label>
                          <LinksInput links={editLinks} labels={editLabels} setLinks={setEditLinks} setLabels={setEditLabels} />
                        </div>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={() => saveEdit(entry.id)} className="glass-btn" style={{ padding: "6px 14px", fontSize: 12, background: "rgba(16,185,129,0.1)", color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }}><Check size={14} /> Save</button>
                          <button onClick={() => setEditingId(null)} className="glass-btn" style={{ padding: "6px 14px", fontSize: 12 }}><X size={14} /> Cancel</button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td style={{ padding: "14px 12px", fontSize: 14, fontWeight: 500 }}>
                        {renderLinks(entry)}
                      </td>
                      <td style={{ padding: "14px 12px", fontSize: 14, color: "var(--os-text-secondary)", whiteSpace: "nowrap" }}>{entry.type}</td>
                      <td style={{ padding: "14px 12px", fontSize: 14, color: "var(--os-text-secondary)", whiteSpace: "nowrap" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Calendar size={14} /> {entry.year || "—"}</span>
                      </td>
                      {isAdmin && (
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => startEdit(entry)} style={{ background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}><Pencil size={14} /></button>
                            <button onClick={() => setConfirmDeleteId(entry.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      )}
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
