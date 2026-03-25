/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Dashboard } from "./pages/Dashboard";
import { Upload } from "./pages/Upload";
import { Quiz } from "./pages/Quiz";
import { Flashcards } from "./pages/Flashcards";
import { QuizzesList } from "./pages/QuizzesList";
import { FlashcardsList } from "./pages/FlashcardsList";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center h-screen text-indigo-600 animate-pulse">Loading StudyBuddy...</div>;
  if (!user) return <Navigate to="/" />;
  
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
            <Route path="/quizzes" element={<PrivateRoute><QuizzesList /></PrivateRoute>} />
            <Route path="/quiz/:id" element={<PrivateRoute><Quiz /></PrivateRoute>} />
            <Route path="/flashcards" element={<PrivateRoute><FlashcardsList /></PrivateRoute>} />
            <Route path="/flashcards/:id" element={<PrivateRoute><Flashcards /></PrivateRoute>} />
          </Routes>
        </Router>
      </ErrorBoundary>
      <Toaster />
    </AuthProvider>
  );
}
