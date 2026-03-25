import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit as firestoreLimit } from "firebase/firestore";
import { db } from "../lib/firebase";

export function usePerformances(userId: string | undefined, limitCount?: number) {
  const [performances, setPerformances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchPerformances = async () => {
      try {
        setLoading(true);
        let q = query(
          collection(db, "performances"),
          where("userId", "==", userId),
          orderBy("completedAt", "asc")
        );
        
        if (limitCount) {
          q = query(q, firestoreLimit(limitCount));
        }

        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setPerformances(data);
      } catch (err: any) {
        setError(err);
        console.error("Error fetching performances:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformances();
  }, [userId, limitCount]);

  return { performances, loading, error };
}
