"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { TodoProvider, useTodosSafe, Todo, Deck } from "@/components/todo/todo-context";
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
  { name: "Competition", color: "#f97316" },
  { name: "Other", color: "#8b5cf6" },
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPageWrapper() {
  return <TodoProvider><CalendarPage /></TodoProvider>;
}

function CalendarPage() {
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTime, setNewTime] = useState("");
  const [allDay, setAllDay] = useState(false);
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

  const syncTodoDeadlines = useCallback(async () => {
    if (!userId || !todos.length) return;
    setSyncing(true);
    const supabase = getSupabase();
    const todosWithDates = todos.filter((t) => !t.completed && t.dueDate);
    const existingLinkedIds = new Set(events.filter((e) => e.linked_todo_id).map((e) => e.linked_todo_id));
    for (const todo of todosWithDates) {
      if (existingLinkedIds.has(todo.id)) continue;
      const deck = decks.find((d) => d.id === todo.deck);
      const color = deck?.color || "#06b6d4";
      const { data, error } = await supabase.from("calendar_events").insert({
        user_id: userId, title: todo.title, description: todo.description || `Task deadline: ${todo.title}`,
        event_date: todo.dueDate, event_time: "", event_type: "other", linked_todo_id: todo.id, color,
      }).select().single();
      if (data && !error) setEvents((prev) => [...prev, data]);
    }
    setSyncing(false);
  }, [userId, todos, decks, events]);

  useEffect(() => { if (mounted && userId) syncTodoDeadlines(); }, [mounted, userId, todos.length]);

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
    events.forEach((e) => { if (!map[e.event_date]) map[e.event_date] = []; map[e.event_date].push(e); });
    return map;
  }, [events]);

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];
  const incompleteTodos = todos.filter((t) => !t.completed && t.dueDate);

  async function createEvent() {
    if (!newTitle.trim() || !selectedDate || !userId) return;
    const supabase = getSupabase();
    const { data, error } = await supabase.from("calendar_events").insert({
      user_id: userId, title: newTitle.trim(), description: newDesc.trim(),
      event_date: selectedDate, event_time: allDay ? "" : newTime, event_type: newType, linked_todo_id: linkedTodo, color: newColor,
    }).select().single();
    if (data && !error) {
      setEvents((prev) => [...prev, data]);
      setNewTitle(""); setNewDesc(""); setNewTime(""); setLinkedTodo(""); setAllDay(false); setShowCreate(false);
    } else {
      alert(error?.message || "Failed to create event. Make sure the calendar_events table exists in Supabase.");
    }
  }

  async function toggleComplete(id: string) {
    const ev = events.find((e) => e.id === id);
    if (!ev || !userId) return;
    const supabase = getSupabase();
    const newCompleted = !ev.completed;
    await supabase.from("calendar_events").update({ completed: newCompleted }).eq("id", id);
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, completed: newCompleted } : e));
    if (ev.linked_todo_id && toggleTodo) {
      const linkedTodo = todos.find((t) => t.id === ev.linked_todo_id);
      if (linkedTodo && linkedTodo.completed !== newCompleted) toggleTodo(ev.linked_todo_id);
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
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title"><CalendarIcon size={28} /> Study Calendar</h1>
          <p className="page-subtitle">Loading calendar...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon"><CalendarIcon size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Sign in required</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>Sign in to use the study calendar and sync your task deadlines.</p>
          <Link href="/login" className="glass-btn glass-btn-primary">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex-between" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="page-title"><CalendarIcon size={28} /> Study Calendar</h1>
          <p className="page-subtitle">
            {events.length} events · {incompleteTodos.length} upcoming tasks
            {syncing && <span style={{ marginLeft: 8, color: "var(--os-accent)" }}>syncing...</span>}
          </p>
        </div>
        <Link href="/tasks" className="glass-btn glass-btn-ghost" style={{ fontSize: 13 }}>Back to Tasks</Link>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "2fr 1fr" }}>
        {/* Calendar Grid */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="glass-panel" style={{ padding: 24 }}>
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <button onClick={prevMonth} className="glass-btn glass-btn-ghost" style={{ padding: 8 }}><ChevronLeft size={20} /></button>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} className="glass-btn glass-btn-ghost" style={{ padding: 8 }}><ChevronRight size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
              {DAYS.map((d) => (
                <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", padding: "4px 0" }}>{d}</div>
              ))}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = eventsByDate[dateStr] || [];
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDate;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    style={{
                      position: "relative", padding: "8px 4px", borderRadius: 10, fontSize: 13,
                      display: "flex", flexDirection: "column", alignItems: "center", minHeight: 48,
                      background: isSelected ? "var(--os-accent)" : isToday ? "rgba(0,212,255,0.1)" : "transparent",
                      color: isSelected ? "#fff" : isToday ? "var(--os-accent)" : "var(--os-text-primary)",
                      border: isToday && !isSelected ? "1px solid rgba(0,212,255,0.3)" : "1px solid transparent",
                      cursor: "pointer", fontFamily: "Inter, sans-serif", fontWeight: isToday ? 700 : 400,
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{day}</span>
                    {dayEvents.length > 0 && (
                      <div style={{ display: "flex", gap: 3, marginTop: 4 }}>
                        {dayEvents.slice(0, 4).map((e, j) => (
                          <span key={j} style={{
                            width: 6, height: 6, borderRadius: "50%", backgroundColor: e.color,
                            opacity: e.completed ? 0.4 : 1,
                          }} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12 }}>Upcoming</h3>
            {events.filter((e) => e.event_date >= today && !e.completed).slice(0, 6).length === 0 ? (
              <p className="text-secondary text-sm" style={{ padding: "16px 0", textAlign: "center" }}>No upcoming events</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {events.filter((e) => e.event_date >= today && !e.completed).slice(0, 6).map((e) => (
                  <div key={e.id} className="glass-card" style={{ padding: 12, display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, backgroundColor: e.color }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</p>
                        {e.linked_todo_id && <LinkIcon size={12} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />}
                      </div>
                      <p style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <Clock size={12} />
                        {new Date(e.event_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        {e.event_time && ` at ${e.event_time}`}
                      </p>
                    </div>
                    <button onClick={() => toggleComplete(e.id)} style={{ padding: 6, borderRadius: 8, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}>
                      <Check size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Selected Date */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <div className="flex-between" style={{ marginBottom: 16 }}>
              <h3 style={{ fontWeight: 600 }}>
                {selectedDate
                  ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                  : "Select a date"}
              </h3>
              {selectedDate && (
                <button onClick={() => setShowCreate(true)} className="glass-btn glass-btn-primary" style={{ padding: 6 }}><Plus size={16} /></button>
              )}
            </div>

            {selectedDate && selectedEvents.length === 0 && !showCreate && (
              <p className="text-secondary text-sm" style={{ padding: "16px 0", textAlign: "center" }}>No events. Click + to add one.</p>
            )}

            {selectedEvents.map((e) => (
              <div key={e.id} style={{
                display: "flex", alignItems: "flex-start", gap: 12, padding: 12, borderRadius: 12,
                marginBottom: 8, opacity: e.completed ? 0.5 : 1,
              }}>
                <span style={{ width: 10, height: 10, borderRadius: "50%", marginTop: 6, flexShrink: 0, backgroundColor: e.color }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, textDecoration: e.completed ? "line-through" : "none" }}>{e.title}</p>
                    {e.linked_todo_id && <LinkIcon size={12} style={{ color: "var(--os-accent)" }} />}
                  </div>
                  {e.description && <p style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 2 }}>{e.description}</p>}
                  {e.event_time ? <p style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 2 }}>{e.event_time}</p> : <p style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 2, fontStyle: "italic" }}>All Day</p>}
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => toggleComplete(e.id)} style={{ padding: 4, borderRadius: 6, background: "none", border: "none", color: e.completed ? "#10b981" : "var(--os-text-dim)", cursor: "pointer" }}>
                    <Check size={14} />
                  </button>
                  <button onClick={() => deleteEvent(e.id)} style={{ padding: 4, borderRadius: 6, background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}

            {/* Create Form */}
            {showCreate && selectedDate && (
              <div style={{ marginTop: 12, padding: 16, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.35)" }}>
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>New Event</span>
                  <button onClick={() => setShowCreate(false)} style={{ padding: 4, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}><X size={14} /></button>
                </div>
                <input className="glass-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Event title..." autoFocus onKeyDown={(e) => e.key === "Enter" && createEvent()} style={{ marginBottom: 8 }} />
                <input className="glass-input" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)..." style={{ marginBottom: 8 }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <button
                    onClick={() => setAllDay(!allDay)}
                    style={{
                      width: 36, height: 20, borderRadius: 10, border: "none", cursor: "pointer", flexShrink: 0,
                      background: allDay ? "var(--os-accent)" : "rgba(255,255,255,0.12)", position: "relative", transition: "background 0.2s",
                    }}
                  >
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2,
                      left: allDay ? 18 : 2, transition: "left 0.2s",
                    }} />
                  </button>
                  <span style={{ fontSize: 12, color: "var(--os-text-dim)" }}>All Day</span>
                </div>
                {!allDay && <input type="time" className="glass-input" value={newTime} onChange={(e) => setNewTime(e.target.value)} style={{ marginBottom: 8 }} />}
                {allDay && <input className="glass-input" value="All Day" disabled style={{ marginBottom: 8, opacity: 0.6 }} />}
                <select className="glass-input" value={newType} onChange={(e) => setNewType(e.target.value)} style={{ marginBottom: 8 }}>
                  <option value="study">Study Session</option>
                  <option value="review">Review</option>
                  <option value="quiz">Quiz Practice</option>
                  <option value="exam">Exam</option>
                  <option value="other">Other</option>
                </select>
                <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                  {EVENT_COLORS.map((c) => (
                    <button key={c.color} onClick={() => setNewColor(c.color)} style={{
                      width: 24, height: 24, borderRadius: "50%",
                      border: newColor === c.color ? "2px solid #fff" : "2px solid transparent",
                      background: c.color, cursor: "pointer",
                    }} title={c.name} />
                  ))}
                </div>
                {incompleteTodos.length > 0 && (
                  <select className="glass-input" value={linkedTodo} onChange={(e) => setLinkedTodo(e.target.value)} style={{ marginBottom: 8 }}>
                    <option value="">Link to a task (optional)...</option>
                    {incompleteTodos.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                )}
                <button onClick={createEvent} disabled={!newTitle.trim()} className="glass-btn glass-btn-primary" style={{ width: "100%", opacity: !newTitle.trim() ? 0.5 : 1 }}>
                  Create Event
                </button>
              </div>
            )}
          </div>

          {/* Tasks with Deadlines */}
          {incompleteTodos.length > 0 && (
            <div className="glass-panel" style={{ padding: 24 }}>
              <h3 style={{ fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <Clock size={16} /> Task Deadlines
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {incompleteTodos.slice(0, 6).map((t) => {
                  const deck = decks.find((d) => d.id === t.deck);
                  return (
                    <div key={t.id} className="glass-card" style={{ padding: 10, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, backgroundColor: deck?.color || "#6b7280" }} />
                      <span style={{ flex: 1, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                      <span style={{
                        fontSize: 11, whiteSpace: "nowrap",
                        color: new Date(t.dueDate) < new Date(today) ? "#ef4444" : "var(--os-text-dim)",
                      }}>
                        {new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="glass-panel" style={{ padding: 24 }}>
            <h3 style={{ fontWeight: 600, marginBottom: 12, fontSize: 13 }}>Legend</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {EVENT_COLORS.map((c) => (
                <div key={c.color} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--os-text-dim)" }}>
                  <span style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: c.color }} /> {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
