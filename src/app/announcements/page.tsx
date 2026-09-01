"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { Megaphone, Plus, Trash2, Pencil, Check, X, Pin, Calendar, Clock } from "lucide-react";

interface Announcement {
  id: string;
  user_id: string;
  title: string;
  content: string;
  event_date: string | null;
  event_time: string | null;
  event_type: string;
  pinned: boolean;
  created_at: string;
}

export default function AnnouncementsPage() {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newPinned, setNewPinned] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editTime, setEditTime] = useState("");
  const [editPinned, setEditPinned] = useState(false);

  const fetchItems = async () => {
    const supabase = getSupabase();
    const { data } = await supabase.from("announcements").select("*").order("pinned", { ascending: false }).order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim() || !user) return;
    const supabase = getSupabase();
    await supabase.from("announcements").insert({
      user_id: user.id,
      title: newTitle.trim(),
      content: newContent.trim(),
      event_date: newDate || null,
      event_time: newTime || null,
      pinned: newPinned,
    });
    setNewTitle(""); setNewContent(""); setNewDate(""); setNewTime(""); setNewPinned(false);
    setCreating(false);
    fetchItems();
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim() || !editContent.trim()) return;
    const supabase = getSupabase();
    await supabase.from("announcements").update({
      title: editTitle.trim(),
      content: editContent.trim(),
      event_date: editDate || null,
      event_time: editTime || null,
      pinned: editPinned,
      updated_at: new Date().toISOString(),
    }).eq("id", id);
    setEditingId(null);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    const supabase = getSupabase();
    await supabase.from("announcements").delete().eq("id", id);
    fetchItems();
  };

  const startEdit = (item: Announcement) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditContent(item.content);
    setEditDate(item.event_date || "");
    setEditTime(item.event_time || "");
    setEditPinned(item.pinned);
  };

  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const pinned = items.filter(i => i.pinned);
  const unpinned = items.filter(i => !i.pinned);

  if (loading) {
    return (
      <div className="page-container">
        <h1 className="page-title"><Megaphone size={28} /> Announcements</h1>
        <p className="text-secondary text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 className="page-title"><Megaphone size={28} /> Announcements</h1>
            <p className="page-subtitle">Updates, deadlines, and important dates</p>
          </div>
          {isAdmin && !creating && (
            <button onClick={() => setCreating(true)} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 13 }}>
              <Plus size={15} /> New
            </button>
          )}
        </div>

        {/* Admin create form */}
        {isAdmin && creating && (
          <div style={{ background: "var(--os-glass)", border: "1px solid var(--os-glass-border)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
            <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Title" style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-primary)", fontSize: 15, fontWeight: 600, marginBottom: 10, outline: "none" }} />
            <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Announcement content..." rows={4} style={{ width: "100%", padding: "10px 14px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 10, color: "var(--os-text-primary)", fontSize: 14, resize: "vertical", outline: "none" }} />
            <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={14} style={{ color: "var(--os-text-dim)" }} />
                <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} style={{ padding: "6px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={14} style={{ color: "var(--os-text-dim)" }} />
                <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} style={{ padding: "6px 10px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 13, outline: "none" }} />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--os-text-secondary)", cursor: "pointer" }}>
                <input type="checkbox" checked={newPinned} onChange={(e) => setNewPinned(e.target.checked)} style={{ accentColor: "var(--os-accent)" }} />
                <Pin size={13} /> Pin to top
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={handleCreate} className="glass-btn glass-btn-primary" style={{ padding: "8px 16px", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}><Check size={14} /> Publish</button>
              <button onClick={() => setCreating(false)} className="glass-btn" style={{ padding: "8px 16px", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* No announcements */}
        {items.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--os-text-dim)" }}>
            <Megaphone size={32} style={{ marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 14 }}>No announcements yet</p>
          </div>
        )}

        {/* Pinned section */}
        {pinned.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
              <Pin size={13} /> Pinned
            </div>
            {pinned.map(item => (
              <AnnouncementCard key={item.id} item={item} isAdmin={isAdmin} editingId={editingId} editTitle={editTitle} editContent={editContent} editDate={editDate} editTime={editTime} editPinned={editPinned} setEditTitle={setEditTitle} setEditContent={setEditContent} setEditDate={setEditDate} setEditTime={setEditTime} setEditPinned={setEditPinned} startEdit={startEdit} handleUpdate={handleUpdate} handleDelete={handleDelete} setEditingId={setEditingId} formatDate={formatDate} />
            ))}
          </div>
        )}

        {/* Regular announcements */}
        {unpinned.length > 0 && (
          <div>
            {pinned.length > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
                All
              </div>
            )}
            {unpinned.map(item => (
              <AnnouncementCard key={item.id} item={item} isAdmin={isAdmin} editingId={editingId} editTitle={editTitle} editContent={editContent} editDate={editDate} editTime={editTime} editPinned={editPinned} setEditTitle={setEditTitle} setEditContent={setEditContent} setEditDate={setEditDate} setEditTime={setEditTime} setEditPinned={setEditPinned} startEdit={startEdit} handleUpdate={handleUpdate} handleDelete={handleDelete} setEditingId={setEditingId} formatDate={formatDate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AnnouncementCard({ item, isAdmin, editingId, editTitle, editContent, editDate, editTime, editPinned, setEditTitle, setEditContent, setEditDate, setEditTime, setEditPinned, startEdit, handleUpdate, handleDelete, setEditingId, formatDate }: any) {
  const isEditing = editingId === item.id;

  return (
    <div style={{ background: item.pinned ? "rgba(var(--os-accent-rgb), 0.05)" : "var(--os-glass)", border: "1px solid var(--os-glass-border)", borderRadius: 14, padding: "16px 20px", marginBottom: 10, transition: "all 0.15s" }}>
      {isEditing ? (
        <>
          <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ width: "100%", padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 15, fontWeight: 600, marginBottom: 8, outline: "none" }} />
          <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} style={{ width: "100%", padding: "8px 12px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 14, resize: "vertical", outline: "none" }} />
          <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ padding: "5px 8px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 12, outline: "none" }} />
            <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} style={{ padding: "5px 8px", background: "rgba(0,0,0,0.2)", border: "1px solid var(--os-glass-border)", borderRadius: 8, color: "var(--os-text-primary)", fontSize: 12, outline: "none" }} />
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--os-text-dim)", cursor: "pointer" }}>
              <input type="checkbox" checked={editPinned} onChange={(e) => setEditPinned(e.target.checked)} style={{ accentColor: "var(--os-accent)" }} /> Pin
            </label>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
            <button onClick={() => handleUpdate(item.id)} className="glass-btn glass-btn-primary" style={{ padding: "5px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}><Check size={12} /> Save</button>
            <button onClick={() => setEditingId(null)} className="glass-btn" style={{ padding: "5px 12px", fontSize: 12 }}>Cancel</button>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                {item.pinned && <Pin size={13} style={{ color: "var(--os-accent)" }} />}
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--os-text-primary)", margin: 0 }}>{item.title}</h3>
              </div>
              <p style={{ fontSize: 14, color: "var(--os-text-secondary)", margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{item.content}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 12, color: "var(--os-text-dim)" }}>
                {item.event_date && (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Calendar size={12} /> {formatDate(item.event_date)}{item.event_time ? ` at ${item.event_time}` : ""}
                  </span>
                )}
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
            {isAdmin && (
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => startEdit(item)} style={{ padding: 6, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 6, color: "var(--os-text-dim)", cursor: "pointer" }}><Pencil size={14} /></button>
                <button onClick={() => handleDelete(item.id)} style={{ padding: 6, background: "rgba(239,68,68,0.08)", border: "none", borderRadius: 6, color: "#ef4444", cursor: "pointer" }}><Trash2 size={14} /></button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
