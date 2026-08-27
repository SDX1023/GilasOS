"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Check, X, Trophy, Calendar } from "lucide-react";

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
  } catch {
    return [];
  }
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
    if (password === "SDX102310") {
      sessionStorage.setItem("archive_admin", "SDX102310");
      setIsAdmin(true);
    }
  };

  const addEntry = () => {
    if (!newEntry.competition.trim()) return;
    const entry: ArchiveEntry = {
      id: Date.now().toString(),
      ...newEntry,
    };
    const updated = [...entries, entry];
    setEntries(updated);
    saveEntries(updated);
    setNewEntry({ competition: "", competitionUrl: "", type: "", date: "" });
    setShowAddForm(false);
  };

  const deleteEntry = (id: string) => {
    if (!confirm("Delete this entry?")) return;
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveEntries(updated);
  };

  const startEdit = (entry: ArchiveEntry) => {
    setEditingId(entry.id);
    setEditValues({ competition: entry.competition, competitionUrl: entry.competitionUrl || "", type: entry.type, date: entry.date });
  };

  const saveEdit = (id: string) => {
    const updated = entries.map((e) =>
      e.id === id ? { ...e, ...editValues } : e
    );
    setEntries(updated);
    saveEntries(updated);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Archive</h1>
          <p className="text-muted-foreground mt-1">Competition history and records</p>
        </div>
        {isAdmin ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" /> Add Entry
          </button>
        ) : (
          <button
            onClick={handleAdminLogin}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted text-sm text-muted-foreground"
          >
            <Pencil className="h-3 w-3" /> Admin Edit
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="mb-6 p-4 rounded-xl border bg-card space-y-3">
          <h3 className="font-semibold">New Entry</h3>
          <div className="grid grid-cols-4 gap-3">
            <input
              type="text"
              value={newEntry.competition}
              onChange={(e) => setNewEntry({ ...newEntry, competition: e.target.value })}
              placeholder="Competition"
              className="px-3 py-2 rounded-lg border bg-background text-sm"
              autoFocus
            />
            <input
              type="url"
              value={newEntry.competitionUrl}
              onChange={(e) => setNewEntry({ ...newEntry, competitionUrl: e.target.value })}
              placeholder="Link (optional)"
              className="px-3 py-2 rounded-lg border bg-background text-sm"
            />
            <input
              type="text"
              value={newEntry.type}
              onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value })}
              placeholder="Type"
              className="px-3 py-2 rounded-lg border bg-background text-sm"
            />
            <input
              type="date"
              value={newEntry.date}
              onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
              className="px-3 py-2 rounded-lg border bg-background text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={addEntry} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              Add
            </button>
            <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-muted rounded-lg text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No archive entries yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left px-4 py-3 text-sm font-semibold">Competition</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Type</th>
                <th className="text-left px-4 py-3 text-sm font-semibold">Date</th>
                {isAdmin && <th className="w-20 px-4 py-3"></th>}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  {editingId === entry.id ? (
                    <>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editValues.competition}
                          onChange={(e) => setEditValues({ ...editValues, competition: e.target.value })}
                          className="w-full px-2 py-1 rounded border bg-background text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="url"
                          value={editValues.competitionUrl}
                          onChange={(e) => setEditValues({ ...editValues, competitionUrl: e.target.value })}
                          placeholder="Link (optional)"
                          className="w-full px-2 py-1 rounded border bg-background text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          value={editValues.type}
                          onChange={(e) => setEditValues({ ...editValues, type: e.target.value })}
                          className="w-full px-2 py-1 rounded border bg-background text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="date"
                          value={editValues.date}
                          onChange={(e) => setEditValues({ ...editValues, date: e.target.value })}
                          className="w-full px-2 py-1 rounded border bg-background text-sm"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => saveEdit(entry.id)} className="p-1 hover:bg-muted rounded text-green-600">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={cancelEdit} className="p-1 hover:bg-muted rounded text-red-600">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-sm font-medium">
                        {entry.competitionUrl ? (
                          <a
                            href={entry.competitionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {entry.competition}
                          </a>
                        ) : (
                          entry.competition
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{entry.type}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {entry.date || "—"}
                      </td>
                      {isAdmin && (
                        <td className="px-4 py-2">
                          <div className="flex gap-1">
                            <button onClick={() => startEdit(entry)} className="p-1 hover:bg-muted rounded text-muted-foreground">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => deleteEntry(entry.id)} className="p-1 hover:bg-muted rounded text-red-500">
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
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
