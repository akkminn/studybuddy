import React, { useState, useEffect, useRef } from "react";
import { Bot, User, Send, Plus, Loader2, MessageSquare, Trash2, ChevronDown, FileText } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { chatWithGemini, ChatMessage } from "../services/gemini";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { useStudyContext } from "../hooks/useStudyContext";

const WELCOME_MESSAGE: ChatMessage & { role: "model" } = {
  role: "model",
  text: "Hi! I'm your **StudyBuddy AI**. I've loaded your study material and I'm ready to help you learn. Ask me anything about the content, request a summary, or quiz yourself! 🎓",
};

const WELCOME_MESSAGE_NO_CONTEXT: ChatMessage & { role: "model" } = {
  role: "model",
  text: "Hi! I'm your **StudyBuddy AI**. Upload a study document first and I'll be able to answer questions based on your material. Or ask me any general study question! 📚",
};

export function Chat() {
  const { user } = useAuth();
  const { contextText, contextTitle, loading: contextLoading } = useStudyContext(user?.uid);
  
  const [messages, setMessages] = useState<(ChatMessage & { id: string })[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevContextRef = useRef<string | null | undefined>(undefined);

  // Initialize / reset messages when context loads or changes
  useEffect(() => {
    if (contextLoading) return;
    if (prevContextRef.current === contextText) return;
    prevContextRef.current = contextText;

    const welcome = contextText ? WELCOME_MESSAGE : WELCOME_MESSAGE_NO_CONTEXT;
    setMessages([{ ...welcome, id: "welcome" }]);
  }, [contextText, contextLoading]);

  // Auto-scroll to bottom
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
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userText = input.trim();
    setInput("");
    setIsAtBottom(true);

    const userMsg: ChatMessage & { id: string } = {
      role: "user",
      text: userText,
      id: `u-${Date.now()}`,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const historyForApi = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, text: m.text } as ChatMessage));

      const response = await chatWithGemini(userText, historyForApi, contextText);

      setMessages((prev) => [
        ...prev,
        { role: "model", text: response, id: `m-${Date.now()}` },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "Sorry, I ran into an error. Please try again.",
          id: `err-${Date.now()}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    const welcome = contextText ? WELCOME_MESSAGE : WELCOME_MESSAGE_NO_CONTEXT;
    setMessages([{ ...welcome, id: "welcome" }]);
  };

  return (
    <div className="h-[calc(100vh-2.5rem)] max-h-[800px] flex flex-col md:flex-row gap-6 w-full -mt-2">
      
      {/* Sidebar for History */}
      <div className="w-full md:w-72 bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col gap-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">StudyBuddy AI</h2>
        </div>
        
        <Button 
          onClick={clearHistory}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center gap-2 h-12 shadow-sm"
        >
          <Plus size={18} />
          <span className="font-semibold text-sm">New Chat</span>
        </Button>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Current Session</h3>
            <div className="bg-indigo-50 text-indigo-700 px-4 py-3 rounded-xl text-sm font-medium border border-indigo-100 flex items-center gap-2">
              <MessageSquare size={16} className="shrink-0" />
              <span className="truncate">{contextTitle || "General Assistant"}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
             <h3 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Previous</h3>
             <p className="text-slate-500 text-sm px-1 py-2">History will be saved here in future updates.</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden relative">
        
        {/* Chat Header */}
        <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white z-10">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                <Bot size={24} />
             </div>
             <h1 className="text-xl font-bold text-slate-800">
                {contextTitle ? `${contextTitle} Assistant` : "Study Assistant"}
             </h1>
          </div>

          {/* Context Badge */}
          <div className="hidden sm:flex items-center gap-2">
            {contextLoading ? (
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
                <Loader2 size={12} className="animate-spin text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">Loading context…</span>
              </div>
            ) : contextTitle ? (
              <div className="flex items-center gap-1.5 bg-indigo-50/50 rounded-lg px-3 py-1.5 border border-indigo-100/50 max-w-[200px]">
                <FileText size={12} className="text-indigo-400 shrink-0" />
                <span className="text-xs text-indigo-700/80 font-medium truncate" title={contextTitle}>
                  {contextTitle}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-200">
                <FileText size={12} className="text-slate-400" />
                <span className="text-xs text-slate-500 font-medium">No document loaded</span>
              </div>
            )}
            <Button variant="ghost" size="icon" onClick={clearHistory} className="text-slate-400 hover:text-rose-500 ml-1">
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div 
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex gap-4",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {msg.role === "model" && (
                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <Bot size={20} />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[75%] px-5 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm",
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white text-slate-800 rounded-bl-sm border border-slate-100"
                )}
              >
                <div className="prose prose-sm prose-p:m-0 prose-ul:my-2 prose-li:my-0.5 max-w-none prose-strong:font-semibold">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 justify-start">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot size={20} />
              </div>
              <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl rounded-bl-sm flex gap-1.5 items-center shadow-sm h-[52px]">
                <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-indigo-300 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Scroll-to-bottom button */}
        <AnimatePresence>
          {!isAtBottom && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute bottom-24 right-8 z-20"
            >
              <Button
                size="icon"
                variant="outline"
                className="h-10 w-10 rounded-full shadow-lg bg-white border-slate-200 text-slate-600 hover:text-indigo-600"
                onClick={scrollToBottom}
              >
                <ChevronDown size={20} />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-100 flex-shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-3 items-center bg-slate-50 border border-slate-200 px-2 py-2 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm"
          >
            <Input
              ref={inputRef}
              placeholder={contextTitle ? `Ask anything about ${contextTitle}...` : "Ask your helpful assistant anything..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="border-0 bg-transparent shadow-none focus-visible:ring-0 text-[15px] h-12 flex-1 outline-none px-3"
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="rounded-xl shrink-0 h-12 w-12 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
            >
              <Send size={18} />
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
