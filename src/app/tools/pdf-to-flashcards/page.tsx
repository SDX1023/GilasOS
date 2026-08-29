"use client";

import { useState, useCallback, useEffect } from "react";
import { FileText, Upload, Loader2, Save } from "lucide-react";
import { addCourse, addModule, addReviewer, loadCustomContent } from "@/lib/custom-content";
import { getSupabase } from "@/lib/supabase";

const PDF_COURSE_ID = "pdf-generated";
const PDF_MODULE_ID = "pdf-cards";

export default function PdfToFlashcardsPage() {
  const [pdfText, setPdfText] = useState("");
  const [generatedCards, setGeneratedCards] = useState<{ front: string; back: string; hint?: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [saving, setSaving] = useState(false);
  const [lastError, setLastError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");
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

  const ensureCourseAndModule = () => {
    const custom = loadCustomContent();
    if (!custom.courses.find((c) => c.id === PDF_COURSE_ID)) {
      addCourse({ id: PDF_COURSE_ID, title: "PDF Generated", description: "Flashcards generated from PDFs" });
      addModule(PDF_COURSE_ID, { id: PDF_MODULE_ID, courseId: PDF_COURSE_ID, title: "My Decks", description: "Auto-saved from PDF to Flashcards" });
    }
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    setIsGenerating(true);
    setLastError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract PDF");
      setPdfText(data.text);
    } catch (err: any) {
      setLastError(err.message);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateCards = useCallback(async () => {
    if (!pdfText.trim() || isGenerating || cooldown > 0) return;
    setIsGenerating(true);
    setLastError("");
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
        if (retryAfter > 0) {
          setCooldown(retryAfter);
          localStorage.setItem("flashcard-cooldown-until", String(Date.now() + retryAfter * 1000));
        }
        throw new Error(data.error || "Failed to generate flashcards");
      }
      if (!data.cards || data.cards.length === 0) throw new Error("No flashcards generated — try again");
      setGeneratedCards(data.cards);
    } catch (error: any) {
      const msg = error.message || "Failed";
      if (msg.toLowerCase().includes("<!doctype") || msg.toLowerCase().includes("bad gateway")) {
        setLastError("Server busy — try again in 30s");
      } else {
        setLastError(msg);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [pdfText, isGenerating, cooldown]);

  const saveDeck = async () => {
    if (!deckName.trim() || generatedCards.length === 0) return;
    setSaving(true);
    setSaveMsg("");
    try {
      ensureCourseAndModule();
      addReviewer(PDF_COURSE_ID, PDF_MODULE_ID, { title: deckName, cards: generatedCards });
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const reviewerId = `${PDF_COURSE_ID}/${PDF_MODULE_ID}/${deckName.toLowerCase().replace(/\s+/g, "-")}`;
        await supabase.from("reviewers").upsert({ id: reviewerId, user_id: user.id, course_id: PDF_COURSE_ID, module_id: PDF_MODULE_ID, title: deckName }, { onConflict: "id" });
        const rows = generatedCards.map((card, i) => ({ id: `${reviewerId.replace(/\//g, "-")}-card-${Date.now()}-${i}`, reviewer_id: reviewerId, user_id: user.id, front: card.front, back: card.back, hint: card.hint || "" }));
        await supabase.from("flashcards").insert(rows);
      }
      setDeckName(""); setGeneratedCards([]); setPdfText(""); setSaveMsg("Deck saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err: any) { setLastError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <FileText className="h-7 w-7" /> PDF to Flashcards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Generate flashcards from your study materials using AI</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="p-5 rounded-2xl border bg-card backdrop-blur-sm">
            <h2 className="font-semibold mb-4">PDF Content</h2>
            <div className="space-y-4">
              <label className="flex items-center justify-center gap-2 px-4 py-8 rounded-xl border border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload PDF</span>
                <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              </label>

              <textarea
                value={pdfText}
                onChange={(e) => { setPdfText(e.target.value); setLastError(""); }}
                placeholder="Or paste text content here..."
                className="w-full px-4 py-3 rounded-xl border bg-background text-sm resize-none h-40"
              />

              {lastError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm">
                  <p className="text-red-600 dark:text-red-400 font-medium">{lastError}</p>
                  {cooldown > 0 && <p className="text-muted-foreground mt-1">Wait {cooldown}s before trying again</p>}
                </div>
              )}

              {saveMsg && (
                <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm">
                  <p className="text-green-600 dark:text-green-400 font-medium">{saveMsg}</p>
                </div>
              )}

              <button
                onClick={generateCards}
                disabled={!pdfText.trim() || isGenerating || cooldown > 0}
                className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {isGenerating ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                ) : cooldown > 0 ? (
                  `Wait ${cooldown}s...`
                ) : (
                  <><FileText className="h-4 w-4" /> Generate Flashcards</>
                )}
              </button>
            </div>
          </div>

          {/* Output Panel */}
          <div className="p-5 rounded-2xl border bg-card backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Generated Cards ({generatedCards.length})</h2>
              {generatedCards.length > 0 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="Deck name"
                    className="px-3 py-1.5 rounded-lg border bg-background text-sm w-32"
                  />
                  <button
                    onClick={saveDeck}
                    disabled={!deckName.trim() || saving}
                    className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    <Save className="h-3 w-3" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>

            {generatedCards.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Generate flashcards from your PDF content</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                {generatedCards.map((card, i) => (
                  <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/50">
                    <p className="font-medium text-sm">{card.front}</p>
                    <p className="text-sm text-muted-foreground mt-1">{card.back}</p>
                    {card.hint && <p className="text-xs text-muted-foreground mt-1 italic">Hint: {card.hint}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
