import { motion, AnimatePresence } from "motion/react";
import React, { useState, useEffect } from "react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

interface QuestionCardProps {
  currentQuestionIndex: number;
  question: any;
  isAnswered: boolean;
  selectedOption: string | null;
  onAnswer: (option: string | null) => void;
}

export function QuestionCard({ currentQuestionIndex, question, isAnswered, selectedOption, onAnswer }: QuestionCardProps) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    setInputValue("");
  }, [currentQuestionIndex]);

  return (
    <div className="flex-1 w-full max-w-2xl mx-auto px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="mb-8">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-relaxed mb-6">
              {question.type === 'fill_in_the_blank' ? (() => {
                const parts = question.text.split(/_{3,}/);
                if (parts.length > 1) {
                  const word = question.correctAnswer || "";
                  const first = word ? word.charAt(0).toUpperCase() : "";
                  const rest = word ? word.slice(1).replace(/[^\s-]/g, "_").split("").join(" ") : "";
                  const blankStr = word ? `${first} ${rest}` : "______";
                  
                  return (
                    <span>
                      {parts.map((part: string, idx: number) => (
                        <React.Fragment key={idx}>
                          {part}
                          {idx < parts.length - 1 && (
                            <span className="inline-block px-3 font-mono tracking-widest text-indigo-600 font-bold dark:text-indigo-400 mx-1 border-b-4 border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/40 rounded-t-md whitespace-nowrap pt-1">
                              {blankStr}
                            </span>
                          )}
                        </React.Fragment>
                      ))}
                    </span>
                  );
                }
                return question.text;
              })() : question.text}
            </h2>

            <div className="space-y-4">
              {question.type === 'multiple_choice' ? (
                question.options.map((option: string, i: number) => (
                  <button
                    key={i}
                    disabled={isAnswered}
                    onClick={() => onAnswer(option)}
                    className={cn(
                      "w-full p-4 text-left rounded-xl border-2 transition-all flex items-center justify-between text-base font-medium",
                      !isAnswered && "border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-sm",
                      isAnswered && option === question.correctAnswer && "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm",
                      isAnswered && selectedOption === option && option !== question.correctAnswer && "border-rose-500 bg-rose-50 text-rose-700 shadow-sm",
                      isAnswered && option !== question.correctAnswer && selectedOption !== option && "border-slate-200 dark:border-slate-700 opacity-50 bg-slate-50 dark:bg-slate-950"
                    )}
                  >
                    <span>{option}</span>
                    {isAnswered && option === question.correctAnswer && <CheckCircle2 size={24} className="text-emerald-500" />}
                    {isAnswered && selectedOption === option && option !== question.correctAnswer && <XCircle size={24} className="text-rose-500" />}
                  </button>
                ))
              ) : (
                <div className="space-y-6">

                  <div className="relative">
                    <Input 
                      className={cn(
                        "text-lg p-6 h-16 rounded-xl border-2 shadow-sm transition-all pr-12",
                        !isAnswered && "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-indigo-200",
                        isAnswered && selectedOption?.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase() && "border-emerald-500 bg-emerald-50 text-emerald-700",
                        isAnswered && selectedOption?.trim().toLowerCase() !== question.correctAnswer?.trim().toLowerCase() && "border-rose-500 bg-rose-50 text-rose-700"
                      )}
                      placeholder="Type your answer..." 
                      disabled={isAnswered}
                      value={inputValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter') onAnswer(inputValue);
                      }}
                    />
                    {isAnswered && selectedOption?.trim().toLowerCase() === question.correctAnswer?.trim().toLowerCase() && (
                      <CheckCircle2 size={24} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                    )}
                    {isAnswered && selectedOption?.trim().toLowerCase() !== question.correctAnswer?.trim().toLowerCase() && (
                      <XCircle size={24} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500" />
                    )}
                  </div>

                  {isAnswered && selectedOption?.trim().toLowerCase() !== question.correctAnswer?.trim().toLowerCase() && (
                     <p className="text-sm font-medium text-emerald-600 px-4">
                      Correct Answer: <span className="font-bold underline">{question.correctAnswer}</span>
                    </p>
                  )}

                  {!isAnswered && (
                    <Button 
                      size="default" 
                      className="w-full h-14 rounded-xl text-lg font-bold shadow-lg shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 text-white" 
                      onClick={() => onAnswer(inputValue)} 
                    >
                      Submit Answer
                    </Button>
                  )}
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
