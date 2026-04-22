import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  BookmarkPlus,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Sparkles,
  Trophy,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { DocumentItem, useDocuments } from "../hooks/useDocuments";
import { useGenerationUsage } from "../hooks/useGenerationUsage";
import { cn, getErrorMessage } from "../lib/utils";
import { apiUrl } from "../lib/api";


interface QuizSettings {
  difficulty: string;
  questionCount: number;
  quizType: string;
}

function UsageBadge({ used, limit }: { used: number; limit: number }) {
  const remaining = limit - used;
  const pct = (used / limit) * 100;
  const color =
    remaining === 0
      ? "bg-rose-500"
      : remaining <= 2
      ? "bg-amber-400"
      : "bg-emerald-500";

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700">
      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", color)} />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Daily Quiz Generations</span>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{used}/{limit}</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", color)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function GenerateQuiz() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDocId = searchParams.get("doc");

  const { documents, loading: docsLoading } = useDocuments();
  const { usage, refetch: refetchUsage } = useGenerationUsage();

  const completedDocs = documents.filter((d) => d.status === "completed");

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: "Medium",
    questionCount: 10,
    quizType: "Multiple Choice",
  });

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  // Pre-select document from URL param
  useEffect(() => {
    if (preselectedDocId && completedDocs.length > 0) {
      const doc = completedDocs.find((d) => d.id.toString() === preselectedDocId);
      if (doc) setSelectedDoc(doc);
    }
  }, [preselectedDocId, completedDocs.length]);

  const isLimitReached = usage.quiz.used >= usage.quiz.limit;

  const handleGenerate = async () => {
    if (!selectedDoc) return;

    setGenerating(true);
    setError(null);
    setQuizId(null);

    try {
      const token = localStorage.getItem("jwt_token");

      const res = await fetch(apiUrl("/api/materials/quizzes/generate/"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          document_id: selectedDoc.id,
          question_count: settings.questionCount,
          quiz_type: settings.quizType,
          difficulty: settings.difficulty,
        }),
      });

      if (!res.ok) {
        throw new Error(await getErrorMessage(res));
      }


      refetchUsage();

      const data = await res.json();

      // Happy path: synchronous mode returns quiz_id directly
      if (data.quiz_id) {

        setQuizId(data.quiz_id.toString());
        toast.success("Quiz is ready!");
        return;
      }

      // Fallback: poll for the quiz (real async Celery mode)
      toast.info("Generating your quiz… this may take a moment.");
      const document_id = data.document_id;
      let attempts = 0;
      let found = false;
      while (!found && attempts < 30) {
        await new Promise((r) => setTimeout(r, 3000));
        const quizRes = await fetch(
          `${apiUrl(`/api/materials/quizzes/?document=${document_id}&ordering=-created_at`)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const quizzes = await quizRes.json();

        if (quizzes.length > 0) {
          found = true;
          setQuizId(quizzes[0].id.toString());
          toast.success("Quiz is ready!");
        }
        attempts++;
      }
      if (!found) throw new Error("Generation timed out. Please try again.");
    } catch (err: any) {
      const msg = await getErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {

      setGenerating(false);
    }
  };

  // ── Success screen ──
  if (quizId) {
    return (
      <div className="w-full flex justify-center py-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[600px] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 p-12 text-center space-y-8"
        >
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={40} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 font-['Funnel_Sans'] mb-3">Quiz is Ready!</h2>
            <p className="text-slate-500 dark:text-slate-400">Your quiz has been generated successfully.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(`/quiz/${quizId}`)}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-sm"
            >
              <Trophy size={20} /> Take Quiz Now
            </button>
            <button
              onClick={() => navigate("/quizzes")}
              className="flex items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-semibold py-4 px-6 rounded-xl transition-colors"
            >
              <BookmarkPlus size={20} /> Save for Later
            </button>
          </div>
          <button
            onClick={() => { setQuizId(null); setError(null); }}
            className="text-sm text-slate-400 hover:text-slate-600 dark:text-slate-400 underline"
          >
            Generate another quiz
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center py-6">
      <AnimatePresence mode="wait">
        {generating ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[600px] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 p-12 flex flex-col items-center text-center space-y-6"
          >
            <div className="w-16 h-16 flex items-center justify-center text-indigo-600">
              <Loader2 size={48} className="animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 font-['Funnel_Sans'] mb-2">
                Generating Quiz...
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">AI is crafting your questions. Please wait.</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-[680px] bg-white dark:bg-slate-900 rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-800 p-8 sm:p-12 space-y-8"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-[28px] font-bold text-slate-800 dark:text-slate-200 font-['Funnel_Sans'] tracking-tight">
                  Generate Quiz
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Pick a document from your library and configure the quiz.
                </p>
              </div>
              <div className="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                <Sparkles size={22} />
              </div>
            </div>

            {/* Usage badge */}
            <UsageBadge used={usage.quiz.used} limit={usage.quiz.limit} />

            {/* Document picker */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">1. Select Document</h2>
              {docsLoading ? (
                <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
                  <Loader2 size={16} className="animate-spin" /> Loading documents...
                </div>
              ) : completedDocs.length === 0 ? (
                <div className="p-5 rounded-xl bg-amber-50 border border-amber-100 text-sm text-amber-800">
                  No processed documents yet.{" "}
                  <button
                    onClick={() => navigate("/upload")}
                    className="font-semibold underline"
                  >
                    Upload one first.
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {completedDocs.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all",
                        selectedDoc?.id === doc.id
                          ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                          : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300"
                      )}
                    >
                      <FileText size={18} className="shrink-0" />
                      <span className="text-sm font-medium truncate">{doc.title}</span>
                      {selectedDoc?.id === doc.id && (
                        <CheckCircle2 size={16} className="ml-auto shrink-0 text-indigo-500" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quiz settings */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">2. Quiz Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Difficulty */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Difficulty</label>
                  <div className="relative">
                    <select
                      value={settings.difficulty}
                      onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}
                      className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                    <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Questions */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Number of Questions</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={settings.questionCount}
                    onChange={(e) => {
                      let val = parseInt(e.target.value) || 1;
                      if (val > 20) val = 20;
                      setSettings({ ...settings, questionCount: val });
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Quiz Type */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Quiz Type</label>
                <div className="relative">
                  <select
                    value={settings.quizType}
                    onChange={(e) => setSettings({ ...settings, quizType: e.target.value })}
                    className="w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Multiple Choice</option>
                    <option>True/False</option>
                    <option>Fill in the Blank</option>
                    <option>Mixed</option>
                  </select>
                  <ChevronDown size={15} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="p-5 rounded-2xl bg-rose-50 border border-rose-100 flex gap-4 items-start"
              >
                <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center shrink-0 text-rose-600">
                  <AlertCircle size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-rose-900 mb-1">Generation Failed</h3>
                  <p className="text-xs text-rose-700 leading-relaxed">{error}</p>
                  <button onClick={() => setError(null)} className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-800 underline uppercase">
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}

            {/* Limit reached warning */}
            {isLimitReached && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-800 flex items-center gap-2">
                <Zap size={16} className="shrink-0 text-amber-500" />
                You've used all {usage.quiz.limit} quiz generations for today. Come back tomorrow!
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!selectedDoc || isLimitReached || generating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-base py-4 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <Sparkles size={18} />
              Generate Quiz
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
