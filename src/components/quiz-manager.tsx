"use client";

import { useState, useEffect, useRef } from "react";
import { saveQuiz, loadSavedQuizzes, deleteSavedQuiz, renameSavedQuiz, updateQuizQuestions } from "@/lib/user-data";
import { MathRenderer } from "@/components/math-renderer";
import { ImageOcclusionCreator } from "@/components/image-occlusion-creator";
import { Plus, Trash2, Play, Save, Pencil, Check, X, ArrowLeft, Sparkles, Image as ImageIcon, Eye } from "lucide-react";

type View = "list" | "edit" | "take" | "results";
type QuestionType = "mc" | "identification" | "image_occlusion" | "image_answer";
type QuizMode = "mc" | "identification" | "mixed";

interface QuizQuestion {
  type: "mc" | "identification" | "image_occlusion" | "image_answer";
  question?: string;
  options?: string[];
  correct?: number;
  answer?: string;
  distractors?: string[];
  image_url?: string;
  labels?: { x: number; y: number; w: number; h: number; text: string }[];
}

interface QuizManagerProps {
  userId: string;
}

function stripOptionPrefix(opt: string): string {
  return opt.replace(/^\s*[A-Da-d]\.\s*/, "").trim();
}

export default function QuizManager({ userId }: QuizManagerProps) {
  const [view, setView] = useState<View>("list");
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState("");

  const [newQuizTitle, setNewQuizTitle] = useState("");
  const [creating, setCreating] = useState(false);

  const [addQuestionType, setAddQuestionType] = useState<QuestionType>("mc");
  const [addQuestion, setAddQuestion] = useState("");
  const [addOptions, setAddOptions] = useState(["", "", "", ""]);
  const [addCorrect, setAddCorrect] = useState(0);
  const [addAnswer, setAddAnswer] = useState("");
  const [addImageUrl, setAddImageUrl] = useState("");
  const [addLabels, setAddLabels] = useState<{ x: number; y: number; w: number; h: number; text: string }[]>([]);
  const [addDistractors, setAddDistractors] = useState(["", "", ""]);
  const [generatingDistractors, setGeneratingDistractors] = useState(false);
  const [addingQuestion, setAddingQuestion] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [quizMode, setQuizMode] = useState<QuizMode>("mc");
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [answered, setAnswered] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizStarted, setQuizStarted] = useState(false);
  const [preGeneratedOptions, setPreGeneratedOptions] = useState<Record<number, string[]>>({});
  const [generatingOptions, setGeneratingOptions] = useState(false);

  useEffect(() => {
    loadSavedQuizzes(userId).then((data) => { setQuizzes(data); setLoading(false); });
  }, [userId]);

  useEffect(() => {
    const isActive = view === "take" && quizStarted;
    if (isActive) {
      document.body.classList.add("quiz-active");
      return () => { document.body.classList.remove("quiz-active"); };
    }
  }, [view, quizStarted]);

  async function handleCreateQuiz() {
    if (!newQuizTitle.trim()) return;
    setCreating(true);
    const ok = await saveQuiz(userId, newQuizTitle.trim(), "custom", []);
    if (ok) {
      const updated = await loadSavedQuizzes(userId);
      setQuizzes(updated);
      setNewQuizTitle("");
    }
    setCreating(false);
  }

  async function handleDeleteQuiz(id: string) {
    await deleteSavedQuiz(userId, id);
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  }

  async function handleRenameQuiz(quizId: string) {
    if (!renamingTitle.trim()) return;
    await renameSavedQuiz(userId, quizId, renamingTitle.trim());
    setQuizzes((prev) => prev.map((q) => q.id === quizId ? { ...q, title: renamingTitle.trim() } : q));
    setRenamingId(null);
    setRenamingTitle("");
    if (activeQuiz?.id === quizId) setActiveQuiz((prev: any) => prev ? { ...prev, title: renamingTitle.trim() } : prev);
  }

  async function handleGenerateDistractors() {
    if (!addAnswer.trim()) return;
    setGeneratingDistractors(true);
    try {
      const res = await fetch("/api/generate-distractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: addQuestion.trim() || "", answer: addAnswer.trim() }),
      });
      const data = await res.json();
      if (data.distractors) setAddDistractors(data.distractors.slice(0, 3));
    } catch {}
    setGeneratingDistractors(false);
  }

  async function handleAddQuestion() {
    if (!activeQuiz) return;
    setAddingQuestion(true);

    let newQ: QuizQuestion;

    if (addQuestionType === "mc") {
      if (!addQuestion.trim() || addOptions.some((o) => !o.trim())) { setAddingQuestion(false); return; }
      newQ = { type: "mc", question: addQuestion.trim(), options: addOptions.map((o) => o.trim()), correct: addCorrect };
    } else if (addQuestionType === "identification") {
      if (!addQuestion.trim() || !addAnswer.trim()) { setAddingQuestion(false); return; }
      const d = addDistractors.filter((d) => d.trim());
      newQ = { type: "identification", question: addQuestion.trim(), answer: addAnswer.trim(), distractors: d.length > 0 ? d : undefined };
    } else if (addQuestionType === "image_occlusion") {
      if (!addImageUrl || addLabels.length === 0) { setAddingQuestion(false); return; }
      newQ = { type: "image_occlusion", image_url: addImageUrl, labels: addLabels };
    } else {
      if (!addImageUrl || !addQuestion.trim() || !addAnswer.trim()) { setAddingQuestion(false); return; }
      const d = addDistractors.filter((d) => d.trim());
      newQ = { type: "image_answer", image_url: addImageUrl, question: addQuestion.trim(), answer: addAnswer.trim(), distractors: d.length > 0 ? d : undefined };
    }

    const updated = [...(activeQuiz.questions || []), newQ];
    const ok = await updateQuizQuestions(userId, activeQuiz.id, updated);
    if (!ok) { alert("Failed to save question. Check console for details."); setAddingQuestion(false); return; }
    setActiveQuiz({ ...activeQuiz, questions: updated });
    setQuizzes((prev) => prev.map((q) => q.id === activeQuiz.id ? { ...q, questions: updated } : q));

    setAddQuestion("");
    setAddOptions(["", "", "", ""]);
    setAddCorrect(0);
    setAddAnswer("");
    setAddImageUrl("");
    setAddLabels([]);
    setAddDistractors(["", "", ""]);
    setAddingQuestion(false);
  }

  async function handleRemoveQuestion(index: number) {
    if (!activeQuiz) return;
    const updated = activeQuiz.questions.filter((_: any, i: number) => i !== index);
    const ok = await updateQuizQuestions(userId, activeQuiz.id, updated);
    if (!ok) return;
    setActiveQuiz({ ...activeQuiz, questions: updated });
    setQuizzes((prev) => prev.map((q) => q.id === activeQuiz.id ? { ...q, questions: updated } : q));
    if (editingIndex === index) resetAddForm();
    else if (editingIndex != null && editingIndex > index) setEditingIndex(editingIndex - 1);
  }

  function handleStartEdit(index: number) {
    if (!activeQuiz) return;
    const q = activeQuiz.questions[index];
    if (!q) return;
    setEditingIndex(index);
    setAddQuestionType(q.type || "mc");
    if (q.type === "mc") {
      setAddQuestion(q.question || "");
      setAddOptions(q.options ? [...q.options] : ["", "", "", ""]);
      setAddCorrect(typeof q.correct === "number" ? q.correct : 0);
      setAddAnswer("");
      setAddImageUrl("");
      setAddLabels([]);
      setAddDistractors(["", "", ""]);
    } else if (q.type === "identification") {
      setAddQuestion(q.question || "");
      setAddAnswer(q.answer || "");
      setAddOptions(["", "", "", ""]);
      setAddCorrect(0);
      setAddImageUrl("");
      setAddLabels([]);
      setAddDistractors(q.distractors ? [...q.distractors] : ["", "", ""]);
    } else if (q.type === "image_occlusion") {
      setAddQuestion("");
      setAddAnswer("");
      setAddOptions(["", "", "", ""]);
      setAddCorrect(0);
      setAddImageUrl(q.image_url || "");
      setAddLabels(q.labels ? q.labels.map((l) => ({ x: l.x, y: l.y, w: l.w, h: l.h, text: l.text })) : []);
      setAddDistractors(["", "", ""]);
    } else if (q.type === "image_answer") {
      setAddQuestion(q.question || "");
      setAddAnswer(q.answer || "");
      setAddOptions(["", "", "", ""]);
      setAddCorrect(0);
      setAddImageUrl(q.image_url || "");
      setAddLabels([]);
      setAddDistractors(q.distractors ? [...q.distractors] : ["", "", ""]);
    }
  }

  function resetAddForm() {
    setEditingIndex(null);
    setAddQuestionType("mc");
    setAddQuestion("");
    setAddOptions(["", "", "", ""]);
    setAddCorrect(0);
    setAddAnswer("");
    setAddImageUrl("");
    setAddLabels([]);
    setAddDistractors(["", "", ""]);
  }

  async function handleUpdateQuestion() {
    if (!activeQuiz || editingIndex == null) return;
    setAddingQuestion(true);
    let updatedQ: QuizQuestion;
    if (addQuestionType === "mc") {
      if (!addQuestion.trim() || addOptions.some((o) => !o.trim())) { setAddingQuestion(false); return; }
      updatedQ = { type: "mc", question: addQuestion.trim(), options: addOptions.map((o) => o.trim()), correct: addCorrect };
    } else if (addQuestionType === "identification") {
      if (!addQuestion.trim() || !addAnswer.trim()) { setAddingQuestion(false); return; }
      const d = addDistractors.filter((d) => d.trim());
      updatedQ = { type: "identification", question: addQuestion.trim(), answer: addAnswer.trim(), distractors: d.length > 0 ? d : undefined };
    } else if (addQuestionType === "image_occlusion") {
      if (!addImageUrl || addLabels.length === 0) { setAddingQuestion(false); return; }
      updatedQ = { type: "image_occlusion", image_url: addImageUrl, labels: addLabels };
    } else {
      if (!addImageUrl || !addQuestion.trim() || !addAnswer.trim()) { setAddingQuestion(false); return; }
      const d = addDistractors.filter((d) => d.trim());
      updatedQ = { type: "image_answer", image_url: addImageUrl, question: addQuestion.trim(), answer: addAnswer.trim(), distractors: d.length > 0 ? d : undefined };
    }
    const updated = [...(activeQuiz.questions || [])];
    updated[editingIndex] = updatedQ;
    const ok = await updateQuizQuestions(userId, activeQuiz.id, updated);
    if (!ok) { alert("Failed to save changes."); setAddingQuestion(false); return; }
    setActiveQuiz({ ...activeQuiz, questions: updated });
    setQuizzes((prev) => prev.map((q) => q.id === activeQuiz.id ? { ...q, questions: updated } : q));
    resetAddForm();
    setAddingQuestion(false);
  }

  const mcOptionsCache = useRef<Record<string, string[]>>({});

  function getMcOptionsCached(q: QuizQuestion, labelIndex?: number): string[] {
    if (q.type === "mc" && q.options) return q.options;
    const flat = flattenQuizQuestions(quizQuestions, quizMode);
    const entryIdx = flat.findIndex((e) => e.question === q && e.labelIndex === labelIndex);
    if (entryIdx !== -1 && preGeneratedOptions[entryIdx]) return preGeneratedOptions[entryIdx];
    return getMcOptions(q, labelIndex);
  }

  function flattenQuizQuestions(questions: QuizQuestion[], mode: QuizMode): { question: QuizQuestion; subIndex: number; labelIndex?: number }[] {
    const result: { question: QuizQuestion; subIndex: number; labelIndex?: number }[] = [];
    for (const q of questions) {
      if (q.type === "image_occlusion" && q.labels && q.labels.length > 0) {
        if (mode === "mc" || mode === "mixed") {
          for (let i = 0; i < q.labels.length; i++) {
            result.push({ question: q, subIndex: i, labelIndex: i });
          }
        } else {
          for (let i = 0; i < q.labels.length; i++) {
            result.push({ question: q, subIndex: i, labelIndex: i });
          }
        }
      } else {
        result.push({ question: q, subIndex: 0 });
      }
    }
    return result;
  }

  function beginQuiz() {
    setCurrentQ(0);
    setQuizAnswers({});
    setAnswered(false);
    setQuizScore(0);
    setQuizStarted(true);
    setGeneratingOptions(true);
    preGenerateAllOptions().finally(() => setGeneratingOptions(false));
  }

  async function preGenerateAllOptions() {
    const flat = flattenQuizQuestions(quizQuestions, quizMode);
    const opts: Record<number, string[]> = {};
    const needsAI: { index: number; q: QuizQuestion; labelIndex?: number; correct: string }[] = [];

    for (let i = 0; i < flat.length; i++) {
      const entry = flat[i];
      const q = entry.question;
      if (q.type === "mc" && q.options) {
        const filledOptions = q.options.filter((o: string) => o.trim().length > 0);
        if (filledOptions.length >= 3 && q.correct != null) {
          opts[i] = q.options;
          continue;
        }
        const correctIdx = getCorrectMcIndex(q.options, q, entry.labelIndex);
        const correct = q.options[correctIdx] || "";
        if (correct.trim()) needsAI.push({ index: i, q, labelIndex: entry.labelIndex, correct: correct.trim() });
        else opts[i] = q.options;
        continue;
      }
      let correct = "";
      if (q.type === "image_answer" && q.answer) correct = q.answer;
      else if (q.type === "image_occlusion" && q.labels && entry.labelIndex != null) correct = q.labels[entry.labelIndex].text;
      else if (q.type === "identification" && q.answer) correct = q.answer;
      if (!correct) { opts[i] = ["A", "B", "C", "D"]; continue; }

      let distractors: string[] = [];
      if (q.type === "image_occlusion" && q.labels && entry.labelIndex != null) {
        distractors = q.labels.filter((l, idx) => idx !== entry.labelIndex).map((l) => l.text).filter((t) => t.length > 0);
      } else if (q.distractors && q.distractors.length >= 2) {
        distractors = q.distractors.filter((d) => d.toLowerCase() !== correct.toLowerCase()).slice(0, 3);
      }

      if (distractors.length < 3) {
        needsAI.push({ index: i, q, labelIndex: entry.labelIndex, correct });
      } else {
        const d = distractors.slice(0, 3);
        const all = [...d, correct];
        for (let j = all.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [all[j], all[k]] = [all[k], all[j]]; }
        opts[i] = all;
      }
    }

    for (const item of needsAI) {
      try {
        const context = item.q.type === "image_occlusion"
          ? `This is from a diagram with these labeled parts: ${item.q.labels?.map((l) => l.text).join(", ") || "unknown"}.`
          : item.q.type === "image_answer"
          ? `Image question: ${item.q.question || "unknown"}.`
          : "";
        const res = await fetch("/api/generate-distractors", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: `${context} What is "${item.correct}"?`, answer: item.correct }),
        });
        const data = await res.json();
        const d = (data.distractors || []).filter((x: string) => x.toLowerCase() !== item.correct.toLowerCase()).slice(0, 3);
        while (d.length < 3) d.push(`Option ${d.length + 1}`);
        const all = [...d, item.correct];
        for (let j = all.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [all[j], all[k]] = [all[k], all[j]]; }
        opts[item.index] = all;
      } catch {
        const d = [`Similar term`, `Related concept`, `Often confused`].filter((x) => x.toLowerCase() !== item.correct.toLowerCase()).slice(0, 3);
        while (d.length < 3) d.push(`Option ${d.length + 1}`);
        const all = [...d, item.correct];
        for (let j = all.length - 1; j > 0; j--) { const k = Math.floor(Math.random() * (j + 1)); [all[j], all[k]] = [all[k], all[j]]; }
        opts[item.index] = all;
      }
    }

    setPreGeneratedOptions(opts);
  }

  function getMcOptions(q: QuizQuestion, labelIndex?: number): string[] {
    if (q.type === "mc" && q.options) return q.options;
    let correct = "";
    if (q.type === "image_answer" && q.answer) correct = q.answer;
    else if (q.type === "image_occlusion" && q.labels && labelIndex != null) correct = q.labels[labelIndex].text;
    else if (q.type === "identification" && q.answer) correct = q.answer;
    if (!correct) return ["Option A", "Option B", "Option C", "Option D"];

    let distractors: string[] = [];

    if (q.type === "image_occlusion" && q.labels && labelIndex != null) {
      distractors = q.labels.filter((l, i) => i !== labelIndex).map((l) => l.text);
    } else if (q.distractors && q.distractors.length >= 2) {
      distractors = q.distractors.filter((d) => d.toLowerCase() !== correct.toLowerCase()).slice(0, 3);
    }

    distractors = distractors.filter((d) => d.length > 0 && d.toLowerCase() !== correct.toLowerCase());
    while (distractors.length < 3) {
      distractors.push(`Other label ${distractors.length + 1}`);
    }

    const opts = [...distractors.slice(0, 3), correct];
    for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
    return opts;
  }

  function getCorrectMcIndex(options: string[], q: QuizQuestion, labelIndex?: number): number {
    if (q.type === "mc") {
      const c = q.correct;
      if (c == null) return 0;
      const cs = String(c).trim();
      if (/^[0-3]$/.test(cs)) return parseInt(cs);
      if (cs.length === 1) {
        const code = cs.toUpperCase().charCodeAt(0);
        if (code >= 65 && code <= 68) return code - 65;
      }
      const stripped = cs.replace(/^\s*[A-Da-d]\.\s*/, "").trim().toLowerCase();
      for (let i = 0; i < options.length; i++) {
        const optText = (options[i] || "").replace(/^\s*[A-Da-d]\.\s*/, "").trim().toLowerCase();
        if (optText === stripped || optText.includes(stripped) || stripped.includes(optText)) return i;
      }
      return 0;
    }
    let correctAnswer = "";
    if (q.type === "image_answer") correctAnswer = q.answer || "";
    else if (q.type === "image_occlusion" && q.labels && labelIndex != null) correctAnswer = q.labels[labelIndex].text;
    else if (q.type === "identification") correctAnswer = q.answer || "";
    return options.findIndex((o) => o.toLowerCase() === correctAnswer.toLowerCase());
  }

  function getQuestionText(q: QuizQuestion, labelIndex?: number): string {
    if (q.type === "image_occlusion") {
      return `What is the label at position ${(labelIndex ?? 0) + 1}?`;
    }
    if (q.type === "image_answer") return q.question || "What does this image show?";
    return q.question || "";
  }

  function isMcForQuestion(q: QuizQuestion, mode: QuizMode): boolean {
    if (mode === "mc") return true;
    if (mode === "identification") return false;
    if (mode === "mixed") {
      if (q.type === "mc") return true;
      if (q.type === "image_answer" || q.type === "image_occlusion") return true;
      return false;
    }
    return true;
  }

  function getCorrectText(q: QuizQuestion, labelIndex?: number): string {
    if (q.type === "mc" && q.options) return q.options[getCorrectMcIndex(q.options, q)] || "";
    if (q.type === "identification") return q.answer || "";
    if (q.type === "image_occlusion" && q.labels && labelIndex != null) return q.labels[labelIndex].text;
    if (q.type === "image_answer") return q.answer || "";
    return "";
  }

  function checkAnswer(flatIndex: number, answer: string) {
    const flat = flattenQuizQuestions(quizQuestions, quizMode);
    const entry = flat[flatIndex];
    if (!entry) return false;

    const asMc = isMcForQuestion(entry.question, quizMode);

    if (asMc) {
      if (entry.question.type === "mc" && entry.question.options) {
        const correctIdx = getCorrectMcIndex(entry.question.options, entry.question);
        return answer === String(correctIdx);
      }
      const options = getMcOptionsCached(entry.question, entry.labelIndex);
      const correctIdx = getCorrectMcIndex(options, entry.question, entry.labelIndex);
      return answer === String(correctIdx);
    }

    const correct = getCorrectText(entry.question, entry.labelIndex);
    const strip = (s: string) => s.toLowerCase().trim().replace(/^\s*[a-d]\.\s*/, "");
    return strip(answer) === strip(correct);
  }

  function finishQuiz() {
    const flat = flattenQuizQuestions(quizQuestions, quizMode);
    let s = 0;
    flat.forEach((_, i) => {
      if (quizAnswers[i] != null && checkAnswer(i, quizAnswers[i])) s++;
    });
    setQuizScore(s);
    setView("results");
  }

  if (loading) return <p className="text-secondary" style={{ textAlign: "center", padding: 32 }}>Loading quizzes...</p>;

  if (view === "list") {
    return (
      <div style={{ maxWidth: 672, margin: "0 auto", padding: "0 16px" }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: 1 }}>
              <input
                value={newQuizTitle}
                onChange={(e) => setNewQuizTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateQuiz(); }}
                placeholder="New quiz title..."
                className="glass-input"
                style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
              />
            </div>
            <button
              onClick={handleCreateQuiz}
              disabled={!newQuizTitle.trim() || creating}
              className="glass-btn glass-btn-primary"
              style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, flexShrink: 0 }}
            >
              <Plus size={14} /> Create Quiz
            </button>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <div className="empty-state" style={{ padding: "48px 0" }}>
            <Sparkles style={{ width: 48, height: 48, color: "var(--os-accent)", marginBottom: 16 }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Create Your First Quiz</h2>
            <p className="text-secondary">Create quizzes manually with MC, ID, Image Occlusion, and Image+Answer questions</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {quizzes.map((q) => {
              const isRenaming = renamingId === q.id;
              return (
                <div key={q.id} className="glass-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isRenaming ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input autoFocus className="glass-input" value={renamingTitle} onChange={(e) => setRenamingTitle(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") handleRenameQuiz(q.id); if (e.key === "Escape") { setRenamingId(null); setRenamingTitle(""); } }}
                          style={{ flex: 1, padding: "4px 8px", fontSize: 13 }} />
                        <button onClick={() => handleRenameQuiz(q.id)} style={{ background: "var(--os-accent)", border: "none", borderRadius: 4, color: "#fff", padding: "4px 8px", cursor: "pointer", fontSize: 12 }}><Check size={12} /></button>
                        <button onClick={() => { setRenamingId(null); setRenamingTitle(""); }} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 4, color: "var(--os-text-secondary)", padding: "4px 8px", cursor: "pointer", fontSize: 12 }}><X size={12} /></button>
                      </div>
                    ) : (
                      <>
                        <p style={{ fontWeight: 500, fontSize: 14, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.title}</p>
                        <p className="text-xs text-secondary" style={{ marginTop: 2 }}>
                          {q.questions?.length || 0} questions
                          {q.questions?.some((qq: QuizQuestion) => qq.type === "image_occlusion" || qq.type === "image_answer") ? " · images" : ""}
                        </p>
                      </>
                    )}
                  </div>
                  <button onClick={() => { setActiveQuiz(q); setView("edit"); }} className="glass-btn" style={{ padding: "6px 12px", fontSize: 12, flexShrink: 0, display: "flex", alignItems: "center", gap: 4 }}>
                    <Pencil size={12} /> Edit
                  </button>
                  <button onClick={() => { setActiveQuiz(q); setView("take"); setQuizQuestions(q.questions || []); setQuizStarted(false); }}
                    disabled={!q.questions?.length}
                    className="glass-btn glass-btn-primary" style={{ padding: "6px 12px", fontSize: 12, flexShrink: 0, display: "flex", alignItems: "center", gap: 4, opacity: q.questions?.length ? 1 : 0.4 }}>
                    <Play size={12} /> Take
                  </button>
                  {!isRenaming && (
                    <button onClick={() => { setRenamingId(q.id); setRenamingTitle(q.title); }} style={{ padding: 4, borderRadius: 4, color: "var(--os-text-secondary)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }} title="Rename">
                      <Pencil size={14} />
                    </button>
                  )}
                  {!isRenaming && (
                    <button onClick={() => handleDeleteQuiz(q.id)} style={{ padding: 4, borderRadius: 4, color: "var(--os-text-secondary)", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (view === "edit" && activeQuiz) {
    return (
      <div style={{ maxWidth: 672, margin: "0 auto", padding: "0 16px" }}>
        <button onClick={() => setView("list")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--os-text-secondary)", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>
          <ArrowLeft size={14} /> Back to My Quizzes
        </button>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4 }}>{activeQuiz.title}</h2>
        <p className="text-sm text-secondary" style={{ marginBottom: 20 }}>{activeQuiz.questions?.length || 0} questions</p>

        {activeQuiz.questions?.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
            {activeQuiz.questions.map((q: QuizQuestion, i: number) => (
              <div key={i} className="glass-card" style={{ display: "flex", alignItems: "center", gap: 10, padding: 12, border: editingIndex === i ? "1px solid rgba(109,40,217,0.4)" : undefined, background: editingIndex === i ? "rgba(109,40,217,0.06)" : undefined }}>
                {q.image_url && (
                  <img src={q.image_url} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8, flexShrink: 0, background: "#0a0e18" }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "var(--os-accent)" }}>{i + 1}.</span>
                    <span style={{
                      fontSize: 10, padding: "2px 6px", borderRadius: 9999, fontWeight: 500,
                      background: q.type === "mc" ? "rgba(59,130,246,0.1)" : q.type === "identification" ? "rgba(168,85,247,0.1)" : q.type === "image_occlusion" ? "rgba(234,179,8,0.1)" : "rgba(34,197,94,0.1)",
                      color: q.type === "mc" ? "#2563eb" : q.type === "identification" ? "#9333ea" : q.type === "image_occlusion" ? "#ca8a04" : "#16a34a",
                    }}>
                      {q.type === "mc" ? "MC" : q.type === "identification" ? "ID" : q.type === "image_occlusion" ? "Occlusion" : "Image+A"}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "var(--os-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {q.type === "image_occlusion" ? `${q.labels?.length || 0} labels` : q.question || "No question"}
                  </p>
                  {q.type === "mc" && q.options && (
                    <p className="text-xs text-secondary" style={{ marginTop: 2 }}>{q.options.map((o, j) => `${String.fromCharCode(65 + j)}. ${stripOptionPrefix(o)}`).join(" | ")}</p>
                  )}
                  {q.type === "identification" && q.answer && <p className="text-xs text-secondary" style={{ marginTop: 2 }}>Answer: {q.answer}</p>}
                  {q.type === "image_answer" && q.answer && <p className="text-xs text-secondary" style={{ marginTop: 2 }}>Answer: {q.answer}</p>}
                </div>
                <div style={{ display: "flex", gap: 2, flexShrink: 0 }}>
                  <button onClick={() => handleStartEdit(i)} style={{ padding: 4, borderRadius: 4, color: "var(--os-accent)", background: editingIndex === i ? "rgba(109,40,217,0.15)" : "none", border: "none", cursor: "pointer" }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleRemoveQuestion(i)} style={{ padding: 4, borderRadius: 4, color: "#ef4444", background: "none", border: "none", cursor: "pointer" }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="glass-panel" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--os-text-primary)", marginBottom: 12 }}>{editingIndex != null ? `Edit Question ${editingIndex + 1}` : "Add Question"}</h3>

          <div style={{ display: "flex", gap: 4, marginBottom: 16, border: "1px solid rgba(255,255,255,0.35)", borderRadius: 10, padding: 3, background: "rgba(255,255,255,0.03)" }}>
            {([
              ["mc", "MC"],
              ["identification", "ID"],
              ["image_occlusion", "Image Occlusion"],
              ["image_answer", "Image + Answer"],
            ] as const).map(([t, label]) => (
              <button key={t} onClick={() => setAddQuestionType(t)}
                style={{
                  flex: 1, padding: "7px 10px", borderRadius: 8, fontSize: 11, fontWeight: 500, cursor: "pointer", transition: "all 0.15s", textAlign: "center",
                  background: addQuestionType === t ? "var(--os-accent)" : "transparent",
                  color: addQuestionType === t ? "#fff" : "var(--os-text-secondary)",
                  border: addQuestionType === t ? "1px solid var(--os-accent)" : "1px solid transparent",
                }}>
                {label}
              </button>
            ))}
          </div>

          {addQuestionType === "image_occlusion" ? (
            <div>
              <p className="text-xs text-secondary" style={{ marginBottom: 8 }}>Upload an image and add labels. Each label becomes a question in the quiz.</p>
              <ImageOcclusionCreator
                onGenerate={(cards) => {
                  if (cards && cards.length > 0 && cards[0].labels) {
                    setAddLabels(cards[0].labels.map((l) => ({ x: l.x, y: l.y, w: l.w, h: l.h, text: l.text })));
                    if (cards[0].image_url) setAddImageUrl(cards[0].image_url);
                  }
                }}
                onCancel={() => {}}
              />
              {addLabels.length > 0 && (
                <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
                  <p className="text-xs text-secondary" style={{ marginBottom: 4 }}>Labels ({addLabels.length}):</p>
                  {addLabels.map((l, i) => (
                    <div key={i} className="text-xs" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ color: "var(--os-accent)", fontWeight: 600 }}>{i + 1}.</span>
                      <span style={{ color: "var(--os-text-primary)" }}>{l.text}</span>
                      <button onClick={() => setAddLabels((prev) => prev.filter((_, j) => j !== i))} style={{ color: "#ef4444", background: "none", border: "none", cursor: "pointer", padding: 0, fontSize: 11 }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : addQuestionType === "image_answer" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-primary)", display: "block", marginBottom: 6 }}>Image</label>
                <label className="glass-btn" style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", cursor: "pointer", borderStyle: "dashed", fontSize: 13 }}>
                  <ImageIcon size={14} /> {addImageUrl ? "Change Image" : "Upload Image"}
                  <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => setAddImageUrl(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }} />
                </label>
                {addImageUrl && <img src={addImageUrl} style={{ marginTop: 8, maxWidth: "100%", maxHeight: 200, borderRadius: 8, objectFit: "contain" }} />}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-primary)", display: "block", marginBottom: 6 }}>Question</label>
                <input value={addQuestion} onChange={(e) => setAddQuestion(e.target.value)} placeholder="What does this image show?" className="glass-input" style={{ width: "100%", padding: "8px 12px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-primary)", display: "block", marginBottom: 6 }}>Answer</label>
                <input value={addAnswer} onChange={(e) => setAddAnswer(e.target.value)} placeholder="Correct answer" className="glass-input" style={{ width: "100%", padding: "8px 12px", fontSize: 13 }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-primary)" }}>Wrong Choices (for MC mode)</label>
                  <button onClick={handleGenerateDistractors} disabled={generatingDistractors || !addAnswer.trim()}
                    style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(109,40,217,0.15)", color: "#a78bfa", border: "1px solid rgba(109,40,217,0.3)", cursor: generatingDistractors || !addAnswer.trim() ? "not-allowed" : "pointer" }}>
                    {generatingDistractors ? "Generating..." : "Generate with AI"}
                  </button>
                </div>
                {addDistractors.map((d, i) => (
                  <input key={i} value={d} onChange={(e) => { const next = [...addDistractors]; next[i] = e.target.value; setAddDistractors(next); }}
                    placeholder={`Wrong choice ${i + 1}`} className="glass-input" style={{ width: "100%", padding: "6px 10px", fontSize: 12, marginBottom: 4 }} />
                ))}
              </div>
            </div>
          ) : addQuestionType === "mc" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-primary)", display: "block", marginBottom: 6 }}>Question</label>
                <input value={addQuestion} onChange={(e) => setAddQuestion(e.target.value)} placeholder="Enter your question..." className="glass-input" style={{ width: "100%", padding: "8px 12px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-primary)", display: "block", marginBottom: 6 }}>Options (click circle to mark correct)</label>
                {addOptions.map((opt, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <button onClick={() => setAddCorrect(i)} style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0, cursor: "pointer",
                      background: addCorrect === i ? "var(--os-accent)" : "rgba(255,255,255,0.06)",
                      border: `2px solid ${addCorrect === i ? "var(--os-accent)" : "rgba(255,255,255,0.2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s",
                    }}>
                      {addCorrect === i && <Check size={10} color="#fff" />}
                    </button>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-secondary)", width: 16, flexShrink: 0 }}>{String.fromCharCode(65 + i)}.</span>
                    <input value={opt} onChange={(e) => { const next = [...addOptions]; next[i] = e.target.value; setAddOptions(next); }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`} className="glass-input" style={{ flex: 1, padding: "6px 10px", fontSize: 13 }} />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-primary)", display: "block", marginBottom: 6 }}>Question</label>
                <input value={addQuestion} onChange={(e) => setAddQuestion(e.target.value)} placeholder="Enter your question..." className="glass-input" style={{ width: "100%", padding: "8px 12px", fontSize: 13 }} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-primary)", display: "block", marginBottom: 6 }}>Answer</label>
                <input value={addAnswer} onChange={(e) => setAddAnswer(e.target.value)} placeholder="Correct answer" className="glass-input" style={{ width: "100%", padding: "8px 12px", fontSize: 13 }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <label style={{ fontSize: 12, fontWeight: 500, color: "var(--os-text-primary)" }}>Wrong Choices (for MC mode)</label>
                  <button onClick={handleGenerateDistractors} disabled={generatingDistractors || !addAnswer.trim()}
                    style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(109,40,217,0.15)", color: "#a78bfa", border: "1px solid rgba(109,40,217,0.3)", cursor: generatingDistractors || !addAnswer.trim() ? "not-allowed" : "pointer" }}>
                    {generatingDistractors ? "Generating..." : "Generate with AI"}
                  </button>
                </div>
                {addDistractors.map((d, i) => (
                  <input key={i} value={d} onChange={(e) => { const next = [...addDistractors]; next[i] = e.target.value; setAddDistractors(next); }}
                    placeholder={`Wrong choice ${i + 1}`} className="glass-input" style={{ width: "100%", padding: "6px 10px", fontSize: 12, marginBottom: 4 }} />
                ))}
              </div>
            </div>
          )}

          {addQuestionType !== "image_occlusion" && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={editingIndex != null ? handleUpdateQuestion : handleAddQuestion} disabled={addingQuestion}
                className="glass-btn glass-btn-primary"
                style={{ flex: 1, padding: "10px", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {editingIndex != null ? <><Check size={14} /> Save Changes</> : <><Plus size={14} /> Add Question</>}
              </button>
              {editingIndex != null && (
                <button onClick={resetAddForm} className="glass-btn" style={{ padding: "10px 16px", fontSize: 13 }}>Cancel</button>
              )}
            </div>
          )}
          {addQuestionType === "image_occlusion" && addLabels.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button onClick={editingIndex != null ? handleUpdateQuestion : handleAddQuestion} disabled={addingQuestion}
                className="glass-btn glass-btn-primary"
                style={{ flex: 1, padding: "10px", fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                {editingIndex != null ? <><Check size={14} /> Save Changes</> : <><Plus size={14} /> Add {addLabels.length} Labels as Questions</>}
              </button>
              {editingIndex != null && (
                <button onClick={resetAddForm} className="glass-btn" style={{ padding: "10px 16px", fontSize: 13 }}>Cancel</button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (view === "take" && activeQuiz) {
    const flat = flattenQuizQuestions(quizQuestions, quizMode);
    const totalQ = flat.length;

    if (!quizStarted) {
      return (
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "0 16px" }}>
          <button onClick={() => setView("edit")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--os-text-secondary)", background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>
            <ArrowLeft size={14} /> Back to Editor
          </button>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--os-text-primary)", marginBottom: 4 }}>{activeQuiz.title}</h2>
          <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>
            {totalQ} question{totalQ !== 1 ? "s" : ""} ({quizQuestions.length} original)
          </p>

          <div className="glass-panel" style={{ padding: 20, marginBottom: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--os-text-primary)", marginBottom: 12 }}>Study Mode</p>
            <div style={{ display: "flex", gap: 4, border: "1px solid rgba(255,255,255,0.35)", borderRadius: 10, padding: 3, background: "rgba(255,255,255,0.03)" }}>
              {([
                ["mc", "MC"],
                ["identification", "ID"],
                ["mixed", "Mixed"],
              ] as const).map(([t, label]) => (
                <button key={t} onClick={() => setQuizMode(t)}
                  style={{
                    flex: 1, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", textAlign: "center",
                    background: quizMode === t ? "var(--os-accent)" : "transparent",
                    color: quizMode === t ? "#fff" : "var(--os-text-secondary)",
                    border: quizMode === t ? "1px solid var(--os-accent)" : "1px solid transparent",
                  }}>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-secondary" style={{ marginTop: 8 }}>
              {quizMode === "mc" && "All questions become Multiple Choice. Image Occlusion = one MC per label. Image+Answer = MC with generated choices."}
              {quizMode === "identification" && "All questions become type-in. Image Occlusion = type each label."}
              {quizMode === "mixed" && "Each question keeps its original type."}
            </p>
          </div>

          <button onClick={() => { beginQuiz(); }} disabled={generatingOptions}
            className="glass-btn glass-btn-primary"
            style={{ width: "100%", padding: "12px", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: generatingOptions ? 0.6 : 1 }}>
            {generatingOptions ? "Generating choices..." : <><Play size={16} /> Start Quiz ({totalQ} questions)</>}
          </button>
        </div>
      );
    }

    if (view === "take" && quizStarted) {
      if (currentQ >= totalQ) {
        finishQuiz();
        return null;
      }

      const entry = flat[currentQ];
      if (!entry) return null;
      const q = entry.question;
      const finalShowMc = isMcForQuestion(q, quizMode);

      const userAnswer = quizAnswers[currentQ];
      const qText = getQuestionText(q, entry.labelIndex);

      return (
        <div style={{ maxWidth: 672, margin: "0 auto", padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <span className="text-sm text-secondary">Question {currentQ + 1} of {totalQ}</span>
            <div style={{ height: 8, flex: 1, marginLeft: 16, marginRight: 16, background: "rgba(255,255,255,0.06)", borderRadius: 9999, overflow: "hidden" }}>
              <div style={{ height: "100%", background: "var(--os-accent)", transition: "all 0.3s", width: `${((currentQ + 1) / totalQ) * 100}%` }} />
            </div>
          </div>

          {q.image_url && (
            <div style={{ marginBottom: 16, position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
              <img src={q.image_url} style={{ width: "100%", maxHeight: 400, objectFit: "contain", background: "#0a0e18", display: "block" }} />
              {q.type === "image_occlusion" && q.labels && q.labels.map((label, li) => (
                <div key={li} style={{
                  position: "absolute",
                  left: `${label.x}%`, top: `${label.y}%`,
                  width: `${label.w}%`, height: `${label.h}%`,
                  background: li === entry.labelIndex ? "#6d28d9" : "#7c3aed",
                  border: li === entry.labelIndex ? "2px solid #8b5cf6" : "1px solid #6d28d9",
                  borderRadius: 4,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.3s ease",
                }}>
                  {li !== entry.labelIndex && <span style={{ fontSize: 11, fontWeight: 700, color: "#e9d5ff", background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: 4 }}>{li + 1}</span>}
                  {li === entry.labelIndex && <span style={{ fontSize: 11, fontWeight: 700, color: "#e9d5ff", background: "rgba(0,0,0,0.5)", padding: "2px 6px", borderRadius: 4 }}>{li + 1}</span>}
                </div>
              ))}
            </div>
          )}

          <div className="glass-panel" style={{ padding: 20, marginBottom: 20 }}>
            <span style={{
              display: "inline-block", fontSize: 11, padding: "3px 8px", borderRadius: 9999, marginBottom: 8, fontWeight: 500,
              background: q.type === "mc" ? "rgba(59,130,246,0.1)" : q.type === "identification" ? "rgba(168,85,247,0.1)" : q.type === "image_occlusion" ? "rgba(234,179,8,0.1)" : "rgba(34,197,94,0.1)",
              color: q.type === "mc" ? "#2563eb" : q.type === "identification" ? "#9333ea" : q.type === "image_occlusion" ? "#ca8a04" : "#16a34a",
            }}>
              {finalShowMc ? "Multiple Choice" : "Type your answer"}
              {q.type === "image_occlusion" && entry.labelIndex != null ? ` · Label ${entry.labelIndex + 1}` : ""}
            </span>
            <p style={{ fontSize: 18, fontWeight: 500, color: "var(--os-text-primary)", marginTop: 4 }}><MathRenderer content={qText} /></p>
          </div>

          {finalShowMc ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
              {getMcOptionsCached(q, entry.labelIndex).map((opt, j) => {
                const isChosen = userAnswer === String(j);
                const isCorrectOpt = j === getCorrectMcIndex(getMcOptionsCached(q, entry.labelIndex), q, entry.labelIndex);
                let bg = "transparent";
                let border = "rgba(255,255,255,0.35)";
                let shadow = "none";
                let txtColor = "var(--os-text-primary)";

                if (answered) {
                  if (isCorrectOpt) { bg = "rgba(34,197,94,0.1)"; border = "#16a34a"; shadow = "0 0 0 2px rgba(34,197,94,0.3)"; txtColor = "#16a34a"; }
                  else if (isChosen && !isCorrectOpt) { bg = "rgba(239,68,68,0.1)"; border = "#ef4444"; shadow = "0 0 0 2px rgba(239,68,68,0.3)"; txtColor = "#ef4444"; }
                } else if (isChosen) {
                  bg = "rgba(59,130,246,0.05)"; border = "var(--os-accent)"; shadow = "0 0 0 2px var(--os-accent)";
                }

                return (
                  <button key={j} onClick={() => { if (!answered) { setQuizAnswers((prev) => ({ ...prev, [currentQ]: String(j) })); setAnswered(true); } }}
                    disabled={answered}
                    className="glass-card" style={{
                      width: "100%", textAlign: "left", padding: "14px 16px", transition: "all 0.2s",
                      borderColor: border, background: bg, boxShadow: shadow, cursor: answered ? "default" : "pointer",
                      opacity: answered && !isCorrectOpt && !isChosen ? 0.5 : 1,
                    }}>
                    <span style={{ fontWeight: 500, marginRight: 10, color: txtColor }}>{String.fromCharCode(65 + j)}.</span>
                    <span style={{ color: txtColor }}><MathRenderer content={stripOptionPrefix(opt)} /></span>
                    {answered && isCorrectOpt && <span style={{ marginLeft: 8, color: "#16a34a" }}>✓</span>}
                    {answered && isChosen && !isCorrectOpt && <span style={{ marginLeft: 8, color: "#ef4444" }}>✗</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ marginBottom: 24 }}>
              <input type="text" value={userAnswer || ""} onChange={(e) => { if (!answered) setQuizAnswers((prev) => ({ ...prev, [currentQ]: e.target.value })); }}
                onKeyDown={(e) => { if (e.key === "Enter" && userAnswer?.trim()) setAnswered(true); }}
                placeholder="Type your answer..." className="glass-input" style={{ width: "100%", fontSize: 16, padding: "12px 16px" }}
                disabled={answered} autoFocus />
              {answered && (() => {
                const rawCorrect = getCorrectText(q, entry.labelIndex);
                const correct = rawCorrect.replace(/^\s*[A-Da-d]\.\s*/, "").trim();
                const userNorm = (userAnswer || "").toLowerCase().trim().replace(/^\s*[A-Da-d]\.\s*/, "");
                const isCorrect = userNorm === correct.toLowerCase();
                return (
                  <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: isCorrect ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)", border: `1px solid ${isCorrect ? "#16a34a" : "#ef4444"}` }}>
                    <p style={{ fontSize: 13, color: isCorrect ? "#16a34a" : "#ef4444", fontWeight: 500 }}>
                      {isCorrect ? "✓ Correct!" : `✗ Correct answer: ${correct}`}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button onClick={() => {
              if (!answered) { setAnswered(true); }
              else { setCurrentQ((prev) => prev + 1); setAnswered(false); }
            }} className="glass-btn-primary" style={{ padding: "8px 24px" }}>
              {!answered ? "Check" : currentQ === totalQ - 1 ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      );
    }

    return null;
  }

  if (view === "results") {
    const flat = flattenQuizQuestions(quizQuestions, quizMode);
    const totalQ = flat.length;
    const pct = totalQ > 0 ? Math.round((quizScore / totalQ) * 100) : 0;

    return (
      <div style={{ maxWidth: 672, margin: "0 auto", padding: "0 16px" }}>
        <div className="empty-state" style={{ marginBottom: 32 }}>
          <Sparkles style={{ width: 64, height: 64, color: "var(--os-accent)", marginBottom: 16 }} />
          <h2 style={{ fontSize: 30, fontWeight: 700, marginBottom: 8 }}>Quiz Complete!</h2>
          <p style={{ fontSize: 48, fontWeight: 700, color: "var(--os-accent)", marginBottom: 16 }}>{quizScore}/{totalQ}</p>
          <p className="text-secondary" style={{ marginBottom: 24 }}>
            {pct === 100 ? "Perfect score!" : pct >= 80 ? "Great job!" : pct >= 50 ? "Good effort!" : "Keep studying!"}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={() => { setQuizStarted(false); }} className="glass-btn-primary" style={{ padding: "8px 24px" }}>Try Again</button>
            <button onClick={() => setView("list")} className="glass-btn" style={{ padding: "8px 24px" }}>Back to Quizzes</button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
          <h3 style={{ fontWeight: 600, fontSize: 16, color: "var(--os-text-primary)" }}>Review Answers</h3>
          {flat.map((entry, i) => {
            const q = entry.question;
            const userAns = quizAnswers[i] || "";
            const isCorrect = checkAnswer(i, userAns);

            let userDisplay = userAns;
            let correctDisplay = "";
            if (isMcForQuestion(q, quizMode)) {
              const opts = getMcOptionsCached(q, entry.labelIndex);
              const ci = getCorrectMcIndex(opts, q, entry.labelIndex);
              correctDisplay = opts[ci] || "";
              const ui = parseInt(userAns);
              userDisplay = !isNaN(ui) && opts[ui] ? opts[ui] : userAns;
            } else {
              correctDisplay = getCorrectText(q, entry.labelIndex);
            }

            return (
              <div key={i} className="glass-card" style={{
                borderColor: isCorrect ? "rgba(34,197,94,0.5)" : "rgba(239,68,68,0.5)",
                background: isCorrect ? "rgba(34,197,94,0.05)" : "rgba(239,68,68,0.05)",
                padding: 14,
              }}>
                <p style={{ fontWeight: 500, fontSize: 13, marginBottom: 6, color: "var(--os-text-primary)" }}>
                  {i + 1}. <MathRenderer content={getQuestionText(q, entry.labelIndex)} />
                </p>
                <div style={{ marginLeft: 16 }}>
                  <p style={{ fontSize: 12, color: isCorrect ? "#16a34a" : "#dc2626" }}>Your answer: {userDisplay || "(none)"}</p>
                  {!isCorrect && <p style={{ fontSize: 12, color: "#16a34a" }}>Correct: {correctDisplay}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
