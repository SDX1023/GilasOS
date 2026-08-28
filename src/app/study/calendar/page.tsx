"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { useTodosSafe } from "@/components/todo/todo-context";
import { ChevronLeft, ChevronRight, Plus, X, Check, Calendar as CalendarIcon, Trash2 } from "lucide-react";

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
  const todoCtx = useTodosSafe();
  const todos = todoCtx?.todos || [];

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

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date().toISOString().split("T")[0];

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
    await supabase.from("calendar_events").update({ completed: !ev.completed }).eq("id", id);
    setEvents((prev) => prev.map((e) => e.id === id ? { ...e, completed: !e.completed } : e));
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
    return <div className="container mx-auto px-4 py-8"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (!userId) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">Sign in to use the study calendar</p>
        <Link href="/login" className="text-primary hover:underline">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <CalendarIcon className="h-7 w-7" /> Study Calendar
        </h1>
        <Link href="/study" className="text-sm text-muted-foreground hover:text-foreground">← Back to Study</Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <div className="p-4 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft className="h-5 w-5" /></button>
              <h2 className="text-lg font-semibold">{MONTHS[month]} {year}</h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-muted"><ChevronRight className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map((d) => <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayEvents = eventsByDate[dateStr] || [];
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDate;
                return (
                  <button key={day} onClick={() => setSelectedDate(dateStr)}
                    className={`relative p-2 rounded-lg text-sm min-h-[3rem] flex flex-col items-center transition-colors ${
                      isSelected ? "bg-primary text-primary-foreground" : isToday ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted"
                    }`}>
                    <span>{day}</span>
                    {dayEvents.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dayEvents.slice(0, 3).map((e, j) => (
                          <span key={j} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: e.color }} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="mt-4 p-4 rounded-xl border bg-card">
            <h3 className="font-medium mb-3">Upcoming</h3>
            {events.filter((e) => e.event_date >= today && !e.completed).slice(0, 5).length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            ) : (
              <div className="space-y-2">
                {events.filter((e) => e.event_date >= today && !e.completed).slice(0, 5).map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: e.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{e.title}</p>
                      <p className="text-xs text-muted-foreground">{e.event_date} {e.event_time && `at ${e.event_time}`}</p>
                    </div>
                    <button onClick={() => toggleComplete(e.id)} className="p-1 rounded hover:bg-green-500/10 text-muted-foreground hover:text-green-600">
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
          {/* Selected Date Events */}
          <div className="p-4 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">{selectedDate ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Select a date"}</h3>
              {selectedDate && (
                <button onClick={() => setShowCreate(true)} className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                </button>
              )}
            </div>
            {selectedDate && selectedEvents.length === 0 && !showCreate && (
              <p className="text-sm text-muted-foreground">No events. Click + to add one.</p>
            )}
            {selectedEvents.map((e) => (
              <div key={e.id} className={`flex items-start gap-3 p-2 rounded-lg mb-2 ${e.completed ? "opacity-50" : ""}`}>
                <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: e.color }} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${e.completed ? "line-through" : ""}`}>{e.title}</p>
                  {e.description && <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>}
                  {e.event_time && <p className="text-xs text-muted-foreground">{e.event_time}</p>}
                  {e.linked_todo_id && <p className="text-xs text-primary mt-0.5">Linked to todo</p>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => toggleComplete(e.id)} className={`p-1 rounded ${e.completed ? "text-green-600" : "text-muted-foreground hover:text-green-600"}`}>
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => deleteEvent(e.id)} className="p-1 rounded text-muted-foreground hover:text-red-500">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {/* Create Event Form */}
            {showCreate && selectedDate && (
              <div className="mt-3 p-3 rounded-lg border bg-muted/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">New Event</span>
                  <button onClick={() => setShowCreate(false)} className="p-1 rounded hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
                </div>
                <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Event title..."
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm" autoFocus onKeyDown={(e) => e.key === "Enter" && createEvent()} />
                <input type="text" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)..."
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
                <select value={newType} onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  <option value="study">Study Session</option>
                  <option value="review">Review</option>
                  <option value="quiz">Quiz Practice</option>
                  <option value="exam">Exam</option>
                  <option value="other">Other</option>
                </select>
                <div className="flex gap-1.5">
                  {EVENT_COLORS.map((c) => (
                    <button key={c.color} onClick={() => setNewColor(c.color)}
                      className={`w-6 h-6 rounded-full border-2 ${newColor === c.color ? "border-foreground" : "border-transparent"}`}
                      style={{ backgroundColor: c.color }} title={c.name} />
                  ))}
                </div>
                {incompleteTodos.length > 0 && (
                  <select value={linkedTodo} onChange={(e) => setLinkedTodo(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                    <option value="">Link to a todo (optional)...</option>
                    {incompleteTodos.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>
                )}
                <button onClick={createEvent} disabled={!newTitle.trim()}
                  className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                  Create Event
                </button>
              </div>
            )}
          </div>

          {/* Linked Todos */}
          {incompleteTodos.length > 0 && (
            <div className="p-4 rounded-xl border bg-card">
              <h3 className="font-medium mb-3">Upcoming Todos</h3>
              <div className="space-y-2">
                {incompleteTodos.slice(0, 5).map((t) => (
                  <div key={t.id} className="flex items-center gap-2 text-sm">
                    <span className={`w-2 h-2 rounded-full ${t.priority === "high" ? "bg-red-500" : t.priority === "medium" ? "bg-yellow-500" : "bg-green-500"}`} />
                    <span className="truncate">{t.title}</span>
                    {t.dueDate && <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">{t.dueDate}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="p-4 rounded-xl border bg-card">
            <h3 className="font-medium mb-2 text-sm">Legend</h3>
            <div className="space-y-1.5">
              {EVENT_COLORS.map((c) => (
                <div key={c.color} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} /> {c.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
