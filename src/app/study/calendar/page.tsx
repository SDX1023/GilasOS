"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { useTodosSafe, Todo, Deck } from "@/components/todo/todo-context";
import { ChevronLeft, ChevronRight, Plus, X, Check, Calendar as CalendarIcon, Trash2, Link as LinkIcon, Clock } from "lucide-react";

interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  event_type: string;
  linked_todo_id: string;
  linked_deck_id: string;
  color: string;
  completed: boolean;
}

const EVENT_COLORS = [
  { name: "Study", color: "#6366f1" },
  { name: "Review", color: "#f59e0b" },
  { name: "Quiz", color: "#10b981" },
  { name: "Exam", color: "#ef4444" },
  { name: "Task", color: "#06b6d4" },
  { name: "Other", color: "#8b5cf6" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newColor, setNewColor] = useState("#6366f1");
  const [newType, setNewType] = useState("study");
  const [linkedTodo, setLinkedTodo] = useState("");
  const [syncing, setSyncing] = useState(false);
  const todoCtx = useTodosSafe();
  const todos = todoCtx?.todos || [];
  const decks = todoCtx?.decks || [];
  const toggleTodo = todoCtx?.toggleTodo;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

  // Load events
  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
      if (user) {
        const { data } = await supabase.from("calendar_events").select("*").eq("user_id", user.id).order("event_date");
        setEvents(data || []);
      }
      setMounted(true);
    })();
  }, []);

  // Auto-sync: create calendar events for todos with due dates
  const syncTodoDeadlines = useCallback(async () => {
    if (!userId || !todos.length) return;
    setSyncing(true);

    const supabase = getSupabase();
    const todosWithDates = todos.filter((t) => !t.completed && t.dueDate);
    const existingLinkedIds = new Set(events.filter((e) => e.linked_todo_id).map((e) => e.linked_todo_id));

    // Create events for unsynced todos
    for (const todo of todosWithDates) {
      if (existingLinkedIds.has(todo.id)) continue;

      const deck = decks.find((d) => d.id === todo.deck);
      const color = deck?.color || "#06b6d4";

      const { data, error } = await supabase.from("calendar_events").insert({
        user_id: userId,
        title: todo.title,
        description: todo.description || `Task deadline: ${todo.title}`,
        event_date: todo.dueDate,
        event_time: "",
        event_type: "other",
        linked_todo_id: todo.id,
        color: color,
      }).select().single();

      if (data && !error) {
        setEvents((prev) => [...prev, data]);
      }
    }

    setSyncing(false);
  }, [userId, todos, decks, events]);

  useEffect(() => {
    if (mounted && userId) {
      syncTodoDeadlines();
    }
  }, [mounted, userId, todos.length]);

  // Watch for todo completion changes → sync to calendar
  useEffect(() => {
    if (!userId || !events.length) return;
    const linkedEvents = events.filter((e) => e.linked_todo_id);
    
    for (const event of linkedEvents) {
      const todo = todos.find((t) => t.id === event.linked_todo_id);
      if (todo && todo.completed !== event.completed) {
        const supabase = getSupabase();
        supabase.from("calendar_events").update({ completed: todo.completed }).eq("id", event.id);
        setEvents((prev) => prev.map((e) => e.id === event.id ? { ...e, completed: todo.completed } : e));
      }
    }
  }, [todos, events, userId]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      if (!map[e.event_date]) map[e.event_date] = [];
      map[e.event_date].push(e);
    });
    return map;
  }, [events]);

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];
  const incompleteTodos = todos.filter((t) => !t.completed && t.dueDate);

  async function createEvent() {
    if (!newTitle.trim() || !selectedDate || !userId) return;
    const supabase = getSupabase();
    const { data, error } = await supabase.from("calendar_events").insert({
      user_id: userId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      event_date: selectedDate,
      event_time: newTime,
      event_type: newType,
      linked_todo_id: linkedTodo,
      color: newColor,
    }).select().single();
    if (data && !error) {
      setEvents((prev) => [...prev, data]);
      setNewTitle(""); setNewDesc(""); setNewTime(""); setLinkedTodo(""); setShowCreate(false);
    }
  }

  async function toggleComplete(id: string) {
    const ev = events.find((e) => e.id === id);
    if (!ev || !userId) return;

    const supabase = getSupabase();
    const newCompleted = !ev.completed;
    await supabase.from("calendar_events").update({ completed: newCompleted }).eq("id", id);
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, completed: newCompleted } : e));

    // If linked to a todo, toggle the todo too
    if (ev.linked_todo_id && toggleTodo) {
      const linkedTodo = todos.find((t) => t.id === ev.linked_todo_id);
      if (linkedTodo && linkedTodo.completed !== newCompleted) {
        toggleTodo(ev.linked_todo_id);
      }
    }
  }

  async function deleteEvent(id: string) {
    if (!userId) return;
    const supabase = getSupabase();
    await supabase.from("calendar_events").delete().eq("id", id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function prevMonth() { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDate(null); }
  function nextMonth() { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDate(null); }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground mb-3 animate-pulse" />
          <p className="text-sm text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl border bg-card max-w-sm mx-4">
          <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Sign in required</h2>
          <p className="text-sm text-muted-foreground mb-4">Sign in to use the study calendar and sync your task deadlines.</p>
          <Link href="/login" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90">
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
              <CalendarIcon className="h-7 w-7" /> Study Calendar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {events.length} events · {incompleteTodos.length} upcoming tasks
              {syncing && <span className="ml-2 text-primary animate-pulse">syncing...</span>}
            </p>
          </div>
          <Link href="/study" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Back to Study
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-2xl border bg-card backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const dayEvents = eventsByDate[dateStr] || [];
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;
                  const hasOverdue = dayEvents.some((e) => !e.completed && e.event_date < today);
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`relative p-2 rounded-lg text-sm min-h-[3.5rem] flex flex-col items-center transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                          : isToday
                          ? "bg-primary/10 text-primary font-bold ring-1 ring-primary/30"
                          : "hover:bg-muted"
                      }`}
                    >
                      <span>{day}</span>
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {dayEvents.slice(0, 4).map((e, j) => (
                            <span
                              key={j}
                              className={`w-1.5 h-1.5 rounded-full ${e.completed ? "opacity-40" : ""}`}
                              style={{ backgroundColor: e.color }}
                            />
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="p-5 rounded-2xl border bg-card backdrop-blur-sm">
              <h3 className="font-semibold mb-3">Upcoming</h3>
              {events.filter((e) => e.event_date >= today && !e.completed).slice(0, 6).length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No upcoming events</p>
              ) : (
                <div className="space-y-2">
                  {events.filter((e) => e.event_date >= today && !e.completed).slice(0, 6).map((e) => (
                    <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">{e.title}</p>
                          {e.linked_todo_id && <LinkIcon className="h-3 w-3 text-muted-foreground flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Clock className="h-3 w-3" />
                          {new Date(e.event_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          {e.event_time && ` at ${e.event_time}`}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleComplete(e.id)}
                        className="p-1.5 rounded-lg hover:bg-green-500/10 text-muted-foreground hover:text-green-600 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Selected Date */}
            <div className="p-5 rounded-2xl border bg-card backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">
                  {selectedDate
                    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                    : "Select a date"}
                </h3>
                {selectedDate && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                )}
              </div>

              {selectedDate && selectedEvents.length === 0 && !showCreate && (
                <p className="text-sm text-muted-foreground text-center py-4">No events. Click + to add one.</p>
              )}

              {selectedEvents.map((e) => (
                <div key={e.id} className={`flex items-start gap-3 p-3 rounded-xl mb-2 transition-colors ${e.completed ? "opacity-50" : "hover:bg-muted/50"}`}>
                  <span className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: e.color }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${e.completed ? "line-through" : ""}`}>{e.title}</p>
                      {e.linked_todo_id && <LinkIcon className="h-3 w-3 text-primary" />}
                    </div>
                    {e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}
                    {e.event_time && <p className="text-xs text-muted-foreground mt-0.5">{e.event_time}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleComplete(e.id)}
                      className={`p-1 rounded-lg transition-colors ${e.completed ? "text-green-600" : "text-muted-foreground hover:text-green-600 hover:bg-green-500/10"}`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => deleteEvent(e.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Create Form */}
              {showCreate && selectedDate && (
                <div className="mt-3 p-4 rounded-xl border bg-muted/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New Event</span>
                    <button onClick={() => setShowCreate(false)} className="p-1 rounded-lg hover:bg-muted transition-colors">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Event title..."
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && createEvent()}
                  />
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Description (optional)..."
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  />
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                  >
                    <option value="study">Study Session</option>
                    <option value="review">Review</option>
                    <option value="quiz">Quiz Practice</option>
                    <option value="exam">Exam</option>
                    <option value="other">Other</option>
                  </select>
                  <div className="flex gap-1.5">
                    {EVENT_COLORS.map((c) => (
                      <button
                        key={c.color}
                        onClick={() => setNewColor(c.color)}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${newColor === c.color ? "border-foreground scale-110" : "border-transparent"}`}
                        style={{ backgroundColor: c.color }}
                        title={c.name}
                      />
                    ))}
                  </div>
                  {incompleteTodos.length > 0 && (
                    <select
                      value={linkedTodo}
                      onChange={(e) => setLinkedTodo(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    >
                      <option value="">Link to a task (optional)...</option>
                      {incompleteTodos.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  )}
                  <button
                    onClick={createEvent}
                    disabled={!newTitle.trim()}
                    className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    Create Event
                  </button>
                </div>
              )}
            </div>

            {/* Tasks with Deadlines */}
            {incompleteTodos.length > 0 && (
              <div className="p-5 rounded-2xl border bg-card backdrop-blur-sm">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" /> Task Deadlines
                </h3>
                <div className="space-y-2">
                  {incompleteTodos.slice(0, 6).map((t) => {
                    const deck = decks.find((d) => d.id === t.deck);
                    return (
                      <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors text-sm">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: deck?.color || "#6b7280" }}
                        />
                        <span className="truncate flex-1">{t.title}</span>
                        <span className={`text-xs whitespace-nowrap ${
                          new Date(t.dueDate) < new Date(today) ? "text-red-500" : "text-muted-foreground"
                        }`}>
                          {new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="p-5 rounded-2xl border bg-card backdrop-blur-sm">
              <h3 className="font-semibold mb-3 text-sm">Legend</h3>
              <div className="space-y-2">
                {EVENT_COLORS.map((c) => (
                  <div key={c.color} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} /> {c.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
