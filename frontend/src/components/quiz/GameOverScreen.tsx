import { motion } from "motion/react";
import { Heart, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "../ui/Button";
import { useNavigate } from "react-router-dom";

export function GameOverScreen() {
  const navigate = useNavigate();
  return (
    <div className="max-w-2xl mx-auto text-center py-20 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <div className="w-24 h-24 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 mx-auto mb-8 relative">
          <Heart size={48} className="fill-current" />
          <div className="absolute font-bold text-rose-100 text-xl mb-1 flex items-center justify-center">0</div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Out of Hearts!</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-12">Keep practicing. Mistakes help you learn.</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="gap-2" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
            <ArrowRight size={20} />
          </Button>
          <Button variant="outline" size="lg" className="gap-2" onClick={() => window.location.reload()}>
            <RotateCcw size={20} />
            Try Again
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
