"use client";

import { useState, useCallback } from "react";
import { FileText, Upload, Loader2, Save } from "lucide-react";
import { addCourse, addModule, addReviewer, loadCustomContent } from "@/lib/custom-content";

const PDF_COURSE_ID = "pdf-generated";
const PDF_MODULE_ID = "pdf-cards";

function splitIntoChunks(text: string, size = 8000): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split(/\n\n+/);
  let current = "";
  for (const p of paragraphs) {
    if (p.length > size) {
      if (current.trim()) chunks.push(current.trim());
      const sentences = p.split(/(?<=[.!?])\s+/);
      current = "";
      for (const s of sentences) {
        if ((current + " " + s).length > size && current) {
          chunks.push(current.trim());
          current = s;
        } else {
          current = current ? current + " " + s : s;
        }
      }
    } else if ((current + "\n\n" + p).length > size && current) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + "\n\n" + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

export default function PdfToFlashcardsPage() {
  const [pdfText, setPdfText] = useState("");
  const [generatedCards, setGeneratedCards] = useState<{ front: string; back: string; hint?: string }[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState("");

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
    setProgress("Extracting PDF text...");
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/extract-pdf", { method: "POST", body: formData });
      if (!res.ok) {
        const text = await res.text();
        let errMsg = "Failed to extract PDF";
        try { errMsg = JSON.parse(text).error || errMsg; } catch { errMsg = text || errMsg; }
        throw new Error(errMsg);
      }
      const data = await res.json();
      setPdfText(data.text);
      setProgress("");
    } catch (err: any) {
      alert(`Error: ${err.message}`);
      setProgress("");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const generateCards = useCallback(async () => {
    if (!pdfText.trim()) return;

    let apiKey = localStorage.getItem("groq_api_key");
    if (!apiKey) {
      const input = window.prompt("Enter your Groq API key (get one free at console.groq.com):");
      if (!input?.trim()) return;
      apiKey = input.trim();
      localStorage.setItem("groq_api_key", apiKey);
    }

    setIsGenerating(true);
    setGeneratedCards([]);
    setProgress("Starting...");
    try {
      const chunks = splitIntoChunks(pdfText);
      const systemPrompt = `You are a flashcard generator. Given text content, generate flashcards for studying.
Return ONLY a JSON array of objects with "front" (question) and "back" (answer) fields.
Optionally include a "hint" field for difficult concepts.
Generate as many flashcards as possible to thoroughly cover ALL key concepts, facts, definitions, and details in the text.
Aim for 10-20 flashcards per chunk. Be thorough.
Make questions clear and concise. Answers should be informative but brief.
Do not include any markdown formatting or code blocks, just the raw JSON array.`;

      const allCards: { front: string; back: string; hint?: string }[] = [];

      for (let i = 0; i < chunks.length; i++) {
        setProgress(`Processing chunk ${i + 1} of ${chunks.length}...`);

        let lastError = "";
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) {
            setProgress(`Retrying chunk ${i + 1} (attempt ${attempt + 1})...`);
            await new Promise(r => setTimeout(r, (attempt + 1) * 3000));
          }

          try {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey.trim()}`,
              },
              body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: chunks[i] },
                ],
                temperature: 0.7,
              }),
            });

            if (res.status === 429) {
              lastError = "Rate limited";
              continue;
            }

            if (!res.ok) {
              const errText = await res.text().catch(() => "");
              lastError = `API error ${res.status}`;
              try { lastError = JSON.parse(errText).error?.message || lastError; } catch {}
              continue;
            }

            const data = await res.json();
            const content = data.choices?.[0]?.message?.content ?? "";
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              const cards = JSON.parse(jsonMatch[0]);
              if (Array.isArray(cards) && cards.length > 0) {
                allCards.push(...cards);
                setGeneratedCards([...allCards]);
              }
            }
            lastError = "";
            break;
          } catch (err: any) {
            lastError = err.message;
          }
        }

        if (lastError && i === chunks.length - 1) {
          throw new Error(lastError);
        }
      }

      setProgress("");
      if (allCards.length === 0) {
        throw new Error("No flashcards generated");
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      setProgress("");
    } finally {
      setIsGenerating(false);
    }
  }, [pdfText]);

  const saveDeck = () => {
    if (!deckName.trim() || generatedCards.length === 0) return;
    setSaving(true);
    try {
      ensureCourseAndModule();
      addReviewer(PDF_COURSE_ID, PDF_MODULE_ID, {
        title: deckName,
        cards: generatedCards,
      });
      setDeckName("");
      setGeneratedCards([]);
      setPdfText("");
      alert("Deck saved! Find it in Flash Cards > PDF Generated.");
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
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
                onChange={(e) => setPdfText(e.target.value)}
                placeholder="Or paste text content here..."
                className="w-full px-3 py-2 rounded-lg border bg-background h-48 resize-none"
              />
              {progress && <p className="text-sm text-muted-foreground">{progress}</p>}
              <button
                onClick={generateCards}
                disabled={!pdfText.trim() || isGenerating}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><FileText className="h-4 w-4" /> Generate Flashcards</>}
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
