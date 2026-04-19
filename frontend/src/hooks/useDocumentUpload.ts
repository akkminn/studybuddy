import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useDocumentUpload(userId: string | undefined) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [quizId, setQuizId] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<number | null>(null);

  const uploadFile = async (file: File | null, settings?: any) => {
    if (!file || !userId) return;

    setLoading(true);
    setQuizId(null);
    setDocumentId(null);
    setError(null);
    try {
      setStatus("Uploading document...");
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      
      // Append generation settings
      if (settings) {
        formData.append('question_count', settings.questionCount.toString());
        formData.append('quiz_type', settings.quizType);
        formData.append('difficulty', settings.difficulty);
      }

      const token = localStorage.getItem("jwt_token");
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/materials/documents/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
         throw new Error(`Upload failed with status ${response.status}`);
      }
      
      const data = await response.json();
      const docId = data.id;
      setDocumentId(docId);

      setStatus("Document uploaded! Generating gamified materials...");
      toast.info("Document in processing pipeline. Please wait...");

      // Poll the backend until status is completed
      let isProcessing = true;
      let checkAttempts = 0;
      
      while (isProcessing && checkAttempts < 30) { // Max 1.5 minutes
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const docRes = await fetch(`http://localhost:8000/api/materials/documents/${docId}/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const docData = await docRes.json();
        
        if (docData.status === 'completed') {
          isProcessing = false;
          
          // Now fetch the related quiz
          const quizRes = await fetch(`http://localhost:8000/api/materials/quizzes/?document=${docId}`, {
             headers: { 'Authorization': `Bearer ${token}` }
          });
          
          const quizzes = await quizRes.json();
          if (quizzes.length > 0) {
             const newQuizId = quizzes[0].id.toString();
              setQuizId(newQuizId);
              toast.success("Your study materials are ready!");
              setStatus("Complete!");
          }
        } else if (docData.status === 'error') {
          throw new Error("Backend failed to process this document. AI Generation failed.");
        }
        
        checkAttempts++;
      }

      if (isProcessing) {
         throw new Error("Processing timed out.");
      }

    } catch (err: any) {
      console.error("Upload error:", err);
      const errorMessage = err.message || "Something went wrong during upload.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { uploadFile, loading, status, error, setError, quizId, documentId };
}
