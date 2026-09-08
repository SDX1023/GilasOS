"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Calculator, Play, Pause, SkipForward, RotateCcw, Trophy, Target, Clock, Zap, CheckCircle, XCircle, ChevronLeft } from "lucide-react";
import Link from "next/link";

type Operation = "add" | "sub" | "mul" | "div" | "mix";
type InputMode = "manual" | "mcq";
type TimerMode = "stopwatch" | "countdown";
type GamePhase = "setup" | "playing" | "paused" | "finished";

interface Settings {
  operation: Operation;
  digits: number;
  terms: number;
  questions: number;
  timerMode: TimerMode;
  countdownMinutes: number;
  inputMode: InputMode;
}

interface Question {
  operands: number[];
  op: Operation;
  expression: string;
  answer: number;
  options?: number[];
}

interface QuestionResult {
  question: Question;
  userAnswer: number | null;
  correct: boolean;
  timeMs: number;
}

function generateNumber(digits: number): number {
  const min = digits === 1 ? 1 : Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateQuestion(settings: Operation, digits: number, terms: number): Question {
  const ops: Operation[] = settings === "mix" ? ["add", "sub", "mul", "div"] : [settings];
  const op = ops[Math.floor(Math.random() * ops.length)];
  const operands: number[] = [];

  for (let i = 0; i < terms; i++) {
    let num = generateNumber(digits);
    if (op === "div" && i > 0) {
      const prev = operands[i - 1];
      const divisors = [];
      for (let d = 1; d <= Math.abs(prev); d++) {
        if (prev % d === 0) divisors.push(d);
      }
      num = divisors[Math.floor(Math.random() * divisors.length)] || 1;
    }
    operands.push(num);
  }

  let answer = operands[0];
  const symbols: Record<Operation, string> = { add: "+", sub: "−", mul: "×", div: "÷", mix: "?" };
  for (let i = 1; i < operands.length; i++) {
    switch (op) {
      case "add": answer += operands[i]; break;
      case "sub": answer -= operands[i]; break;
      case "mul": answer *= operands[i]; break;
      case "div": answer = Math.round(answer / operands[i] * 1000) / 1000; break;
    }
  }

  const expression = operands.map((o, i) => (i === 0 ? `${o}` : ` ${symbols[op]} ${o}`)).join("");

  return { operands, op, expression, answer: Math.round(answer * 1000) / 1000 };
}

function generateOptions(answer: number): number[] {
  const opts = new Set<number>([answer]);
  const spread = Math.max(Math.abs(answer) * 0.3, 5);
  while (opts.size < 4) {
    const offset = Math.floor(Math.random() * spread * 2) - spread;
    const wrong = Math.round(answer + offset);
    if (wrong !== answer && wrong >= 0) opts.add(wrong);
  }
  return Array.from(opts).sort(() => Math.random() - 0.5);
}

function formatTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function SpeedMathPage() {
  const [phase, setPhase] = useState<GamePhase>("setup");
  const [settings, setSettings] = useState<Settings>({
    operation: "add", digits: 2, terms: 2, questions: 10,
    timerMode: "stopwatch", countdownMinutes: 2, inputMode: "manual",
  });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [userInput, setUserInput] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [questionStart, setQuestionStart] = useState(0);
  const [questionTime, setQuestionTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ = questions[currentIndex];

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => setElapsed((p) => p + 100), 100);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "playing" && inputRef.current) inputRef.current.focus();
  }, [currentIndex, phase]);

  const startGame = useCallback(() => {
    const qs: Question[] = [];
    for (let i = 0; i < settings.questions; i++) {
      const q = generateQuestion(settings.operation, settings.digits, settings.terms);
      if (settings.inputMode === "mcq") q.options = generateOptions(q.answer);
      qs.push(q);
    }
    setQuestions(qs);
    setCurrentIndex(0);
    setResults([]);
    setUserInput("");
    setSelectedOption(null);
    setElapsed(0);
    setQuestionStart(Date.now());
    setPhase("playing");
  }, [settings]);

  const submitAnswer = useCallback((answer: number | null) => {
    if (!currentQ || answer === null) return;
    const timeMs = Date.now() - questionStart;
    const correct = Math.abs(answer - currentQ.answer) < 0.01;
    const result: QuestionResult = { question: currentQ, userAnswer: answer, correct, timeMs };
    setResults((p) => [...p, result]);
    setUserInput("");
    setSelectedOption(null);

    if (currentIndex + 1 >= questions.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("finished");
    } else {
      setCurrentIndex((p) => p + 1);
      setQuestionStart(Date.now());
    }
  }, [currentQ, currentIndex, questions.length, questionStart]);

  const skipQuestion = useCallback(() => {
    if (!currentQ) return;
    const result: QuestionResult = { question: currentQ, userAnswer: null, correct: false, timeMs: Date.now() - questionStart };
    setResults((p) => [...p, result]);
    setUserInput("");
    setSelectedOption(null);
    if (currentIndex + 1 >= questions.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      setPhase("finished");
    } else {
      setCurrentIndex((p) => p + 1);
      setQuestionStart(Date.now());
    }
  }, [currentQ, currentIndex, questions.length, questionStart]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase === "playing") {
      if (e.key === "Enter") {
        e.preventDefault();
        if (settings.inputMode === "manual") {
          const val = parseFloat(userInput);
          if (!isNaN(val)) submitAnswer(val);
        } else if (selectedOption !== null) {
          submitAnswer(selectedOption);
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        skipQuestion();
      } else if (e.key === "p" || e.key === "P") {
        setPhase((p) => p === "paused" ? "playing" : "paused");
      } else if (settings.inputMode === "mcq" && ["1", "2", "3", "4"].includes(e.key)) {
        const idx = parseInt(e.key) - 1;
        if (currentQ?.options?.[idx] !== undefined) setSelectedOption(currentQ.options[idx]);
      }
    } else if (phase === "paused" && (e.key === "p" || e.key === "P")) {
      setPhase("playing");
    }
  }, [phase, userInput, selectedOption, settings.inputMode, submitAnswer, skipQuestion, currentQ]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const correct = results.filter((r) => r.correct).length;
  const wrong = results.filter((r) => !r.correct && r.userAnswer !== null).length;
  const skipped = results.filter((r) => r.userAnswer === null).length;
  const accuracy = results.length > 0 ? Math.round((correct / results.length) * 100) : 0;
  const avgTime = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.timeMs, 0) / results.length / 1000 * 10) / 10 : 0;

  const opLabels: Record<Operation, string> = { add: "Addition", sub: "Subtraction", mul: "Multiplication", div: "Division", mix: "Mixed" };
  const opSymbol: Record<Operation, string> = { add: "+", sub: "−", mul: "×", div: "÷", mix: "?" };

  return (
    <div style={{ minHeight: "100%" }}>
      <div className="os-background">
        <div className="os-orb os-orb--1" />
        <div className="os-orb os-orb--2" />
        <div className="os-orb os-orb--3" />
        <div className="os-grid" />
      </div>

      <div className="os-window" style={{ maxWidth: 700 }}>
        <div className="os-window-header">
          <div className="os-window-title">
            <span className="icon">⚡</span>
            <span>Speed Math</span>
          </div>
          <div className="os-window-controls">
            <Link href="/" style={{ textDecoration: "none" }}>
              <button className="close" title="Close">✕</button>
            </Link>
          </div>
        </div>

        <div className="os-window-body" style={{ padding: "24px 28px" }}>
          {/* SETUP PHASE */}
          {phase === "setup" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <Calculator size={36} color="var(--os-accent)" style={{ marginBottom: 8 }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4 }}>Practice Arena</h2>
                <p style={{ fontSize: 13, color: "var(--os-text-dim)" }}>Sharpen your calculation speed</p>
              </div>

              {/* Operation Selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Operation</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {(["add", "sub", "mul", "div", "mix"] as Operation[]).map((op) => (
                    <button key={op} onClick={() => setSettings((s) => ({ ...s, operation: op }))} style={{
                      ...chipStyle, fontWeight: settings.operation === op ? 600 : 400,
                      background: settings.operation === op ? "var(--os-accent)" : undefined,
                      color: settings.operation === op ? "#fff" : undefined,
                      borderColor: settings.operation === op ? "var(--os-accent)" : undefined,
                    }}>
                      <span style={{ fontSize: 16 }}>{opSymbol[op]}</span>
                      <span style={{ fontSize: 10 }}>{opLabels[op]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Settings Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
                <div>
                  <label style={labelStyle}>Digits</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[1, 2, 3, 4].map((d) => (
                      <button key={d} onClick={() => setSettings((s) => ({ ...s, digits: d }))} style={{
                        ...chipSm, background: settings.digits === d ? "var(--os-accent)" : undefined,
                        color: settings.digits === d ? "#fff" : undefined,
                      }}>{d}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Terms</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[2, 3, 4, 5].map((t) => (
                      <button key={t} onClick={() => setSettings((s) => ({ ...s, terms: t }))} style={{
                        ...chipSm, background: settings.terms === t ? "var(--os-accent)" : undefined,
                        color: settings.terms === t ? "#fff" : undefined,
                      }}>{t}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Questions</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[5, 10, 15, 20, 30].map((q) => (
                      <button key={q} onClick={() => setSettings((s) => ({ ...s, questions: q }))} style={{
                        ...chipSm, background: settings.questions === q ? "var(--os-accent)" : undefined,
                        color: settings.questions === q ? "#fff" : undefined,
                      }}>{q}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Timer</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setSettings((s) => ({ ...s, timerMode: "stopwatch" }))} style={{
                      ...chipSm, flex: 1, background: settings.timerMode === "stopwatch" ? "var(--os-accent)" : undefined,
                      color: settings.timerMode === "stopwatch" ? "#fff" : undefined,
                    }}>⏱ Stopwatch</button>
                    <button onClick={() => setSettings((s) => ({ ...s, timerMode: "countdown" }))} style={{
                      ...chipSm, flex: 1, background: settings.timerMode === "countdown" ? "var(--os-accent)" : undefined,
                      color: settings.timerMode === "countdown" ? "#fff" : undefined,
                    }}>⏳ Countdown</button>
                  </div>
                </div>
                {settings.timerMode === "countdown" && (
                  <div>
                    <label style={labelStyle}>Countdown (min)</label>
                    <div style={{ display: "flex", gap: 4 }}>
                      {[1, 2, 3, 5, 10].map((m) => (
                        <button key={m} onClick={() => setSettings((s) => ({ ...s, countdownMinutes: m }))} style={{
                          ...chipSm, background: settings.countdownMinutes === m ? "var(--os-accent)" : undefined,
                          color: settings.countdownMinutes === m ? "#fff" : undefined,
                        }}>{m}m</button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Input Mode</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button onClick={() => setSettings((s) => ({ ...s, inputMode: "manual" }))} style={{
                      ...chipSm, flex: 1, background: settings.inputMode === "manual" ? "var(--os-accent)" : undefined,
                      color: settings.inputMode === "manual" ? "#fff" : undefined,
                    }}>⌨ Manual</button>
                    <button onClick={() => setSettings((s) => ({ ...s, inputMode: "mcq" }))} style={{
                      ...chipSm, flex: 1, background: settings.inputMode === "mcq" ? "var(--os-accent)" : undefined,
                      color: settings.inputMode === "mcq" ? "#fff" : undefined,
                    }}>🔘 MCQ</button>
                  </div>
                </div>
              </div>

              <button onClick={startGame} style={{
                width: "100%", padding: "14px 0", borderRadius: 12, border: "none", cursor: "pointer",
                background: "var(--os-accent)", color: "#fff", fontSize: 15, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                transition: "opacity 0.15s",
              }}>
                <Play size={18} /> Start Practice
              </button>

              <div style={{ marginTop: 20, padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 12, color: "var(--os-text-dim)", marginBottom: 6, fontWeight: 600 }}>⌨ Keyboard Shortcuts</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11, color: "var(--os-text-dim)" }}>
                  <span><kbd style={kbdStyle}>Enter</kbd> Submit answer</span>
                  <span><kbd style={kbdStyle}>Tab</kbd> Skip question</span>
                  <span><kbd style={kbdStyle}>P</kbd> Pause / Resume</span>
                  <span><kbd style={kbdStyle}>1-4</kbd> Select MCQ option</span>
                </div>
              </div>
            </div>
          )}

          {/* PLAYING / PAUSED PHASE */}
          {(phase === "playing" || phase === "paused") && currentQ && (
            <div>
              {/* Top Bar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase("setup"); }} style={ghostBtn}>
                  <ChevronLeft size={16} /> Exit
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--os-text-secondary)" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Target size={14} color="#22c55e" /> {currentIndex + 1}/{questions.length}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={14} color="#60a5fa" /> {formatTime(elapsed)}
                  </span>
                  <button onClick={() => setPhase((p) => p === "paused" ? "playing" : "paused")} style={ghostBtn}>
                    {phase === "paused" ? <Play size={14} /> : <Pause size={14} />}
                  </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", marginBottom: 24, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${((currentIndex + 1) / questions.length) * 100}%`, background: "var(--os-accent)", borderRadius: 2, transition: "width 0.3s" }} />
              </div>

              {phase === "paused" ? (
                <div style={{ textAlign: "center", padding: "40px 0" }}>
                  <Pause size={40} color="var(--os-text-dim)" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 16, color: "var(--os-text-secondary)", fontWeight: 600 }}>Paused</p>
                  <p style={{ fontSize: 12, color: "var(--os-text-dim)", marginTop: 4 }}>Press <kbd style={kbdStyle}>P</kbd> to resume</p>
                </div>
              ) : (
                <>
                  {/* Question */}
                  <div style={{ textAlign: "center", marginBottom: 32 }}>
                    <div style={{
                      fontSize: 36, fontWeight: 700, color: "var(--os-text-primary)",
                      fontFamily: "'JetBrains Mono', monospace", letterSpacing: -1,
                      padding: "24px 0", lineHeight: 1.3,
                    }}>
                      {currentQ.expression} = <span style={{ color: "var(--os-accent)" }}>?</span>
                    </div>
                  </div>

                  {/* Input Area */}
                  {settings.inputMode === "manual" ? (
                    <div style={{ marginBottom: 20 }}>
                      <input
                        ref={inputRef}
                        type="text"
                        inputMode="decimal"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type your answer..."
                        style={{
                          width: "100%", padding: "14px 16px", fontSize: 20, fontWeight: 600,
                          borderRadius: 12, border: "2px solid rgba(255,255,255,0.1)",
                          background: "rgba(0,0,0,0.3)", color: "var(--os-text-primary)",
                          outline: "none", textAlign: "center", fontFamily: "'JetBrains Mono', monospace",
                          transition: "border-color 0.15s",
                        }}
                        autoFocus
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={() => { const val = parseFloat(userInput); if (!isNaN(val)) submitAnswer(val); }} style={{ ...actionBtn, flex: 1, background: "var(--os-accent)", color: "#fff" }}>
                          <CheckCircle size={16} /> Submit
                        </button>
                        <button onClick={skipQuestion} style={{ ...actionBtn, flex: 1, background: "rgba(255,255,255,0.06)", color: "var(--os-text-secondary)" }}>
                          <SkipForward size={16} /> Skip
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
                      {currentQ.options?.map((opt, i) => (
                        <button key={i} onClick={() => { setSelectedOption(opt); submitAnswer(opt); }} style={{
                          padding: "16px 12px", borderRadius: 12, border: `2px solid ${selectedOption === opt ? "var(--os-accent)" : "rgba(255,255,255,0.08)"}`,
                          background: selectedOption === opt ? "rgba(109,40,217,0.15)" : "rgba(255,255,255,0.03)",
                          color: "var(--os-text-primary)", fontSize: 18, fontWeight: 600, cursor: "pointer",
                          fontFamily: "'JetBrains Mono', monospace", transition: "all 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                        }}>
                          <span style={{ fontSize: 11, color: "var(--os-text-dim)", fontWeight: 500 }}>{i + 1}</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Streak */}
                  {results.length > 0 && (
                    <div style={{ textAlign: "center" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: results[results.length - 1]?.correct ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
                        color: results[results.length - 1]?.correct ? "#22c55e" : "#ef4444",
                      }}>
                        {results[results.length - 1]?.correct ? "✓ Correct" : "✗ Wrong"}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* FINISHED PHASE */}
          {phase === "finished" && (
            <div>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <Trophy size={40} color="#fbbf24" style={{ marginBottom: 8 }} />
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4 }}>Practice Complete!</h2>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
                {[
                  { label: "Score", value: `${correct}/${questions.length}`, color: "#22c55e", icon: <CheckCircle size={14} /> },
                  { label: "Accuracy", value: `${accuracy}%`, color: accuracy >= 80 ? "#22c55e" : accuracy >= 50 ? "#eab308" : "#ef4444", icon: <Target size={14} /> },
                  { label: "Avg Time", value: `${avgTime}s`, color: "#60a5fa", icon: <Clock size={14} /> },
                  { label: "Wrong", value: `${wrong}`, color: "#ef4444", icon: <XCircle size={14} /> },
                ].map((s) => (
                  <div key={s.label} style={{
                    padding: "12px 10px", borderRadius: 10, textAlign: "center",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, color: s.color, marginBottom: 4 }}>{s.icon}<span style={{ fontSize: 18, fontWeight: 700 }}>{s.value}</span></div>
                    <div style={{ fontSize: 10, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Review */}
              <div style={{ maxHeight: 300, overflowY: "auto", marginBottom: 20 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ color: "var(--os-text-dim)", textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>#</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Question</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Your Answer</th>
                      <th style={{ textAlign: "left", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Correct</th>
                      <th style={{ textAlign: "right", padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ color: r.correct ? "#22c55e" : r.userAnswer === null ? "var(--os-text-dim)" : "#ef4444" }}>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{i + 1}</td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace" }}>{r.question.expression} = {r.question.answer}</td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", fontFamily: "'JetBrains Mono', monospace" }}>{r.userAnswer ?? "Skipped"}</td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>{r.correct ? "✓" : "✗"}</td>
                        <td style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", textAlign: "right" }}>{(r.timeMs / 1000).toFixed(1)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={startGame} style={{ ...actionBtn, flex: 1, background: "var(--os-accent)", color: "#fff" }}>
                  <RotateCcw size={16} /> Practice Again
                </button>
                <button onClick={() => setPhase("setup")} style={{ ...actionBtn, flex: 1, background: "rgba(255,255,255,0.06)", color: "var(--os-text-secondary)" }}>
                  <Calculator size={16} /> New Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" };
const chipStyle: React.CSSProperties = { padding: "8px 6px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "var(--os-text-secondary)", cursor: "pointer", fontSize: 11, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, transition: "all 0.15s" };
const chipSm: React.CSSProperties = { flex: 1, padding: "6px 4px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: "var(--os-text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 500, textAlign: "center", transition: "all 0.15s" };
const ghostBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, padding: "6px 10px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.04)", color: "var(--os-text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 500 };
const actionBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "opacity 0.15s" };
const kbdStyle: React.CSSProperties = { display: "inline-block", padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", fontSize: 10, fontFamily: "monospace", fontWeight: 600 };
