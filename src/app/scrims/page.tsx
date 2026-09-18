"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Swords, Upload, FileText, Clock, Zap, Check, X, ArrowLeft, RotateCcw, Trophy, Flame, Timer, Loader2, Trash2, History } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { saveStudySession, saveScrimResult, loadScrimResults, deleteScrimResult, ScrimResult, saveScrim, loadSavedScrims, deleteSavedScrim, SavedScrim } from "@/lib/user-data";

interface ScrimQuestion {
  question: string;
  answer: string;
  difficulty: "easy" | "medium" | "hard";
}

type View = "upload" | "generating" | "playing" | "results";

const DIFFICULTY_CONFIG = {
  easy: { label: "Easy", time: 10, color: "#22c55e", icon: Zap },
  medium: { label: "Medium", time: 30, color: "#f59e0b", icon: Clock },
  hard: { label: "Hard", time: 60, color: "#ef4444", icon: Flame },
};

function matchAnswer(userInput: string, correctAnswer: string): boolean {
  const normalize = (s: string) =>
    s.toLowerCase()
      .replace(/[^\w\s\d]/g, " ")
      .replace(/\s+/g, " ")
      .replace(/\b(a|an|the|is|are|was|were|of|in|on|at|to|for|and|or)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const user = normalize(userInput);
  if (!user) return false;

  const alternatives = correctAnswer.split("/").map((a) => normalize(a));
  return alternatives.some((correct) => {
    if (!correct) return false;
    if (user === correct) return true;
    const userWords = user.split(" ").filter(Boolean);
    const correctWords = correct.split(" ").filter(Boolean);
    if (userWords.length === 0 || correctWords.length === 0) return false;
    const matchCount = userWords.filter((w) => correctWords.includes(w)).length;
    return matchCount / correctWords.length >= 0.6;
  });
}

export default function ScrimsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [view, setView] = useState<View>("upload");
  const [docText, setDocText] = useState("");
  const [questions, setQuestions] = useState<ScrimQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<{ correct: boolean; question: ScrimQuestion; userAnswer: string; timedOut: boolean }[]>([]);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [streak, setStreak] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [flashAnswer, setFlashAnswer] = useState("");
  const [scrimHistory, setScrimHistory] = useState<ScrimResult[]>([]);
  const [savedScrims, setSavedScrims] = useState<SavedScrim[]>([]);
  const [docTitle, setDocTitle] = useState("Untitled Document");
  const [scrimStartTime, setScrimStartTime] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      loadScrimResults(user.id).then(setScrimHistory);
      loadSavedScrims(user.id).then(setSavedScrims);
    }
  }, [user]);

  const startScrim = useCallback(async (text: string) => {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/generate-scrims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || !data.questions?.length) {
        setError(data.error || "Failed to generate questions");
        setGenerating(false);
        return;
      }
      const shuffled = [...data.questions].sort(() => Math.random() - 0.5);
      setQuestions(shuffled);
      setCurrentIdx(0);
      setResults([]);
      setStreak(0);
      setScrimStartTime(Date.now());
      setView("playing");
      const diff = shuffled[0].difficulty as keyof typeof DIFFICULTY_CONFIG;
      setTimeLeft(DIFFICULTY_CONFIG[diff].time);
    } catch {
      setError("Failed to generate questions. Try again.");
    }
    setGenerating(false);
  }, []);

  useEffect(() => {
    if (view !== "playing") return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [view, currentIdx, timeLeft]);

  useEffect(() => {
    if (view === "playing" && inputRef.current) inputRef.current.focus();
  }, [view, currentIdx]);

  function handleTimeout() {
    if (timerRef.current) clearInterval(timerRef.current);
    const q = questions[currentIdx];
    setResults((prev) => [...prev, { correct: false, question: q, userAnswer: "", timedOut: true }]);
    setFlash("wrong");
    setFlashAnswer(q.answer);
    setStreak(0);
    setTimeout(() => {
      setFlash(null);
      setFlashAnswer("");
      advanceQuestion();
    }, 1200);
  }

  function handleSubmit() {
    if (timerRef.current) clearInterval(timerRef.current);
    const q = questions[currentIdx];
    const isCorrect = matchAnswer(userAnswer, q.answer);
    setResults((prev) => [...prev, { correct: isCorrect, question: q, userAnswer, timedOut: false }]);
    if (isCorrect) {
      setFlash("correct");
      setFlashAnswer("");
      setStreak((s) => s + 1);
    } else {
      setFlash("wrong");
      setFlashAnswer(q.answer);
      setStreak(0);
    }
    setUserAnswer("");
    setTimeout(() => {
      setFlash(null);
      setFlashAnswer("");
      advanceQuestion();
    }, 1200);
  }

  function advanceQuestion() {
    if (currentIdx + 1 >= questions.length) {
      setView("results");
      if (user) {
        const correct = results.filter((r) => r.correct).length + (flash === "correct" ? 1 : 0);
        const timedOut = results.filter((r) => r.timedOut).length;
        const duration = Math.round((Date.now() - scrimStartTime) / 1000);
        saveStudySession(user.id, { session_type: "scrims", subject: "Scrims", score: correct, total_questions: questions.length, duration_seconds: duration });
        saveScrimResult(user.id, docTitle, correct, questions.length, timedOut, duration, JSON.stringify(results.map((r) => ({ q: r.question.question, a: r.question.answer, userA: r.userAnswer, correct: r.correct, timedOut: r.timedOut, diff: r.question.difficulty }))));
      }
    } else {
      setCurrentIdx((i) => i + 1);
      const next = questions[currentIdx + 1];
      const diff = next.difficulty as keyof typeof DIFFICULTY_CONFIG;
      setTimeLeft(DIFFICULTY_CONFIG[diff].time);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "txt" || ext === "md") {
      const reader = new FileReader();
      reader.onload = (ev) => setDocText(ev.target?.result as string);
      reader.readAsText(file);
    } else if (ext === "pdf") {
      parsePdf(file);
    } else if (ext === "docx") {
      parseDocx(file);
    } else {
      setError("Unsupported file type. Use .txt, .md, .pdf, or .docx");
    }
  }

  async function parsePdf(file: File) {
    setGenerating(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to parse PDF");
      } else {
        setDocText(data.text);
      }
    } catch {
      setError("Failed to parse PDF. Try converting to .txt first.");
    }
    setGenerating(false);
  }

  async function parseDocx(file: File) {
    setGenerating(true);
    setError("");
    try {
      const mammoth = await import("mammoth");
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setDocText(result.value);
    } catch {
      setError("Failed to parse DOCX. Try converting to .txt first.");
    }
    setGenerating(false);
  }

  async function handleSaveScrim() {
    if (!user || !questions.length) return;
    const id = await saveScrim(user.id, docTitle || "Untitled Scrim", docText, JSON.stringify(questions));
    if (id) {
      loadSavedScrims(user.id).then(setSavedScrims);
    }
  }

  function handleLoadSavedScrim(saved: SavedScrim) {
    const qs: ScrimQuestion[] = JSON.parse(saved.questions_json);
    const shuffled = [...qs].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIdx(0);
    setResults([]);
    setStreak(0);
    setDocText(saved.doc_text);
    setDocTitle(saved.title);
    setScrimStartTime(Date.now());
    setView("playing");
    const diff = shuffled[0].difficulty as keyof typeof DIFFICULTY_CONFIG;
    setTimeLeft(DIFFICULTY_CONFIG[diff].time);
  }

  async function handleDeleteSavedScrim(id: string) {
    if (!user) return;
    await deleteSavedScrim(user.id, id);
    setSavedScrims((prev) => prev.filter((s) => s.id !== id));
  }

  function resetScrim() {
    setView("upload");
    setDocText("");
    setQuestions([]);
    setCurrentIdx(0);
    setUserAnswer("");
    setTimeLeft(0);
    setResults([]);
    setStreak(0);
    setFlash(null);
    setFlashAnswer("");
    setError("");
    if (user) loadScrimResults(user.id).then(setScrimHistory);
  }

  async function handleDeleteScrim(id: string) {
    if (!user) return;
    await deleteScrimResult(user.id, id);
    setScrimHistory((prev) => prev.filter((s) => s.id !== id));
  }

  if (!user) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <div className="empty-state-icon"><Swords size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Sign in required</h2>
          <p className="text-secondary text-sm" style={{ marginBottom: 16 }}>Log in to play Scrims.</p>
        </div>
      </div>
    );
  }

  if (view === "upload") {
    return (
      <div className="page-container">
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="empty-state" style={{ marginBottom: 32 }}>
            <Swords style={{ width: 48, height: 48, color: "var(--os-accent)", marginBottom: 16 }} />
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Scrims</h2>
            <p className="text-secondary">Upload a document and get tested on it. Type your answers under time pressure.</p>
          </div>

          <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--os-text-primary)" }}>Upload Document</h3>
            <label className="glass-btn" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "20px 16px", cursor: "pointer", border: "2px dashed rgba(255,255,255,0.12)", borderRadius: 12, width: "100%", marginBottom: 12 }}>
              <Upload size={18} />
              <span style={{ fontSize: 13 }}>Upload PDF, DOCX, or TXT</span>
              <input type="file" accept=".txt,.md,.pdf,.docx" onChange={handleFileUpload} style={{ display: "none" }} />
            </label>
            <p style={{ fontSize: 11, color: "var(--os-text-dim)", textAlign: "center" }}>or paste your text below</p>
          </div>

          <div className="glass-card" style={{ padding: 24, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--os-text-primary)" }}>Or Paste Text</h3>
            <textarea
              className="glass-input"
              value={docText}
              onChange={(e) => setDocText(e.target.value)}
              placeholder="Paste your study material here..."
              style={{ width: "100%", minHeight: 160, resize: "vertical", padding: 12, fontSize: 13, lineHeight: 1.6 }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12, textAlign: "center" }}>{error}</p>}

          <button
            onClick={() => startScrim(docText)}
            disabled={!docText.trim() || generating}
            className="glass-btn glass-btn-primary"
            style={{ width: "100%", padding: "12px 24px", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: docText.trim() ? 1 : 0.4 }}
          >
            {generating ? <><Loader2 size={16} className="animate-spin" /> Generating Questions...</> : <><Swords size={16} /> Start Scrim</>}
          </button>

          <div style={{ display: "flex", gap: 12, marginTop: 20, justifyContent: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--os-text-dim)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: DIFFICULTY_CONFIG.easy.color }} /> Easy: 10s
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--os-text-dim)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: DIFFICULTY_CONFIG.medium.color }} /> Medium: 30s
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--os-text-dim)" }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: DIFFICULTY_CONFIG.hard.color }} /> Hard: 60s
            </div>
          </div>

          {scrimHistory.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--os-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <History size={16} /> Recent Scrims
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {scrimHistory.map((s) => {
                  const pct = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
                  return (
                    <div key={s.id} className="glass-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.document_title}</p>
                        <p style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 2 }}>
                          {s.score}/{s.total} ({pct}%) · {s.timed_out} timed out · {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button onClick={() => handleDeleteScrim(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-dim)", padding: 4, flexShrink: 0 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {savedScrims.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--os-text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                <Swords size={16} /> Saved Scrims
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {savedScrims.map((s) => {
                  const qs: ScrimQuestion[] = JSON.parse(s.questions_json);
                  return (
                    <div key={s.id} className="glass-card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</p>
                        <p style={{ fontSize: 11, color: "var(--os-text-dim)", marginTop: 2 }}>
                          {qs.length} questions · {new Date(s.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button onClick={() => handleLoadSavedScrim(s)} className="glass-btn glass-btn-primary" style={{ padding: "6px 14px", fontSize: 12, flexShrink: 0 }}>
                        Play
                      </button>
                      <button onClick={() => handleDeleteSavedScrim(s.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-dim)", padding: 4, flexShrink: 0 }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "playing" && questions.length > 0) {
    const q = questions[currentIdx];
    const diff = q.difficulty as keyof typeof DIFFICULTY_CONFIG;
    const config = DIFFICULTY_CONFIG[diff];
    const DiffIcon = config.icon;
    const pct = (timeLeft / config.time) * 100;
    const progress = ((currentIdx + 1) / questions.length) * 100;

    return (
      <div className="page-container" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        {flash && (
          <div style={{
            position: "fixed", inset: 0, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            background: flash === "correct" ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)",
            animation: "fadeInOut 1.2s ease-in-out",
          }}>
            <div style={{ fontSize: 64, fontWeight: 800, color: flash === "correct" ? "#22c55e" : "#ef4444", marginBottom: flashAnswer ? 8 : 0 }}>
              {flash === "correct" ? "CORRECT" : "WRONG"}
            </div>
            {flashAnswer && (
              <div style={{ fontSize: 20, color: "var(--os-text-secondary)", fontWeight: 500 }}>
                Answer: <span style={{ color: "#22c55e" }}>{flashAnswer}</span>
              </div>
            )}
          </div>
        )}

        <div style={{ width: "100%", maxWidth: 600 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <button onClick={resetScrim} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--os-text-dim)", padding: 4 }}>
              <ArrowLeft size={18} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "var(--os-text-dim)" }}>{currentIdx + 1}/{questions.length}</span>
              {streak >= 2 && (
                <span style={{ fontSize: 12, color: "#f59e0b", display: "flex", alignItems: "center", gap: 4 }}>
                  <Flame size={14} /> {streak}
                </span>
              )}
            </div>
          </div>

          <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginBottom: 20 }}>
            <div style={{ height: "100%", borderRadius: 2, width: `${progress}%`, background: "var(--os-accent)", transition: "width 0.3s" }} />
          </div>

          <div style={{ position: "relative", marginBottom: 20 }}>
            <div style={{
              position: "absolute", top: -8, right: 0,
              display: "flex", alignItems: "center", gap: 6,
              padding: "4px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: `${config.color}18`, color: config.color,
            }}>
              <DiffIcon size={14} />
              {config.label}
            </div>

            <div style={{ width: "100%", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 24 }}>
              <div style={{
                height: "100%", borderRadius: 3, transition: "width 1s linear, background 0.3s",
                width: `${pct}%`,
                background: pct > 50 ? config.color : pct > 20 ? "#f59e0b" : "#ef4444",
              }} />
            </div>

            <div style={{ fontSize: 32, fontWeight: 800, color: timeLeft <= 3 ? "#ef4444" : "var(--os-text-primary)", textAlign: "center", marginBottom: 4, fontVariantNumeric: "tabular-nums" }}>
              {timeLeft}s
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24, marginBottom: 20 }}>
            <p style={{ fontSize: 18, fontWeight: 600, color: "var(--os-text-primary)", lineHeight: 1.5 }}>
              {q.question}
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              ref={inputRef}
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && userAnswer.trim()) handleSubmit(); }}
              placeholder="Type your answer..."
              className="glass-input"
              style={{ flex: 1, padding: "12px 16px", fontSize: 16 }}
            />
            <button
              onClick={handleSubmit}
              disabled={!userAnswer.trim()}
              className="glass-btn glass-btn-primary"
              style={{ padding: "12px 24px", fontSize: 14, fontWeight: 600, opacity: userAnswer.trim() ? 1 : 0.4 }}
            >
              Submit
            </button>
          </div>
        </div>

        <style>{`
          @keyframes fadeInOut {
            0% { opacity: 0; transform: scale(0.8); }
            30% { opacity: 1; transform: scale(1); }
            70% { opacity: 1; transform: scale(1); }
            100% { opacity: 0; transform: scale(0.8); }
          }
        `}</style>
      </div>
    );
  }

  if (view === "results") {
    const correct = results.filter((r) => r.correct).length;
    const total = results.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const timedOut = results.filter((r) => r.timedOut).length;

    return (
      <div className="page-container">
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div className="empty-state" style={{ marginBottom: 32 }}>
            <Trophy style={{ width: 64, height: 64, color: pct >= 80 ? "#f59e0b" : "var(--os-accent)", marginBottom: 16 }} />
            <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 8 }}>Scrim Complete!</h2>
            <div style={{ fontSize: 48, fontWeight: 800, color: pct >= 80 ? "#f59e0b" : "var(--os-accent)", marginBottom: 8 }}>{correct}/{total}</div>
            <p className="text-secondary" style={{ marginBottom: 4 }}>
              {pct === 100 ? "Perfect score!" : pct >= 80 ? "Excellent!" : pct >= 60 ? "Good effort!" : "Keep practicing!"}
            </p>
            <p style={{ fontSize: 12, color: "var(--os-text-dim)" }}>
              {pct}% accuracy · {timedOut} timed out
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 24, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={resetScrim} className="glass-btn glass-btn-primary" style={{ padding: "10px 24px", display: "flex", alignItems: "center", gap: 6 }}>
              <RotateCcw size={16} /> New Scrim
            </button>
            <button onClick={handleSaveScrim} className="glass-btn" style={{ padding: "10px 24px", display: "flex", alignItems: "center", gap: 6 }}>
              <FileText size={16} /> Save Scrim
            </button>
          </div>

          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: "var(--os-text-primary)" }}>Review Answers</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {results.map((r, i) => (
              <div key={i} className="glass-card" style={{
                padding: 14,
                borderColor: r.correct ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)",
                background: r.correct ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--os-text-dim)" }}>#{i + 1}</span>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 6, fontWeight: 600,
                    background: `${DIFFICULTY_CONFIG[r.question.difficulty].color}18`,
                    color: DIFFICULTY_CONFIG[r.question.difficulty].color,
                  }}>
                    {DIFFICULTY_CONFIG[r.question.difficulty].label} · {DIFFICULTY_CONFIG[r.question.difficulty].time}s
                  </span>
                  {r.correct ? <Check size={14} color="#22c55e" /> : <X size={14} color="#ef4444" />}
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-primary)", marginBottom: 4 }}>{r.question.question}</p>
                <p style={{ fontSize: 12, color: r.correct ? "#22c55e" : "var(--os-text-secondary)" }}>
                  {r.timedOut ? "Timed out" : `Your answer: ${r.userAnswer || "(none)"}`}
                </p>
                {!r.correct && <p style={{ fontSize: 12, color: "#22c55e" }}>Correct: {r.question.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
