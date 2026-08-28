"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadCustomContent, deleteReviewer, loadReviewersFromSupabase, deleteReviewerFromSupabase, saveReviewerToSupabase } from "@/lib/custom-content";
import { getSupabase } from "@/lib/supabase";
import { useCourses } from "@/hooks/use-db";
import { Brain, Trash2, PenTool, Sparkles, Upload, FileText, BookOpen, ChevronDown } from "lucide-react";

type Tab = "flashcards" | "quiz";

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

      // Always load from localStorage
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Study</h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 flex items-center gap-3">
        <PenTool className="h-7 w-7" /> Study
      </h1>

      {/* Tabs */}
      <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/50 mb-6 w-fit">
        <button
          onClick={() => setTab("flashcards")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "flashcards" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Brain className="h-4 w-4" /> Flashcards
        </button>
        <button
          onClick={() => setTab("quiz")}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === "quiz" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" /> Quiz
        </button>
      </div>

      {tab === "flashcards" && (
        <FlashcardsTab
          allReviewers={allReviewers}
          userId={userId}
          onDelete={(target) => setDeleteTarget(target)}
        />
      )}

      {tab === "quiz" && <QuizTab />}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card border rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Deck?</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Are you sure you want to delete &quot;{deleteTarget.title}&quot;? This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
              >
                Delete
              </button>
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
  if (allReviewers.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No flashcard decks yet.</p>
        <Link
          href="/tools/pdf-to-flashcards"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm"
        >
          <Upload className="h-4 w-4" /> Generate from PDF
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Array.from(new Set(allReviewers.map((r) => r.courseId))).map((courseId) => {
        const courseReviewers = allReviewers.filter((r) => r.courseId === courseId);
        return (
          <div key={courseId}>
            <h2 className="text-lg font-semibold mb-3">{courseId}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {courseReviewers.map(({ courseId: cid, moduleId, reviewer }) => (
                <div
                  key={reviewer.id}
                  className="relative p-4 rounded-lg border bg-card hover:shadow-lg transition-all group"
                >
                  <Link href={`/flashcards/${reviewer.id}`} className="block">
                    <h3 className="font-medium group-hover:text-primary transition-colors">
                      {reviewer.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">{moduleId}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {reviewer.cards?.length || 0} cards
                    </p>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete({ courseId: cid, moduleId, reviewerId: reviewer.id, title: reviewer.title });
                    }}
                    className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete deck"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function QuizTab() {
  const { courses, loading: coursesLoading } = useCourses();
  const [inputText, setInputText] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [numQuestions, setNumQuestions] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  // Course/module selection
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedSource, setSelectedSource] = useState<"text" | "course">("text");
  const [courseContent, setCourseContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);

  const selectedCourseData = courses.find((c) => c.id === selectedCourse);
  const selectedModuleData = selectedCourseData?.modules?.find((m: any) => m.id === selectedModule);

  // Load content from selected module
  useEffect(() => {
    if (selectedSource !== "course" || !selectedCourse || !selectedModule) {
      setCourseContent("");
      return;
    }
    (async () => {
      setLoadingContent(true);
      try {
        const supabase = getSupabase();
        // Load notes
        const { data: notes } = await supabase
          .from("notes")
          .select("title, content")
          .eq("course_id", selectedCourse)
          .eq("module_id", selectedModule);

        // Load module content
        const { data: contents } = await supabase
          .from("module_content")
          .select("title, content")
          .eq("course_id", selectedCourse)
          .eq("module_id", selectedModule);

        // Load flashcards
        const customContent = loadCustomContent();
        const customCourse = customContent.courses.find((c) => c.id === selectedCourse);
        const customModule = customCourse?.modules.find((m) => m.id === selectedModule);
        const flashcardTexts = (customModule?.reviewers || []).flatMap((r: any) =>
          (r.cards || []).map((c: any) => `Q: ${c.front}\nA: ${c.back}`)
        );

        let allText = "";
        if (notes?.length) allText += notes.map((n: any) => `${n.title}\n${n.content || ""}`).join("\n\n") + "\n\n";
        if (contents?.length) allText += contents.map((c: any) => `${c.title}\n${c.content || ""}`).join("\n\n") + "\n\n";
        if (flashcardTexts.length) allText += "Flashcards:\n" + flashcardTexts.join("\n");

        setCourseContent(allText.trim());
      } catch {
        setCourseContent("");
      } finally {
        setLoadingContent(false);
      }
    })();
  }, [selectedCourse, selectedModule, selectedSource]);

  async function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    setPdfFile(file);
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract-pdf", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to extract PDF");
      setInputText(data.text);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  async function generateQuiz() {
    const textToUse = selectedSource === "course" ? courseContent : inputText;
    if (!textToUse.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToUse, numQuestions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate quiz");
      setQuizQuestions(data.questions);
      setQuizStarted(true);
      setCurrentQ(0);
      setAnswers({});
      setShowResults(false);
      setScore(0);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  }

  function answerQuestion(answer: string) {
    setAnswers((prev) => ({ ...prev, [currentQ]: answer }));
  }

  function nextQuestion() {
    if (currentQ < quizQuestions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      let s = 0;
      quizQuestions.forEach((q, i) => {
        if (q.type === "mc" && answers[i] === q.correct) s++;
        if (q.type === "identification" && answers[i]?.toLowerCase().trim() === q.answer.toLowerCase().trim()) s++;
      });
      setScore(s);
      setShowResults(true);
    }
  }

  function restartQuiz() {
    setQuizStarted(false);
    setQuizQuestions([]);
    setAnswers({});
    setShowResults(false);
    setCurrentQ(0);
    setScore(0);
  }

  if (showResults) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center py-12">
          <Sparkles className="h-16 w-16 mx-auto text-primary mb-4" />
          <h2 className="text-3xl font-bold mb-2">Quiz Complete!</h2>
          <p className="text-5xl font-bold text-primary mb-4">{score}/{quizQuestions.length}</p>
          <p className="text-muted-foreground mb-8">
            {score === quizQuestions.length ? "Perfect score!" :
             score >= quizQuestions.length * 0.8 ? "Great job!" :
             score >= quizQuestions.length * 0.5 ? "Good effort!" : "Keep studying!"}
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button onClick={restartQuiz} className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
              Try Again
            </button>
            <Link href="/flashcards" className="px-6 py-2 border rounded-lg hover:bg-muted">
              Study Flashcards
            </Link>
          </div>
        </div>

        <div className="space-y-4 mt-8">
          <h3 className="font-semibold text-lg">Review Answers</h3>
          {quizQuestions.map((q, i) => {
            const userAnswer = answers[i] || "";
            const isCorrect = q.type === "mc"
              ? userAnswer === q.correct
              : userAnswer.toLowerCase().trim() === q.answer.toLowerCase().trim();
            return (
              <div key={i} className={`p-4 rounded-lg border ${isCorrect ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5"}`}>
                <p className="font-medium mb-2">{i + 1}. {q.question}</p>
                {q.type === "mc" && (
                  <div className="space-y-1 ml-4">
                    {q.options.map((opt: string, j: number) => (
                      <p key={j} className={`text-sm ${j === Number(q.correct) ? "text-green-600 font-medium" : userAnswer === String(j) ? "text-red-600" : "text-muted-foreground"}`}>
                        {String.fromCharCode(65 + j)}. {opt} {j === Number(q.correct) ? " ✓" : userAnswer === String(j) ? " ✗" : ""}
                      </p>
                    ))}
                  </div>
                )}
                {q.type === "identification" && (
                  <div className="ml-4 text-sm">
                    <p className={isCorrect ? "text-green-600" : "text-red-600"}>Your answer: {userAnswer || "(none)"}</p>
                    {!isCorrect && <p className="text-green-600">Correct: {q.answer}</p>}
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
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm text-muted-foreground">Question {currentQ + 1} of {quizQuestions.length}</span>
          <div className="h-2 flex-1 mx-4 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary transition-all" style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }} />
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-card mb-6">
          <span className={`text-xs px-2 py-1 rounded-full mb-3 inline-block ${
            q.type === "mc" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
          }`}>
            {q.type === "mc" ? "Multiple Choice" : "Identification"}
          </span>
          <p className="text-lg font-medium mt-2">{q.question}</p>
        </div>

        {q.type === "mc" ? (
          <div className="space-y-2 mb-6">
            {q.options.map((opt: string, j: number) => (
              <button
                key={j}
                onClick={() => answerQuestion(String(j))}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  answers[currentQ] === String(j)
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:bg-muted/50"
                }`}
              >
                <span className="font-medium mr-3">{String.fromCharCode(65 + j)}.</span>{opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-6">
            <input
              type="text"
              value={answers[currentQ] || ""}
              onChange={(e) => answerQuestion(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 rounded-lg border bg-background text-lg"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && answers[currentQ] && nextQuestion()}
            />
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={nextQuestion}
            disabled={!answers[currentQ]}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {currentQ === quizQuestions.length - 1 ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Sparkles className="h-12 w-12 mx-auto text-primary mb-4" />
        <h2 className="text-2xl font-bold mb-2">Generate a Quiz</h2>
        <p className="text-muted-foreground">Generate multiple choice and identification questions from your study materials</p>
      </div>

      {/* Source tabs */}
      <div className="flex items-center gap-1 border rounded-lg p-1 bg-muted/50 mb-6">
        <button
          onClick={() => setSelectedSource("text")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedSource === "text" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-4 w-4" /> Text / PDF
        </button>
        <button
          onClick={() => setSelectedSource("course")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedSource === "course" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <BookOpen className="h-4 w-4" /> From Courses
        </button>
      </div>

      <div className="space-y-4">
        {selectedSource === "text" ? (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Study Material</label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your notes, textbook content, or study material here..."
                className="w-full h-40 px-4 py-3 rounded-lg border bg-background resize-none"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed cursor-pointer hover:bg-muted transition-colors text-sm">
                <Upload className="h-4 w-4" />
                {pdfFile ? pdfFile.name : "Upload PDF"}
                <input type="file" accept=".pdf" onChange={handlePdfUpload} className="hidden" />
              </label>
              {isGenerating && <span className="text-sm text-muted-foreground">Extracting text...</span>}
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => { setSelectedCourse(e.target.value); setSelectedModule(""); }}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm"
                >
                  <option value="">Select course...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title || c.id}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Module</label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  disabled={!selectedCourse}
                  className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm disabled:opacity-50"
                >
                  <option value="">Select module...</option>
                  {selectedCourseData?.modules?.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.title || m.id}</option>
                  ))}
                </select>
              </div>
            </div>
            {selectedModule && (
              <div className="p-3 rounded-lg border bg-muted/50 text-sm">
                {loadingContent ? (
                  <span className="text-muted-foreground">Loading content...</span>
                ) : courseContent ? (
                  <span className="text-green-600">Loaded {courseContent.length} characters of study material</span>
                ) : (
                  <span className="text-muted-foreground">No content found in this module</span>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium">Questions:</label>
          <select
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border bg-background text-sm"
          >
            {[3, 5, 7, 10, 15].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          onClick={generateQuiz}
          disabled={selectedSource === "course" ? !courseContent || isGenerating : !inputText.trim() || isGenerating}
          className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 font-medium"
        >
          {isGenerating ? "Generating..." : "Generate Quiz"}
        </button>
      </div>
    </div>
  );
}
