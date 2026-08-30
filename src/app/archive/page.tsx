"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Archive, Plus, Trash2, Pencil, Check, X, Calendar, ExternalLink, Link as LinkIcon } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

interface ArchiveEntry {
  id: string;
  competition: string;
  competition_url: string;
  links: string[];
  type: string;
  year: string;
}

export default function ArchivePage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ competition: "", type: "", year: "" });
  const [newLinks, setNewLinks] = useState<string[]>([""]);
  const [editValues, setEditValues] = useState({ competition: "", type: "", year: "" });
  const [editLinks, setEditLinks] = useState<string[]>([]);

  useEffect(() => {
    const password = sessionStorage.getItem("archive_admin");
    setIsAdmin(password === "SDX102310");
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase.from("archive_entries").select("*").order("year", { ascending: false });
    if (error) console.error("Archive load error:", error);
    const mapped = (data || []).map((e: any) => ({
      ...e,
      links: e.links || (e.competition_url ? [e.competition_url] : []),
    }));
    setEntries(mapped);
    setLoading(false);
  }

  const handleAdminLogin = () => {
    const password = prompt("Enter admin password:");
    if (password === "SDX102310") { sessionStorage.setItem("archive_admin", "SDX102310"); setIsAdmin(true); }
  };

  const getAllLinks = (entry: ArchiveEntry): string[] => {
    const links: string[] = [];
    if (entry.competition_url && !entry.links?.includes(entry.competition_url)) links.push(entry.competition_url);
    if (entry.links?.length) links.push(...entry.links);
    return [...new Set(links)].filter(Boolean);
  };

  const addEntry = async () => {
    if (!newEntry.competition.trim()) return;
    const supabase = getSupabase();
    const filteredLinks = newLinks.filter((l) => l.trim());
    const { error } = await supabase.from("archive_entries").insert({
      competition: newEntry.competition,
      competition_url: filteredLinks[0] || "",
      links: filteredLinks,
      type: newEntry.type,
      year: newEntry.year,
    });
    if (!error) {
      setNewEntry({ competition: "", type: "", year: "" });
      setNewLinks([""]);
      setShowAddForm(false);
      loadEntries();
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const supabase = getSupabase();
    await supabase.from("archive_entries").delete().eq("id", id);
    loadEntries();
  };

  const startEdit = (entry: ArchiveEntry) => {
    setEditingId(entry.id);
    setEditValues({ competition: entry.competition, type: entry.type, year: entry.year });
    const allLinks = getAllLinks(entry);
    setEditLinks(allLinks.length > 0 ? allLinks : [""]);
  };

  const saveEdit = async (id: string) => {
    const supabase = getSupabase();
    const filteredLinks = editLinks.filter((l) => l.trim());
    await supabase.from("archive_entries").update({
      competition: editValues.competition,
      competition_url: filteredLinks[0] || "",
      links: filteredLinks,
      type: editValues.type,
      year: editValues.year,
    }).eq("id", id);
    setEditingId(null);
    loadEntries();
  };

  const renderLinks = (entry: ArchiveEntry) => {
    const allLinks = getAllLinks(entry);
    if (allLinks.length === 0) return <span>{entry.competition}</span>;
    if (allLinks.length === 1) {
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
        <a href={allLinks[0]} target="_blank" rel="noopener noreferrer" style={{ color: "var(--os-accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
          {entry.competition} <ExternalLink size={12} />
        </a>
      );
    }
    return (
      <div>
        <p style={{ marginBottom: 4 }}>{entry.competition}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {allLinks.map((link, i) => (
            <a key={i} href={link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--os-accent)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, padding: "2px 8px", borderRadius: 6, background: "rgba(109,40,217,0.1)", border: "1px solid rgba(109,40,217,0.2)" }}>
              <LinkIcon size={10} /> Link {i + 1}
            </a>
          ))}
        </div>
      </div>
    );
  };

  const LinksInput = ({ links, setLinks }: { links: string[]; setLinks: (v: string[]) => void }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: "1 / -1" }}>
      {links.map((link, i) => (
        <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input className="glass-input" value={link} onChange={(e) => { const updated = [...links]; updated[i] = e.target.value; setLinks(updated); }} placeholder={`Link ${i + 1} (optional)`} style={{ flex: 1 }} />
          {links.length > 1 && (
            <button onClick={() => setLinks(links.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", padding: 4, flexShrink: 0 }}><X size={14} /></button>
          )}
        </div>
      ))}
      <button onClick={() => setLinks([...links, ""])} style={{ background: "none", border: "1px dashed rgba(255,255,255,0.2)", borderRadius: 8, color: "var(--os-text-dim)", cursor: "pointer", padding: "6px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4, alignSelf: "flex-start" }}>
        <Plus size={12} /> Add Link
      </button>
    </div>
  );

  return (
    <div className="page-container">
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

      {showAddForm && (
        <div className="glass-panel" style={{ marginBottom: 24 }}>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h3 style={{ fontWeight: 600 }}>New Entry</h3>
            <button onClick={() => setShowAddForm(false)} style={{ background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}><X size={18} /></button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
            <input className="glass-input" value={newEntry.competition} onChange={(e) => setNewEntry({ ...newEntry, competition: e.target.value })} placeholder="Competition" autoFocus />
            <input className="glass-input" value={newEntry.type} onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })} placeholder="Type" />
            <input className="glass-input" type="number" min="2000" max="2099" value={newEntry.year} onChange={(e) => setNewEntry({ ...newEntry, year: e.target.value })} placeholder="Year" />
            <LinksInput links={newLinks} setLinks={setNewLinks} />
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
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Archive size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>No archive entries yet</h2>
          <p className="text-secondary text-sm">Competition records will appear here.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.35)" }}>
                <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Competition</th>
                <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
                <th style={{ textAlign: "left", padding: "14px 20px", fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Year</th>
                {isAdmin && <th style={{ width: 80 }}></th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {editingId === entry.id ? (
                    <td colSpan={isAdmin ? 4 : 3} style={{ padding: "12px 20px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px", gap: 10 }}>
                          <input className="glass-input" value={editValues.competition} onChange={(e) => setEditValues({ ...editValues, competition: e.target.value })} placeholder="Competition" />
                          <input className="glass-input" value={editValues.type} onChange={(e) => setEditValues({ ...editValues, type: e.target.value })} placeholder="Type" />
                          <input className="glass-input" type="number" min="2000" max="2099" value={editValues.year} onChange={(e) => setEditValues({ ...editValues, year: e.target.value })} placeholder="Year" />
                        </div>
                        <LinksInput links={editLinks} setLinks={setEditLinks} />
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          <button onClick={() => saveEdit(entry.id)} className="glass-btn" style={{ padding: "6px 14px", fontSize: 12, background: "rgba(16,185,129,0.1)", color: "#10b981", borderColor: "rgba(16,185,129,0.3)" }}><Check size={14} /> Save</button>
                          <button onClick={() => setEditingId(null)} className="glass-btn" style={{ padding: "6px 14px", fontSize: 12 }}><X size={14} /> Cancel</button>
                        </div>
                      </div>
                    </td>
                  ) : (
                    <>
                      <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 500 }}>
                        {renderLinks(entry)}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "var(--os-text-secondary)" }}>{entry.type}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "var(--os-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={14} /> {entry.year || "—"}
                      </td>
                      {isAdmin && (
                        <td style={{ padding: "14px 20px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => startEdit(entry)} style={{ background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}><Pencil size={14} /></button>
                            <button onClick={() => deleteEntry(entry.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
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