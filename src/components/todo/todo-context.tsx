"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

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

export function TodoProvider({ children }: { children: ReactNode }) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setTodos(loadTodos());
    setDecks(loadDecks());
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) saveTodos(todos);
  }, [todos, loaded]);

  useEffect(() => {
    if (loaded) saveDecks(decks);
  }, [decks, loaded]);

  const addTodo = useCallback((data: Omit<Todo, "id" | "createdAt" | "completed">) => {
    const newTodo: Todo = {
      ...data,
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      completed: false,
      createdAt: Date.now(),
    };
    setTodos((prev) => [newTodo, ...prev]);
  }, []);

  const updateTodo = useCallback((id: string, updates: Partial<Todo>) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  const deleteTodo = useCallback((id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toggleTodo = useCallback((id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  }, []);

  const addDeck = useCallback((name: string, color: string) => {
    const newDeck: Deck = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      name,
      color,
      createdAt: Date.now(),
    };
    setDecks((prev) => [...prev, newDeck]);
  }, []);

  const renameDeck = useCallback((id: string, name: string) => {
    setDecks((prev) => prev.map((d) => (d.id === id ? { ...d, name } : d)));
  }, []);

  const deleteDeck = useCallback((id: string) => {
    setDecks((prev) => prev.filter((d) => d.id !== id));
    setTodos((prev) => prev.map((t) => (t.deck === id ? { ...t, deck: "general" } : t)));
  }, []);

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
