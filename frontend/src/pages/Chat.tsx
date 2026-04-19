import React, { useState, useEffect, useRef } from "react";
import {
  Bot, User, Send, Plus, Loader2, FileText, AlertCircle,
  RefreshCcw, CheckCircle2, Clock, XCircle, X, Search,
  ChevronDown, Trash2, BookOpen, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "../components/ui/Input";
export interface ChatMessage {
  role: "user" | "model";
  text: string;
}
import ReactMarkdown from "react-markdown";
import { cn, getErrorMessage } from "../lib/utils";

import { useAuth } from "../hooks/useAuth";
import { useStudyContext } from "../hooks/useStudyContext";
import { useDocuments, DocumentItem } from "../hooks/useDocuments";
import { useSearchParams, useNavigate } from "react-router-dom";

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWelcomeMessage(docCount: number): ChatMessage & { role: "model" } {
  if (docCount > 1) {
    return {
      role: "model",
      text: `Hi! I'm your **StudyBuddy AI**. I've loaded **${docCount} documents** and I'm ready to help you learn. Ask me anything about the content, request a summary, or quiz yourself! 🎓`,
    };
  }
  if (docCount === 1) {
    return {
      role: "model",
      text: "Hi! I'm your **StudyBuddy AI**. I've loaded your study material and I'm ready to help. Ask me anything about the content, request a summary, or test your knowledge! 🎓",
    };
  }
  return {
    role: "model",
    text: "Hi! I'm your **StudyBuddy AI**. Select a document from the panel and I'll answer questions based on your material — or ask me any general study question! 📚",
  };
}

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: "text-emerald-500", label: "Ready" },
  processing: { icon: Clock, color: "text-amber-500", label: "Processing" },
  error: { icon: XCircle, color: "text-rose-500", label: "Error" },
} as const;

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"
          style={{ animationDelay: `${delay}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({
  msg,
  onRetry,
}: {
  msg: ChatMessage & { id: string };
  onRetry?: (text: string) => void;
}) {
  const isUser = msg.role === "user";
  const isServiceError = !isUser && msg.text.startsWith("[SERVICE_ERROR]");
  const cleanText = isServiceError ? msg.text.replace("[SERVICE_ERROR]", "").trim() : msg.text;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}
    >
      {/* AI avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
          <Bot size={16} />
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[82%] sm:max-w-[72%] text-[14.5px] leading-relaxed",
          isUser
            ? "bg-indigo-600 text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-sm"
            : isServiceError
              ? "bg-amber-50 border border-amber-200 rounded-2xl rounded-tl-sm overflow-hidden"
              : "bg-white text-slate-800 px-5 py-3.5 rounded-2xl rounded-tl-sm border border-slate-200 shadow-sm"
        )}
      >
        {isServiceError ? (
          <div>
            <div className="flex items-center gap-2 px-4 py-3 bg-amber-100/60 border-b border-amber-200">
              <AlertCircle size={15} className="text-amber-600 shrink-0" />
              <span className="text-sm font-semibold text-amber-900">AI Service is Busy</span>
            </div>
            <div className="px-4 py-3">
              <p className="text-amber-800 text-sm mb-3">{cleanText}</p>
              {onRetry && (
                <button
                  onClick={() => onRetry(cleanText)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-amber-300 text-amber-700 hover:bg-amber-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  <RefreshCcw size={12} /> Retry
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "prose prose-sm max-w-none",
              isUser
                ? "prose-invert prose-p:text-white prose-strong:text-white prose-p:m-0 prose-ul:my-1 prose-li:my-0"
                : "prose-p:m-0 prose-ul:my-1 prose-li:my-0 prose-strong:text-slate-900 prose-p:text-slate-800"
            )}
          >
            <ReactMarkdown>{cleanText}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-1">
          <User size={15} />
        </div>
      )}
    </motion.div>
  );
}

// ── Document item for sidebar ─────────────────────────────────────────────────
function DocItem({
  doc,
  selected,
  selectable,
  onToggle,
}: {
  doc: DocumentItem;
  selected: boolean;
  selectable: boolean;
  onToggle: () => void;
}) {
  const cfg = STATUS_CONFIG[doc.status] ?? STATUS_CONFIG.error;
  const Icon = cfg.icon;

  return (
    <button
      onClick={() => selectable && onToggle()}
      disabled={!selectable && !selected}
      className={cn(
        "w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-3",
        selected
          ? "bg-indigo-50 border border-indigo-200"
          : selectable
            ? "hover:bg-slate-50 border border-transparent hover:border-slate-200"
            : "opacity-50 cursor-not-allowed border border-transparent"
      )}
    >
      {/* Checkbox */}
      <div
        className={cn(
          "w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
          selected ? "bg-indigo-600 border-indigo-600" : "border-slate-300 bg-white"
        )}
      >
        {selected && <CheckCircle2 size={10} className="text-white" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-xs font-medium truncate leading-tight",
            selected ? "text-indigo-800" : "text-slate-700"
          )}
          title={doc.title}
        >
          {doc.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <Icon size={9} className={cfg.color} />
          <span className={cn("text-[10px] font-medium", cfg.color)}>{cfg.label}</span>
        </div>
      </div>
    </button>
  );
}

// ── Main Chat ────────────────────────────────────────────────────────────────
export function Chat() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { documents, loading: docsLoading } = useDocuments();
  const {
    selectedDocuments, selectDocument, deselectDocument,
    isSelected, canSelectMore, contextTitle, selectedDocumentIds,
  } = useStudyContext();

  const [messages, setMessages] = useState<(ChatMessage & { id: string })[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [docSearch, setDocSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  // Auto-select document from URL ?doc=
  useEffect(() => {
    if (docsLoading || initializedRef.current) return;
    const docIdParam = searchParams.get("doc");
    if (docIdParam) {
      const doc = documents.find((d) => d.id === parseInt(docIdParam, 10));
      if (doc) selectDocument(doc);
    }
    initializedRef.current = true;
  }, [docsLoading, documents, searchParams, selectDocument]);

  // Reset messages & session on selection change
  useEffect(() => {
    const welcome = getWelcomeMessage(selectedDocuments.length);
    setMessages([{ ...welcome, id: "welcome" }]);
    setSessionId(null);
  }, [selectedDocuments.length]);

  // Auto-scroll
  useEffect(() => {
    if (isAtBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAtBottom]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsAtBottom(scrollHeight - scrollTop - clientHeight < 40);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;

    if (!overrideText) setInput("");
    setIsAtBottom(true);

    const userMsg: ChatMessage & { id: string } = {
      role: "user", text, id: `u-${Date.now()}`,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("jwt_token");
      let sid = sessionId;

      if (!sid) {
        const sessionPayload: Record<string, unknown> = {
          title: contextTitle
            ? `Chat about ${selectedDocuments.length > 1 ? `${selectedDocuments.length} documents` : contextTitle}`
            : "General Study Session",
        };
        if (selectedDocumentIds.length > 0) sessionPayload.document_ids = selectedDocumentIds;

        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/chat/sessions/`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(sessionPayload),
        });
        if (!res.ok) {
          throw new Error(await getErrorMessage(res));
        }

        const sessionData = await res.json();
        sid = sessionData.id;
        setSessionId(sid);
      }

      const res = await fetch(
        `http://localhost:8000/api/chat/sessions/${sid}/send_message/`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        }
      );

      if (!res.ok) {
        throw new Error(await getErrorMessage(res));
      }

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "model", text: data.assistant_reply || "(No reply)", id: `m-${Date.now()}` },
      ]);
    } catch (err) {
      const msg = await getErrorMessage(err);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: `[SERVICE_ERROR] ${msg}`, id: `err-${Date.now()}` },
      ]);
    } finally {

      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([{ ...getWelcomeMessage(selectedDocuments.length), id: "welcome" }]);
    setSessionId(null);
  };

  const toggleDocument = (doc: DocumentItem) =>
    isSelected(doc.id) ? deselectDocument(doc.id) : selectDocument(doc);

  const filteredDocs = documents.filter((d) =>
    d.title.toLowerCase().includes(docSearch.toLowerCase())
  );

  // Suggested prompts shown on empty state
  const suggestions = [
    "Summarise the key points",
    "Quiz me on this chapter",
    "Explain the main concepts",
    "What should I focus on?",
  ];

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-4 w-full overflow-hidden -mt-2">

      {/* ══ SIDEBAR ══ */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 288, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shrink-0"
            style={{ minWidth: 0 }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center">
                    <Bot size={14} className="text-white" />
                  </div>
                  <span className="text-sm font-bold text-slate-800">StudyBuddy AI</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>

              <button
                onClick={clearHistory}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
              >
                <Plus size={16} /> New Chat
              </button>
            </div>

            {/* Documents label */}
            <div className="px-4 pt-4 pb-2 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">
                  Documents
                </span>
                {selectedDocuments.length > 0 && (
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                    {selectedDocuments.length} selected
                  </span>
                )}
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search…"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400/30 focus:border-indigo-400 transition-all"
                />
                {docSearch && (
                  <button
                    onClick={() => setDocSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Document list */}
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
              {docsLoading ? (
                <div className="flex items-center justify-center py-10 text-slate-400">
                  <Loader2 size={18} className="animate-spin mr-2" />
                  <span className="text-xs">Loading…</span>
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-10 px-3">
                  <FileText size={28} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-xs text-slate-500 font-medium">
                    {documents.length === 0 ? "No documents yet" : "No matches"}
                  </p>
                  {documents.length === 0 && (
                    <button
                      onClick={() => navigate("/upload")}
                      className="mt-3 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 underline"
                    >
                      Upload a document →
                    </button>
                  )}
                </div>
              ) : (
                filteredDocs.map((doc) => (
                  <DocItem
                    key={doc.id}
                    doc={doc}
                    selected={isSelected(doc.id)}
                    selectable={doc.status === "completed" && (isSelected(doc.id) || canSelectMore)}
                    onToggle={() => toggleDocument(doc)}
                  />
                ))
              )}
            </div>

            {/* Max selection hint */}
            {!canSelectMore && (
              <div className="px-4 py-2.5 border-t border-slate-100 bg-amber-50/50 shrink-0">
                <p className="text-[10px] text-amber-600 font-medium text-center">
                  Max 5 documents per session
                </p>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ══ MAIN CHAT ══ */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden">

        {/* Chat header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 shrink-0">
          {/* Sidebar toggle */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors shrink-0"
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>

          {/* Context pills */}
          <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {selectedDocuments.length === 0 ? (
              <span className="text-sm font-semibold text-slate-400 whitespace-nowrap">
                No document selected — general mode
              </span>
            ) : (
              <>
                <span className="text-xs text-slate-400 font-medium shrink-0">Context:</span>
                {selectedDocuments.slice(0, 3).map((doc) => (
                  <span
                    key={doc.id}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full whitespace-nowrap"
                  >
                    <FileText size={10} />
                    {doc.title.length > 25 ? doc.title.slice(0, 25) + "…" : doc.title}
                    <button
                      onClick={() => deselectDocument(doc.id)}
                      className="hover:text-indigo-900 ml-0.5"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                {selectedDocuments.length > 3 && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap">
                    +{selectedDocuments.length - 3} more
                  </span>
                )}
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={clearHistory}
              className="p-2 rounded-xl hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors"
              title="Clear chat"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-5 bg-slate-50/40"
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              onRetry={(text) => {
                const lastUser = [...messages].reverse().find((m) => m.role === "user");
                if (lastUser) handleSend(lastUser.text);
              }}
            />
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 justify-start"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot size={16} />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                <TypingDots />
              </div>
            </motion.div>
          )}

          {/* Suggested prompts — shown when only welcome message and a doc is selected */}
          {messages.length === 1 && selectedDocuments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap gap-2 justify-center mt-2"
            >
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSend(s)}
                  className="text-xs font-medium bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 border border-slate-200 hover:border-indigo-200 px-3.5 py-2 rounded-full transition-all shadow-sm"
                >
                  {s}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Scroll to bottom button */}
        <AnimatePresence>
          {!isAtBottom && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-24 right-6 z-20"
            >
              <button
                onClick={scrollToBottom}
                className="w-9 h-9 rounded-full bg-white border border-slate-200 shadow-lg text-slate-600 hover:text-indigo-600 flex items-center justify-center transition-colors"
              >
                <ChevronDown size={18} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        <div className="px-4 pb-4 pt-3 border-t border-slate-100 bg-white shrink-0">
          {/* Quick action chips — shown when no doc selected */}
          {selectedDocuments.length === 0 && !sidebarOpen && (
            <div className="flex gap-2 mb-3 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setSidebarOpen(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-full whitespace-nowrap transition-colors"
              >
                <BookOpen size={12} /> Pick a document
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2 items-end bg-white border border-slate-200 rounded-2xl px-2 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-400/30 focus-within:border-indigo-400 transition-all"
          >
            <Input
              ref={inputRef}
              placeholder={
                selectedDocuments.length > 0
                  ? `Ask about your ${selectedDocuments.length > 1 ? `${selectedDocuments.length} documents` : "document"}…`
                  : "Ask anything…"
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm flex-1 outline-none px-2 h-10"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className={cn(
                "shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                input.trim() && !isLoading
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              )}
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>

          <p className="text-center text-[10px] text-slate-300 mt-2 font-medium">
            StudyBuddy AI · Powered by Gemini
          </p>
        </div>
      </div>
    </div>
  );
}
