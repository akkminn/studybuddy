import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen } from "lucide-react";
import { cn } from "../lib/utils";
import "./Flashcards.css";

export function Flashcards() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flashcardSet, setFlashcardSet] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSet = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "flashcardSets", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFlashcardSet(docSnap.data());
        } else {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching flashcards:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSet();
  }, [id, navigate]);

  const nextCard = () => {
    if (currentIndex < flashcardSet.cards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96 text-indigo-600 animate-pulse">Loading Flashcards...</div>;
  if (!flashcardSet) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
          <ChevronLeft size={20} />
          Back
        </Button>
        <div className="text-sm font-medium text-slate-500">
          Card {currentIndex + 1} of {flashcardSet.cards.length}
        </div>
        <div className="w-10" /> {/* Spacer */}
      </div>

      <div className="perspective-1000 h-[400px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          className="relative w-full h-full transition-all duration-500 preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-12 text-center shadow-xl border-2 border-indigo-50">
            <div className="absolute top-6 left-6 text-indigo-200">
              <BookOpen size={32} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 leading-tight">
              {flashcardSet.cards[currentIndex].front}
            </h2>
            <p className="absolute bottom-8 text-sm text-slate-400 font-medium uppercase tracking-wider">Click to flip</p>
          </Card>

          {/* Back */}
          <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-12 text-center shadow-xl border-2 border-emerald-50 bg-emerald-50/30">
            <div className="absolute top-6 left-6 text-emerald-200">
              <RotateCcw size={32} />
            </div>
            <div className="max-w-md">
              <p className="text-lg text-slate-800 leading-relaxed">
                {flashcardSet.cards[currentIndex].back}
              </p>
            </div>
            <p className="absolute bottom-8 text-sm text-emerald-400 font-medium uppercase tracking-wider">Click to flip back</p>
          </Card>
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-6 mt-12">
        <Button
          variant="outline"
          size="lg"
          className="rounded-full h-14 w-14"
          onClick={(e) => { e.stopPropagation(); prevCard(); }}
          disabled={currentIndex === 0}
        >
          <ChevronLeft size={24} />
        </Button>
        <Button
          variant="default"
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={(e) => { e.stopPropagation(); nextCard(); }}
          disabled={currentIndex === flashcardSet.cards.length - 1}
        >
          <ChevronRight size={24} />
        </Button>
      </div>

      <div className="mt-12 flex justify-center">
        <div className="flex gap-1">
          {flashcardSet.cards.map((_: any, i: number) => (
            <div
              key={i}
              className={cn(
                "h-1.5 rounded-full transition-all",
                i === currentIndex ? "w-8 bg-indigo-600" : "w-2 bg-slate-200"
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
