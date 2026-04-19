import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../ui/Button";
import { cn } from "../../lib/utils";

interface BottomActionBarProps {
  isAnswered: boolean;
  isCorrect: boolean;
  correctAnswer: string;
  isLastQuestion: boolean;
  onNext: () => void;
}

export function BottomActionBar({ isAnswered, isCorrect, correctAnswer, isLastQuestion, onNext }: BottomActionBarProps) {
  return (
    <AnimatePresence>
      {isAnswered && (
        <motion.div 
          initial={{ y: 200 }} 
          animate={{ y: 0 }} 
          exit={{ y: 200 }} 
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={cn(
            "fixed bottom-0 left-0 right-0 border-t-2 z-50",
            isCorrect ? "bg-emerald-100 border-emerald-200" : "bg-rose-100 border-rose-200"
          )}
        >
          <div className="max-w-4xl mx-auto px-6 py-6 sm:py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={cn(
                "hidden sm:flex w-16 h-16 rounded-full items-center justify-center text-white shrink-0",
                isCorrect ? "bg-emerald-500" : "bg-rose-500"
              )}>
                {isCorrect ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              <div>
                <h3 className={cn("text-lg font-bold mb-1", isCorrect ? "text-emerald-700" : "text-rose-700")}>
                  {isCorrect ? "Excellent!" : "Not quite right."}
                </h3>
                {!isCorrect && (
                  <p className="text-rose-600 font-medium">
                    Correct answer: <span className="font-bold underline underline-offset-2">{correctAnswer}</span>
                  </p>
                )}
              </div>
            </div>
            
            <Button 
              size="lg" 
              className={cn(
                "w-full sm:w-48 h-12 rounded-xl text-base shadow-md",
                isCorrect ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-rose-500 hover:bg-rose-600 text-white"
              )} 
              onClick={onNext}
            >
              {isLastQuestion ? "Finish" : "Continue"}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
