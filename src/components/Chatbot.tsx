import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, User, Bot, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { chatWithGemini } from "../services/gemini";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/utils";

export function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await chatWithGemini(userMessage, []);
      setMessages((prev) => [...prev, { role: "bot", text: response }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "bot", text: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-80 sm:w-96"
          >
            <Card className="h-[500px] flex flex-col shadow-2xl border-indigo-100">
              <CardHeader className="bg-indigo-600 text-white rounded-t-2xl p-4 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot size={20} />
                  StudyBuddy AI
                </CardTitle>
                <Button variant="ghost" size="icon" className="text-white hover:bg-indigo-500" onClick={() => setIsOpen(false)}>
                  <X size={20} />
                </Button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                {messages.length === 0 && (
                  <div className="text-center text-slate-500 mt-10">
                    <Bot size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Hi! I'm your StudyBuddy. Ask me anything about your studies!</p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={cn("flex gap-2", msg.role === "user" ? "flex-row-reverse" : "flex-row")}>
                    <div className={cn("p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0", msg.role === "user" ? "bg-indigo-100 text-indigo-600" : "bg-emerald-100 text-emerald-600")}>
                      {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                    </div>
                    <div className={cn("max-w-[80%] p-3 rounded-2xl text-sm", msg.role === "user" ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-100 text-slate-800 rounded-tl-none")}>
                      <div className="markdown-body">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2">
                    <div className="p-2 rounded-full h-8 w-8 bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <Bot size={16} />
                    </div>
                    <div className="bg-slate-100 p-3 rounded-2xl rounded-tl-none">
                      <Loader2 size={16} className="animate-spin text-emerald-600" />
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t border-slate-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex gap-2"
                >
                  <Input placeholder="Ask a question..." value={input} onChange={(e) => setInput(e.target.value)} disabled={isLoading} />
                  <Button type="submit" size="icon" disabled={isLoading}>
                    <Send size={18} />
                  </Button>
                </form>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button size="lg" className="rounded-full h-14 w-14 shadow-xl" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </Button>
    </div>
  );
}
