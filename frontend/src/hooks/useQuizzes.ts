import { useState, useEffect } from "react";
import { apiUrl } from "../lib/api";

export function useQuizzes(userId: string | undefined, limitCount?: number) {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("jwt_token");
        const url = new URL(apiUrl("/api/materials/quizzes/"));
        
        if (limitCount) {
          url.searchParams.append("limit", limitCount.toString());
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch quizzes: ${response.status}`);
        }

        const data = await response.json();
        // Depending on DRF pagination, the array might be directly returned or inside data.results
        setQuizzes(Array.isArray(data) ? data : data.results || []);
      } catch (err: any) {
        setError(err);
        console.error("Error fetching quizzes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [userId, limitCount]);

  const deleteQuiz = async (quizId: string) => {
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch(apiUrl(`/api/materials/quizzes/${quizId}/`), {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to delete quiz");
      }
      setQuizzes((prev) => prev.filter((quiz) => quiz.id !== quizId));
    } catch (err: any) {
      console.error("Error deleting quiz:", err);
      throw err;
    }
  };

  return { quizzes, loading, error, deleteQuiz };
}
