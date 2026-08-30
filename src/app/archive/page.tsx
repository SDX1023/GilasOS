"use client";

import { useState, useEffect } from "react";
import { Archive, Plus, Trash2, Pencil, Check, X, Calendar, ExternalLink } from "lucide-react";

interface ArchiveEntry {
  id: string;
  competition: string;
  competitionUrl: string;
  type: string;
  date: string;
}

function loadEntries(): ArchiveEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem("archive_entries");
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveEntries(entries: ArchiveEntry[]) {
  localStorage.setItem("archive_entries", JSON.stringify(entries));
}

export default function ArchivePage() {
  const [entries, setEntries] = useState<ArchiveEntry[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEntry, setNewEntry] = useState({ competition: "", competitionUrl: "", type: "", date: "" });
  const [editValues, setEditValues] = useState({ competition: "", competitionUrl: "", type: "", date: "" });

  useEffect(() => {
    setEntries(loadEntries());
    const password = sessionStorage.getItem("archive_admin");
    setIsAdmin(password === "SDX102310");
  }, []);

  const handleAdminLogin = () => {
    const password = prompt("Enter admin password:");
    if (password === "SDX102310") { sessionStorage.setItem("archive_admin", "SDX102310"); setIsAdmin(true); }
  };

  const addEntry = () => {
    if (!newEntry.competition.trim()) return;
    const entry: ArchiveEntry = { id: Date.now().toString(), ...newEntry };
    const updated = [...entries, entry];
    setEntries(updated); saveEntries(updated);
    setNewEntry({ competition: "", competitionUrl: "", type: "", date: "" });
    setShowAddForm(false);
  };

  const deleteEntry = (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated); saveEntries(updated);
  };

  const startEdit = (entry: ArchiveEntry) => {
    setEditingId(entry.id);
    setEditValues({ competition: entry.competition, competitionUrl: entry.competitionUrl || "", type: entry.type, date: entry.date });
  };

  const saveEdit = (id: string) => {
    const updated = entries.map((e) => (e.id === id ? { ...e, ...editValues } : e));
    setEntries(updated); saveEntries(updated); setEditingId(null);
  };

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
            <input className="glass-input" value={newEntry.competitionUrl} onChange={(e) => setNewEntry({ ...newEntry, competitionUrl: e.target.value })} placeholder="Link (optional)" />
            <input className="glass-input" value={newEntry.type} onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })} placeholder="Type" />
            <input className="glass-input" type="number" min="2000" max="2099" value={newEntry.date} onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })} placeholder="Year" />
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={addEntry} className="glass-btn glass-btn-primary">Add</button>
            <button onClick={() => setShowAddForm(false)} className="glass-btn glass-btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Archive size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>No archive entries yet</h2>
          <p className="text-secondary text-sm">Competition records will appear here.</p>
        </div>
      ) : (
        <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
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
                    <>
                      <td style={{ padding: "10px 20px" }}><input className="glass-input" value={editValues.competition} onChange={(e) => setEditValues({ ...editValues, competition: e.target.value })} /></td>
                      <td style={{ padding: "10px 20px" }}><input className="glass-input" value={editValues.competitionUrl} onChange={(e) => setEditValues({ ...editValues, competitionUrl: e.target.value })} placeholder="Link" /></td>
                      <td style={{ padding: "10px 20px" }}><input className="glass-input" value={editValues.type} onChange={(e) => setEditValues({ ...editValues, type: e.target.value })} /></td>
                      <td style={{ padding: "10px 20px" }}><input className="glass-input" type="number" min="2000" max="2099" value={editValues.date} onChange={(e) => setEditValues({ ...editValues, date: e.target.value })} placeholder="Year" /></td>
                      <td style={{ padding: "10px 20px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button onClick={() => saveEdit(entry.id)} style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer" }}><Check size={16} /></button>
                          <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><X size={16} /></button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: "14px 20px", fontSize: 14, fontWeight: 500 }}>
                        {entry.competitionUrl ? (
                          <a href={entry.competitionUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--os-accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
                            {entry.competition} <ExternalLink size={12} />
                          </a>
                        ) : entry.competition}
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "var(--os-text-secondary)" }}>{entry.type}</td>
                      <td style={{ padding: "14px 20px", fontSize: 14, color: "var(--os-text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                        <Calendar size={14} /> {entry.date || "—"}
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
