import { useState, useEffect } from "react";
import { apiUrl } from "../lib/api";

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
        const token = localStorage.getItem("jwt_token");
        const url = new URL(apiUrl("/api/materials/flashcard-decks/"));
        
        if (limitCount) {
          url.searchParams.append("limit", limitCount.toString());
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch flashcard decks: ${response.status}`);
        }

        const data = await response.json();
        // Handle DRF pagination gracefully
        setSets(Array.isArray(data) ? data : data.results || []);
      } catch (err: any) {
        setError(err);
        console.error("Error fetching flashcards:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSets();
  }, [userId, limitCount]);

  const deleteSet = async (setId: string) => {
    try {
      const token = localStorage.getItem("jwt_token");
      const response = await fetch(apiUrl(`/api/materials/flashcard-decks/${setId}/`), {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to delete flashcards set");
      }
      setSets((prev) => prev.filter((set) => set.id !== setId));
    } catch (err: any) {
      console.error("Error deleting flashcards set:", err);
      throw err;
    }
  };

  return { sets, loading, error, deleteSet };
}
