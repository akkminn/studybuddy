import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useFlashcardSets(userId: string | undefined, limitCount?: number) {
  const [sets, setSets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchSets = async () => {
      try {
        setLoading(true);
        let q = query(
          collection(db, "flashcardSets"),
          where("createdBy", "==", userId),
          orderBy("createdAt", "desc")
        );
        
        if (limitCount) {
          q = query(q, firestoreLimit(limitCount));
        }

        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setSets(data);
      } catch (err: any) {
        setError(err);
        console.error("Error fetching flashcards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [userId, limitCount]);

  return { sets, loading, error };
}
