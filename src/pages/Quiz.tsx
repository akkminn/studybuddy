import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, collection, updateDoc, increment } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../hooks/useAuth";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "../components/ui/alert-dialog";
import confetti from "canvas-confetti";

import { QuizHeader } from "../components/quiz/QuizHeader";
import { QuestionCard } from "../components/quiz/QuestionCard";
import { BottomActionBar } from "../components/quiz/BottomActionBar";
import { GameOverScreen } from "../components/quiz/GameOverScreen";
import { QuizCompletedScreen } from "../components/quiz/QuizCompletedScreen";

export function Quiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quiz, setQuiz] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  
  // Gamification state
  const [hearts, setHearts] = useState(5);
  const [streak, setStreak] = useState(0);
  const [showExitDialog, setShowExitDialog] = useState(false);
  
  const [isFinished, setIsFinished] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "quizzes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const quizData = docSnap.data();
          
          if (quizData.questions && Array.isArray(quizData.questions)) {
            const shuffleArray = (array: any[]) => {
              const newArray = [...array];
              for (let i = newArray.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
              }
              return newArray;
            };

            quizData.questions = shuffleArray(quizData.questions).map(q => {
              if (q.options && Array.isArray(q.options)) {
                return { ...q, options: shuffleArray(q.options) };
              }
              return q;
            });
          }
          
          setQuiz(quizData);
        } else {
          navigate("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching quiz:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id, navigate]);

  const handleAnswer = (option: string | null) => {
    if (isAnswered) return;
    
    setSelectedOption(option);
    setIsAnswered(true);

    const correct = option === quiz.questions[currentQuestion].correctAnswer;
    if (correct) {
      setScore((prev) => prev + 1);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
      setHearts((prev) => {
        const newHearts = prev - 1;
        if (newHearts <= 0) {
          setGameOver(true);
        }
        return newHearts;
      });
    }
  };

  const nextQuestion = async () => {
    if (gameOver) return;
    
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsFinished(true);
      await savePerformance();
    }
  };

  const savePerformance = async () => {
    if (!user || !quiz) return;

    try {
      const finalScore = score + (selectedOption === quiz.questions[currentQuestion].correctAnswer ? 1 : 0);
      
      await addDoc(collection(db, "performances"), {
        userId: user.uid,
        quizId: id,
        score: finalScore,
        totalQuestions: quiz.questions.length,
        completedAt: new Date().toISOString(),
      });

      // Update user points
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        points: increment(finalScore * 10),
        streak: increment(1), // overall day streak
        lastActivity: new Date().toISOString(),
      });

      if (finalScore === quiz.questions.length) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#4f46e5", "#10b981", "#f59e0b"]
        });
      }
    } catch (error) {
      console.error("Error saving performance:", error);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-96 text-indigo-600 animate-pulse font-bold text-xl">Loading Quiz...</div>;
  if (!quiz) return null;

  if (gameOver) return <GameOverScreen />;
  if (isFinished) return <QuizCompletedScreen score={score} totalQuestions={quiz.questions.length} />;

  const question = quiz.questions[currentQuestion];
  const isCorrect = isAnswered && selectedOption === question.correctAnswer;
  const isLastQuestion = currentQuestion === quiz.questions.length - 1;

  return (
    <div className="min-h-[calc(100vh-80px)] flex flex-col pt-4 pb-32">
      <QuizHeader 
        currentQuestion={currentQuestion}
        totalQuestions={quiz.questions.length}
        streak={streak}
        hearts={hearts}
        onExit={() => setShowExitDialog(true)}
      />

      <QuestionCard 
        currentQuestionIndex={currentQuestion}
        question={question}
        isAnswered={isAnswered}
        selectedOption={selectedOption}
        onAnswer={handleAnswer}
      />

      <BottomActionBar 
        isAnswered={isAnswered}
        isCorrect={isCorrect}
        correctAnswer={question.correctAnswer}
        isLastQuestion={isLastQuestion}
        onNext={nextQuestion}
      />

      {/* Exit Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent className="rounded-3xl p-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-center">Are you sure you want to quit?</AlertDialogTitle>
            <AlertDialogDescription className="text-center text-slate-500 text-lg">
              You will lose your progress for this quiz!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-3 mt-6">
            <AlertDialogCancel className="h-12 rounded-xl text-lg font-medium w-full sm:w-1/2 mt-0">Keep Learning</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => navigate("/dashboard")} 
              className="h-12 rounded-xl text-lg font-medium w-full sm:w-1/2 bg-rose-500 hover:bg-rose-600 text-white border-0"
            >
              Quit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
