import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

export interface StudyContext {
  contextText: string | null;
  contextTitle: string | null;
  loading: boolean;
}

export function useStudyContext(userId: string | undefined): StudyContext {
  const [contextText, setContextText] = useState<string | null>(null);
  const [contextTitle, setContextTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) {
      setContextText(null);
      setContextTitle(null);
      return;
    }

    const fetchLatestDocument = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "documents"),
          where("createdBy", "==", userId),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          setContextText(data.textContent ?? null);
          setContextTitle(data.title ?? null);
        } else {
          setContextText(null);
          setContextTitle(null);
        }
      } catch (err) {
        console.error("Failed to load study context:", err);
        setContextText(null);
        setContextTitle(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestDocument();
  }, [userId]);

  return { contextText, contextTitle, loading };
}
