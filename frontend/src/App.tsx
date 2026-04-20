/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { ThemeProvider } from "./components/ThemeProvider";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { Dashboard } from "./pages/Dashboard";
import { Profile } from "./pages/Profile";
import { Upload } from "./pages/Upload";
import { GenerateQuiz } from "./pages/GenerateQuiz";
import { GenerateFlashcards } from "./pages/GenerateFlashcards";
import { Quiz } from "./pages/Quiz";
import { Flashcards } from "./pages/Flashcards";
import { QuizzesList } from "./pages/QuizzesList";
import { FlashcardsList } from "./pages/FlashcardsList";
import { Chat } from "./pages/Chat";
import { AuthCallback } from "./pages/AuthCallback";
import { GenerateMindMap } from "./pages/GenerateMindMap";
import { MindMap } from "./pages/MindMap";
import { MindMapsList } from "./pages/MindMapsList";
import { Toaster } from "./components/ui/sonner";
import { ErrorBoundary } from "./components/ErrorBoundary";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex items-center justify-center h-screen text-indigo-600 animate-pulse">Loading StudyBuddy...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="studybuddy-ui-theme">
      <AuthProvider>
        <ErrorBoundary>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/auth/callback/google" element={<AuthCallback />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
              <Route path="/generate/quiz" element={<PrivateRoute><GenerateQuiz /></PrivateRoute>} />
              <Route path="/generate/flashcards" element={<PrivateRoute><GenerateFlashcards /></PrivateRoute>} />
              <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
              <Route path="/quizzes" element={<PrivateRoute><QuizzesList /></PrivateRoute>} />
              <Route path="/quiz/:id" element={<PrivateRoute><Quiz /></PrivateRoute>} />
              <Route path="/flashcards" element={<PrivateRoute><FlashcardsList /></PrivateRoute>} />
              <Route path="/flashcards/:id" element={<PrivateRoute><Flashcards /></PrivateRoute>} />
              <Route path="/generate/mindmap" element={<PrivateRoute><GenerateMindMap /></PrivateRoute>} />
              <Route path="/mindmaps" element={<PrivateRoute><MindMapsList /></PrivateRoute>} />
              <Route path="/mindmaps/:id" element={<PrivateRoute><MindMap /></PrivateRoute>} />
            </Routes>
          </Router>
        </ErrorBoundary>
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}
