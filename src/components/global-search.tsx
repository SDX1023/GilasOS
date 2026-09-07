"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, BookOpen, Layers, FileText, FolderOpen, Trophy, X } from "lucide-react";

const TYPE_ICONS: Record<string, any> = {
  subject: BookOpen,
  module: Layers,
  note: FileText,
  content: FileText,
  deck: Layers,
  shared: Layers,
  archive: Trophy,
};

const TYPE_COLORS: Record<string, string> = {
  subject: "#6d28d9",
  module: "#8b5cf6",
  note: "#a78bfa",
  content: "#c084fc",
  deck: "#2563eb",
  shared: "#0ea5e9",
  archive: "#f59e0b",
};

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !open && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
        setQuery("");
        setResults([]);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results || []);
        setSelectedIdx(0);
      } catch {}
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function navigate(href: string) {
    router.push(href);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && results[selectedIdx]) { navigate(results[selectedIdx].href); }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Search (press /)"
        style={{
          width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.04)", color: "#94a3b8", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#e2e8f0"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#94a3b8"; }}
      >
        <Search size={15} />
      </button>
    );
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh", backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      onClick={() => { setOpen(false); setQuery(""); setResults([]); }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 520, maxHeight: "60vh", borderRadius: 16, overflow: "hidden",
          background: "linear-gradient(160deg, rgba(20,25,40,0.97), rgba(12,15,25,0.99))",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
          display: "flex", flexDirection: "column",
        }}
      >
        {/* Search Input */}
        <div style={{ display: "flex", alignItems: "center", padding: "14px 16px", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <Search size={16} color="#64748b" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search subjects, decks, notes..."
            style={{
              flex: 1, background: "none", border: "none", outline: "none",
              fontSize: 14, color: "#e2e8f0", fontFamily: "inherit",
            }}
          />
          {query && (
            <button onClick={() => { setQuery(""); setResults([]); }} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", padding: 2 }}>
              <X size={14} />
            </button>
          )}
          <span style={{ fontSize: 10, color: "#4a5568", padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>ESC</span>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
          {loading && query.length >= 2 && (
            <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 13 }}>Searching...</div>
          )}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 13 }}>No results found</div>
          )}
          {results.map((r, i) => {
            const Icon = TYPE_ICONS[r.type] || FileText;
            const color = TYPE_COLORS[r.type] || "#94a3b8";
            return (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => navigate(r.href)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10,
                  background: i === selectedIdx ? "rgba(255,255,255,0.06)" : "transparent",
                  border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.1s",
                }}
                onMouseEnter={() => setSelectedIdx(i)}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <Icon size={14} color={color} />
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.subtitle}</div>
                </div>
                <span style={{ fontSize: 9, color: "#4a5568", textTransform: "uppercase", letterSpacing: "0.05em" }}>{r.type}</span>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "8px 16px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", gap: 12, fontSize: 10, color: "#4a5568" }}>
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>esc Close</span>
        </div>
      </div>
    </div>
  );
}
