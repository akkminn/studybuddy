import { useState } from "react";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { extractTextFromFile } from "../services/documentProcessor";
import { generateQuiz, generateFlashcards, QuizSettings } from "../services/gemini";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const MAX_CONTEXT_CHARS = 20000;

export function useDocumentUpload(userId: string | undefined) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);

  const uploadFile = async (file: File | null, settings?: QuizSettings) => {
    if (!file || !userId) return;

    setLoading(true);
    setQuizId(null);
    setError(null);
    try {
      setStatus("Extracting text from document...");
      const text = await extractTextFromFile(file);

      if (text.length < 100) {
        throw new Error("Document content is too short to generate a quiz.");
      }

      setStatus("AI is analyzing content and generating quiz...");
      const quizData = await generateQuiz(text, settings);
      
      setStatus("AI is generating flashcards...");
      const flashcardData = await generateFlashcards(text);

      setStatus("Saving to your library...");
      const quizRef = await addDoc(collection(db, "quizzes"), {
        ...quizData,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      });

      await addDoc(collection(db, "flashcardSets"), {
        ...flashcardData,
        createdBy: userId,
        createdAt: new Date().toISOString(),
      });

      // Save extracted text for RAG chat context
      await addDoc(collection(db, "documents"), {
        title: file.name,
        textContent: text.slice(0, MAX_CONTEXT_CHARS),
        createdBy: userId,
        createdAt: new Date().toISOString(),
      });

      setStatus("Success!");
      toast.success("Study material generated successfully!");
      setQuizId(quizRef.id);
    } catch (err: any) {
      console.error("Upload error:", err);
      const errorMessage = err.message || "Something went wrong during processing.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { uploadFile, loading, status, error, setError, quizId };
}
