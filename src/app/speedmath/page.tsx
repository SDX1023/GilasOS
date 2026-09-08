"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, RotateCcw, Trophy, Target, Clock, CheckCircle, XCircle, ChevronLeft, Zap, Flame, TrendingUp } from "lucide-react";
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

const OP_CONFIG: Record<Operation, { symbol: string; label: string; color: string; gradient: string }> = {
  add: { symbol: "+", label: "Add", color: "#22c55e", gradient: "from-emerald-500/20 to-emerald-500/5" },
  sub: { symbol: "−", label: "Sub", color: "#60a5fa", gradient: "from-blue-500/20 to-blue-500/5" },
  mul: { symbol: "×", label: "Mul", color: "#a78bfa", gradient: "from-violet-500/20 to-violet-500/5" },
  div: { symbol: "÷", label: "Div", color: "#f59e0b", gradient: "from-amber-500/20 to-amber-500/5" },
  mix: { symbol: "?", label: "Mix", color: "#f472b6", gradient: "from-pink-500/20 to-pink-500/5" },
};

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
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [flashCorrect, setFlashCorrect] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex) / questions.length) * 100 : 0;

  useEffect(() => {
    if (phase === "playing") {
      timerRef.current = setInterval(() => setElapsed((p) => p + 100), 100);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "playing" && settings.timerMode === "countdown") {
      const totalMs = settings.countdownMinutes * 60 * 1000;
      countdownRef.current = setInterval(() => {
        setElapsed((p) => {
          if (p >= totalMs) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            if (timerRef.current) clearInterval(timerRef.current);
            setPhase("finished");
            return totalMs;
          }
          return p + 100;
        });
      }, 100);
      return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
    }
  }, [phase, settings.timerMode, settings.countdownMinutes]);

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
    setStreak(0);
    setBestStreak(0);
    setFlashCorrect(null);
    setPhase("playing");
  }, [settings]);

  const advance = useCallback((correct: boolean) => {
    setFlashCorrect(correct);
    setTimeout(() => setFlashCorrect(null), 600);
    setUserInput("");
    setSelectedOption(null);

    if (currentIndex + 1 >= questions.length) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setPhase("finished");
    } else {
      setCurrentIndex((p) => p + 1);
      setQuestionStart(Date.now());
    }
  }, [currentIndex, questions.length]);

  const submitAnswer = useCallback((answer: number | null) => {
    if (!currentQ || answer === null) return;
    const timeMs = Date.now() - questionStart;
    const correct = Math.abs(answer - currentQ.answer) < 0.01;
    setResults((p) => [...p, { question: currentQ, userAnswer: answer, correct, timeMs }]);
    if (correct) {
      setStreak((s) => { const n = s + 1; setBestStreak((b) => Math.max(b, n)); return n; });
    } else {
      setStreak(0);
    }
    advance(correct);
  }, [currentQ, questionStart, advance]);

  const skipQuestion = useCallback(() => {
    if (!currentQ) return;
    setResults((p) => [...p, { question: currentQ, userAnswer: null, correct: false, timeMs: Date.now() - questionStart }]);
    setStreak(0);
    advance(false);
  }, [currentQ, questionStart, advance]);

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

  const correctCount = results.filter((r) => r.correct).length;
  const wrongCount = results.filter((r) => !r.correct && r.userAnswer !== null).length;
  const skippedCount = results.filter((r) => r.userAnswer === null).length;
  const accuracy = results.length > 0 ? Math.round((correctCount / results.length) * 100) : 0;
  const avgTime = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.timeMs, 0) / results.length / 1000 * 10) / 10 : 0;
  const remainingSec = settings.timerMode === "countdown" ? Math.max(0, Math.floor((settings.countdownMinutes * 60 * 1000 - elapsed) / 1000)) : null;

  return (
    <div style={{ minHeight: "100%", position: "relative" }}>
      <div className="os-background">
        <div className="os-orb os-orb--1" />
        <div className="os-orb os-orb--2" />
        <div className="os-orb os-orb--3" />
        <div className="os-grid" />
      </div>

      {/* Flash overlay */}
      {flashCorrect !== null && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200, pointerEvents: "none",
          background: flashCorrect ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)",
          animation: "flashFade 0.6s ease-out forwards",
        }} />
      )}

      <style>{`
        @keyframes flashFade { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .speed-math-input:focus { border-color: var(--os-accent) !important; box-shadow: 0 0 0 3px rgba(109,40,217,0.2); }
        .speed-math-option { transition: all 0.15s; }
        .speed-math-option:hover { transform: translateY(-2px); box-shadow: 0 4px 16px rgba(0,0,0,0.2); }
        .speed-math-option:active { transform: scale(0.97); }
        .speed-math-btn { transition: all 0.15s; }
        .speed-math-btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .speed-math-btn:active { transform: scale(0.97); }
      `}</style>

      <div className="os-window" style={{ maxWidth: 680 }}>
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

        <div className="os-window-body" style={{ padding: 0, overflow: "hidden" }}>

          {/* ==================== SETUP ==================== */}
          {phase === "setup" && (
            <div style={{ padding: "28px 28px 24px", animation: "slideUp 0.3s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
                  background: "linear-gradient(135deg, var(--os-accent), #a855f7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 20px rgba(109,40,217,0.3)",
                }}>
                  <Zap size={28} color="#fff" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4 }}>Practice Arena</h2>
                <p style={{ fontSize: 13, color: "var(--os-text-dim)" }}>Sharpen your calculation speed</p>
              </div>

              {/* Operation Selector */}
              <div style={{ marginBottom: 22 }}>
                <label style={labelStyle}>Operation</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
                  {(["add", "sub", "mul", "div", "mix"] as Operation[]).map((op) => {
                    const cfg = OP_CONFIG[op];
                    const active = settings.operation === op;
                    return (
                      <button key={op} onClick={() => setSettings((s) => ({ ...s, operation: op }))}
                        className="speed-math-btn"
                        style={{
                          padding: "12px 4px", borderRadius: 10, border: `1.5px solid ${active ? cfg.color : "rgba(255,255,255,0.08)"}`,
                          background: active ? `${cfg.color}18` : "rgba(255,255,255,0.02)", cursor: "pointer",
                          color: active ? cfg.color : "var(--os-text-secondary)",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                        }}>
                        <span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>{cfg.symbol}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Settings */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 22 }}>
                <SettingGroup label="Digits" options={[1, 2, 3, 4]} value={settings.digits} onChange={(v) => setSettings((s) => ({ ...s, digits: v }))} />
                <SettingGroup label="Terms" options={[2, 3, 4, 5]} value={settings.terms} onChange={(v) => setSettings((s) => ({ ...s, terms: v }))} />
                <SettingGroup label="Questions" options={[5, 10, 15, 20, 30]} value={settings.questions} onChange={(v) => setSettings((s) => ({ ...s, questions: v }))} />
                <div>
                  <label style={labelStyle}>Timer</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["stopwatch", "countdown"] as TimerMode[]).map((m) => (
                      <button key={m} onClick={() => setSettings((s) => ({ ...s, timerMode: m }))} className="speed-math-btn"
                        style={{
                          ...chipBtn, flex: 1,
                          background: settings.timerMode === m ? "var(--os-accent)" : undefined,
                          color: settings.timerMode === m ? "#fff" : undefined,
                          borderColor: settings.timerMode === m ? "var(--os-accent)" : undefined,
                        }}>
                        {m === "stopwatch" ? "⏱ Stopwatch" : "⏳ Countdown"}
                      </button>
                    ))}
                  </div>
                </div>
                {settings.timerMode === "countdown" && (
                  <SettingGroup label="Duration (min)" options={[1, 2, 3, 5, 10]} value={settings.countdownMinutes} onChange={(v) => setSettings((s) => ({ ...s, countdownMinutes: v }))} />
                )}
                <div>
                  <label style={labelStyle}>Input Mode</label>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["manual", "mcq"] as InputMode[]).map((m) => (
                      <button key={m} onClick={() => setSettings((s) => ({ ...s, inputMode: m }))} className="speed-math-btn"
                        style={{
                          ...chipBtn, flex: 1,
                          background: settings.inputMode === m ? "var(--os-accent)" : undefined,
                          color: settings.inputMode === m ? "#fff" : undefined,
                          borderColor: settings.inputMode === m ? "var(--os-accent)" : undefined,
                        }}>
                        {m === "manual" ? "⌨ Type" : "🔘 MCQ"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button onClick={startGame} className="speed-math-btn"
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 12, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, var(--os-accent), #7c3aed)", color: "#fff",
                  fontSize: 15, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  boxShadow: "0 4px 20px rgba(109,40,217,0.3)",
                }}>
                <Play size={18} fill="currentColor" /> Start Practice
              </button>

              <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, fontSize: 11, color: "var(--os-text-dim)" }}>
                  <span><kbd style={kbd}>Enter</kbd> Submit</span>
                  <span><kbd style={kbd}>Tab</kbd> Skip</span>
                  <span><kbd style={kbd}>P</kbd> Pause</span>
                  <span><kbd style={kbd}>1-4</kbd> MCQ select</span>
                </div>
              </div>
            </div>
          )}

          {/* ==================== PLAYING ==================== */}
          {(phase === "playing" || phase === "paused") && currentQ && (
            <div style={{ animation: "slideUp 0.2s ease" }}>
              {/* Top bar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.01)",
              }}>
                <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); if (countdownRef.current) clearInterval(countdownRef.current); setPhase("setup"); }}
                  className="speed-math-btn" style={ghostBtn}>
                  <ChevronLeft size={15} /> Exit
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {streak >= 2 && (
                    <span style={{
                      display: "flex", alignItems: "center", gap: 3, padding: "3px 8px", borderRadius: 8,
                      background: "rgba(249,115,22,0.12)", color: "#f97316", fontSize: 11, fontWeight: 700,
                    }}>
                      <Flame size={12} /> {streak}
                    </span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--os-text-dim)", fontWeight: 500, fontFamily: "monospace" }}>
                    {currentIndex + 1}/{questions.length}
                  </span>
                  <span style={{
                    padding: "3px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600, fontFamily: "monospace",
                    background: settings.timerMode === "countdown" && remainingSec !== null && remainingSec < 30
                      ? "rgba(239,68,68,0.12)" : "rgba(96,165,250,0.1)",
                    color: settings.timerMode === "countdown" && remainingSec !== null && remainingSec < 30
                      ? "#ef4444" : "#60a5fa",
                  }}>
                    <Clock size={11} style={{ display: "inline", marginRight: 3, verticalAlign: -1 }} />
                    {settings.timerMode === "countdown" && remainingSec !== null
                      ? `${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, "0")}`
                      : formatTime(elapsed)}
                  </span>
                  <button onClick={() => setPhase((p) => p === "paused" ? "playing" : "paused")} className="speed-math-btn" style={ghostBtn}>
                    {phase === "paused" ? <Play size={13} /> : <Pause size={13} />}
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div style={{ height: 3, background: "rgba(255,255,255,0.04)" }}>
                <div style={{
                  height: "100%", width: `${progress}%`,
                  background: "linear-gradient(90deg, var(--os-accent), #a855f7)",
                  transition: "width 0.3s ease", borderRadius: "0 2px 2px 0",
                }} />
              </div>

              {phase === "paused" ? (
                <div style={{ padding: "60px 28px", textAlign: "center" }}>
                  <Pause size={36} color="var(--os-text-dim)" style={{ marginBottom: 10, opacity: 0.5 }} />
                  <p style={{ fontSize: 16, color: "var(--os-text-secondary)", fontWeight: 600, marginBottom: 4 }}>Paused</p>
                  <p style={{ fontSize: 11, color: "var(--os-text-dim)" }}>Press <kbd style={kbd}>P</kbd> to resume</p>
                </div>
              ) : (
                <div style={{ padding: "20px 28px 24px" }}>
                  {/* Question card */}
                  <div style={{
                    textAlign: "center", padding: "28px 20px", borderRadius: 16, marginBottom: 24,
                    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
                      color: OP_CONFIG[currentQ.op].color, marginBottom: 8,
                    }}>
                      {OP_CONFIG[currentQ.op].label}
                    </div>
                    <div style={{
                      fontSize: 38, fontWeight: 700, color: "var(--os-text-primary)",
                      fontFamily: "'JetBrains Mono', 'SF Mono', monospace", letterSpacing: -1, lineHeight: 1.2,
                    }}>
                      {currentQ.expression}
                      <span style={{ color: "var(--os-accent)", margin: "0 4px" }}>=</span>
                      <span style={{ color: "var(--os-accent)", animation: "pulse 1.5s ease infinite" }}>?</span>
                    </div>
                  </div>

                  {/* Input */}
                  {settings.inputMode === "manual" ? (
                    <div>
                      <input
                        ref={inputRef} type="text" inputMode="decimal"
                        value={userInput} onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type your answer"
                        className="speed-math-input"
                        style={{
                          width: "100%", padding: "14px 16px", fontSize: 22, fontWeight: 600,
                          borderRadius: 12, border: "2px solid rgba(255,255,255,0.08)",
                          background: "rgba(0,0,0,0.25)", color: "var(--os-text-primary)",
                          outline: "none", textAlign: "center",
                          fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s",
                        }}
                        autoFocus
                      />
                      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                        <button onClick={() => { const val = parseFloat(userInput); if (!isNaN(val)) submitAnswer(val); }}
                          className="speed-math-btn" style={{ ...actionBtn, flex: 1, background: "linear-gradient(135deg, var(--os-accent), #7c3aed)", color: "#fff", boxShadow: "0 2px 12px rgba(109,40,217,0.3)" }}>
                          <CheckCircle size={15} /> Submit
                        </button>
                        <button onClick={skipQuestion} className="speed-math-btn"
                          style={{ ...actionBtn, flex: 1, background: "rgba(255,255,255,0.05)", color: "var(--os-text-dim)" }}>
                          <SkipForward size={15} /> Skip
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {currentQ.options?.map((opt, i) => (
                        <button key={i} onClick={() => { setSelectedOption(opt); submitAnswer(opt); }}
                          className="speed-math-option"
                          style={{
                            padding: "18px 12px", borderRadius: 12,
                            border: "1.5px solid rgba(255,255,255,0.08)",
                            background: "rgba(255,255,255,0.02)",
                            color: "var(--os-text-primary)", fontSize: 20, fontWeight: 600, cursor: "pointer",
                            fontFamily: "'JetBrains Mono', monospace",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                          }}>
                          <span style={{
                            width: 22, height: 22, borderRadius: 6, fontSize: 11, fontWeight: 700,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            background: "rgba(255,255,255,0.06)", color: "var(--os-text-dim)",
                          }}>{i + 1}</span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Last answer feedback */}
                  {results.length > 0 && (
                    <div style={{ textAlign: "center", marginTop: 16 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                        background: results[results.length - 1]?.correct ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                        color: results[results.length - 1]?.correct ? "#22c55e" : "#ef4444",
                        border: `1px solid ${results[results.length - 1]?.correct ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
                      }}>
                        {results[results.length - 1]?.correct
                          ? <><CheckCircle size={13} /> Correct!</>
                          : <><XCircle size={13} /> {results[results.length - 1]?.userAnswer === null ? "Skipped" : `Wrong — ${results[results.length - 1]?.question.answer}`}</>}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ==================== FINISHED ==================== */}
          {phase === "finished" && (
            <div style={{ padding: "28px 28px 24px", animation: "slideUp 0.3s ease" }}>
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", margin: "0 auto 10px",
                  background: accuracy >= 80 ? "linear-gradient(135deg, #22c55e, #16a34a)" : accuracy >= 50 ? "linear-gradient(135deg, #eab308, #ca8a04)" : "linear-gradient(135deg, #ef4444, #dc2626)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: accuracy >= 80 ? "0 4px 20px rgba(34,197,94,0.3)" : accuracy >= 50 ? "0 4px 20px rgba(234,179,8,0.3)" : "0 4px 20px rgba(239,68,68,0.3)",
                }}>
                  <Trophy size={28} color="#fff" />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-primary)" }}>
                  {accuracy >= 90 ? "Outstanding!" : accuracy >= 70 ? "Great Work!" : accuracy >= 50 ? "Not Bad!" : "Keep Practicing!"}
                </h2>
                <p style={{ fontSize: 12, color: "var(--os-text-dim)", marginTop: 2 }}>
                  {settings.operation !== "mix" ? OP_CONFIG[settings.operation].label : "Mixed"} · {settings.digits} digit · {settings.terms} terms
                </p>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 }}>
                <StatCard icon={<CheckCircle size={15} />} label="Correct" value={`${correctCount}/${questions.length}`} color="#22c55e" />
                <StatCard icon={<Target size={15} />} label="Accuracy" value={`${accuracy}%`} color={accuracy >= 80 ? "#22c55e" : accuracy >= 50 ? "#eab308" : "#ef4444"} />
                <StatCard icon={<Clock size={15} />} label="Avg Time" value={`${avgTime}s`} color="#60a5fa" />
                <StatCard icon={<Flame size={15} />} label="Best Streak" value={`${bestStreak}`} color="#f97316" />
              </div>

              {/* Review table */}
              <div style={{
                maxHeight: 280, overflowY: "auto", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20,
              }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ position: "sticky", top: 0, background: "rgba(10,14,24,0.95)", backdropFilter: "blur(8px)" }}>
                      {["#", "Question", "Answer", "✓", "Time"].map((h, i) => (
                        <th key={h} style={{
                          textAlign: i === 4 ? "right" : i === 0 ? "center" : "left",
                          padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                          fontSize: 10, fontWeight: 600, color: "var(--os-text-dim)",
                          textTransform: "uppercase", letterSpacing: "0.05em",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{
                        background: i % 2 === 0 ? "rgba(255,255,255,0.01)" : "transparent",
                      }}>
                        <td style={{ padding: "7px 10px", textAlign: "center", color: "var(--os-text-dim)" }}>{i + 1}</td>
                        <td style={{ padding: "7px 10px", fontFamily: "'JetBrains Mono', monospace", color: "var(--os-text-secondary)" }}>{r.question.expression}</td>
                        <td style={{ padding: "7px 10px", fontFamily: "'JetBrains Mono', monospace" }}>
                          <span style={{ color: r.userAnswer === null ? "var(--os-text-dim)" : r.correct ? "#22c55e" : "#ef4444" }}>
                            {r.userAnswer ?? "—"}
                          </span>
                          <span style={{ color: "var(--os-text-dim)", margin: "0 4px" }}>→</span>
                          <span style={{ color: "var(--os-text-secondary)" }}>{r.question.answer}</span>
                        </td>
                        <td style={{ padding: "7px 10px", textAlign: "center" }}>
                          {r.correct ? <CheckCircle size={13} color="#22c55e" /> : r.userAnswer === null ? <span style={{ color: "var(--os-text-dim)", fontSize: 10 }}>skip</span> : <XCircle size={13} color="#ef4444" />}
                        </td>
                        <td style={{ padding: "7px 10px", textAlign: "right", fontFamily: "monospace", color: "var(--os-text-dim)" }}>{(r.timeMs / 1000).toFixed(1)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={startGame} className="speed-math-btn"
                  style={{ ...actionBtn, flex: 1, background: "linear-gradient(135deg, var(--os-accent), #7c3aed)", color: "#fff", boxShadow: "0 2px 12px rgba(109,40,217,0.3)" }}>
                  <RotateCcw size={15} /> Practice Again
                </button>
                <button onClick={() => setPhase("setup")} className="speed-math-btn"
                  style={{ ...actionBtn, flex: 1, background: "rgba(255,255,255,0.05)", color: "var(--os-text-secondary)" }}>
                  <TrendingUp size={15} /> New Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SettingGroup({ label, options, value, onChange }: { label: string; options: number[]; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: 4 }}>
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className="speed-math-btn"
            style={{
              ...chipBtn, background: value === o ? "var(--os-accent)" : undefined,
              color: value === o ? "#fff" : undefined,
              borderColor: value === o ? "var(--os-accent)" : undefined,
            }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: "14px 10px", borderRadius: 12, textAlign: "center",
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    }}>
      <div style={{ color, marginBottom: 6, display: "flex", justifyContent: "center" }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color, fontFamily: "monospace" }}>{value}</div>
      <div style={{ fontSize: 9, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{label}</div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6, display: "block" };
const chipBtn: React.CSSProperties = { flex: 1, padding: "7px 4px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", color: "var(--os-text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 600, textAlign: "center", transition: "all 0.15s" };
const ghostBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 6, border: "none", background: "rgba(255,255,255,0.04)", color: "var(--os-text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 500 };
const actionBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "11px 16px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s" };
const kbd: React.CSSProperties = { display: "inline-block", padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", fontSize: 10, fontFamily: "monospace", fontWeight: 600 };
