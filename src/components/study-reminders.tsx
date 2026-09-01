"use client";

import { useState, useEffect, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Bell, BellOff, Plus, Trash2, Clock, Repeat } from "lucide-react";

interface Reminder {
  id: string;
  title: string;
  remind_at: string;
  recurrence: string;
  enabled: boolean;
}

const RECURRENCE_OPTIONS = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
];

export function StudyReminders() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newRecurrence, setNewRecurrence] = useState("none");
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchReminders();
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
      timersRef.current.clear();
    };
  }, [user]);

  useEffect(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current.clear();
    reminders.filter((r) => r.enabled).forEach(scheduleNotification);
  }, [reminders]);

  const fetchReminders = async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from("study_reminders").select("*").eq("user_id", user!.id).order("remind_at");
    if (data) setReminders(data);
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const scheduleNotification = (reminder: Reminder) => {
    const now = Date.now();
    const target = new Date(reminder.remind_at).getTime();
    const delay = target - now;
    if (delay <= 0) return;

    const timer = setTimeout(() => {
      if (Notification.permission === "granted") {
        new Notification("📚 Study Reminder", {
          body: reminder.title,
          icon: "/logo.png",
        });
      }
      if (reminder.recurrence !== "none") {
        const next = getNextReminderTime(reminder.remind_at, reminder.recurrence);
        const supabase = getSupabase();
        supabase.from("study_reminders").update({ remind_at: next }).eq("id", reminder.id).then(() => {
          fetchReminders();
        });
      }
    }, delay);
    timersRef.current.set(reminder.id, timer);
  };

  const getNextReminderTime = (current: string, recurrence: string): string => {
    const d = new Date(current);
    switch (recurrence) {
      case "daily": d.setDate(d.getDate() + 1); break;
      case "weekdays": {
        do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
        break;
      }
      case "weekly": d.setDate(d.getDate() + 7); break;
    }
    return d.toISOString();
  };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDate || !newTime || !user) return;
    const remind_at = new Date(`${newDate}T${newTime}`).toISOString();
    const supabase = getSupabase();
    const { data } = await supabase.from("study_reminders").insert({
      user_id: user.id,
      title: newTitle.trim(),
      remind_at,
      recurrence: newRecurrence,
      enabled: true,
    }).select().single();
    if (data) setReminders([...reminders, data]);
    setNewTitle(""); setNewDate(""); setNewTime(""); setNewRecurrence("none");
    setShowCreate(false);
  };

  const handleDelete = async (id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) { clearTimeout(timer); timersRef.current.delete(id); }
    const supabase = getSupabase();
    await supabase.from("study_reminders").delete().eq("id", id);
    setReminders(reminders.filter((r) => r.id !== id));
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    const supabase = getSupabase();
    await supabase.from("study_reminders").update({ enabled }).eq("id", id);
    setReminders(reminders.map((r) => r.id === id ? { ...r, enabled } : r));
  };

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {/* Permission banner */}
      {notifPermission !== "granted" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10, fontSize: 13 }}>
          <BellOff size={16} style={{ color: "#fbbf24", flexShrink: 0 }} />
          <span style={{ color: "var(--os-text-secondary)", flex: 1 }}>Enable notifications to receive study reminders</span>
          <button onClick={requestPermission} style={{ padding: "4px 12px", borderRadius: 6, background: "#fbbf24", color: "#000", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: "Inter, sans-serif" }}>Enable</button>
        </div>
      )}

      {/* Reminder list */}
      {reminders.map((r) => (
        <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: r.enabled ? "var(--os-glass)" : "rgba(255,255,255,0.02)", border: "1px solid var(--os-glass-border)", borderRadius: 10, opacity: r.enabled ? 1 : 0.5 }}>
          <Clock size={16} style={{ color: r.enabled ? "var(--os-accent)" : "var(--os-text-dim)", flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
            <div style={{ fontSize: 12, color: "var(--os-text-dim)", display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <span>{formatDateTime(r.remind_at)}</span>
              {r.recurrence !== "none" && (
                <span style={{ display: "flex", alignItems: "center", gap: 2, padding: "1px 6px", background: "rgba(109,40,217,0.1)", borderRadius: 4, color: "#a78bfa", fontSize: 11 }}>
                  <Repeat size={10} /> {RECURRENCE_OPTIONS.find(o => o.value === r.recurrence)?.label}
                </span>
              )}
            </div>
          </div>
          <button onClick={() => handleToggle(r.id, !r.enabled)} style={{ padding: 4, background: "none", border: "none", color: r.enabled ? "#22c55e" : "var(--os-text-dim)", cursor: "pointer" }}>
            {r.enabled ? <Bell size={16} /> : <BellOff size={16} />}
          </button>
          <button onClick={() => handleDelete(r.id)} style={{ padding: 4, background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      {reminders.length === 0 && !showCreate && (
        <div style={{ textAlign: "center", padding: 20, color: "var(--os-text-dim)", fontSize: 13 }}>
          No reminders set
        </div>
      )}

      {/* Create form */}
      {showCreate ? (
        <div style={{ padding: 14, background: "var(--os-glass)", border: "1px solid var(--os-glass-border)", borderRadius: 12, display: "flex", flexDirection: "column", gap: 10 }}>
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Reminder title..." style={{ padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 14, outline: "none" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ flex: 1, padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }} />
            <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} style={{ flex: 1, padding: "8px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }} />
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {RECURRENCE_OPTIONS.map((opt) => (
              <button key={opt.value} onClick={() => setNewRecurrence(opt.value)} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "Inter, sans-serif", border: newRecurrence === opt.value ? "1.5px solid var(--os-accent)" : "1px solid rgba(255,255,255,0.1)", background: newRecurrence === opt.value ? "rgba(109,40,217,0.12)" : "rgba(255,255,255,0.03)", color: newRecurrence === opt.value ? "var(--os-accent)" : "var(--os-text-secondary)" }}>
                {opt.label}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleCreate} className="glass-btn glass-btn-primary" style={{ padding: "6px 14px", fontSize: 13 }}>Set Reminder</button>
            <button onClick={() => setShowCreate(false)} className="glass-btn" style={{ padding: "6px 14px", fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowCreate(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 10, border: "2px dashed rgba(255,255,255,0.1)", borderRadius: 10, background: "transparent", color: "var(--os-text-dim)", fontSize: 13, cursor: "pointer", fontFamily: "Inter, sans-serif" }}>
          <Plus size={14} /> Add Reminder
        </button>
      )}
    </div>
  );
}
