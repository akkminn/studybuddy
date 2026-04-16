import React, { useState } from "react";
import { UploadCloud, Loader2, ChevronDown, CheckCircle2, Trophy, BookmarkPlus } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useDocumentUpload } from "../hooks/useDocumentUpload";
import { motion, AnimatePresence } from "motion/react";
import { QuizSettings } from "../services/gemini";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

export function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: "Medium",
    questionCount: 10,
    quizType: "Multiple Choice"
  });

  const { uploadFile, loading, status, error, setError, quizId } = useDocumentUpload(user?.uid);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setError(null);
    }
  };

  const handleUpload = () => {
    uploadFile(file, settings);
  };

  return (
    <div className="w-full flex justify-center py-6">
      <AnimatePresence mode="wait">
        {quizId ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[600px] bg-white rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 p-12 text-center space-y-8"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={40} />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-slate-800 font-['Funnel_Sans'] mb-3">Quiz is Ready!</h2>
              <p className="text-slate-500">Your materials have been processed and the quiz has been generated successfully.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <button
                onClick={() => navigate(`/quiz/${quizId}`)}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base py-4 px-6 rounded-xl transition-colors shadow-sm w-full sm:w-auto"
              >
                <Trophy size={20} />
                Take Quiz Now
              </button>
              <button
                onClick={() => navigate("/quizzes")}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-base py-4 px-6 rounded-xl transition-colors w-full sm:w-auto"
              >
                <BookmarkPlus size={20} />
                Save for Later
              </button>
            </div>
          </motion.div>
        ) : !loading ? (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-[600px] bg-white rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 p-8 sm:p-12 space-y-8"
          >
            <h1 className="text-[32px] leading-tight font-bold text-slate-800 font-['Funnel_Sans'] tracking-tight">
              Generate New Quiz
            </h1>

            {/* Source Material */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800 tracking-tight">
                1. Select Source Material
              </h2>
              
              <label 
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "cursor-pointer flex flex-col items-center justify-center p-8 rounded-xl border border-dashed transition-all w-full",
                  isDragOver ? "border-indigo-400 bg-indigo-50/50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                )}
              >
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3">
                  <UploadCloud size={24} />
                </div>
                <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
                
                {file ? (
                  <>
                    <p className="text-sm font-semibold text-indigo-600">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">Click or drag to replace</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-indigo-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500 mt-1">PDF, DOCX, or TXT up to 10MB</p>
                  </>
                )}
              </label>

              <div className="flex items-center justify-center gap-2 mt-4">
                <span className="text-xs text-slate-400">or</span>
                <button className="text-xs font-semibold text-indigo-600 hover:underline">
                  select existing material
                </button>
              </div>
            </div>

            {/* Quiz Settings */}
            <div className="space-y-4">
              <h2 className="text-base font-semibold text-slate-800 tracking-tight">
                2. Quiz Settings
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Difficulty</label>
                  <div className="relative">
                    <select 
                      value={settings.difficulty}
                      onChange={(e) => setSettings({ ...settings, difficulty: e.target.value })}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option>Easy</option>
                      <option>Medium</option>
                      <option>Hard</option>
                    </select>
                    <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-500">Questions</label>
                  <input 
                    type="number"
                    min={1}
                    max={30}
                    value={settings.questionCount}
                    onChange={(e) => setSettings({ ...settings, questionCount: parseInt(e.target.value) || 10 })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium text-slate-500">Quiz Type</label>
                <div className="relative">
                  <select 
                    value={settings.quizType}
                    onChange={(e) => setSettings({ ...settings, quizType: e.target.value })}
                    className="w-full appearance-none bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option>Multiple Choice</option>
                    <option>True/False</option>
                    <option>Mixed</option>
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 text-rose-600 text-sm font-medium text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-base py-4 rounded-xl transition-colors shadow-sm"
            >
              Generate Quiz
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-[600px] bg-white rounded-3xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-slate-100 p-12 flex flex-col justify-center items-center text-center space-y-6"
          >
            <div className="w-16 h-16 flex items-center justify-center text-indigo-600">
              <Loader2 size={48} className="animate-spin" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800 font-['Funnel_Sans'] mb-2">Analyzing Document...</h2>
              <p className="text-sm text-slate-500">{status}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
