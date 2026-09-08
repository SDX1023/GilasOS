"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Pause, SkipForward, RotateCcw, Trophy, Target, Clock, CheckCircle, XCircle, ChevronLeft, Zap, Flame, TrendingUp, Minus } from "lucide-react";
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
      for (let d = 1; d <= Math.abs(prev); d++) { if (prev % d === 0) divisors.push(d); }
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

const OP: Record<Operation, { sym: string; label: string; color: string; glow: string }> = {
  add: { sym: "+", label: "Add", color: "#34d399", glow: "rgba(52,211,153,0.25)" },
  sub: { sym: "−", label: "Sub", color: "#60a5fa", glow: "rgba(96,165,250,0.25)" },
  mul: { sym: "×", label: "Mul", color: "#a78bfa", glow: "rgba(167,139,250,0.25)" },
  div: { sym: "÷", label: "Div", color: "#fbbf24", glow: "rgba(251,191,36,0.25)" },
  mix: { sym: "?", label: "Mix", color: "#f472b6", glow: "rgba(244,114,182,0.25)" },
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
  const [flash, setFlash] = useState<boolean | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const currentQ = questions[currentIndex];
  const progress = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

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
    setFlash(null);
    setPhase("playing");
  }, [settings]);

  const advance = useCallback((correct: boolean) => {
    setFlash(correct);
    setTimeout(() => setFlash(null), 500);
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
    if (correct) setStreak((s) => { const n = s + 1; setBestStreak((b) => Math.max(b, n)); return n; });
    else setStreak(0);
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
      if (e.key === "Enter") { e.preventDefault(); if (settings.inputMode === "manual") { const v = parseFloat(userInput); if (!isNaN(v)) submitAnswer(v); } else if (selectedOption !== null) submitAnswer(selectedOption); }
      else if (e.key === "Tab") { e.preventDefault(); skipQuestion(); }
      else if (e.key === "p" || e.key === "P") setPhase((p) => p === "paused" ? "playing" : "paused");
      else if (settings.inputMode === "mcq" && ["1", "2", "3", "4"].includes(e.key)) { const idx = parseInt(e.key) - 1; if (currentQ?.options?.[idx] !== undefined) setSelectedOption(currentQ.options[idx]); }
    } else if (phase === "paused" && (e.key === "p" || e.key === "P")) setPhase("playing");
  }, [phase, userInput, selectedOption, settings.inputMode, submitAnswer, skipQuestion, currentQ]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const correctCount = results.filter((r) => r.correct).length;
  const wrongCount = results.filter((r) => !r.correct && r.userAnswer !== null).length;
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

      {flash !== null && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200, pointerEvents: "none",
          background: flash ? "rgba(52,211,153,0.07)" : "rgba(239,68,68,0.07)",
          animation: "smFlash 0.5s ease-out forwards",
        }} />
      )}

      <style>{`
        @keyframes smFlash { 0% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes smSlide { 0% { opacity: 0; transform: translateY(16px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes smPop { 0% { transform: scale(0.95); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes smPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes smGlow { 0%, 100% { box-shadow: 0 0 20px var(--glow); } 50% { box-shadow: 0 0 40px var(--glow); } }
        .sm-input:focus { border-color: var(--os-accent) !important; box-shadow: 0 0 0 3px rgba(109,40,217,0.2), 0 0 20px rgba(109,40,217,0.1); }
        .sm-opt { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .sm-opt:hover { transform: translateY(-3px); box-shadow: 0 8px 25px rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15); }
        .sm-opt:active { transform: scale(0.97) translateY(-1px); }
        .sm-btn { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .sm-btn:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .sm-btn:active { transform: scale(0.97); }
        .sm-op-card { transition: all 0.2s cubic-bezier(0.4,0,0.2,1); }
        .sm-op-card:hover { transform: translateY(-2px); }
        .sm-op-card:active { transform: scale(0.97); }
        .sm-chip { transition: all 0.15s ease; }
        .sm-chip:hover { background: rgba(255,255,255,0.08) !important; }
        .sm-table tr:hover td { background: rgba(255,255,255,0.03); }
      `}</style>

      <div className="os-window" style={{ maxWidth: 700, margin: "0 auto" }}>
        <div className="os-window-header">
          <div className="os-window-title">
            <span className="icon">⚡</span>
            <span>Speed Math</span>
          </div>
          <div className="os-window-controls">
            <Link href="/" style={{ textDecoration: "none" }}><button className="close" title="Close">✕</button></Link>
          </div>
        </div>

        <div className="os-window-body" style={{ padding: 0, overflow: "hidden" }}>

          {/* ============ SETUP ============ */}
          {phase === "setup" && (
            <div style={{ padding: "32px 32px 28px", animation: "smSlide 0.35s ease" }}>
              {/* Hero */}
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18, margin: "0 auto 14px",
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 8px 32px rgba(124,58,237,0.35), 0 0 0 1px rgba(255,255,255,0.1) inset",
                }}>
                  <Zap size={30} color="#fff" strokeWidth={2.5} />
                </div>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--os-text-primary)", marginBottom: 4, letterSpacing: -0.5 }}>Practice Arena</h2>
                <p style={{ fontSize: 13, color: "var(--os-text-dim)", letterSpacing: 0.2 }}>Sharpen your calculation speed</p>
              </div>

              {/* Operation Cards */}
              <div style={{ marginBottom: 24 }}>
                <label style={lbl}>Operation</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                  {(["add", "sub", "mul", "div", "mix"] as Operation[]).map((op) => {
                    const c = OP[op]; const active = settings.operation === op;
                    return (
                      <button key={op} onClick={() => setSettings((s) => ({ ...s, operation: op }))}
                        className="sm-op-card"
                        style={{
                          padding: "14px 4px 12px", borderRadius: 14, cursor: "pointer",
                          border: `2px solid ${active ? c.color : "rgba(255,255,255,0.06)"}`,
                          background: active ? `linear-gradient(180deg, ${c.color}15, ${c.color}08)` : "rgba(255,255,255,0.015)",
                          boxShadow: active ? `0 4px 20px ${c.glow}, inset 0 1px 0 rgba(255,255,255,0.05)` : "none",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                          color: active ? c.color : "var(--os-text-dim)",
                        }}>
                        <span style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, fontFamily: "monospace" }}>{c.sym}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{c.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Settings Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 26 }}>
                <Chips label="Digits" options={[1, 2, 3, 4]} value={settings.digits} onChange={(v) => setSettings((s) => ({ ...s, digits: v }))} />
                <Chips label="Terms" options={[2, 3, 4, 5]} value={settings.terms} onChange={(v) => setSettings((s) => ({ ...s, terms: v }))} />
                <Chips label="Questions" options={[5, 10, 15, 20, 30]} value={settings.questions} onChange={(v) => setSettings((s) => ({ ...s, questions: v }))} />
                <div>
                  <label style={lbl}>Timer</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["stopwatch", "countdown"] as TimerMode[]).map((m) => (
                      <button key={m} onClick={() => setSettings((s) => ({ ...s, timerMode: m }))} className="sm-chip"
                        style={{
                          ...chipBase, flex: 1,
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
                  <Chips label="Duration (min)" options={[1, 2, 3, 5, 10]} value={settings.countdownMinutes} onChange={(v) => setSettings((s) => ({ ...s, countdownMinutes: v }))} />
                )}
                <div>
                  <label style={lbl}>Input Mode</label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {(["manual", "mcq"] as InputMode[]).map((m) => (
                      <button key={m} onClick={() => setSettings((s) => ({ ...s, inputMode: m }))} className="sm-chip"
                        style={{
                          ...chipBase, flex: 1,
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

              {/* Start Button */}
              <button onClick={startGame} className="sm-btn"
                style={{
                  width: "100%", padding: "16px 0", borderRadius: 14, border: "none", cursor: "pointer",
                  background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff",
                  fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  boxShadow: "0 6px 24px rgba(124,58,237,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                  letterSpacing: 0.3,
                }}>
                <Play size={20} fill="currentColor" /> Start Practice
              </button>

              {/* Shortcuts */}
              <div style={{
                marginTop: 20, padding: "14px 18px", borderRadius: 12,
                background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, fontSize: 11, color: "var(--os-text-dim)" }}>
                  <span><kbd style={kbd}>Enter</kbd> Submit</span>
                  <span><kbd style={kbd}>Tab</kbd> Skip</span>
                  <span><kbd style={kbd}>P</kbd> Pause</span>
                  <span><kbd style={kbd}>1-4</kbd> MCQ</span>
                </div>
              </div>
            </div>
          )}

          {/* ============ PLAYING / PAUSED ============ */}
          {(phase === "playing" || phase === "paused") && currentQ && (
            <div style={{ animation: "smSlide 0.2s ease" }}>
              {/* Top Bar */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.01)",
              }}>
                <button onClick={() => { if (timerRef.current) clearInterval(timerRef.current); if (countdownRef.current) clearInterval(countdownRef.current); setPhase("setup"); }}
                  className="sm-btn" style={ghostBtn}><ChevronLeft size={15} /> Exit</button>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {streak >= 2 && (
                    <span style={{
                      display: "flex", alignItems: "center", gap: 3, padding: "3px 10px", borderRadius: 8,
                      background: "rgba(249,115,22,0.1)", color: "#fb923c", fontSize: 12, fontWeight: 700,
                      border: "1px solid rgba(249,115,22,0.15)",
                    }}><Flame size={12} /> {streak}</span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--os-text-dim)", fontWeight: 600, fontFamily: "monospace" }}>
                    {currentIndex + 1}/{questions.length}
                  </span>
                  <span style={{
                    padding: "3px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: "monospace",
                    background: settings.timerMode === "countdown" && remainingSec !== null && remainingSec < 30
                      ? "rgba(239,68,68,0.1)" : "rgba(96,165,250,0.08)",
                    color: settings.timerMode === "countdown" && remainingSec !== null && remainingSec < 30
                      ? "#f87171" : "#60a5fa",
                    border: `1px solid ${settings.timerMode === "countdown" && remainingSec !== null && remainingSec < 30 ? "rgba(239,68,68,0.15)" : "rgba(96,165,250,0.1)"}`,
                  }}>
                    <Clock size={11} style={{ display: "inline", marginRight: 3, verticalAlign: -1 }} />
                    {settings.timerMode === "countdown" && remainingSec !== null
                      ? `${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, "0")}`
                      : formatTime(elapsed)}
                  </span>
                  <button onClick={() => setPhase((p) => p === "paused" ? "playing" : "paused")} className="sm-btn" style={ghostBtn}>
                    {phase === "paused" ? <Play size={13} /> : <Pause size={13} />}
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div style={{ height: 3, background: "rgba(255,255,255,0.03)" }}>
                <div style={{
                  height: "100%", width: `${progress}%`,
                  background: "linear-gradient(90deg, #7c3aed, #a855f7)",
                  transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)", borderRadius: "0 3px 3px 0",
                  boxShadow: "0 0 8px rgba(168,85,247,0.4)",
                }} />
              </div>

              {phase === "paused" ? (
                <div style={{ padding: "64px 28px", textAlign: "center" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, margin: "0 auto 14px",
                    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}><Pause size={24} color="var(--os-text-dim)" /></div>
                  <p style={{ fontSize: 18, color: "var(--os-text-primary)", fontWeight: 700, marginBottom: 4 }}>Paused</p>
                  <p style={{ fontSize: 12, color: "var(--os-text-dim)" }}>Press <kbd style={kbd}>P</kbd> to resume</p>
                </div>
              ) : (
                <div style={{ padding: "24px 32px 28px" }}>
                  {/* Question Display */}
                  <div style={{
                    textAlign: "center", padding: "32px 24px", borderRadius: 18, marginBottom: 28,
                    background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
                    position: "relative", overflow: "hidden",
                  }}>
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: 2,
                      background: `linear-gradient(90deg, transparent, ${OP[currentQ.op].color}60, transparent)`,
                    }} />
                    <div style={{
                      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em",
                      color: OP[currentQ.op].color, marginBottom: 10,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: OP[currentQ.op].color, boxShadow: `0 0 8px ${OP[currentQ.op].glow}`,
                      }} />
                      {OP[currentQ.op].label}
                    </div>
                    <div style={{
                      fontSize: 42, fontWeight: 800, color: "var(--os-text-primary)",
                      fontFamily: "'JetBrains Mono', 'SF Mono', 'Cascadia Code', monospace",
                      letterSpacing: -2, lineHeight: 1.2,
                    }}>
                      {currentQ.expression}
                      <span style={{ color: OP[currentQ.op].color, margin: "0 6px", fontWeight: 400 }}>=</span>
                      <span style={{
                        color: OP[currentQ.op].color,
                        animation: "smPulse 1.5s ease infinite",
                      }}>?</span>
                    </div>
                  </div>

                  {/* Manual Input */}
                  {settings.inputMode === "manual" ? (
                    <div>
                      <input ref={inputRef} type="text" inputMode="decimal"
                        value={userInput} onChange={(e) => setUserInput(e.target.value)}
                        placeholder="Type your answer"
                        className="sm-input"
                        style={{
                          width: "100%", padding: "16px 20px", fontSize: 24, fontWeight: 700,
                          borderRadius: 14, border: "2px solid rgba(255,255,255,0.06)",
                          background: "rgba(0,0,0,0.2)", color: "var(--os-text-primary)",
                          outline: "none", textAlign: "center",
                          fontFamily: "'JetBrains Mono', monospace", transition: "all 0.2s",
                        }} autoFocus />
                      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                        <button onClick={() => { const v = parseFloat(userInput); if (!isNaN(v)) submitAnswer(v); }}
                          className="sm-btn" style={{ ...actBtn, flex: 1, background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
                          <CheckCircle size={16} /> Submit
                        </button>
                        <button onClick={skipQuestion} className="sm-btn"
                          style={{ ...actBtn, flex: 1, background: "rgba(255,255,255,0.04)", color: "var(--os-text-dim)", border: "1px solid rgba(255,255,255,0.06)" }}>
                          <SkipForward size={16} /> Skip
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {currentQ.options?.map((opt, i) => (
                        <button key={i} onClick={() => { setSelectedOption(opt); submitAnswer(opt); }}
                          className="sm-opt"
                          style={{
                            padding: "20px 16px", borderRadius: 14,
                            border: "1.5px solid rgba(255,255,255,0.06)",
                            background: "rgba(255,255,255,0.015)",
                            color: "var(--os-text-primary)", fontSize: 22, fontWeight: 700, cursor: "pointer",
                            fontFamily: "'JetBrains Mono', monospace",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                          }}>
                        <span style={{
                          width: 24, height: 24, borderRadius: 7, fontSize: 11, fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          background: "rgba(255,255,255,0.05)", color: "var(--os-text-dim)",
                        }}>{i + 1}</span>
                        {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Feedback */}
                  {results.length > 0 && (
                    <div style={{ textAlign: "center", marginTop: 18 }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "6px 16px", borderRadius: 24, fontSize: 13, fontWeight: 600,
                        background: results[results.length - 1]?.correct ? "rgba(52,211,153,0.08)" : "rgba(239,68,68,0.08)",
                        color: results[results.length - 1]?.correct ? "#34d399" : "#f87171",
                        border: `1px solid ${results[results.length - 1]?.correct ? "rgba(52,211,153,0.12)" : "rgba(239,68,68,0.12)"}`,
                      }}>
                        {results[results.length - 1]?.correct
                          ? <><CheckCircle size={14} /> Correct!</>
                          : <><XCircle size={14} /> {results[results.length - 1]?.userAnswer === null ? "Skipped" : `Wrong — answer is ${results[results.length - 1]?.question.answer}`}</>}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============ FINISHED ============ */}
          {phase === "finished" && (
            <div style={{ padding: "32px 32px 28px", animation: "smSlide 0.35s ease" }}>
              {/* Header */}
              <div style={{ textAlign: "center", marginBottom: 28 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: "50%", margin: "0 auto 12px",
                  background: accuracy >= 80 ? "linear-gradient(135deg, #34d399, #22c55e)" : accuracy >= 50 ? "linear-gradient(135deg, #fbbf24, #f59e0b)" : "linear-gradient(135deg, #f87171, #ef4444)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: `0 8px 32px ${accuracy >= 80 ? "rgba(52,211,153,0.3)" : accuracy >= 50 ? "rgba(251,191,36,0.3)" : "rgba(248,113,113,0.3)"}`,
                }}>
                  <Trophy size={30} color="#fff" />
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--os-text-primary)", letterSpacing: -0.3 }}>
                  {accuracy >= 90 ? "Outstanding!" : accuracy >= 70 ? "Great Work!" : accuracy >= 50 ? "Not Bad!" : "Keep Practicing!"}
                </h2>
                <p style={{ fontSize: 12, color: "var(--os-text-dim)", marginTop: 4 }}>
                  {settings.operation !== "mix" ? OP[settings.operation].label : "Mixed"} · {settings.digits} digit · {settings.terms} terms · {settings.questions} questions
                </p>
              </div>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
                <ResultStat icon={<CheckCircle size={16} />} label="Correct" value={`${correctCount}/${questions.length}`} color="#34d399" />
                <ResultStat icon={<Target size={16} />} label="Accuracy" value={`${accuracy}%`} color={accuracy >= 80 ? "#34d399" : accuracy >= 50 ? "#fbbf24" : "#f87171"} />
                <ResultStat icon={<Clock size={16} />} label="Avg Time" value={`${avgTime}s`} color="#60a5fa" />
                <ResultStat icon={<Flame size={16} />} label="Best Streak" value={`${bestStreak}`} color="#fb923c" />
              </div>

              {/* Review */}
              <div style={{
                maxHeight: 300, overflowY: "auto", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.05)", marginBottom: 24,
              }}>
                <table className="sm-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ position: "sticky", top: 0, background: "rgba(10,14,24,0.95)", backdropFilter: "blur(8px)", zIndex: 2 }}>
                      {["#", "Question", "Your Answer", "", "Time"].map((h, i) => (
                        <th key={i} style={{
                          textAlign: i === 4 ? "right" : i === 0 ? "center" : "left",
                          padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)",
                          fontSize: 10, fontWeight: 700, color: "var(--os-text-dim)",
                          textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} style={{ transition: "background 0.1s" }}>
                        <td style={{ padding: "9px 12px", textAlign: "center", color: "var(--os-text-dim)", fontWeight: 600 }}>{i + 1}</td>
                        <td style={{ padding: "9px 12px", fontFamily: "'JetBrains Mono', monospace", color: "var(--os-text-secondary)", fontSize: 11 }}>
                          {r.question.expression} <span style={{ color: "var(--os-text-dim)" }}>=</span> <span style={{ color: "var(--os-text-primary)", fontWeight: 600 }}>{r.question.answer}</span>
                        </td>
                        <td style={{ padding: "9px 12px", fontFamily: "'JetBrains Mono', monospace" }}>
                          <span style={{
                            color: r.userAnswer === null ? "var(--os-text-dim)" : r.correct ? "#34d399" : "#f87171",
                            fontWeight: 600,
                          }}>{r.userAnswer ?? "—"}</span>
                        </td>
                        <td style={{ padding: "9px 12px", textAlign: "center" }}>
                          {r.correct ? <CheckCircle size={14} color="#34d399" />
                            : r.userAnswer === null ? <Minus size={14} color="var(--os-text-dim)" />
                            : <XCircle size={14} color="#f87171" />}
                        </td>
                        <td style={{ padding: "9px 12px", textAlign: "right", fontFamily: "monospace", color: "var(--os-text-dim)", fontSize: 11 }}>
                          {(r.timeMs / 1000).toFixed(1)}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={startGame} className="sm-btn"
                  style={{ ...actBtn, flex: 1, background: "linear-gradient(135deg, #7c3aed, #a855f7)", color: "#fff", boxShadow: "0 4px 16px rgba(124,58,237,0.3)" }}>
                  <RotateCcw size={16} /> Practice Again
                </button>
                <button onClick={() => setPhase("setup")} className="sm-btn"
                  style={{ ...actBtn, flex: 1, background: "rgba(255,255,255,0.04)", color: "var(--os-text-secondary)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <TrendingUp size={16} /> New Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Chips({ label, options, value, onChange }: { label: string; options: number[]; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label style={lbl}>{label}</label>
      <div style={{ display: "flex", gap: 5 }}>
        {options.map((o) => (
          <button key={o} onClick={() => onChange(o)} className="sm-chip"
            style={{
              ...chipBase, background: value === o ? "var(--os-accent)" : undefined,
              color: value === o ? "#fff" : undefined,
              borderColor: value === o ? "var(--os-accent)" : undefined,
            }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

function ResultStat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: "16px 10px", borderRadius: 14, textAlign: "center",
      background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.05)",
    }}>
      <div style={{ color, marginBottom: 8, display: "flex", justifyContent: "center", opacity: 0.8 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, fontFamily: "monospace", letterSpacing: -0.5 }}>{value}</div>
      <div style={{ fontSize: 9, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 3, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

const lbl: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: "var(--os-text-dim)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8, display: "block" };
const chipBase: React.CSSProperties = { padding: "8px 6px", borderRadius: 10, border: "1.5px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", color: "var(--os-text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 600, textAlign: "center" };
const ghostBtn: React.CSSProperties = { display: "flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, border: "none", background: "rgba(255,255,255,0.03)", color: "var(--os-text-secondary)", cursor: "pointer", fontSize: 12, fontWeight: 500 };
const actBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 18px", borderRadius: 12, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 };
const kbd: React.CSSProperties = { display: "inline-block", padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", fontSize: 10, fontFamily: "monospace", fontWeight: 700 };
