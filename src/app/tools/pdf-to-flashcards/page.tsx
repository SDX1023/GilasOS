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
  const [cooldown, setCooldown] = useState(() => {
    if (typeof window === "undefined") return 0;
    const until = localStorage.getItem("flashcard-cooldown-until");
    if (until) {
      const remaining = Math.max(0, Math.ceil((Number(until) - Date.now()) / 1000));
      return remaining;
    }
    return 0;
  });
  const [lastError, setLastError] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  useEffect(() => {
    if (cooldown <= 0) { localStorage.removeItem("flashcard-cooldown-until"); return; }
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const ensureCourseAndModule = () => {
    const custom = loadCustomContent();
    const existingCourse = custom.courses.find((c) => c.id === PDF_COURSE_ID);
    if (!existingCourse) {
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
    if (!pdfText.trim() || isGenerating) return;
    setIsGenerating(true);
    setLastError("");
    try {
      const res = await fetch("/api/generate-flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: pdfText }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate flashcards");
      }

      const jobId = data.jobId;
      if (!jobId) throw new Error("No job id returned");

      let final: any = null;
      while (true) {
        const r = await fetch(`/api/generate-flashcards?job=${encodeURIComponent(jobId)}`);
        const text = await r.text();
        let d: any;
        try { d = JSON.parse(text); } catch { throw new Error(text.slice(0, 300) || "Invalid server response"); }
        if (!r.ok) throw new Error(d.error || "Failed to poll job");
        if (d.status === "error") throw new Error(d.error || "Generation failed");
        if (d.status === "done") { final = d; break; }
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
      setGeneratedCards(final.cards);
    } catch (error: any) {
      setLastError(error.message);
    } finally {
      setIsGenerating(false);
    }
  }, [pdfText, isGenerating]);

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
        await supabase.from("reviewers").upsert({
          id: reviewerId, user_id: user.id, course_id: PDF_COURSE_ID, module_id: PDF_MODULE_ID, title: deckName,
        }, { onConflict: "id" });
        if (generatedCards.length > 0) {
          const rows = generatedCards.map((card, i) => ({
            id: `${reviewerId.replace(/\//g, "-")}-card-${Date.now()}-${i}`,
            reviewer_id: reviewerId, user_id: user.id, front: card.front, back: card.back, hint: card.hint || "",
          }));
          await supabase.from("flashcards").insert(rows);
        }
      }
      setDeckName("");
      setGeneratedCards([]);
      setPdfText("");
      setSaveMsg("Deck saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err: any) {
      setLastError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">PDF to Flashcards</h1>
      <p className="text-muted-foreground mb-8">Generate flashcards from your study materials using AI</p>

      <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
        <div className="space-y-6">
          <div className="p-6 rounded-xl border bg-card">
            <h2 className="font-semibold mb-4">PDF Content</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-2 px-4 py-3 rounded-lg border border-dashed cursor-pointer hover:bg-muted transition-colors">
                <Upload className="h-5 w-5" />
                <span className="text-sm">Upload PDF</span>
                <input type="file" accept=".pdf" onChange={handleFileUpload} className="hidden" />
              </label>
              <textarea
                value={pdfText}
                onChange={(e) => { setPdfText(e.target.value); setLastError(""); }}
                placeholder="Or paste text content here..."
                className="w-full px-3 py-2 rounded-lg border bg-background h-48 resize-none"
              />

              {lastError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm">
                  <p className="text-red-600 font-medium">{lastError}</p>
                  {cooldown > 0 && <p className="text-muted-foreground mt-1">Wait {cooldown}s before trying again</p>}
                </div>
              )}

              {saveMsg && (
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-sm">
                  <p className="text-green-600 font-medium">{saveMsg}</p>
                </div>
              )}

              <button
                onClick={generateCards}
                disabled={!pdfText.trim() || isGenerating || cooldown > 0}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : cooldown > 0 ? `Wait ${cooldown}s...` : <><FileText className="h-4 w-4" /> Generate Flashcards</>}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl border bg-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Generated Cards ({generatedCards.length})</h2>
              {generatedCards.length > 0 && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={deckName}
                    onChange={(e) => setDeckName(e.target.value)}
                    placeholder="Deck name"
                    className="px-3 py-1 rounded-lg border bg-background text-sm w-36"
                  />
                  <button
                    onClick={saveDeck}
                    disabled={!deckName.trim() || saving}
                    className="flex items-center gap-1 px-3 py-1 bg-primary text-primary-foreground rounded-lg text-sm disabled:opacity-50"
                  >
                    <Save className="h-3 w-3" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>

            {generatedCards.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Generate flashcards from your PDF content</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {generatedCards.map((card, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50">
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
