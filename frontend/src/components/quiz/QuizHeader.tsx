import { Heart, Flame, X } from "lucide-react";
import { Button } from "../ui/Button";
import { Progress } from "../ui/progress";
import { cn } from "../../lib/utils";

interface QuizHeaderProps {
  currentQuestion: number;
  totalQuestions: number;
  streak: number;
  hearts: number;
  onExit: () => void;
}

export function QuizHeader({ currentQuestion, totalQuestions, streak, hearts, onExit }: QuizHeaderProps) {
  return (
    <div className="max-w-3xl mx-auto w-full px-4 mb-8 flex items-center gap-4">
      <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-100 hover:text-slate-600 shrink-0" onClick={onExit}>
        <X size={28} />
      </Button>

      <div className="flex-1 items-center justify-center pt-2">
        <Progress value={((currentQuestion + 1) / totalQuestions) * 100} className="h-3 w-full" />
      </div>

      <div className="flex items-center gap-4 shrink-0 font-bold text-lg">
        <div className={cn("flex items-center gap-1 transition-colors", streak >= 3 ? "text-amber-500 animate-pulse" : "text-slate-400")}>
          <Flame size={20} className={streak >= 3 ? "fill-amber-500" : ""} />
          <span>{streak}</span>
        </div>
        <div className="flex items-center gap-1 text-rose-500">
          <Heart size={20} className="fill-rose-500" />
          <span>{hearts}</span>
        </div>
      </div>
    </div>
  );
}
