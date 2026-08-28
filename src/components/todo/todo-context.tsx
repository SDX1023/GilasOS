"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";

interface Todo {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  dueDate: string;
  completed: boolean;
  deck: string;
  createdAt: number;
}

interface Deck {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

interface TodoContextType {
  todos: Todo[];
  decks: Deck[];
  addTodo: (todo: Omit<Todo, "id" | "createdAt" | "completed">) => void;
  updateTodo: (id: string, updates: Partial<Todo>) => void;
  deleteTodo: (id: string) => void;
  toggleTodo: (id: string) => void;
  addDeck: (name: string, color: string) => void;
  renameDeck: (id: string, name: string) => void;
  deleteDeck: (id: string) => void;
}

const TodoContext = createContext<TodoContextType | null>(null);

const TODOS_KEY = "gilasos_todos";
const DECKS_KEY = "gilasos_decks";

const DEFAULT_DECKS: Deck[] = [
  { id: "general", name: "General", color: "#6366f1", createdAt: 0 },
  { id: "school", name: "School", color: "#f59e0b", createdAt: 0 },
  { id: "personal", name: "Personal", color: "#10b981", createdAt: 0 },
];

function loadTodos(): Todo[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(TODOS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadDecks(): Deck[] {
  if (typeof window === "undefined") return DEFAULT_DECKS;
  try {
    const stored = localStorage.getItem(DECKS_KEY);
    if (!stored) return DEFAULT_DECKS;
    const parsed = JSON.parse(stored);
    return parsed.length > 0 ? parsed : DEFAULT_DECKS;
  } catch {
    return DEFAULT_DECKS;
  }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(TODOS_KEY, JSON.stringify(todos));
}

function saveDecks(decks: Deck[]) {
  localStorage.setItem(DECKS_KEY, JSON.stringify(decks));
}

async function loadTodosFromSupabase(userId: string): Promise<Todo[]> {
  const supabase = getSupabase();
  const { data } = await supabase.from("todos").select("*").eq("user_id", userId);
  if (!data) return [];
  return data.map((r: any) => ({
    id: r.id,
    title: r.title,
    description: r.description || "",
    priority: r.priority || "medium",
    dueDate: r.due_date || "",
    completed: r.completed || false,
    deck: r.deck_id || "general",
    createdAt: new Date(r.created_at).getTime(),
  }));
}

async function loadDecksFromSupabase(userId: string): Promise<Deck[]> {
  const supabase = getSupabase();
  const { data } = await supabase.from("todo_decks").select("*").eq("user_id", userId);
  if (!data || data.length === 0) return DEFAULT_DECKS;
  return data.map((r: any) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    createdAt: new Date(r.created_at).getTime(),
  }));
}

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserId(user.id);
        const [cloudTodos, cloudDecks] = await Promise.all([
          loadTodosFromSupabase(user.id),
          loadDecksFromSupabase(user.id),
        ]);
        setTodos(cloudTodos);
        setDecks(cloudDecks);
      } else {
        setTodos(loadTodos());
        setDecks(loadDecks());
      }
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (loaded) saveTodos(todos);
  }, [todos, loaded]);

  useEffect(() => {
    if (loaded) saveDecks(decks);
  }, [decks, loaded]);

  const syncTodo = useCallback(async (todo: Todo) => {
    if (!userId) return;
    const supabase = getSupabase();
    await supabase.from("todos").upsert({
      id: todo.id,
      user_id: userId,
      deck_id: todo.deck,
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      due_date: todo.dueDate,
      completed: todo.completed,
      created_at: new Date(todo.createdAt).toISOString(),
    }, { onConflict: "id" });
  }, [userId]);

  const syncDeck = useCallback(async (deck: Deck) => {
    if (!userId) return;
    const supabase = getSupabase();
    await supabase.from("todo_decks").upsert({
      id: deck.id,
      user_id: userId,
      name: deck.name,
      color: deck.color,
      created_at: new Date(deck.createdAt).toISOString(),
    }, { onConflict: "id" });
  }, [userId]);

  const addTodo = useCallback((data: Omit<Todo, "id" | "createdAt" | "completed">) => {
    const newTodo: Todo = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => [newTodo, ...prev]);
    syncTodo(newTodo);
  }, [syncTodo]);

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setTodos((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      const todo = updated.find((t) => t.id === id);
      if (todo) syncTodo(todo);
      return updated;
    });
  }, [syncTodo]);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    if (userId) {
      const supabase = getSupabase();
      supabase.from("todos").delete().eq("id", id);
    }
  }, [userId]);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      const todo = updated.find((t) => t.id === id);
      if (todo) syncTodo(todo);
      return updated;
    });
  }, [syncTodo]);

  const addDeck = useCallback((name: string, color: string) => {
    const newDeck: Deck = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      name,
      color,
      createdAt: Date.now(),
    };
    setDecks((prev) => [...prev, newDeck]);
    syncDeck(newDeck);
  }, [syncDeck]);

  const renameDeck = useCallback((id: string, name: string) => {
    setDecks((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, name } : d));
      const deck = updated.find((d) => d.id === id);
      if (deck) syncDeck(deck);
      return updated;
    });
  }, [syncDeck]);

  const deleteDeck = useCallback((id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id));
    setTodos((prev) => prev.map((t) => (t.deck === id ? { ...t, deck: "general" } : t)));
    if (userId) {
      const supabase = getSupabase();
      supabase.from("todo_decks").delete().eq("id", id);
    }
  }, [userId]);

  return (
    <TodoContext.Provider value={{ todos, decks, addTodo, updateTodo, deleteTodo, toggleTodo, addDeck, renameDeck, deleteDeck }}>
      {children}
    </TodoContext.Provider>
  );
}

export function useTodos() {
  const ctx = useContext(TodoContext);
  if (!ctx) throw new Error("useTodos must be used within TodoProvider");
  return ctx;
}

export type { Todo, Deck };
