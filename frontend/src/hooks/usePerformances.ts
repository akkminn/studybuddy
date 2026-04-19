import { useState, useEffect } from "react";

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
        const token = localStorage.getItem("jwt_token");
        const url = new URL(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/materials/performances/`);
        
        if (limitCount) {
          url.searchParams.append("limit", limitCount.toString());
        }

        const response = await fetch(url.toString(), {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch performances");
        }
        
        const data = await response.json();
        setPerformances(Array.isArray(data) ? data : data.results || []);
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
