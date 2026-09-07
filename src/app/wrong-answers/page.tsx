"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { getSupabase } from "@/lib/supabase";
import { Trash2, CheckCircle, BookOpen, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface WrongAnswer {
  id: string;
  front: string;
  back: string;
  hint: string;
  source: string;
  subject: string;
  mastered: boolean;
  created_at: string;
}

export default function WrongAnswersPage() {
  const { user } = useAuth();
  const [answers, setAnswers] = useState<WrongAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "mastered">("active");
  const [search, setSearch] = useState("");
  const [flippedId, setFlippedId] = useState<string | null>(null);

  useEffect(() => {
    if (user) loadAnswers();
  }, [user?.id]);

  async function loadAnswers() {
    if (!user) return;
    setLoading(true);
    const supabase = getSupabase();
    const { data } = await supabase
      .from("wrong_answers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setAnswers((data || []) as WrongAnswer[]);
    setLoading(false);
  }

  async function toggleMastered(id: string, current: boolean) {
    const supabase = getSupabase();
    await supabase.from("wrong_answers").update({ mastered: !current }).eq("id", id);
    setAnswers((prev) => prev.map((a) => a.id === id ? { ...a, mastered: !a.mastered } : a));
  }

  async function deleteAnswer(id: string) {
    const supabase = getSupabase();
    await supabase.from("wrong_answers").delete().eq("id", id);
    setAnswers((prev) => prev.filter((a) => a.id !== id));
  }

  async function clearMastered() {
    if (!user) return;
    const supabase = getSupabase();
    await supabase.from("wrong_answers").delete().eq("user_id", user.id).eq("mastered", true);
    setAnswers((prev) => prev.filter((a) => !a.mastered));
  }

  const filtered = answers
    .filter((a) => {
      if (filter === "active") return !a.mastered;
      if (filter === "mastered") return a.mastered;
      return true;
    })
    .filter((a) => {
      if (!search) return true;
      const q = search.toLowerCase();
      return a.front.toLowerCase().includes(q) || a.back.toLowerCase().includes(q) || a.source.toLowerCase().includes(q);
    });

  const activeCount = answers.filter((a) => !a.mastered).length;
  const masteredCount = answers.filter((a) => a.mastered).length;

  return (
    <div style={{ minHeight: "100%" }}>
      <div className="os-background">
        <div className="os-orb os-orb--1" />
        <div className="os-orb os-orb--2" />
        <div className="os-orb os-orb--3" />
        <div className="os-grid" />
      </div>

      <div className="os-window" style={{ maxWidth: 640 }}>
        <div className="os-window-header">
          <div className="os-window-title">
            <span className="icon">📝</span>
            <span>Wrong Answer Journal</span>
          </div>
          <div className="os-window-controls">
            <Link href="/" style={{ textDecoration: "none" }}>
              <button className="close" title="Close">✕</button>
            </Link>
          </div>
        </div>

        <div className="os-window-body" style={{ padding: "20px 24px" }}>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "#64748b", fontSize: 13 }}>Loading...</div>
          ) : answers.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <BookOpen size={32} color="#4a5568" style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 4 }}>No wrong answers yet</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>When you mark a card as "Forgot" or "I Don&apos;t Know", it will appear here.</div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{activeCount}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>To Review</div>
                </div>
                <div style={{ flex: 1, padding: "10px 14px", borderRadius: 10, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#22c55e" }}>{masteredCount}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>Mastered</div>
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                {(["active", "mastered", "all"] as const).map((f) => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500, border: "none", cursor: "pointer",
                    background: filter === f ? "var(--os-accent)" : "rgba(255,255,255,0.04)",
                    color: filter === f ? "#fff" : "#94a3b8", transition: "all 0.15s",
                  }}>
                    {f === "active" ? "To Review" : f === "mastered" ? "Mastered" : "All"}
                  </button>
                ))}
                {masteredCount > 0 && (
                  <button onClick={clearMastered} style={{
                    marginLeft: "auto", padding: "5px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
                    border: "none", cursor: "pointer", background: "rgba(239,68,68,0.1)", color: "#ef4444",
                  }}>Clear Mastered</button>
                )}
              </div>

              {/* Search */}
              <div style={{ marginBottom: 16 }}>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search wrong answers..."
                  style={{
                    width: "100%", padding: "8px 12px", fontSize: 13, borderRadius: 10,
                    background: "rgba(0,0,0,0.2)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#e2e8f0", outline: "none",
                  }}
                />
              </div>

              {/* Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map((a) => (
                  <div key={a.id} style={{
                    padding: "12px 14px", borderRadius: 12,
                    background: a.mastered ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${a.mastered ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)"}`,
                    opacity: a.mastered ? 0.6 : 1,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ flex: 1, cursor: "pointer" }} onClick={() => setFlippedId(flippedId === a.id ? null : a.id)}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", marginBottom: 4 }}>
                          {flippedId === a.id ? a.back : a.front}
                        </div>
                        {flippedId === a.id && a.hint && (
                          <div style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>Hint: {a.hint}</div>
                        )}
                        <div style={{ display: "flex", gap: 8, marginTop: 6, fontSize: 10, color: "#64748b" }}>
                          {a.source && <span>{a.source}</span>}
                          {a.subject && <span>· {a.subject}</span>}
                          <span>· {new Date(a.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button onClick={() => toggleMastered(a.id, a.mastered)} title={a.mastered ? "Mark as active" : "Mark as mastered"} style={{
                          width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer",
                          background: a.mastered ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
                          color: a.mastered ? "#22c55e" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <CheckCircle size={14} />
                        </button>
                        <button onClick={() => deleteAnswer(a.id)} title="Delete" style={{
                          width: 28, height: 28, borderRadius: 6, border: "none", cursor: "pointer",
                          background: "rgba(255,255,255,0.04)", color: "#64748b",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    {filter === "active" ? "All mastered! Great work!" : "No results"}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
