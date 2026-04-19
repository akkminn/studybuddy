import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
// Firebase logic removed
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, RotateCcw, BookOpen, Trophy, PartyPopper, Home, List, CheckCircle2, AlertCircle } from "lucide-react";

import { cn, getErrorMessage } from "../lib/utils";

import "./Flashcards.css";
import ReactMarkdown from "react-markdown";

export function Flashcards() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [flashcardSet, setFlashcardSet] = useState<any>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);


  useEffect(() => {
    const fetchSet = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("jwt_token");
        const response = await fetch(`http://localhost:8000/api/materials/flashcard-decks/${id}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          setFlashcardSet(await response.json());
        } else {
          setError(await getErrorMessage(response));
        }
      } catch (err) {
        setError(await getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchSet();
  }, [id, navigate]);

  const nextCard = () => {
    if (currentIndex < flashcardSet.flashcards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
    } else {
      setIsFinished(true);
    }
  };

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  if (isFinished) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 md:p-12 text-center"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="w-24 h-24 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center"
              >
                <Trophy size={48} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full shadow-lg"
              >
                <CheckCircle2 size={24} />
              </motion.div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-900 mb-2 font-['Funnel_Sans']">Study Session Complete!</h1>
          <p className="text-slate-500 mb-8 max-w-sm mx-auto">
            Great job! You've just mastered <strong>{flashcardSet.flashcards.length} flashcards</strong> from "{flashcardSet.title}".
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="text-2xl font-bold text-indigo-600">{flashcardSet.flashcards.length}</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Cards Studied</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="text-2xl font-bold text-emerald-600">100%</div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Completion Rate</div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => {
                setCurrentIndex(0);
                setIsFlipped(false);
                setIsFinished(false);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-700 py-6 rounded-2xl text-lg font-semibold shadow-indigo-200 shadow-lg"
            >
              <RotateCcw className="mr-2" size={20} /> Restart Session
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => navigate("/flashcards")}
                className="py-6 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <List className="mr-2" size={18} /> Library
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/dashboard")}
                className="py-6 rounded-2xl border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                <Home className="mr-2" size={18} /> Dashboard
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Couldn't Load Flashcards</h2>
        <p className="text-slate-500 mb-8">{error}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.location.reload()} variant="default" className="bg-indigo-600">
            <RotateCcw className="mr-2" size={18} /> Try Again
          </Button>
          <Button onClick={() => navigate("/dashboard")} variant="outline">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (loading) return (

    <div className="flex flex-col items-center justify-center h-96">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
      <div className="text-indigo-600 font-medium animate-pulse">Loading Flashcards...</div>
    </div>
  );

  if (!flashcardSet || !flashcardSet.flashcards || flashcardSet.flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="text-slate-500">No flashcards found in this set.</div>
        <Button onClick={() => navigate("/dashboard")}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-1 sm:gap-2 px-2 sm:px-4">
          <ChevronLeft size={20} />
          <span className="hidden sm:inline">Back</span>
        </Button>
        <div className="text-xs sm:text-sm font-medium text-slate-500">
          Card {currentIndex + 1} of {flashcardSet.flashcards.length}
        </div>
        <div className="w-10 sm:w-20" /> {/* Spacer */}
      </div>

      <div className="perspective-1000 h-[350px] sm:h-[400px] cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
        <motion.div
          className="relative w-full h-full transition-all duration-500 preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          {/* Front */}
          <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-6 sm:p-12 text-center shadow-xl border-2 border-indigo-50">
            <div className="hidden sm:block absolute top-6 left-6 text-indigo-200">
              <BookOpen size={32} />
            </div>
            <div className="w-full max-h-[260px] sm:max-h-[280px] overflow-y-auto no-scrollbar">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 leading-tight px-2 prose prose-slate max-w-none text-center prose-p:my-1 prose-strong:text-indigo-900">
                <ReactMarkdown>{flashcardSet.flashcards[currentIndex].front}</ReactMarkdown>
              </div>
            </div>
            <p className="absolute bottom-4 sm:bottom-8 text-[10px] sm:text-sm text-slate-400 font-medium uppercase tracking-wider">Click to flip</p>
          </Card>

          {/* Back */}
          <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 sm:p-12 text-center shadow-xl border-2 border-emerald-50 bg-emerald-50/30">
            <div className="hidden sm:block absolute top-6 left-6 text-emerald-200">
              <RotateCcw size={32} />
            </div>
            <div className="max-w-md w-full max-h-[260px] sm:max-h-[280px] overflow-y-auto no-scrollbar">
              <div className="text-sm sm:text-lg text-slate-800 leading-relaxed px-2 prose prose-slate max-w-none text-center prose-p:my-1 prose-strong:text-slate-900">
                <ReactMarkdown>{flashcardSet.flashcards[currentIndex].back}</ReactMarkdown>
              </div>
            </div>
            <p className="absolute bottom-4 sm:bottom-8 text-[10px] sm:text-sm text-emerald-400 font-medium uppercase tracking-wider">Click to flip back</p>
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
          className={cn(
            "rounded-full h-14 w-14 shadow-lg transition-all",
            currentIndex === flashcardSet.flashcards.length - 1 ? "bg-emerald-600 hover:bg-emerald-700 w-32 rounded-2xl" : "bg-indigo-600"
          )}
          onClick={(e) => { e.stopPropagation(); nextCard(); }}
        >
          {currentIndex === flashcardSet.flashcards.length - 1 ? (
            <span className="flex items-center gap-2">Finish <PartyPopper size={20} /></span>
          ) : (
            <ChevronRight size={24} />
          )}
        </Button>
      </div>

      <div className="mt-12 flex justify-center">
        <div className="flex gap-1">
          {flashcardSet.flashcards.map((_: any, i: number) => (
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
