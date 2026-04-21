import React from "react";
import { Trophy, BookOpen, Clock, Zap, ArrowRight, TrendingUp } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Link } from "react-router-dom";
import { formatDate, cn } from "../lib/utils";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuizzes } from "../hooks/useQuizzes";
import { usePerformances } from "../hooks/usePerformances";

export function Dashboard() {
  const { user, profile, loading: authLoading } = useAuth();

  const { quizzes: recentQuizzes, loading: loadingQuizzes } = useQuizzes(user?.uid, 3);
  const { performances: rawPerformances, loading: loadingPerf } = usePerformances(user?.uid, 10);
  
  const loading = loadingQuizzes || loadingPerf || authLoading;


  const performances = React.useMemo(() => {
    return rawPerformances.map(doc => ({
      date: formatDate(doc.completed_at),
      score: (doc.score / doc.totalQuestions) * 100
    }));
  }, [rawPerformances]);

  const stats = [
    { label: "Total Points", value: profile?.points || 0, icon: Zap, color: "text-amber-500 bg-amber-500/15 dark:bg-amber-500/20" },
    { label: "Current Streak", value: `${profile?.streak || 0} Days`, icon: Trophy, color: "text-emerald-500 bg-emerald-500/15 dark:bg-emerald-500/20" },
    { label: "Quizzes Taken", value: performances.length, icon: BookOpen, color: "text-indigo-500 bg-indigo-500/15 dark:bg-indigo-500/20" },
    { label: "Avg. Score", value: performances.length > 0 ? `${Math.round(performances.reduce((acc, p) => acc + p.score, 0) / performances.length)}%` : "0%", icon: TrendingUp, color: "text-rose-500 bg-rose-500/15 dark:bg-rose-500/20" },
  ];
  
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px] text-primary animate-pulse font-medium">Loading Dashboard...</div>;
  }


  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Welcome back, {user?.email?.split("@")[0]}!</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening with your studies today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={cn("p-3 rounded-2xl", stat.color)}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Progress Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Your quiz scores over the last 10 sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {performances.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={performances}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border" />
                  <XAxis dataKey="date" stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="currentColor" className="text-muted-foreground" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}%`} />
                  <Tooltip
                    contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  />
                  <Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: "#4f46e5" }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                <TrendingUp size={48} className="mb-4 opacity-20" />
                <p>Take some quizzes to see your progress!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Quizzes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent Quizzes</CardTitle>
              <CardDescription>Your latest study materials</CardDescription>
            </div>
            <Link to="/quizzes">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentQuizzes.length > 0 ? (
              recentQuizzes.map((quiz) => (
                <Link key={quiz.id} to={`/quiz/${quiz.id}`} className="block group">
                  <div className="p-4 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{quiz.title}</h4>
                      <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary transition-all group-hover:translate-x-1" />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock size={12} /> {formatDate(quiz.created_at)}</span>
                      <span className="flex items-center gap-1"><Zap size={12} /> {quiz.questions?.length || 0} Questions</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-4">No quizzes generated yet.</p>
                <Link to="/upload">
                  <Button variant="outline" size="sm">Upload a Document</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
