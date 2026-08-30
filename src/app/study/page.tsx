"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadCustomContent, deleteReviewer, loadReviewersFromSupabase, deleteReviewerFromSupabase, saveReviewerToSupabase } from "@/lib/custom-content";
import { getSupabase } from "@/lib/supabase";
import { useCourses } from "@/hooks/use-db";
import { saveQuizHistory, loadQuizHistory, deleteQuizHistory, loadBookmarkedCards, saveStudyStats } from "@/lib/user-data";
import { Brain, Trash2, PenTool, Sparkles, Upload, FileText, BookOpen, History, TrendingDown, X, Check, ChevronRight, ChevronDown, BarChart3, Bookmark } from "lucide-react";

type Tab = "flashcards" | "quiz" | "history" | "weak";

export default function StudyPage() {
  const [tab, setTab] = useState<Tab>("flashcards");
  const [mounted, setMounted] = useState(false);
  const [allReviewers, setAllReviewers] = useState<{ courseId: string; moduleId: string; reviewer: any }[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ courseId: string; moduleId: string; reviewerId: string; title: string } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      const localReviewers: { courseId: string; moduleId: string; reviewer: any }[] = [];
      const customContent = loadCustomContent();
      for (const course of customContent.courses) {
        for (const mod of course.modules) {
          for (const reviewer of mod.reviewers) {
            localReviewers.push({ courseId: course.id, moduleId: mod.id, reviewer });
          }
        }
      }

      if (user) {
        const cloudReviewers = await loadReviewersFromSupabase();
        const cloudIds = new Set(cloudReviewers.map((r) => r.reviewer.id));
        const missingFromCloud = localReviewers.filter((r) => !cloudIds.has(r.reviewer.id));
        for (const item of missingFromCloud) {
          saveReviewerToSupabase(item.courseId, item.moduleId, item.reviewer).catch(() => {});
        }
        setAllReviewers([...cloudReviewers, ...missingFromCloud]);
      } else {
        setAllReviewers(localReviewers);
      }
      setMounted(true);
    })();
  }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    if (userId) {
      await deleteReviewerFromSupabase(deleteTarget.reviewerId);
      const cloudReviewers = await loadReviewersFromSupabase();
      setAllReviewers(cloudReviewers);
    } else {
      deleteReviewer(deleteTarget.courseId, deleteTarget.moduleId, deleteTarget.reviewerId);
      const customContent = loadCustomContent();
      const reviewers: { courseId: string; moduleId: string; reviewer: any }[] = [];
      for (const course of customContent.courses) {
        for (const mod of course.modules) {
          for (const reviewer of mod.reviewers) {
            reviewers.push({ courseId: course.id, moduleId: mod.id, reviewer });
          }
        }
      }
      setAllReviewers(reviewers);
    }
    setDeleteTarget(null);
  }

  if (!mounted) {
    return (
      <div className="page-container">
        <h1 className="page-title">Study</h1>
        <p className="text-secondary">Loading...</p>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ paddingBottom: "24px" }}>
      <h1 className="page-title">
        <PenTool style={{ width: "28px", height: "28px" }} /> Study
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: "4px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "4px", background: "rgba(255,255,255,0.03)", marginBottom: "24px", width: "fit-content", overflowX: "auto" }}>
        {([
          ["flashcards", "Flashcards", Brain],
          ["quiz", "Quiz", Sparkles],
          ["history", "History", History],
          ["weak", "Weak Areas", TrendingDown],
        ] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              outline: "none",
              fontSize: "13px",
              fontWeight: 500,
              whiteSpace: "nowrap",
              transition: "all 0.2s",
              background: tab === key ? "var(--os-accent)" : "transparent",
              color: tab === key ? "#fff" : "var(--os-text-secondary)",
              cursor: "pointer",
            }}>
            <Icon style={{ width: "16px", height: "16px" }} /> {label}
          </button>
        ))}
      </div>

      {tab === "flashcards" && (
        <FlashcardsTab allReviewers={allReviewers} userId={userId} onDelete={(target) => setDeleteTarget(target)} />
      )}
      {tab === "quiz" && <QuizTab userId={userId} />}
      {tab === "history" && <HistoryTab userId={userId} />}
      {tab === "weak" && <WeakAreasTab userId={userId} />}


      {deleteTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div className="glass-card" style={{ maxWidth: "384px", width: "100%", margin: "0 16px", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", color: "var(--os-text-primary)" }}>Delete Deck?</h3>
            <p className="text-secondary" style={{ fontSize: "13px", marginBottom: "16px" }}>
              Are you sure you want to delete &quot;{deleteTarget.title}&quot;? This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={() => setDeleteTarget(null)} className="glass-btn" style={{ padding: "8px 16px", fontSize: "13px", fontWeight: 500 }}>Cancel</button>
              <button onClick={handleDelete} style={{ padding: "8px 16px", borderRadius: "8px", background: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 500, border: "none", cursor: "pointer" }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FlashcardsTab({ allReviewers, userId, onDelete }: {
  allReviewers: { courseId: string; moduleId: string; reviewer: any }[];
  userId: string | null;
  onDelete: (target: { courseId: string; moduleId: string; reviewerId: string; title: string }) => void;
}) {
  const [openCourses, setOpenCourses] = useState<Set<string>>(new Set());
  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const toggleCourse = (id: string) => {
    setOpenCourses((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleModule = (id: string) => {
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (allReviewers.length === 0) {
    return (
      <div className="empty-state">
        <Brain className="empty-state-icon" />
        <p className="text-secondary" style={{ marginBottom: "16px" }}>No flashcard decks yet.</p>
        <Link href="/pdf-to-cards" className="glass-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", fontSize: "13px" }}>
          <Upload style={{ width: "16px", height: "16px" }} /> Generate from PDF
        </Link>
      </div>
    );
  }

  const courseMap = new Map<string, { moduleId: string; reviewer: any; courseId: string }[]>();
  for (const r of allReviewers) {
    if (!courseMap.has(r.courseId)) courseMap.set(r.courseId, []);
    courseMap.get(r.courseId)!.push(r);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {Array.from(courseMap.entries()).map(([courseId, reviewers]) => {
        const courseOpen = openCourses.has(courseId);
        const modMap = new Map<string, typeof reviewers>();
        for (const r of reviewers) {
          if (!modMap.has(r.moduleId)) modMap.set(r.moduleId, []);
          modMap.get(r.moduleId)!.push(r);
        }
        const totalCards = reviewers.reduce((s, r) => s + (r.reviewer.cards?.length || 0), 0);
        return (
          <div key={courseId} className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
            <button onClick={() => toggleCourse(courseId)} style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
              background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif",
            }}>
              {courseOpen ? <ChevronDown size={18} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} /> : <ChevronRight size={18} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />}
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontWeight: 600, fontSize: 16, color: "var(--os-text-primary)" }}>{courseId}</span>
                <span className="text-xs" style={{ color: "var(--os-text-dim)", marginLeft: 8 }}>
                  {modMap.size} modules &middot; {totalCards} cards
                </span>
              </div>
            </button>
            {courseOpen && (
              <div style={{ borderTop: "1px solid var(--os-glass-border)", padding: "4px 0" }}>
                {Array.from(modMap.entries()).map(([moduleId, mods]) => {
                  const modKey = `${courseId}/${moduleId}`;
                  const modOpen = openModules.has(modKey);
                  const modCards = mods.reduce((s, r) => s + (r.reviewer.cards?.length || 0), 0);
                  return (
                    <div key={modKey}>
                      <button onClick={() => toggleModule(modKey)} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "10px 16px 10px 46px",
                        background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "Inter, sans-serif",
                      }}>
                        {modOpen ? <ChevronDown size={14} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} /> : <ChevronRight size={14} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span className="text-sm" style={{ fontWeight: 500, color: "var(--os-text-secondary)" }}>{moduleId}</span>
                          <span className="text-xs" style={{ color: "var(--os-text-dim)", marginLeft: 8 }}>
                            {mods.length} decks &middot; {modCards} cards
                          </span>
                        </div>
                      </button>
                      {modOpen && (
                        <div style={{ padding: "0 16px 8px 62px", display: "flex", flexDirection: "column", gap: 6 }}>
                          {mods.map(({ courseId: cid, moduleId: mid, reviewer }) => (
                            <div key={reviewer.id} className="glass-card-link" style={{ position: "relative", padding: "10px 14px" }}>
                              <Link href={`/flashcards/${reviewer.id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span className="text-sm" style={{ fontWeight: 500, color: "var(--os-text-primary)" }}>{reviewer.title}</span>
                                  <span className="text-xs" style={{ color: "var(--os-text-dim)", marginLeft: 8 }}>{reviewer.cards?.length || 0} cards</span>
                                </div>
                                <ChevronRight size={14} style={{ color: "var(--os-text-dim)", flexShrink: 0 }} />
                              </Link>
                              <button onClick={(e) => { e.preventDefault(); onDelete({ courseId: cid, moduleId: mid, reviewerId: reviewer.id, title: reviewer.title }); }}
                                style={{ position: "absolute", top: 8, right: 8, padding: 4, borderRadius: 6, background: "none", border: "none", color: "var(--os-text-dim)", cursor: "pointer", opacity: 0.4 }}
                                title="Delete deck">
                                <Trash2 size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function getCorrectIndex(q: any): string {
  if (q.correct == null) return "0";
  const c = String(q.correct).trim();
  if (/^[0-3]$/.test(c)) return c;
  const code = c.toUpperCase().charCodeAt(0);
  if (code >= 65 && code <= 68) return String(code - 65);
  return "0";
}

function stripOptionPrefix(opt: string): string {
  return opt.replace(/^\s*[A-Da-d]\.\s*/, "").trim();
}

function QuizTab({ userId }: { userId: string | null }) {
  const { courses } = useCourses();
  const [inputText, setInputText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [lastError, setLastError] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedSource, setSelectedSource] = useState<"text" | "course">("text");
  const [courseContent, setCourseContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [quizType, setQuizType] = useState<"mc" | "identification" | "mixed">("mc");
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);

  useEffect(() => {
    if (selectedSource !== "course" || !selectedCourse || !selectedModule) { setCourseContent(""); return; }
    (async () => {
      setLoadingContent(true);
      try {
        const supabase = getSupabase();
        const { data: notes } = await supabase.from("notes").select("title, content").eq("course_id", selectedCourse).eq("module_id", selectedModule);
        const { data: contents } = await supabase.from("module_content").select("title, content").eq("course_id", selectedCourse).eq("module_id", selectedModule);
        const customContent = loadCustomContent();
        const customCourse = customContent.courses.find((c) => c.id === selectedCourse);
        const customModule = customCourse?.modules.find((m) => m.id === selectedModule);
        const flashcardTexts = (customModule?.reviewers || []).flatMap((r: any) => (r.cards || []).map((c: any) => `Q: ${c.front}\nA: ${c.back}`));
        let allText = "";
        if (notes?.length) allText += notes.map((n: any) => `${n.title}\n${n.content || ""}`).join("\n\n") + "\n\n";
        if (contents?.length) allText += contents.map((c: any) => `${c.title}\n${c.content || ""}`).join("\n\n") + "\n\n";
        if (flashcardTexts.length) allText += "Flashcards:\n" + flashcardTexts.join("\n");
        setCourseContent(allText.trim());
      } catch { setCourseContent(""); } finally { setLoadingContent(false); }
    })();
  }, [selectedCourse, selectedModule, selectedSource]);

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    setPdfFile(file); setIsGenerating(true);
    try {
      const formData = new FormData(); formData.append("file", file);
      const res = await fetch("/api/extract-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract PDF");
      setInputText(data.text);
    } catch (err: any) { alert(`Error: ${err.message}`); } finally { setIsGenerating(false); }
  }

  async function generateQuiz() {
    const textToUse = selectedSource === "course" ? courseContent : inputText;
    if (!textToUse.trim()) return;
    setIsGenerating(true); setLastError("");
    try {
      const res = await fetch("/api/generate-quiz", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: textToUse, type: quizType }) });
      const data = await res.json();
      if (!res.ok) {
        const retryAfter = data.retryAfter || (res.status === 429 ? 60 : 0);
        setCooldown(retryAfter);
        throw new Error(data.error || "Failed to generate quiz");
      }
      setQuizQuestions(data.questions); setQuizStarted(true); setCurrentQ(0); setAnswers({}); setShowResults(false); setScore(0);
    } catch (err: any) { setLastError(err.message || "Failed to generate quiz"); } finally { setIsGenerating(false); }
  }

  function answerQuestion(answer: string) {
    setAnswers((prev) => ({ ...prev, [currentQ]: answer }));
  }

  function nextQuestion() {
    if (currentQ < quizQuestions.length - 1) { setCurrentQ(currentQ + 1); setAnswered(false); }
    else {
      let s = 0;
      quizQuestions.forEach((q, i) => {
        const correctIdx = getCorrectIndex(q);
        if (q.type === "mc" && answers[i] === correctIdx) s++;
        if (q.type === "identification" && answers[i]?.toLowerCase().trim() === (q.answer || "").toLowerCase().trim()) s++;
      });
      setScore(s); setShowResults(true);
      if (userId) {
        const wrong = quizQuestions.length - s;
        const title = selectedSource === "course"
          ? (selectedCourseData?.title || selectedCourse || "Custom Quiz")
          : (pdfFile?.name || "Custom Quiz");
        const source = selectedSource === "course"
          ? `${selectedCourse}/${selectedModule}`
          : "custom";
        saveQuizHistory(userId, title, quizQuestions.length, s, wrong, source).catch(() => {});
        saveStudyStats(userId, s, 0, wrong, quizQuestions.length).catch(() => {});
      }
    }
  }

  function restartQuiz() { setQuizStarted(false); setQuizQuestions([]); setAnswers({}); setShowResults(false); setCurrentQ(0); setScore(0); setAnswered(false); }

  if (showResults) {
    return (
      <div style={{ maxWidth: "672px", margin: "0 auto" }}>
        <div className="empty-state">
          <Sparkles style={{ width: "64px", height: "64px", color: "var(--os-accent)", marginBottom: "16px" }} />
          <h2 style={{ fontSize: "30px", fontWeight: 700, marginBottom: "8px", color: "var(--os-text-primary)" }}>Quiz Complete!</h2>
          <p style={{ fontSize: "48px", fontWeight: 700, color: "var(--os-accent)", marginBottom: "16px" }}>{score}/{quizQuestions.length}</p>
          <p className="text-secondary" style={{ marginBottom: "32px" }}>
            {score === quizQuestions.length ? "Perfect score!" : score >= quizQuestions.length * 0.8 ? "Great job!" : score >= quizQuestions.length * 0.5 ? "Good effort!" : "Keep studying!"}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={restartQuiz} className="glass-btn-primary" style={{ padding: "8px 24px" }}>Try Again</button>
            <Link href="/study" className="glass-btn" style={{ padding: "8px 24px" }}>Back to Study</Link>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "32px" }}>
          <h3 style={{ fontWeight: 600, fontSize: "18px", color: "var(--os-text-primary)" }}>Review Answers</h3>
          {quizQuestions.map((q, i) => {
            const userAnswer = answers[i] || "";
            const correctIdx = getCorrectIndex(q);
            const isCorrect = q.type === "mc" ? userAnswer === correctIdx : userAnswer.toLowerCase().trim() === (q.answer || "").toLowerCase().trim();
            return (
              <div key={i} className="glass-card" style={{
                borderColor: isCorrect ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
                background: isCorrect ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
              }}>
                <p style={{ fontWeight: 500, marginBottom: "8px", color: "var(--os-text-primary)" }}>{i + 1}. {q.question}</p>
                {q.type === "mc" && q.options && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginLeft: "16px" }}>
                    {q.options.map((opt: string, j: number) => {
                      const isCorrectOpt = String(j) === correctIdx;
                      const isUserChoice = userAnswer === String(j);
                      return (
                        <p key={j} className="text-sm" style={{
                          color: isCorrectOpt ? "#16a34a" : isUserChoice && !isCorrectOpt ? "#dc2626" : "var(--os-text-secondary)",
                          fontWeight: isCorrectOpt ? 500 : 400,
                        }}>
                          {String.fromCharCode(65 + j)}. {stripOptionPrefix(opt)} {isCorrectOpt ? " ✓" : isUserChoice && !isCorrectOpt ? " ✗" : ""}
                        </p>
                      );
                    })}
                  </div>
                )}
                {q.type === "identification" && (
                  <div style={{ marginLeft: "16px" }} className="text-sm">
                    <p style={{ color: isCorrect ? "#16a34a" : "#dc2626" }}>Your answer: {userAnswer || "(none)"}</p>
                    {!isCorrect && <p style={{ color: "#16a34a" }}>Correct: {q.answer}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (quizStarted && quizQuestions.length > 0) {
    const q = quizQuestions[currentQ];
    const correctIdx = getCorrectIndex(q);
    const userAns = answers[currentQ];
    const isMc = q.type === "mc";

    return (
      <div style={{ maxWidth: "672px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
          <span className="text-sm text-secondary">Question {currentQ + 1} of {quizQuestions.length}</span>
          <div style={{ height: "8px", flex: 1, marginLeft: "16px", marginRight: "16px", background: "rgba(255,255,255,0.06)", borderRadius: "9999px", overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--os-accent)", transition: "all 0.3s", width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }} />
          </div>
        </div>
        <div className="glass-panel" style={{ padding: "24px", marginBottom: "24px" }}>
          <span style={{
            display: "inline-block", fontSize: "12px", padding: "4px 8px", borderRadius: "9999px", marginBottom: "12px",
            background: isMc ? "rgba(59,130,246,0.1)" : "rgba(168,85,247,0.1)",
            color: isMc ? "#2563eb" : "#9333ea",
          }}>
            {isMc ? "Multiple Choice" : "Identification"}
          </span>
          <p style={{ fontSize: "18px", fontWeight: 500, marginTop: "8px", color: "var(--os-text-primary)" }}>{q.question}</p>
        </div>

        {isMc ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "24px" }}>
            {q.options.map((opt: string, j: number) => {
              const isChosen = userAns === String(j);
              const isCorrectOpt = String(j) === correctIdx;
              const showFeedback = answered;
              let bg = "transparent";
              let border = "rgba(255,255,255,0.06)";
              let shadow = "none";
              let txtColor = "var(--os-text-primary)";

              if (showFeedback) {
                if (isCorrectOpt) { bg = "rgba(34,197,94,0.1)"; border = "#16a34a"; shadow = "0 0 0 2px rgba(34,197,94,0.3)"; txtColor = "#16a34a"; }
                else if (isChosen && !isCorrectOpt) { bg = "rgba(239,68,68,0.1)"; border = "#ef4444"; shadow = "0 0 0 2px rgba(239,68,68,0.3)"; txtColor = "#ef4444"; }
              } else if (isChosen) {
                bg = "rgba(59,130,246,0.05)"; border = "var(--os-accent)"; shadow = "0 0 0 2px var(--os-accent)";
              }

              return (
                <button key={j} onClick={() => !answered && answerQuestion(String(j))} disabled={answered}
                  className="glass-card" style={{
                    width: "100%", textAlign: "left", padding: "14px 16px", transition: "all 0.2s",
                    borderColor: border, background: bg, boxShadow: shadow, cursor: answered ? "default" : "pointer",
                    opacity: showFeedback && !isCorrectOpt && !isChosen ? 0.5 : 1,
                  }}>
                  <span style={{ fontWeight: 500, marginRight: "10px", color: txtColor }}>{String.fromCharCode(65 + j)}.</span>
                  <span style={{ color: txtColor }}>{stripOptionPrefix(opt)}</span>
                  {showFeedback && isCorrectOpt && <span style={{ marginLeft: 8, color: "#16a34a" }}>✓</span>}
                  {showFeedback && isChosen && !isCorrectOpt && <span style={{ marginLeft: 8, color: "#ef4444" }}>✗</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ marginBottom: "24px" }}>
            <input type="text" value={answers[currentQ] || ""} onChange={(e) => !answered && answerQuestion(e.target.value)}
              placeholder="Type your answer..." className="glass-input" style={{
                width: "100%", fontSize: "18px",
                borderColor: answered ? (answers[currentQ]?.toLowerCase().trim() === (q.answer || "").toLowerCase().trim() ? "#16a34a" : "#ef4444") : undefined,
              }}
              disabled={answered} autoFocus />
            {answered && (
              <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: answers[currentQ]?.toLowerCase().trim() === (q.answer || "").toLowerCase().trim() ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${answers[currentQ]?.toLowerCase().trim() === (q.answer || "").toLowerCase().trim() ? "#16a34a" : "#ef4444"}` }}>
                <p style={{ fontSize: 13, color: answers[currentQ]?.toLowerCase().trim() === (q.answer || "").toLowerCase().trim() ? "#16a34a" : "#ef4444", fontWeight: 500 }}>
                  {answers[currentQ]?.toLowerCase().trim() === (q.answer || "").toLowerCase().trim() ? "✓ Correct!" : `✗ Correct answer: ${q.answer}`}
                </p>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => { if (!answered) { setAnswered(true); } else { nextQuestion(); } }}
            className="glass-btn-primary"
            style={{ padding: "8px 24px" }}>
            {!answered ? "Check" : currentQ === quizQuestions.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "672px", margin: "0 auto" }}>
      <div className="empty-state" style={{ marginBottom: "32px" }}>
        <Sparkles style={{ width: "48px", height: "48px", color: "var(--os-accent)", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px", color: "var(--os-text-primary)" }}>Generate a Quiz</h2>
        <p className="text-secondary">Generate multiple choice and identification questions from your study materials</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "4px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "4px", background: "rgba(255,255,255,0.03)", marginBottom: "24px" }}>
        <button onClick={() => setSelectedSource("text")}
          className="flex items-center"
          style={{
            flex: 1,
            justifyContent: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 500,
            transition: "colors 0.2s",
            background: selectedSource === "text" ? "var(--os-bg)" : "transparent",
            boxShadow: selectedSource === "text" ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
            color: selectedSource === "text" ? "var(--os-text-primary)" : "var(--os-text-secondary)",
          }}>
          <FileText style={{ width: "16px", height: "16px" }} /> Text / PDF
        </button>
        <button onClick={() => setSelectedSource("course")}
          className="flex items-center"
          style={{
            flex: 1,
            justifyContent: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "6px",
            fontSize: "13px",
            fontWeight: 500,
            transition: "colors 0.2s",
            background: selectedSource === "course" ? "var(--os-bg)" : "transparent",
            boxShadow: selectedSource === "course" ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
            color: selectedSource === "course" ? "var(--os-text-primary)" : "var(--os-text-secondary)",
          }}>
          <BookOpen style={{ width: "16px", height: "16px" }} /> From Courses
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {selectedSource === "text" ? (
          <>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px", color: "var(--os-text-primary)" }}>Study Material</label>
              <textarea value={inputText} onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your notes, textbook content, or study material here..."
                className="glass-input" style={{ width: "100%", height: "160px", resize: "none" }} />
              {inputText && <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>~{Math.max(5, Math.ceil(inputText.length / 500))} questions will be generated</p>}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <label className="glass-btn" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 16px", cursor: "pointer", borderStyle: "dashed", fontSize: "13px" }}>
                <Upload style={{ width: "16px", height: "16px" }} /> {pdfFile ? pdfFile.name : "Upload PDF"}
                <input type="file" accept=".pdf" onChange={handlePdfUpload} style={{ display: "none" }} />
              </label>
              {isGenerating && <span className="text-sm text-secondary">Extracting text...</span>}
            </div>
          </>
        ) : (
          <>
            <div className="grid-2" style={{ gap: "12px" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px", color: "var(--os-text-primary)" }}>Course</label>
                <select value={selectedCourse} onChange={(e) => { setSelectedCourse(e.target.value); setSelectedModule(""); }}
                  className="glass-input" style={{ width: "100%", padding: "10px 12px", fontSize: "13px" }}>
                  <option value="">Select course...</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title || c.id}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px", color: "var(--os-text-primary)" }}>Module</label>
                <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)} disabled={!selectedCourse}
                  className="glass-input" style={{ width: "100%", padding: "10px 12px", fontSize: "13px", opacity: selectedCourse ? 1 : 0.5 }}>
                  <option value="">Select module...</option>
                  {selectedCourseData?.modules?.map((m: any) => <option key={m.id} value={m.id}>{m.title || m.id}</option>)}
                </select>
              </div>
            </div>
            {selectedModule && (
              <div className="glass-card" style={{ padding: "12px", fontSize: "13px", background: "rgba(255,255,255,0.03)" }}>
                {loadingContent ? <span className="text-secondary">Loading content...</span>
                  : courseContent ? <span style={{ color: "#16a34a" }}>Loaded {courseContent.length.toLocaleString()} characters</span>
                  : <span className="text-secondary">No content found in this module</span>}
              </div>
            )}
          </>
        )}
        {lastError && (
          <div className="glass-card" style={{ padding: "12px", background: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.3)", fontSize: "13px" }}>
            <p style={{ color: "#dc2626", fontWeight: 500 }}>{lastError}</p>
            {cooldown > 0 && <p className="text-secondary" style={{ marginTop: "4px" }}>Retry in {cooldown}s</p>}
          </div>
        )}
        <div>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "8px", color: "var(--os-text-primary)" }}>Question Type</label>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "4px", background: "rgba(255,255,255,0.03)" }}>
            {(["mc", "identification", "mixed"] as const).map((t) => (
              <button key={t} onClick={() => setQuizType(t)} style={{
                flex: 1, justifyContent: "center", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 500, transition: "colors 0.2s",
                background: quizType === t ? "var(--os-bg)" : "transparent", boxShadow: quizType === t ? "0 1px 2px rgba(0,0,0,0.2)" : "none",
                color: quizType === t ? "var(--os-text-primary)" : "var(--os-text-secondary)", border: "none", cursor: "pointer",
              }}>
                {t === "mc" ? "Multiple Choice" : t === "identification" ? "Identification" : "Mixed"}
              </button>
            ))}
          </div>
        </div>
        <button onClick={generateQuiz}
          disabled={(selectedSource === "course" ? !courseContent || isGenerating : !inputText.trim() || isGenerating) || cooldown > 0}
          className="glass-btn-primary"
          style={{ width: "100%", padding: "12px", fontWeight: 500, opacity: ((selectedSource === "course" ? !courseContent || isGenerating : !inputText.trim() || isGenerating) || cooldown > 0) ? 0.5 : 1, cursor: ((selectedSource === "course" ? !courseContent || isGenerating : !inputText.trim() || isGenerating) || cooldown > 0) ? "not-allowed" : "pointer" }}>
          {isGenerating ? "Generating..." : cooldown > 0 ? `Wait ${cooldown}s...` : "Generate Quiz"}
        </button>
      </div>
    </div>
  );
}

function HistoryTab({ userId }: { userId: string | null }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    loadQuizHistory(userId).then((data) => { setHistory(data); setLoading(false); });
  }, [userId]);

  async function handleDelete(id: string) {
    if (!userId) return;
    await deleteQuizHistory(userId, id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  }

  if (!userId) {
    return (
      <div className="empty-state">
        <History className="empty-state-icon" />
        <p className="text-secondary" style={{ marginBottom: "8px" }}>Sign in to track your quiz history</p>
        <Link href="/login" className="text-secondary" style={{ fontSize: "13px", color: "var(--os-accent)", textDecoration: "underline" }}>Sign in</Link>
      </div>
    );
  }

  if (loading) return <p className="text-secondary" style={{ padding: "32px 0", textAlign: "center" }}>Loading...</p>;

  if (history.length === 0) {
    return (
      <div className="empty-state">
        <History className="empty-state-icon" />
        <p className="text-secondary">No quiz history yet. Take a quiz to start tracking!</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "672px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--os-text-primary)" }}>Quiz History</h2>
        <span className="text-sm text-secondary">{history.length} quizzes taken</span>
      </div>
      {history.map((h) => {
        const pct = h.total_questions > 0 ? Math.round((h.correct_answers / h.total_questions) * 100) : 0;
        const date = new Date(h.created_at);
        const sourceParts = (h.source || "").split("/");
        const isCourse = sourceParts.length >= 2 && sourceParts[0] !== "text" && sourceParts[0] !== "custom";
        return (
          <div key={h.id} className="glass-card" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--os-text-primary)" }}>{h.deck_title}</p>
              {isCourse && (
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3, fontSize: 11, color: "var(--os-text-secondary)" }}>
                  <BookOpen size={10} />
                  <span>{sourceParts[0]}</span>
                  {sourceParts[1] && <><span>/</span><span>{sourceParts[1]}</span></>}
                </div>
              )}
              {!isCourse && h.source && h.source !== "text" && h.source !== "custom" && (
                <p className="text-xs" style={{ color: "var(--os-text-secondary)", marginTop: 3 }}>PDF: {h.deck_title}</p>
              )}
              <p className="text-xs" style={{ color: "var(--os-text-dim)", marginTop: 2 }}>
                {date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <p style={{
                fontSize: "18px",
                fontWeight: 700,
                color: pct >= 80 ? "#16a34a" : pct >= 50 ? "#eab308" : "#dc2626",
              }}>{pct}%</p>
              <p className="text-xs text-secondary">{h.correct_answers}/{h.total_questions}</p>
            </div>
            <button onClick={() => handleDelete(h.id)}
              style={{ padding: "6px", borderRadius: "8px", color: "var(--os-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>
              <Trash2 style={{ width: "16px", height: "16px" }} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

function WeakAreasTab({ userId }: { userId: string | null }) {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [studyStats, setStudyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    (async () => {
      const [bm, stats] = await Promise.all([
        loadBookmarkedCards(userId),
        (async () => {
          const supabase = getSupabase();
          const { data } = await supabase.from("study_stats").select("*").eq("user_id", userId).order("date", { ascending: false }).limit(30);
          return data || [];
        })(),
      ]);
      setBookmarks(bm);
      setStudyStats(stats);
      setLoading(false);
    })();
  }, [userId]);

  if (!userId) {
    return (
      <div className="empty-state">
        <TrendingDown className="empty-state-icon" />
        <p className="text-secondary" style={{ marginBottom: "8px" }}>Sign in to see your weak areas</p>
        <Link href="/login" className="text-secondary" style={{ fontSize: "13px", color: "var(--os-accent)", textDecoration: "underline" }}>Sign in</Link>
      </div>
    );
  }

  if (loading) return <p className="text-secondary" style={{ padding: "32px 0", textAlign: "center" }}>Loading...</p>;

  const totalForgot = studyStats.reduce((sum, s) => sum + (s.forgot || 0), 0);
  const totalDontKnow = studyStats.reduce((sum, s) => sum + (s.dont_know || 0), 0);
  const totalKnown = studyStats.reduce((sum, s) => sum + (s.known || 0), 0);
  const totalCards = totalKnown + totalForgot + totalDontKnow;
  const accuracy = totalCards > 0 ? Math.round((totalKnown / totalCards) * 100) : 0;

  const deckStats: Record<string, { forgot: number; dontKnow: number; known: number }> = {};
  bookmarks.forEach((b) => {
    if (!deckStats[b.deck_title]) deckStats[b.deck_title] = { forgot: 0, dontKnow: 0, known: 0 };
    deckStats[b.deck_title].dontKnow++;
  });

  return (
    <div style={{ maxWidth: "672px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "24px" }}>
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--os-text-primary)" }}>Weak Areas Report</h2>

      {/* Overall Stats */}
      <div className="grid-3" style={{ gap: "12px" }}>
        <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "30px", fontWeight: 700, color: "#16a34a" }}>{totalKnown}</p>
          <p className="text-sm text-secondary" style={{ marginTop: "4px" }}>Cards Known</p>
        </div>
        <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "30px", fontWeight: 700, color: "#f97316" }}>{totalDontKnow}</p>
          <p className="text-sm text-secondary" style={{ marginTop: "4px" }}>Don&apos;t Know</p>
        </div>
        <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
          <p style={{ fontSize: "30px", fontWeight: 700, color: "#ef4444" }}>{totalForgot}</p>
          <p className="text-sm text-secondary" style={{ marginTop: "4px" }}>Forgot</p>
        </div>
      </div>

      {/* Accuracy Ring */}
      <div className="glass-panel" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "24px" }}>
        <div style={{ position: "relative", width: "80px", height: "80px", flexShrink: 0 }}>
          <svg style={{ width: "80px", height: "80px", transform: "rotate(-90deg)" }} viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6" style={{ color: "rgba(255,255,255,0.1)" }} />
            <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="6"
              style={{ color: accuracy >= 80 ? "#22c55e" : accuracy >= 50 ? "#eab308" : "#ef4444" }}
              strokeDasharray={`${accuracy * 2.136} 213.6`} strokeLinecap="round" />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--os-text-primary)" }}>{accuracy}%</span>
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 500, color: "var(--os-text-primary)" }}>Overall Accuracy</p>
          <p className="text-sm text-secondary" style={{ marginTop: "2px" }}>
            {totalCards > 0 ? `${totalCards} cards studied across ${studyStats.length} sessions` : "Start reviewing to see your accuracy"}
          </p>
        </div>
      </div>

      {/* Bookmarked / Struggling Cards */}
      {bookmarks.length > 0 && (
        <div>
          <h3 className="text-sm" style={{ fontWeight: 500, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", color: "var(--os-text-primary)" }}>
            <Bookmark style={{ width: "16px", height: "16px", color: "#eab308" }} /> Bookmarked Cards ({bookmarks.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {Object.entries(deckStats).map(([deck, stats]) => (
              <div key={deck} className="glass-card" style={{ padding: "12px" }}>
                <p className="text-sm" style={{ fontWeight: 500, color: "var(--os-text-primary)" }}>{deck}</p>
                <p className="text-xs text-secondary" style={{ marginTop: "4px" }}>{stats.dontKnow} cards bookmarked for review</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Study Trend */}
      {studyStats.length > 0 && (
        <div>
          <h3 className="text-sm" style={{ fontWeight: 500, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px", color: "var(--os-text-primary)" }}>
            <BarChart3 style={{ width: "16px", height: "16px" }} /> Recent Sessions
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {studyStats.slice(0, 14).map((s, i) => {
              const total = (s.known || 0) + (s.forgot || 0) + (s.dont_know || 0);
              const pct = total > 0 ? Math.round(((s.known || 0) / total) * 100) : 0;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }} className="text-sm">
                  <span className="text-xs text-secondary" style={{ width: "80px", textAlign: "right" }}>{s.date?.split(" ").slice(1, 3).join(" ") || ""}</span>
                  <div style={{ flex: 1, height: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "9999px", overflow: "hidden", display: "flex" }}>
                    {total > 0 && (
                      <>
                        <div style={{ height: "100%", background: "rgba(34,197,94,0.8)", width: `${(s.known || 0) / total * 100}%` }} />
                        <div style={{ height: "100%", background: "rgba(249,115,22,0.8)", width: `${(s.dont_know || 0) / total * 100}%` }} />
                        <div style={{ height: "100%", background: "rgba(239,68,68,0.8)", width: `${(s.forgot || 0) / total * 100}%` }} />
                      </>
                    )}
                  </div>
                  <span className="text-xs" style={{ width: "40px", fontWeight: 500, color: "var(--os-text-primary)" }}>{pct}%</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "12px" }} className="text-xs text-secondary">
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "9999px", background: "rgba(34,197,94,0.8)", display: "inline-block" }} /> Known</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "9999px", background: "rgba(249,115,22,0.8)", display: "inline-block" }} /> Don&apos;t Know</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><span style={{ width: "10px", height: "10px", borderRadius: "9999px", background: "rgba(239,68,68,0.8)", display: "inline-block" }} /> Forgot</span>
          </div>
        </div>
      )}

      {totalCards === 0 && bookmarks.length === 0 && (
        <div className="empty-state">
          <p className="text-secondary">No study data yet. Review flashcards and take quizzes to see your weak areas.</p>
        </div>
      )}
    </div>
  );
}
