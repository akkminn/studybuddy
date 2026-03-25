import React from "react";
import { useAuth } from "../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";
import { formatDate } from "../lib/utils";
import { Trophy, Clock, Zap, ArrowRight, BookOpen } from "lucide-react";
import { useQuizzes } from "../hooks/useQuizzes";

export function QuizzesList() {
  const { user } = useAuth();
  const { quizzes, loading } = useQuizzes(user?.uid);

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
            <Card key={quiz.id} className="group hover:shadow-md transition-shadow">
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
