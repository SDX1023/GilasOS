"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { FileText, Upload, Loader2, Save } from "lucide-react";
import { addCourse, addModule, addReviewer, loadCustomContent } from "@/lib/custom-content";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

const PDF_COURSE_ID = "pdf-generated";
const PDF_MODULE_ID = "pdf-cards";

export default function PdfToFlashcardsPage() {
  const { user } = useAuth();
  const [pdfText, setPdfText] = useState("");
  const [generatedCards, setGeneratedCards] = useState<{ front: string; back: string; hint?: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastError, setLastError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
  const [targetModule, setTargetModule] = useState("pdf-cards");
  const [cooldown, setCooldown] = useState(() => {
    if (typeof window === "undefined") return 0;
    const until = localStorage.getItem("flashcard-cooldown-until");
    if (until) return Math.max(0, Math.ceil((Number(until) - Date.now()) / 1000));
    return 0;
  });

  useEffect(() => {
    if (cooldown <= 0) { localStorage.removeItem("flashcard-cooldown-until"); return; }
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const ensureCourseAndModule = (moduleId?: string) => {
    const custom = loadCustomContent();
    if (!custom.courses.find((c) => c.id === PDF_COURSE_ID)) {
      addCourse({ id: PDF_COURSE_ID, title: "PDF Generated", description: "Flashcards generated from PDFs" });
    }
    const target = moduleId || PDF_MODULE_ID;
    const course = custom.courses.find((c) => c.id === PDF_COURSE_ID);
    if (!course?.modules.find((m) => m.id === target)) {
      addModule(PDF_COURSE_ID, { id: target, courseId: PDF_COURSE_ID, title: target, description: `Auto-saved from PDF to Flashcards` });
    }
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    setIsGenerating(true); setLastError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract PDF");
      setPdfText(data.text);
    } catch (err: any) { setLastError(err.message); } finally { setIsGenerating(false); }
  }, []);

  const generateCards = useCallback(async () => {
    if (!pdfText.trim() || isGenerating || cooldown > 0) return;
    setIsGenerating(true); setLastError("");
    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pdfText.slice(0, 360000) }),
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error(text.slice(0, 400) || "Invalid server response"); }
      if (!res.ok) {
        const retryAfter = data.retryAfter || (res.status === 429 ? 35 : 0);
        if (retryAfter > 0) { setCooldown(retryAfter); localStorage.setItem("flashcard-cooldown-until", String(Date.now() + retryAfter * 1000)); }
        throw new Error(data.error || "Failed to generate flashcards");
      }
      if (!data.cards || data.cards.length === 0) throw new Error("No flashcards generated — try again");
      setGeneratedCards(data.cards);
    } catch (error: any) {
      const msg = error.message || "Failed";
      setLastError(msg.toLowerCase().includes("<!doctype") ? "Server busy — try again in 30s" : msg);
    } finally { setIsGenerating(false); }
  }, [pdfText, isGenerating, cooldown]);

  const saveDeck = async () => {
    if (!deckName.trim() || generatedCards.length === 0) return;
    setSaving(true); setSaveMsg("");
    try {
      ensureCourseAndModule(targetModule);
      addReviewer(PDF_COURSE_ID, targetModule, { title: deckName, cards: generatedCards });
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const reviewerId = `${PDF_COURSE_ID}/${targetModule}/${deckName.toLowerCase().replace(/\s+/g, "-")}`;
        await supabase.from("reviewers").upsert({ id: reviewerId, user_id: user.id, course_id: PDF_COURSE_ID, module_id: targetModule, title: deckName }, { onConflict: "id" });
        const rows = generatedCards.map((card, i) => ({ id: `${reviewerId.replace(/\//g, "-")}-card-${Date.now()}-${i}`, reviewer_id: reviewerId, user_id: user.id, front: card.front, back: card.back, hint: card.hint || "" }));
        await supabase.from("flashcards").insert(rows);
      }
      setDeckName(""); setGeneratedCards([]); setPdfText(""); setSaveMsg("Deck saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err: any) { setLastError(err.message); } finally { setSaving(false); }
  };

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon"><FileText size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Sign in required</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>Log in to generate flashcards from PDFs.</p>
          <Link href="/login" className="glass-btn glass-btn-primary">Log In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title"><FileText size={28} /> PDF to Flashcards</h1>
        <p className="page-subtitle">Generate flashcards from your study materials using AI</p>
      </div>

      <div className="grid-2">
        {/* Input */}
        <div className="glass-panel">
          <h2 style={{ fontWeight: 600, marginBottom: 16 }}>PDF Content</h2>
          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "32px 16px", borderRadius: 12, border: "1.5px dashed rgba(255,255,255,0.1)", cursor: "pointer", marginBottom: 16, position: "relative" }}>
            <Upload size={20} style={{ color: "var(--os-text-dim)" }} />
            <span className="text-secondary text-sm">Upload PDF</span>
            <input type="file" accept=".pdf" onChange={handleFileUpload} style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", top: 0, left: 0, cursor: "pointer" }} />
          </label>
          <textarea
            value={pdfText}
            onChange={(e) => { setPdfText(e.target.value); setLastError(""); }}
            placeholder="Or paste text content here..."
            className="glass-input"
            style={{ height: 160, resize: "none", marginBottom: 16 }}
          />
          {lastError && (
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#ef4444", fontWeight: 500 }}>{lastError}</p>
              {cooldown > 0 && <p className="text-dim text-xs" style={{ marginTop: 4 }}>Wait {cooldown}s before trying again</p>}
            </div>
          )}
          {saveMsg && (
            <div style={{ padding: 12, borderRadius: 10, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: "#10b981", fontWeight: 500 }}>{saveMsg}</p>
            </div>
          )}
          <button
            onClick={generateCards}
            disabled={!pdfText.trim() || isGenerating || cooldown > 0}
            className="glass-btn glass-btn-primary"
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: !pdfText.trim() || isGenerating || cooldown > 0 ? 0.5 : 1 }}
          >
            {isGenerating ? <><Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Generating...</> : cooldown > 0 ? `Wait ${cooldown}s...` : <><FileText size={16} /> Generate Flashcards</>}
          </button>
        </div>

        {/* Output */}
        <div className="glass-panel">
          <div className="flex-between" style={{ marginBottom: 16 }}>
            <h2 style={{ fontWeight: 600 }}>Generated Cards ({generatedCards.length})</h2>
            {generatedCards.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input className="glass-input" value={deckName} onChange={(e) => setDeckName(e.target.value)} placeholder="Deck name" style={{ width: 140 }} />
                <input className="glass-input" value={targetModule} onChange={(e) => setTargetModule(e.target.value)} placeholder="Module (default: pdf-cards)" style={{ width: 160 }} />
                <button onClick={saveDeck} disabled={!deckName.trim() || saving} className="glass-btn glass-btn-primary" style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 14px", fontSize: 13, opacity: !deckName.trim() || saving ? 0.5 : 1 }}>
                  <Save size={12} /> {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>
          {generatedCards.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px 20px" }}>
              <FileText size={36} style={{ color: "var(--os-text-dim)", marginBottom: 12 }} />
              <p className="text-secondary text-sm">Generate flashcards from your PDF content</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "32rem", overflowY: "auto" }}>
              {generatedCards.map((card, i) => (
                <div key={i} className="glass-card" style={{ padding: 14 }}>
                  <p style={{ fontWeight: 500, fontSize: 14 }}>{card.front}</p>
                  <p className="text-secondary text-sm" style={{ marginTop: 4 }}>{card.back}</p>
                  {card.hint && <p className="text-dim text-xs" style={{ marginTop: 4, fontStyle: "italic" }}>Hint: {card.hint}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
