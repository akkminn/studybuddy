import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";
import { formatDate } from "../lib/utils";
import { Trophy, Clock, Zap, ArrowRight, BookOpen, Trash2 } from "lucide-react";
import { useQuizzes } from "../hooks/useQuizzes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

export function QuizzesList() {
  const { user } = useAuth();
  const { quizzes, loading, deleteQuiz } = useQuizzes(user?.uid);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Quizzes</h1>
          <p className="text-sm text-slate-500">Manage and take your generated quizzes.</p>
        </div>
        <Link to="/upload">
          <Button className="gap-2">
            <Zap size={18} />
            Generate New
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-slate-100 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : quizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="group hover:shadow-md transition-shadow relative">
              <div className="absolute top-4 right-4 z-10 transition-opacity">
                <AlertDialog>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                        title="Delete quiz"
                      />
                    }
                  >
                    <Trash2 size={18} />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-lg">Delete Quiz</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this quiz? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel size="lg">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        size="lg"
                        className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
                        onClick={async () => {
                          try {
                            if (deleteQuiz) {
                              await deleteQuiz(quiz.id);
                            }
                          } catch (err) {
                            console.error("Failed to delete quiz:", err);
                          }
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
              <CardHeader>
                <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors">{quiz.title}</CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Clock size={14} />
                  {formatDate(quiz.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
                  <span className="flex items-center gap-1.5">
                    <Trophy size={16} className="text-amber-500" />
                    {quiz.questions.length} Questions
                  </span>
                </div>
                <Link to={`/quiz/${quiz.id}`}>
                  <Button className="w-full gap-2">
                    Start Quiz
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-slate-200" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">No quizzes yet</h3>
          <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Upload your first document to generate a quiz automatically.</p>
          <Link to="/upload">
            <Button>Get Started</Button>
          </Link>
        </Card>
      )}
    </div>
  );
}
