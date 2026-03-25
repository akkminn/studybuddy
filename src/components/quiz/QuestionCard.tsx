import { motion, AnimatePresence } from "motion/react";
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
            <h2 className="text-xl font-bold text-slate-900 leading-tight mb-6">
              {question.question}
            </h2>

            <div className="space-y-4">
              {question.options ? (
                question.options.map((option: string, i: number) => (
                  <button
                    key={i}
                    disabled={isAnswered}
                    onClick={() => onAnswer(option)}
                    className={cn(
                      "w-full p-4 text-left rounded-xl border-2 transition-all flex items-center justify-between text-base font-medium",
                      !isAnswered && "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 shadow-sm",
                      isAnswered && option === question.correctAnswer && "border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm",
                      isAnswered && selectedOption === option && option !== question.correctAnswer && "border-rose-500 bg-rose-50 text-rose-700 shadow-sm",
                      isAnswered && option !== question.correctAnswer && selectedOption !== option && "border-slate-200 opacity-50 bg-slate-50"
                    )}
                  >
                    <span>{option}</span>
                    {isAnswered && option === question.correctAnswer && <CheckCircle2 size={24} className="text-emerald-500" />}
                    {isAnswered && selectedOption === option && option !== question.correctAnswer && <XCircle size={24} className="text-rose-500" />}
                  </button>
                ))
              ) : (
                <div className="space-y-4">
                  <Input 
                    className="text-base p-4 rounded-xl border-2 shadow-sm"
                    placeholder="Type your answer..." 
                    disabled={isAnswered}
                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') onAnswer(e.currentTarget.value);
                    }}
                  />
                  <Button 
                    size="default" 
                    className="w-full h-12 rounded-xl text-base shadow-lg shadow-indigo-200" 
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      onAnswer(input.value);
                    }} 
                    disabled={isAnswered}
                  >
                    Submit Answer
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
