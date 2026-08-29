"use client";

import { useState, useMemo } from "react";
import { TodoProvider, useTodos, Todo, Deck } from "@/components/todo/todo-context";
import {
  Plus, Trash2, Pencil, Check, X, Calendar, CheckSquare,
  ArrowUpDown, Flag, Clock, Layers, FolderOpen,
  Circle, PanelLeftOpen, Link as LinkIcon
} from "lucide-react";

type FilterStatus = "all" | "active" | "completed";
type SortBy = "created" | "dueDate" | "priority";

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  high: { label: "High", color: "bg-red-500/10 text-red-600 dark:text-red-400" },
};

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const DECK_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
  "#10b981", "#06b6d4", "#3b82f6", "#f97316", "#64748b",
];

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

  const [newTodo, setNewTodo] = useState<{ title: string; description: string; priority: "low" | "medium" | "high"; dueDate: string }>({
    title: "", description: "", priority: "medium", dueDate: "",
  });
  const [editValues, setEditValues] = useState<{ title: string; description: string; priority: "low" | "medium" | "high"; dueDate: string }>({
    title: "", description: "", priority: "medium", dueDate: "",
  });

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
    todos.forEach((t) => {
      const d = counts[t.deck];
      if (d) {
        d.total++;
        if (t.completed) d.completed++;
        else d.active++;
      }
    });
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
    setNewDeckName("");
    setNewDeckColor(DECK_COLORS[0]);
    setShowNewDeck(false);
  };

  const startRenameDeck = (deck: Deck) => {
    setRenamingDeckId(deck.id);
    setRenameDeckValue(deck.name);
  };

  const saveRenameDeck = () => {
    if (!renamingDeckId || !renameDeckValue.trim()) return;
    renameDeck(renamingDeckId, renameDeckValue.trim());
    setRenamingDeckId(null);
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date(new Date().toDateString());
  };

  const formatDate = (d: string) => {
    if (!d) return null;
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const activeDeckData = decks.find((d) => d.id === activeDeck);

  return (
    <div className="flex h-screen relative">
      {/* Mobile overlay */}
      {showSidebar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar */}
      <div className={`${showSidebar ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 fixed md:static inset-y-0 left-0 z-40 w-72 md:w-64 border-r bg-background md:bg-card/30 backdrop-blur-sm flex flex-col flex-shrink-0 transition-transform`}>
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold flex items-center gap-2 text-sm">
            <Layers className="h-4 w-4" /> Decks
          </h2>
          <button onClick={() => setShowSidebar(false)} className="md:hidden p-1 hover:bg-muted rounded-lg transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-0.5">
          <button
            onClick={() => setActiveDeck(null)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
              activeDeck === null ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderOpen className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">All Tasks</span>
            <span className="text-xs opacity-70">{globalCounts.all}</span>
          </button>

          {decks.map((deck) => (
            <div key={deck.id}>
              {renamingDeckId === deck.id ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <input
                    value={renameDeckValue}
                    onChange={(e) => setRenameDeckValue(e.target.value)}
                    className="flex-1 px-2 py-1.5 rounded-lg border bg-background text-sm"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === "Enter") saveRenameDeck(); if (e.key === "Escape") setRenamingDeckId(null); }}
                    onBlur={saveRenameDeck}
                  />
                </div>
              ) : (
                <button
                  onClick={() => setActiveDeck(deck.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors group ${
                    activeDeck === deck.id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Circle className="h-3 w-3 flex-shrink-0" style={{ fill: deck.color, color: deck.color }} />
                  <span className="flex-1 truncate">{deck.name}</span>
                  <span className="text-xs opacity-70">{deckCounts[deck.id]?.active || 0}</span>
                  {deck.id !== "general" && (
                    <div className={`flex gap-0.5 ${activeDeck === deck.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                      <button
                        onClick={(e) => { e.stopPropagation(); startRenameDeck(deck); }}
                        className="p-0.5 hover:bg-background/20 rounded"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteDeck(deck.id); }}
                        className="p-0.5 hover:bg-background/20 rounded text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </button>
              )}
            </div>
          ))}

          {showNewDeck ? (
            <div className="px-2 py-1 space-y-2">
              <input
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                placeholder="Deck name"
                className="w-full px-2 py-1.5 rounded-lg border bg-background text-sm"
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleAddDeck(); if (e.key === "Escape") setShowNewDeck(false); }}
              />
              <div className="flex gap-1 flex-wrap">
                {DECK_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewDeckColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${newDeckColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-1">
                <button onClick={handleAddDeck} className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium">Create</button>
                <button onClick={() => setShowNewDeck(false)} className="px-3 py-1 bg-muted rounded-lg text-xs">Cancel</button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewDeck(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Deck</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 hover:bg-muted rounded-xl transition-colors">
                <PanelLeftOpen className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
                  {activeDeckData ? (
                    <>
                      <Circle className="h-6 w-6" style={{ fill: activeDeckData.color, color: activeDeckData.color }} />
                      {activeDeckData.name}
                    </>
                  ) : (
                    <>
                      <CheckSquare className="h-7 w-7" /> Tasks
                    </>
                  )}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeDeck ? deckCounts[activeDeck]?.active || 0 : globalCounts.active} active, {" "}
                  {activeDeck ? deckCounts[activeDeck]?.completed || 0 : globalCounts.completed} completed
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Task</span>
            </button>
          </div>

          {/* Filters & Sort */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-1 border rounded-xl p-1 bg-muted/30">
              {(["all", "active", "completed"] as FilterStatus[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-1.5 rounded-xl border bg-background text-sm"
              >
                <option value="created">Date Created</option>
                <option value="dueDate">Due Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>

          {/* Add Form */}
          {showAddForm && (
            <div className="mb-6 p-5 rounded-2xl border bg-card backdrop-blur-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">New Task</h3>
                <button onClick={() => setShowAddForm(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <input
                type="text"
                value={newTodo.title}
                onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
                placeholder="Task title"
                className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
              <textarea
                value={newTodo.description}
                onChange={(e) => setNewTodo({ ...newTodo, description: e.target.value })}
                placeholder="Description (optional)"
                className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm resize-none h-20"
              />
              <div className="flex gap-3 items-center flex-wrap">
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={newTodo.priority}
                    onChange={(e) => setNewTodo({ ...newTodo, priority: e.target.value as "low" | "medium" | "high" })}
                    className="px-2 py-1.5 rounded-xl border bg-background text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={newTodo.dueDate}
                    onChange={(e) => setNewTodo({ ...newTodo, dueDate: e.target.value })}
                    className="px-2 py-1.5 rounded-xl border bg-background text-sm"
                  />
                </div>
                {activeDeck && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Circle className="h-2.5 w-2.5" style={{ fill: activeDeckData?.color, color: activeDeckData?.color }} />
                    {activeDeckData?.name}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={handleAdd} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
                  Add Task
                </button>
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 bg-muted rounded-xl text-sm hover:bg-muted/80 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Task List */}
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <CheckSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-semibold mb-1">
                {filter === "all" ? "No tasks yet" : `No ${filter} tasks`}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filter === "all" ? "Add your first task above!" : "Try a different filter."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((todo) => {
                const todoDeck = decks.find((d) => d.id === todo.deck);
                return (
                  <div
                    key={todo.id}
                    className={`group p-4 rounded-2xl border bg-card hover:bg-muted/30 transition-all duration-200 ${
                      todo.completed ? "opacity-60" : ""
                    }`}
                  >
                    {editingId === todo.id ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={editValues.title}
                          onChange={(e) => setEditValues({ ...editValues, title: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm font-medium"
                          autoFocus
                          onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        />
                        <textarea
                          value={editValues.description}
                          onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                          placeholder="Description (optional)"
                          className="w-full px-4 py-2.5 rounded-xl border bg-background text-sm resize-none h-16"
                        />
                        <div className="flex gap-3 items-center flex-wrap">
                          <select
                            value={editValues.priority}
                            onChange={(e) => setEditValues({ ...editValues, priority: e.target.value as "low" | "medium" | "high" })}
                            className="px-2 py-1.5 rounded-xl border bg-background text-sm"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                          <input
                            type="date"
                            value={editValues.dueDate}
                            onChange={(e) => setEditValues({ ...editValues, dueDate: e.target.value })}
                            className="px-2 py-1.5 rounded-xl border bg-background text-sm"
                          />
                          <div className="flex gap-1 ml-auto">
                            <button onClick={saveEdit} className="p-1.5 hover:bg-green-500/10 rounded-lg text-green-600"><Check className="h-4 w-4" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-600"><X className="h-4 w-4" /></button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleTodo(todo.id)}
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${
                            todo.completed ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 hover:border-primary"
                          }`}
                        >
                          {todo.completed && <Check className="h-3 w-3" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium ${todo.completed ? "line-through text-muted-foreground" : ""}`}>
                              {todo.title}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded-md ${PRIORITY_CONFIG[todo.priority].color}`}>
                              {PRIORITY_CONFIG[todo.priority].label}
                            </span>
                            {!activeDeck && todoDeck && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Circle className="h-2 w-2" style={{ fill: todoDeck.color, color: todoDeck.color }} />
                                {todoDeck.name}
                              </span>
                            )}
                            {todo.dueDate && (
                              <span className={`text-xs flex items-center gap-1 ${
                                isOverdue(todo.dueDate) && !todo.completed ? "text-red-500" : "text-muted-foreground"
                              }`}>
                                <Clock className="h-3 w-3" />
                                {formatDate(todo.dueDate)}
                              </span>
                            )}
                          </div>
                          {todo.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{todo.description}</p>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEdit(todo)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => deleteTodo(todo.id)} className="p-1.5 hover:bg-red-500/10 rounded-lg text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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
  return (
    <TodoProvider>
      <TodoApp />
    </TodoProvider>
  );
}
