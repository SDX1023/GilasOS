"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useCourseDetail } from "@/hooks/use-db";
import { isAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { ChevronRight, Plus, Trash2, ExternalLink, Pencil, X, Check, Link as LinkIcon } from "lucide-react";

interface ResourceLink {
  id: string;
  course_id: string;
  title: string;
  url: string;
  type: string;
}

const LINK_TYPES = ["Google Docs", "Google Drive", "YouTube", "Website", "PDF", "Other"];

const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  "Google Docs": { bg: "rgba(66,133,244,0.12)", text: "#60a5fa" },
  "Google Drive": { bg: "rgba(52,168,83,0.12)", text: "#4ade80" },
  "YouTube": { bg: "rgba(255,0,0,0.12)", text: "#f87171" },
  "Website": { bg: "rgba(139,92,246,0.12)", text: "#a78bfa" },
  "PDF": { bg: "rgba(239,68,68,0.12)", text: "#fb923c" },
  "Other": { bg: "rgba(255,255,255,0.08)", text: "var(--os-text-dim)" },
};

export default function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const { course: courseSlug } = use(params);
  const { course, modules, loading } = useCourseDetail(courseSlug);
  const [links, setLinks] = useState<ResourceLink[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState("Google Docs");
  const [editValues, setEditValues] = useState({ title: "", url: "", type: "" });
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    if (!courseSlug) return;
    setAdmin(isAdmin());
    (async () => {
      const supabase = getSupabase();
      const { data } = await supabase.from("course_resources").select("*").eq("course_id", courseSlug).order("created_at");
      setLinks(data || []);
    })();
  }, [courseSlug]);

  const updateLinks = async (action: "add" | "update" | "delete", link?: ResourceLink, id?: string) => {
    const supabase = getSupabase();
    if (action === "add" && link) {
      const { data } = await supabase.from("course_resources").insert({ course_id: courseSlug, title: link.title, url: link.url, type: link.type }).select().single();
      if (data) setLinks((prev) => [...prev, data]);
    } else if (action === "update" && link && id) {
      await supabase.from("course_resources").update({ title: link.title, url: link.url, type: link.type }).eq("id", id);
      setLinks((prev) => prev.map((l) => l.id === id ? { ...l, title: link.title, url: link.url, type: link.type } : l));
    } else if (action === "delete" && id) {
      await supabase.from("course_resources").delete().eq("id", id);
      setLinks((prev) => prev.filter((l) => l.id !== id));
    }
  };

  const handleAdd = () => {
    if (!newTitle.trim() || !newUrl.trim()) return;
    updateLinks("add", { id: "", course_id: courseSlug, title: newTitle.trim(), url: newUrl.trim(), type: newType });
    setNewTitle(""); setNewUrl(""); setNewType("Google Docs"); setShowForm(false);
  };

  const handleDelete = (id: string) => {
    updateLinks("delete", undefined, id);
  };

  const startEdit = (link: ResourceLink) => {
    setEditingId(link.id);
    setEditValues({ title: link.title, url: link.url, type: link.type });
  };

  const saveEdit = () => {
    if (!editingId || !editValues.title.trim() || !editValues.url.trim()) return;
    updateLinks("update", { id: editingId, course_id: courseSlug, title: editValues.title, url: editValues.url, type: editValues.type }, editingId);
    setEditingId(null);
  };

  if (loading) {
    return <div className="page-container"><p className="text-secondary">Loading...</p></div>;
  }

  if (!course) {
    return <div className="page-container"><p className="text-secondary">Course not found.</p></div>;
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 32 }}>
        <Link href="/courses" style={{ fontSize: 13, color: "var(--os-text-dim)", textDecoration: "none" }}>Courses</Link>
        <h1 className="page-title" style={{ marginTop: 8 }}>{course.title}</h1>
        <p className="text-secondary">{course.description}</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 40 }}>
        {modules.map((mod) => (
          <Link
            key={mod.id}
            href={`/courses/${course.id}/${mod.id}`}
            className="glass-card-link"
            style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "var(--os-text-primary)", marginBottom: 4 }}>{mod.title}</h2>
              <p className="text-secondary text-sm">{mod.description}</p>
            </div>
            <ChevronRight size={20} style={{ color: "var(--os-text-dim)", flexShrink: 0, marginLeft: 12 }} />
          </Link>
        ))}
      </div>

      {/* Resources */}
      {admin && (
        <div>
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
              <LinkIcon size={18} /> Resources
            </h2>
            <button onClick={() => setShowForm(true)} className="glass-btn glass-btn-ghost" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13 }}>
              <Plus size={14} /> Add Link
            </button>
          </div>

        {showForm && (
          <div className="glass-panel" style={{ padding: 16, marginBottom: 16 }}>
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>New Resource Link</span>
              <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}><X size={14} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 8, alignItems: "end" }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--os-text-dim)", display: "block", marginBottom: 4 }}>Title</label>
                <input className="glass-input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Module 1 Notes" autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--os-text-dim)", display: "block", marginBottom: 4 }}>URL</label>
                <input className="glass-input" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="https://..." />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--os-text-dim)", display: "block", marginBottom: 4 }}>Type</label>
                <select className="glass-input" value={newType} onChange={(e) => setNewType(e.target.value)} style={{ width: "auto" }}>
                  {LINK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button onClick={handleAdd} className="glass-btn glass-btn-primary" style={{ fontSize: 13 }}>Add</button>
              <button onClick={() => setShowForm(false)} className="glass-btn glass-btn-ghost" style={{ fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        )}

        {links.length === 0 ? (
          <div className="glass-panel" style={{ padding: 24, textAlign: "center" }}>
            <p className="text-secondary text-sm">No resources yet. Add Google Docs, Drives, or any useful links.</p>
          </div>
        ) : (
          <div className="glass-panel" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Title</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
                  <th style={{ textAlign: "left", padding: "10px 16px", fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Link</th>
                  <th style={{ width: 80 }}></th>
                </tr>
              </thead>
              <tbody>
                {links.map((link) => (
                  <tr key={link.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    {editingId === link.id ? (
                      <>
                        <td style={{ padding: "8px 16px" }}><input className="glass-input" value={editValues.title} onChange={(e) => setEditValues({ ...editValues, title: e.target.value })} style={{ fontSize: 13 }} /></td>
                        <td style={{ padding: "8px 16px" }}>
                          <select className="glass-input" value={editValues.type} onChange={(e) => setEditValues({ ...editValues, type: e.target.value })} style={{ fontSize: 13, width: "auto" }}>
                            {LINK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: "8px 16px" }}><input className="glass-input" value={editValues.url} onChange={(e) => setEditValues({ ...editValues, url: e.target.value })} style={{ fontSize: 13 }} /></td>
                        <td style={{ padding: "8px 16px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={saveEdit} style={{ background: "none", border: "none", color: "#10b981", cursor: "pointer" }}><Check size={14} /></button>
                            <button onClick={() => setEditingId(null)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><X size={14} /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: "10px 16px", fontSize: 13, fontWeight: 500 }}>{link.title}</td>
                        <td style={{ padding: "10px 16px" }}>
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: TYPE_COLORS[link.type]?.bg || TYPE_COLORS["Other"].bg, color: TYPE_COLORS[link.type]?.text || TYPE_COLORS["Other"].text }}>{link.type}</span>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--os-accent)", textDecoration: "none", fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                            Open <ExternalLink size={12} />
                          </a>
                        </td>
                        <td style={{ padding: "10px 16px" }}>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => startEdit(link)} style={{ background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer" }}><Pencil size={13} /></button>
                            <button onClick={() => handleDelete(link.id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        </div>
      )}
    </div>
  );
}
