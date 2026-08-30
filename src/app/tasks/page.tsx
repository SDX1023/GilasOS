"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TodoProvider, useTodos, Todo, Deck } from "@/components/todo/todo-context";
import {
  Plus, Trash2, Pencil, Check, X, Calendar, CheckSquare,
  ArrowUpDown, Flag, Clock, Layers, FolderOpen,
  Circle, PanelLeftOpen, PanelLeftClose
} from "lucide-react";

type FilterStatus = "all" | "active" | "completed";
type SortBy = "created" | "dueDate" | "priority";

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "#3b82f6" },
  medium: { label: "Medium", color: "#f59e0b" },
  high: { label: "High", color: "#ef4444" },
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const DECK_COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", "#f97316", "#64748b"];

function TodoApp() {
  const { todos, decks, addTodo, updateTodo, deleteTodo, toggleTodo, addDeck, renameDeck, deleteDeck } = useTodos();
  const [activeDeck, setActiveDeck] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [sortBy, setSortBy] = useState<SortBy>("created");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [newDeckName, setNewDeckName] = useState("");
  const [newDeckColor, setNewDeckColor] = useState(DECK_COLORS[0]);
  const [renamingDeckId, setRenamingDeckId] = useState<string | null>(null);
  const [renameDeckValue, setRenameDeckValue] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [newTodo, setNewTodo] = useState({ title: "", description: "", priority: "medium" as "low" | "medium" | "high", dueDate: "" });
  const [editValues, setEditValues] = useState({ title: "", description: "", priority: "medium" as "low" | "medium" | "high", dueDate: "" });

  const filtered = useMemo(() => {
    let result = todos;
    if (activeDeck) result = result.filter((t) => t.deck === activeDeck);
    if (filter === "active") result = result.filter((t) => !t.completed);
    if (filter === "completed") result = result.filter((t) => t.completed);
    return [...result].sort((a, b) => {
      if (sortBy === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (sortBy === "dueDate") {
        if (!a.dueDate && !b.dueDate) return b.createdAt - a.createdAt;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      return b.createdAt - a.createdAt;
    });
  }, [todos, activeDeck, filter, sortBy]);

  const deckCounts = useMemo(() => {
    const counts: Record<string, { total: number; active: number; completed: number }> = {};
    decks.forEach((d) => { counts[d.id] = { total: 0, active: 0, completed: 0 }; });
    todos.forEach((t) => { const d = counts[t.deck]; if (d) { d.total++; if (t.completed) d.completed++; else d.active++; } });
    return counts;
  }, [todos, decks]);

  const globalCounts = useMemo(() => ({
    all: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  }), [todos]);

  const handleAdd = () => {
    if (!newTodo.title.trim()) return;
    addTodo({ ...newTodo, deck: activeDeck || "general" });
    setNewTodo({ title: "", description: "", priority: "medium", dueDate: "" });
    setShowAddForm(false);
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditValues({ title: todo.title, description: todo.description, priority: todo.priority, dueDate: todo.dueDate });
  };

  const saveEdit = () => {
    if (!editingId || !editValues.title.trim()) return;
    updateTodo(editingId, editValues);
    setEditingId(null);
  };

  const handleAddDeck = () => {
    if (!newDeckName.trim()) return;
    addDeck(newDeckName.trim(), newDeckColor);
    setNewDeckName(""); setNewDeckColor(DECK_COLORS[0]); setShowNewDeck(false);
  };

  const startRenameDeck = (deck: Deck) => { setRenamingDeckId(deck.id); setRenameDeckValue(deck.name); };
  const saveRenameDeck = () => { if (!renamingDeckId || !renameDeckValue.trim()) return; renameDeck(renamingDeckId, renameDeckValue.trim()); setRenamingDeckId(null); };

  const isOverdue = (dueDate: string) => dueDate ? new Date(dueDate) < new Date(new Date().toDateString()) : false;
  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : null;
  const activeDeckData = decks.find((d) => d.id === activeDeck);

  return (
    <div style={{ display: "flex", height: "100%" }}>
      {showSidebar && <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 30 }} onClick={() => setShowSidebar(false)} />}

      {/* Sidebar */}
      <div style={{
        width: 260, flexShrink: 0, borderRight: "1px solid var(--os-glass-border)",
        background: "var(--os-glass)", backdropFilter: "blur(20px)",
        display: "flex", flexDirection: "column",
        position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 40,
        transform: showSidebar ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.2s ease",
      }}>
        <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ fontWeight: 600, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}><Layers size={16} /> Decks</h2>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 8 }}>
          <button onClick={() => setActiveDeck(null)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
            background: activeDeck === null ? "var(--os-accent)" : "transparent", color: activeDeck === null ? "#fff" : "var(--os-text-secondary)",
            border: "none", cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "Inter, sans-serif",
          }}>
            <FolderOpen size={16} /> <span style={{ flex: 1 }}>All Tasks</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>{globalCounts.all}</span>
          </button>
          {decks.map((deck) => (
            <div key={deck.id}>
              {renamingDeckId === deck.id ? (
                <div style={{ padding: "4px 8px" }}>
                  <input className="glass-input" value={renameDeckValue} onChange={(e) => setRenameDeckValue(e.target.value)} autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") saveRenameDeck(); if (e.key === "Escape") setRenamingDeckId(null); }} onBlur={saveRenameDeck} style={{ fontSize: 13 }} />
                </div>
              ) : (
                <button onClick={() => setActiveDeck(deck.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                  background: activeDeck === deck.id ? "var(--os-accent)" : "transparent", color: activeDeck === deck.id ? "#fff" : "var(--os-text-secondary)",
                  border: "none", cursor: "pointer", fontSize: 13, textAlign: "left", fontFamily: "Inter, sans-serif",
                }}>
                  <Circle size={10} style={{ fill: deck.color, color: deck.color, flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{deck.name}</span>
                  <span style={{ fontSize: 11, opacity: 0.7 }}>{deckCounts[deck.id]?.active || 0}</span>
                  {deck.id !== "general" && (
                    <div style={{ display: "flex", gap: 2 }}>
                      <button onClick={(e) => { e.stopPropagation(); startRenameDeck(deck); }} style={{ background: "none", border: "none", padding: 4, color: "inherit", cursor: "pointer" }}><Pencil size={12} /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }} style={{ background: "none", border: "none", padding: 4, color: "#ef4444", cursor: "pointer" }}><Trash2 size={12} /></button>
                    </div>
                  )}
                </button>
              )}
            </div>
          ))}
          {showNewDeck ? (
            <div style={{ padding: "8px", marginTop: 4 }}>
              <input className="glass-input" value={newDeckName} onChange={(e) => setNewDeckName(e.target.value)} placeholder="Deck name" autoFocus style={{ fontSize: 13, marginBottom: 8 }}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddDeck(); if (e.key === "Escape") setShowNewDeck(false); }} />
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
                {DECK_COLORS.map((c) => (
                  <button key={c} onClick={() => setNewDeckColor(c)} style={{
                    width: 20, height: 20, borderRadius: "50%", border: newDeckColor === c ? "2px solid #fff" : "2px solid transparent",
                    background: c, cursor: "pointer",
                  }} />
                ))}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={handleAddDeck} className="glass-btn glass-btn-primary" style={{ padding: "6px 14px", fontSize: 12 }}>Create</button>
                <button onClick={() => setShowNewDeck(false)} className="glass-btn glass-btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }}>Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowNewDeck(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", fontSize: 13, fontFamily: "Inter, sans-serif" }}>
              <Plus size={16} /> New Deck
            </button>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 20px" }}>
          <div className="flex-between" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setShowSidebar(!showSidebar)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-dim)" }}>{showSidebar ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}</button>
              <div>
                <h1 className="page-title" style={{ fontSize: 24 }}>
                  {activeDeckData ? <><Circle size={22} style={{ fill: activeDeckData.color, color: activeDeckData.color }} /> {activeDeckData.name}</> : <><CheckSquare size={24} /> Tasks</>}
                </h1>
                <p className="text-secondary text-sm" style={{ marginTop: 2 }}>
                  {activeDeck ? deckCounts[activeDeck]?.active || 0 : globalCounts.active} active, {activeDeck ? deckCounts[activeDeck]?.completed || 0 : globalCounts.completed} completed
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link href="/study/calendar" className="glass-btn glass-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={16} /> <span>Calendar</span>
              </Link>
              <button onClick={() => setShowAddForm(true)} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Plus size={16} /> <span>Add Task</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex-between" style={{ marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.35)" }}>
              {(["all", "active", "completed"] as FilterStatus[]).map((f) => (
                <button key={f} onClick={() => setFilter(f)} style={{
                  padding: "6px 14px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif",
                  background: filter === f ? "rgba(255,255,255,0.08)" : "transparent", color: filter === f ? "var(--os-text-primary)" : "var(--os-text-dim)",
                }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ArrowUpDown size={14} style={{ color: "var(--os-text-dim)" }} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortBy)} className="glass-input" style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}>
                <option value="created">Date Created</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="glass-panel" style={{ marginBottom: 20 }}>
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <h3 style={{ fontWeight: 600 }}>New Task</h3>
                <button onClick={() => setShowAddForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-dim)" }}><X size={18} /></button>
              </div>
              <input className="glass-input" value={newTodo.title} onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })} placeholder="Task title" autoFocus onKeyDown={(e) => e.key === "Enter" && handleAdd()} style={{ marginBottom: 10 }} />
              <textarea className="glass-input" value={newTodo.description} onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })} placeholder="Description (optional)" style={{ height: 80, resize: "none", marginBottom: 10 }} />
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Flag size={14} style={{ color: "var(--os-text-dim)" }} />
                  <select value={newTodo.priority} onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as any })} className="glass-input" style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Calendar size={14} style={{ color: "var(--os-text-dim)" }} />
                  <input type="date" value={newTodo.dueDate} onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })} className="glass-input" style={{ width: "auto", padding: "6px 10px", fontSize: 13 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleAdd} className="glass-btn glass-btn-primary">Add Task</button>
                <button onClick={() => setShowAddForm(false)} className="glass-btn glass-btn-ghost">Cancel</button>
              </div>
            </div>
          )}

          {/* Tasks */}
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><CheckSquare size={32} style={{ color: "var(--os-text-dim)" }} /></div>
              <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{filter === "all" ? "No tasks yet" : `No ${filter} tasks`}</h2>
              <p className="text-secondary text-sm">{filter === "all" ? "Add your first task above!" : "Try a different filter."}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map((todo) => {
                const todoDeck = decks.find((d) => d.id === todo.deck);
                return (
                  <div key={todo.id} className="glass-card" style={{ padding: 16, opacity: todo.completed ? 0.5 : 1 }}>
                    {editingId === todo.id ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <input className="glass-input" value={editValues.title} onChange={(e) => setEditValues({ ...editValues, title: e.target.value })} autoFocus onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
                        <textarea className="glass-input" value={editValues.description} onChange={(e) => setEditValues({ ...editValues, description: e.target.value })} placeholder="Description" style={{ height: 60, resize: "none" }} />
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <select value={editValues.priority} onChange={(e) => setEditValues({ ...editValues, priority: e.target.value as any })} className="glass-input" style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}>
                            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                          </select>
                          <input type="date" value={editValues.dueDate} onChange={(e) => setEditValues({ ...editValues, dueDate: e.target.value })} className="glass-input" style={{ width: "auto", padding: "6px 10px", fontSize: 13 }} />
                          <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                            <button onClick={saveEdit} style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer" }}><Check size={16} /></button>
                            <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><X size={16} /></button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        <button onClick={() => toggleTodo(todo.id)} style={{
                          marginTop: 2, width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                          border: `2px solid ${todo.completed ? "var(--os-accent)" : "rgba(255,255,255,0.15)"}`,
                          background: todo.completed ? "var(--os-accent)" : "transparent",
                          color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>{todo.completed && <Check size={12} />}</button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 500, textDecoration: todo.completed ? "line-through" : "none", color: todo.completed ? "var(--os-text-dim)" : "var(--os-text-primary)" }}>{todo.title}</span>
                            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: `${PRIORITY_CONFIG[todo.priority].color}15`, color: PRIORITY_CONFIG[todo.priority].color }}>{PRIORITY_CONFIG[todo.priority].label}</span>
                            {!activeDeck && todoDeck && <span className="text-xs text-dim" style={{ display: "flex", alignItems: "center", gap: 4 }}><Circle size={8} style={{ fill: todoDeck.color, color: todoDeck.color }} /> {todoDeck.name}</span>}
                            {todo.dueDate && <span className="text-xs" style={{ color: isOverdue(todo.dueDate) && !todo.completed ? "#ef4444" : "var(--os-text-dim)", display: "flex", alignItems: "center", gap: 4 }}><Clock size={12} /> {formatDate(todo.dueDate)}</span>}
                          </div>
                          {todo.description && <p className="text-secondary text-sm" style={{ marginTop: 4 }}>{todo.description}</p>}
                        </div>
                        <div style={{ display: "flex", gap: 4, opacity: 0.4, transition: "opacity 0.2s" }}>
                          <button onClick={() => startEdit(todo)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-dim)", padding: 4 }}><Pencil size={14} /></button>
                          <button onClick={() => deleteTodo(todo.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", padding: 4 }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TodoPage() {
  return <TodoProvider><TodoApp /></TodoProvider>;
}
