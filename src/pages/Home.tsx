import React from "react";
import { motion } from "motion/react";
import { GraduationCap, Zap, Trophy, BookOpen, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

export function Home() {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="relative overflow-hidden bg-slate-50 border-b border-slate-200">
        <nav className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-xl text-white">
              <GraduationCap size={24} />
            </div>
            <span className="text-2xl font-bold text-slate-900">StudyBuddy</span>
          </div>
          <Button onClick={login}>Sign In</Button>
        </nav>

        <div className="max-w-7xl mx-auto px-6 py-20 md:py-32 grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium mb-6">
              <Zap size={16} />
              AI-Powered Learning
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-slate-900 leading-tight mb-6">
              Turn your notes into <span className="text-indigo-600">interactive</span> quizzes.
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-lg">
              Upload any document and let StudyBuddy generate gamified quizzes and flashcards to help you master any subject in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="gap-2" onClick={login}>
                Get Started for Free
                <ArrowRight size={20} />
              </Button>
              <Button variant="outline" size="lg">
                View Demo
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative"
          >
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 p-8 z-10">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Current Streak</p>
                    <p className="text-xl font-bold">12 Days 🔥</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Points</p>
                  <p className="text-xl font-bold text-indigo-600">2,450 XP</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  "What is the capital of France?",
                  "Define Photosynthesis.",
                  "Who wrote 'Romeo and Juliet'?",
                ].map((q, i) => (
                  <div key={i} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-slate-700 font-medium">{q}</span>
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-600/10 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </header>

      {/* Features Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Everything you need to study smarter</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">StudyBuddy uses advanced AI to automate the tedious parts of learning, so you can focus on mastering the material.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Smart Generation", desc: "Upload PDFs, DOCX, or text and get instant quizzes.", icon: FileUp, color: "bg-indigo-100 text-indigo-600" },
            { title: "Gamified Experience", desc: "Earn points, level up, and maintain streaks as you learn.", icon: Trophy, color: "bg-emerald-100 text-emerald-600" },
            { title: "Flashcard Sets", desc: "AI-extracted key concepts turned into digital flashcards.", icon: BookOpen, color: "bg-amber-100 text-amber-600" },
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-3xl border border-slate-100 bg-white hover:shadow-lg transition-shadow">
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", feature.color)}>
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

import { cn } from "../lib/utils";
import { FileUp } from "lucide-react";
