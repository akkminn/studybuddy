import { motion } from "motion/react";
import { Trophy, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { useNavigate } from "react-router-dom";

interface QuizCompletedScreenProps {
  score: number;
  totalQuestions: number;
}

export function QuizCompletedScreen({ score, totalQuestions }: QuizCompletedScreenProps) {
  const navigate = useNavigate();
  const percentage = Math.round((score / totalQuestions) * 100);

  return (
    <div className="max-w-2xl mx-auto text-center py-12 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mx-auto mb-8">
          <Trophy size={48} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Quiz Completed!</h1>
        <p className="text-sm text-slate-500 mb-12">Great job! You've earned {score * 10} XP.</p>

        <div className="grid grid-cols-2 gap-6 mb-12">
          <Card className="border-2 border-indigo-100 shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-1">Score</p>
              <p className="text-3xl font-bold text-indigo-600 text-center">{score} / {totalQuestions}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-emerald-100 shadow-sm">
            <CardContent className="p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center mb-1">Accuracy</p>
              <p className="text-3xl font-bold text-emerald-600 text-center">{percentage}%</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="default" className="gap-2 w-full sm:w-auto h-12 rounded-xl text-base shadow-indigo-200/50 shadow-lg" onClick={() => navigate("/dashboard")}>
            Continue
            <ArrowRight size={20} />
          </Button>
          <Button variant="outline" size="default" className="gap-2 w-full sm:w-auto h-12 rounded-xl text-base" onClick={() => window.location.reload()}>
            <RotateCcw size={20} />
            Try Again
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
