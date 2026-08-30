"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { getSupabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Brain, Sparkles, Play, Check, X, User } from "lucide-react";
import Link from "next/link";

interface QuizQuestion {
  question: string;
  options?: string[];
  type: "mc" | "identification";
  correct?: string;
  answer?: string;
}

function getCorrectIndex(q: QuizQuestion): string {
  if (q.correct === "A" || q.correct === "0") return "0";
  if (q.correct === "B" || q.correct === "1") return "1";
  if (q.correct === "C" || q.correct === "2") return "2";
  if (q.correct === "D" || q.correct === "3") return "3";
  return q.correct || "0";
}

function stripOptionPrefix(opt: string): string {
  return opt.replace(/^[A-D]\.\s*/, "");
}

export default function SharedQuizPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [studyMode, setStudyMode] = useState<"mc" | "identification" | "mixed">("mixed");
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [answered, setAnswered] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    (async () => {
      const supabase = getSupabase();
      const { data, error } = await supabase.from("saved_quizzes").select("*").eq("share_code", code).maybeSingle();
      if (error || !data) { setNotFound(true); setLoading(false); return; }
      setQuiz(data);

      const { data: profile } = await supabase.from("user_profiles").select("user_id, username, avatar_url").eq("user_id", data.user_id).maybeSingle();
      if (profile) setCreator(profile);
      setLoading(false);
    })();
  }, [code, user]);

  function getQuestionsForMode(): QuizQuestion[] {
    if (!quiz?.questions) return [];
    if (studyMode === "mixed") return quiz.questions;
    return quiz.questions.filter((q: QuizQuestion) => q.type === studyMode);
  }

  function startQuiz() {
    setQuizStarted(true);
    setCurrentQ(0);
    setAnswers({});
    setAnswered(false);
    setShowResults(false);
    setScore(0);
  }

  function answerQuestion(answer: string) {
    setAnswers((prev) => ({ ...prev, [currentQ]: answer }));
  }

  function nextQuestion() {
    const questions = getQuestionsForMode();
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
      setAnswered(false);
    } else {
      let s = 0;
      questions.forEach((q: QuizQuestion, i: number) => {
        const userAnswer = answers[i] || "";
        if (q.type === "mc") {
          if (userAnswer === getCorrectIndex(q)) s++;
        } else {
          if (userAnswer.toLowerCase().trim() === (q.answer || "").toLowerCase().trim()) s++;
        }
      });
      setScore(s);
      setShowResults(true);
    }
  }

  if (!user) {
    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <div className="empty-state">
          <div className="empty-state-icon"><Brain size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <p className="text-secondary text-sm">Log in to view shared quizzes.</p>
          <Link href="/login" className="glass-btn glass-btn-primary" style={{ marginTop: 12 }}>Log In</Link>
        </div>
      </div>
    );
  }

  if (loading) return <div className="page-container" style={{ maxWidth: 700 }}><p className="text-secondary text-sm">Loading quiz...</p></div>;

  if (notFound || !quiz) {
    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <div className="empty-state">
          <div className="empty-state-icon"><Brain size={32} style={{ color: "var(--os-text-dim)" }} /></div>
          <p className="text-secondary text-sm">Shared quiz not found.</p>
          <Link href="/study" className="glass-btn glass-btn-ghost" style={{ marginTop: 12 }}><ArrowLeft size={14} /> Back to Study</Link>
        </div>
      </div>
    );
  }

  const questions = getQuestionsForMode();
  const allQuestions = quiz.questions || [];

  if (showResults) {
    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <Link href="/study" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--os-text-dim)", textDecoration: "none", marginBottom: 24 }}>
          <ArrowLeft size={14} /> Back to Study
        </Link>
        <div className="empty-state">
          <Sparkles style={{ width: 64, height: 64, color: "var(--os-accent)", marginBottom: 16 }} />
          <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 8, color: "var(--os-text-primary)" }}>Quiz Complete!</h2>
          <p style={{ fontSize: 48, fontWeight: 700, color: "var(--os-accent)", marginBottom: 16 }}>{score}/{questions.length}</p>
          <p className="text-secondary" style={{ marginBottom: 32 }}>
            {score === questions.length ? "Perfect score!" : score >= questions.length * 0.8 ? "Great job!" : score >= questions.length * 0.5 ? "Good effort!" : "Keep studying!"}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={startQuiz} className="glass-btn glass-btn-primary" style={{ padding: "10px 24px" }}>Try Again</button>
            <Link href="/study" className="glass-btn" style={{ padding: "10px 24px", textDecoration: "none" }}>Back to Study</Link>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
          <h3 style={{ fontWeight: 600, fontSize: 18, color: "var(--os-text-primary)" }}>Review Answers</h3>
          {questions.map((q: QuizQuestion, i: number) => {
            const userAnswer = answers[i] || "";
            const isCorrect = q.type === "mc" ? userAnswer === getCorrectIndex(q) : userAnswer.toLowerCase().trim() === (q.answer || "").toLowerCase().trim();
            return (
              <div key={i} className="glass-card" style={{
                borderColor: isCorrect ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
                background: isCorrect ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
              }}>
                <p style={{ fontWeight: 500, marginBottom: 8, color: "var(--os-text-primary)" }}>{i + 1}. {q.question}</p>
                {q.type === "mc" && q.options && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, marginLeft: 16 }}>
                    {q.options.map((opt: string, j: number) => {
                      const isCorrectOpt = String(j) === getCorrectIndex(q);
                      const isUserChoice = userAnswer === String(j);
                      return (
                        <p key={j} style={{ fontSize: 13, color: isCorrectOpt ? "#16a34a" : isUserChoice && !isCorrectOpt ? "#dc2626" : "var(--os-text-secondary)", fontWeight: isCorrectOpt ? 500 : 400 }}>
                          {String.fromCharCode(65 + j)}. {stripOptionPrefix(opt)} {isCorrectOpt ? "✓" : isUserChoice && !isCorrectOpt ? "✗" : ""}
                        </p>
                      );
                    })}
                  </div>
                )}
                {q.type === "identification" && (
                  <div style={{ marginLeft: 16, fontSize: 13 }}>
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

  if (quizStarted && questions.length > 0) {
    const q = questions[currentQ];
    const correctIdx = getCorrectIndex(q);
    const userAns = answers[currentQ];
    const isMc = q.type === "mc";

    return (
      <div className="page-container" style={{ maxWidth: 700 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: "var(--os-text-dim)" }}>Question {currentQ + 1} of {questions.length}</span>
          <div style={{ height: 8, flex: 1, marginLeft: 16, marginRight: 16, background: "rgba(255,255,255,0.06)", borderRadius: 9999, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--os-accent)", transition: "all 0.3s", width: `${((currentQ + 1) / questions.length) * 100}%` }} />
          </div>
        </div>
        <div className="glass-panel" style={{ padding: 24, marginBottom: 24 }}>
          <span style={{
            display: "inline-block", fontSize: 12, padding: "4px 8px", borderRadius: 9999, marginBottom: 12,
            background: isMc ? "rgba(59,130,246,0.1)" : "rgba(168,85,247,0.1)",
            color: isMc ? "#2563eb" : "#9333ea",
          }}>
            {isMc ? "Multiple Choice" : "Identification"}
          </span>
          <p style={{ fontSize: 18, fontWeight: 500, marginTop: 8, color: "var(--os-text-primary)" }}>{q.question}</p>
        </div>

        {isMc ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {q.options?.map((opt: string, j: number) => {
              const isChosen = userAns === String(j);
              const isCorrectOpt = String(j) === correctIdx;
              const showFeedback = answered;
              let bg = "transparent";
              let border = "rgba(255,255,255,0.35)";
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
                  <span style={{ fontWeight: 500, marginRight: 10, color: txtColor }}>{String.fromCharCode(65 + j)}.</span>
                  <span style={{ color: txtColor }}>{stripOptionPrefix(opt)}</span>
                  {showFeedback && isCorrectOpt && <span style={{ marginLeft: 8, color: "#16a34a" }}>✓</span>}
                  {showFeedback && isChosen && !isCorrectOpt && <span style={{ marginLeft: 8, color: "#ef4444" }}>✗</span>}
                </button>
              );
            })}
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <input type="text" value={answers[currentQ] || ""} onChange={(e) => !answered && answerQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !answered && answers[currentQ]?.trim()) setAnswered(true); }}
              placeholder="Type your answer..." className="glass-input" style={{
                padding: "14px 16px", fontSize: 16,
                borderColor: answered ? (answers[currentQ]?.toLowerCase().trim() === (q.answer || "").toLowerCase().trim() ? "#16a34a" : "#ef4444") : undefined,
              }} />
            {answered && (
              <p style={{ marginTop: 8, fontSize: 13, color: answers[currentQ]?.toLowerCase().trim() === (q.answer || "").toLowerCase().trim() ? "#16a34a" : "#ef4444" }}>
                {answers[currentQ]?.toLowerCase().trim() === (q.answer || "").toLowerCase().trim() ? "Correct!" : `Correct answer: ${q.answer}`}
              </p>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button onClick={() => { if (!answered) { setAnswered(true); } else { nextQuestion(); } }}
            className="glass-btn glass-btn-primary"
            style={{ padding: "8px 24px" }}>
            {!answered ? "Check" : currentQ === questions.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <Link href="/study" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--os-text-dim)", textDecoration: "none", marginBottom: 24 }}>
        <ArrowLeft size={14} /> Back to Study
      </Link>

      <div className="glass-panel" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4 }}>{quiz.title}</h1>
            <p style={{ fontSize: 13, color: "var(--os-text-dim)" }}>{allQuestions.length} questions</p>
          </div>
        </div>

        {creator && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.35)" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", overflow: "hidden", flexShrink: 0, border: "1px solid rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {creator.avatar_url ? <img src={creator.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={18} style={{ color: "var(--os-text-dim)" }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 500, color: "var(--os-text-primary)", fontSize: 14 }}>{creator.username}</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-primary)", display: "block", marginBottom: 8 }}>Study Mode</label>
        <div style={{ display: "flex", gap: 4, padding: 3, borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.35)" }}>
          {(["mc", "identification", "mixed"] as const).map((t) => {
            const count = t === "mixed" ? allQuestions.length : allQuestions.filter((q: QuizQuestion) => q.type === t).length;
            return (
              <button key={t} onClick={() => setStudyMode(t)} style={{
                flex: 1, padding: "10px 12px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
                background: studyMode === t ? "var(--os-accent)" : "transparent",
                color: studyMode === t ? "#fff" : "var(--os-text-secondary)",
                border: studyMode === t ? "1px solid var(--os-accent)" : "1px solid transparent",
              }}>
                {t === "mc" ? "Multiple Choice" : t === "identification" ? "Identification" : "Mixed"} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="empty-state">
          <p className="text-secondary text-sm">No questions match this study mode.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
          {questions.map((q: QuizQuestion, i: number) => (
            <div key={i} className="glass-card" style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--os-accent)", minWidth: 20 }}>{i + 1}.</span>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-primary)", flex: 1 }}>{q.question}</p>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 9999, background: q.type === "mc" ? "rgba(59,130,246,0.1)" : "rgba(168,85,247,0.1)", color: q.type === "mc" ? "#2563eb" : "#9333ea" }}>
                      {q.type === "mc" ? "MC" : "ID"}
                    </span>
                  </div>
                  {q.type === "mc" && q.options && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginLeft: 4 }}>
                      {q.options.map((opt: string, j: number) => (
                        <p key={j} style={{ fontSize: 12, color: "var(--os-text-secondary)" }}>
                          {String.fromCharCode(65 + j)}. {stripOptionPrefix(opt)}
                        </p>
                      ))}
                    </div>
                  )}
                  {q.type === "identification" && (
                    <p style={{ fontSize: 12, color: "var(--os-text-secondary)", marginLeft: 4 }}>Type your answer</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {questions.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button onClick={startQuiz} className="glass-btn glass-btn-primary" style={{ padding: "10px 24px", display: "flex", alignItems: "center", gap: 6 }}>
            <Play size={14} /> Start Quiz
          </button>
        </div>
      )}
    </div>
  );
}