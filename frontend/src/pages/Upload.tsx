import React, { useState, useRef } from "react";
import {
  UploadCloud,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  BookOpen,
  FileText,
  Trash2,
  Clock,
  Info,
  FolderOpen,
  X,
  ChevronRight,
  Layers,
  Network,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { apiUrl } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useDocuments } from "../hooks/useDocuments";
import { formatDate } from "../lib/utils";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    processing: "bg-amber-50 text-amber-700 border-amber-200",
    error: "bg-rose-50 text-rose-700 border-rose-200",
  };
  const labels: Record<string, string> = {
    completed: "Ready",
    processing: "Processing…",
    error: "Error",
  };
  const dots: Record<string, string> = {
    completed: "bg-emerald-500",
    processing: "bg-amber-400 animate-pulse",
    error: "bg-rose-500",
  };
  const s = styles[status] ?? "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
        s
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dots[status] ?? "bg-slate-400")} />
      {labels[status] ?? status}
    </span>
  );
}

// ── DocCard ───────────────────────────────────────────────────────────────────

function DocCard({
  doc,
  onDelete,
  onQuiz,
  onFlashcards,
  onChat,
  onMindMap,
  isNew,
}: {
  doc: { id: number; title: string; status: string; uploaded_at: string };
  onDelete: (id: number) => Promise<void>;
  onQuiz: (id: number) => void;
  onFlashcards: (id: number) => void;
  onChat: (id: number) => void;
  onMindMap: (id: number) => void;
  isNew?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(isNew ?? false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(doc.id);
      toast.success("Document deleted.");
    } catch {
      toast.error("Failed to delete document.");
      setDeleting(false);
      setConfirming(false);
    }
  };

  const ready = doc.status === "completed";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className={cn(
        "rounded-2xl border bg-white transition-shadow",
        isNew
          ? "border-indigo-200 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
      )}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-3 p-4 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Icon */}
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
            ready ? "bg-indigo-50 text-indigo-500" : "bg-slate-100 text-slate-400"
          )}
        >
          <FileText size={17} />
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold text-slate-800 truncate leading-tight"
            title={doc.title}
          >
            {doc.title}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <StatusBadge status={doc.status} />
            <span className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock size={10} />
              {formatDate(doc.uploaded_at)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 shrink-0">
          {!confirming ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirming(true);
              }}
              className="p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
              title="Delete"
            >
              <Trash2 size={15} />
            </button>
          ) : (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setConfirming(false)}
                className="text-[11px] font-semibold text-slate-500 hover:text-slate-700 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-[11px] font-semibold text-white bg-rose-500 hover:bg-rose-600 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                {deleting && <Loader2 size={11} className="animate-spin" />}
                Confirm
              </button>
            </div>
          )}

          <ChevronRight
            size={16}
            className={cn(
              "text-slate-400 transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
        </div>
      </div>

      {/* Expanded actions */}
      <AnimatePresence>
        {expanded && ready && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="h-px bg-slate-100 mb-3" />
              <p className="text-xs text-slate-500 mb-3 font-medium">Generate from this document:</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => onQuiz(doc.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 hover:border-indigo-200 text-indigo-700 transition-all group"
                >
                  <Sparkles size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-semibold">Quiz</span>
                </button>
                <button
                  onClick={() => onFlashcards(doc.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-100 hover:border-violet-200 text-violet-700 transition-all group"
                >
                  <Layers size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-semibold">Flashcards</span>
                </button>
                <button
                  onClick={() => onMindMap(doc.id)}
                  className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-cyan-50 hover:bg-cyan-100 border border-cyan-100 hover:border-cyan-200 text-cyan-700 transition-all group text-center"
                >
                  <Network size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-semibold leading-tight">Mind Map</span>
                </button>
                <button
                  onClick={() => onChat(doc.id)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 hover:border-emerald-200 text-emerald-700 transition-all group"
                >
                  <MessageSquare size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-semibold">Chat</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {expanded && !ready && doc.status === "error" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              <div className="h-px bg-slate-100 mb-3" />
              <p className="text-xs text-rose-600 bg-rose-50 rounded-xl p-3 border border-rose-100">
                This document failed to process. Please delete it and re-upload.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Upload page ───────────────────────────────────────────────────────────────

export function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { documents, loading: docsLoading, refetch, deleteDocument } = useDocuments();

  const [file, setFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justUploadedId, setJustUploadedId] = useState<number | null>(null);

  const setFileAndClear = (f: File) => {
    setFile(f);
    setError(null);
    setJustUploadedId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFileAndClear(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) setFileAndClear(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file || !user?.uid) return;

    setUploading(true);
    setError(null);
    setJustUploadedId(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);

      const token = localStorage.getItem("jwt_token");
      const res = await fetch(apiUrl("/api/materials/documents/"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error(`Upload failed (${res.status})`);

      const data = await res.json();
      const docId: number = data.id;

      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.info("Uploaded! Processing text…");
      refetch();

      // Poll until processing is done
      let attempts = 0;
      let done = false;
      while (!done && attempts < 30) {
        await new Promise((r) => setTimeout(r, 3000));
        const docRes = await fetch(apiUrl(`/api/materials/documents/${docId}/`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const docData = await docRes.json();
        if (docData.status === "completed") {
          done = true;
          setJustUploadedId(docId);
          refetch();
          toast.success("Document is ready!");
        } else if (docData.status === "error") {
          throw new Error("Failed to process this document.");
        }
        attempts++;
      }
      if (!done) throw new Error("Processing timed out.");
    } catch (err: any) {
      const msg = err.message || "Something went wrong.";
      setError(msg);
      toast.error(msg);
      refetch();
    } finally {
      setUploading(false);
    }
  };

  const completedCount = documents.filter((d) => d.status === "completed").length;

  return (
    <div className="w-full space-y-8">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload study materials and manage your library.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 items-start">

        {/* ══ LEFT — Upload zone (2 cols) ══ */}
        <div className="xl:col-span-2 space-y-5">

          {/* Upload area */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Upload New</h2>
              <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2.5 py-1 rounded-full">
                PDF · DOCX · TXT
              </span>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !uploading && fileInputRef.current?.click()}
              className={cn(
                "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer select-none",
                "min-h-[180px] px-6 py-8",
                isDragOver
                  ? "border-indigo-400 bg-indigo-50/60"
                  : file
                  ? "border-indigo-300 bg-indigo-50/40"
                  : "border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/20"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                disabled={uploading}
              />

              <AnimatePresence mode="wait">
                {file ? (
                  <motion.div
                    key="file"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                      <FileText size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 break-all line-clamp-2">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                    >
                      <X size={12} /> Remove
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 text-center"
                  >
                    <div
                      className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        isDragOver ? "bg-indigo-200 text-indigo-700" : "bg-slate-200 text-slate-500"
                      )}
                    >
                      <UploadCloud size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {isDragOver ? "Drop it here!" : "Drag & drop or click to browse"}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Up to 10 MB</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Upload button */}
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className={cn(
                "w-full flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl transition-all",
                file && !uploading
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow-md"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {uploading ? (
                <><Loader2 size={16} className="animate-spin" /> Processing…</>
              ) : (
                <><UploadCloud size={16} /> Upload Document</>
              )}
            </button>

            {/* Processing progress */}
            <AnimatePresence>
              {uploading && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <Loader2 size={16} className="text-indigo-500 shrink-0 animate-spin" />
                    <div>
                      <p className="text-xs font-semibold text-indigo-800">Extracting text…</p>
                      <p className="text-[11px] text-indigo-500 mt-0.5">
                        Preparing your document for AI generation
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="flex items-start gap-3 bg-rose-50 border border-rose-100 rounded-xl p-4">
                    <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-rose-800">Upload failed</p>
                      <p className="text-[11px] text-rose-600 mt-0.5">{error}</p>
                      <button
                        onClick={() => setError(null)}
                        className="mt-2 text-[11px] font-bold text-rose-500 hover:text-rose-700 underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Post-upload success card */}
          <AnimatePresence>
            {justUploadedId && !uploading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5"
              >
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <p className="text-sm font-semibold text-emerald-800">
                    Document ready — generate from it:
                  </p>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => navigate(`/generate/quiz?doc=${justUploadedId}`)}
                    className="w-full flex items-center gap-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-slate-700 hover:text-indigo-700 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  >
                    <Sparkles size={16} className="text-indigo-500" />
                    Generate Quiz
                    <ChevronRight size={14} className="ml-auto text-slate-400" />
                  </button>
                  <button
                    onClick={() => navigate(`/generate/flashcards?doc=${justUploadedId}`)}
                    className="w-full flex items-center gap-3 bg-white hover:bg-violet-50 border border-slate-200 hover:border-violet-200 text-slate-700 hover:text-violet-700 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  >
                    <Layers size={16} className="text-violet-500" />
                    Generate Flashcards
                    <ChevronRight size={14} className="ml-auto text-slate-400" />
                  </button>
                  <button
                    onClick={() => navigate(`/generate/mindmap?doc=${justUploadedId}`)}
                    className="w-full flex items-center gap-3 bg-white hover:bg-cyan-50 border border-slate-200 hover:border-cyan-200 text-slate-700 hover:text-cyan-700 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  >
                    <Network size={16} className="text-cyan-500" />
                    Generate Mind Map
                    <ChevronRight size={14} className="ml-auto text-slate-400" />
                  </button>
                  <button
                    onClick={() => navigate(`/chat?doc=${justUploadedId}`)}
                    className="w-full flex items-center gap-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-200 text-slate-700 hover:text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  >
                    <MessageSquare size={16} className="text-emerald-500" />
                    Chat with Document
                    <ChevronRight size={14} className="ml-auto text-slate-400" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick tip */}
          {!justUploadedId && !uploading && (
            <div className="flex items-start gap-2.5 text-xs text-slate-400 px-1">
              <Info size={13} className="shrink-0 mt-0.5" />
              <p>
                After upload, generate a <strong className="text-slate-500">Quiz</strong>,{" "}
                <strong className="text-slate-500">Flashcard deck</strong>, or{" "}
                <strong className="text-slate-500">Mind Map</strong> from any document in your
                library at any time.
              </p>
            </div>
          )}
        </div>

        {/* ══ RIGHT — Library (3 cols) ══ */}
        <div className="xl:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {/* Library header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-slate-500" />
                <h2 className="text-sm font-semibold text-slate-800">Your Library</h2>
              </div>
              <div className="flex items-center gap-2">
                {completedCount > 0 && (
                  <span className="text-[11px] bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-full border border-indigo-100">
                    {completedCount} ready
                  </span>
                )}
                <span className="text-[11px] text-slate-400 font-medium">
                  {documents.length} total
                </span>
              </div>
            </div>

            {/* List */}
            <div className="p-4">
              {docsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                    <FolderOpen size={30} />
                  </div>
                  <p className="text-sm font-semibold text-slate-600">No documents yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-52">
                    Upload your first study material to get started.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[560px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {documents.map((doc) => (
                      <DocCard
                        key={doc.id}
                        doc={doc}
                        isNew={doc.id === justUploadedId}
                        onDelete={deleteDocument}
                        onQuiz={(id) => navigate(`/generate/quiz?doc=${id}`)}
                        onFlashcards={(id) => navigate(`/generate/flashcards?doc=${id}`)}
                        onChat={(id) => navigate(`/chat?doc=${id}`)}
                        onMindMap={(id) => navigate(`/generate/mindmap?doc=${id}`)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer note */}
            {documents.length > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center gap-2">
                <Info size={12} className="text-slate-300 shrink-0" />
                <p className="text-[11px] text-slate-400">
                  Deleting a document also removes all its quizzes and flashcards.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
