import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from "firebase/firestore";
import { db } from "../lib/firebase";

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
        let q = query(
          collection(db, "quizzes"),
          where("createdBy", "==", userId),
          orderBy("createdAt", "desc")
        );
        
        if (limitCount) {
          q = query(q, firestoreLimit(limitCount));
        }

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setQuizzes(data);
      } catch (err: any) {
        setError(err);
        console.error("Error fetching quizzes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, [userId, limitCount]);

  return { quizzes, loading, error };
}
