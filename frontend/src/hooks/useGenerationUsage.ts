import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "../lib/api";

export interface GenerationUsageData {
  quiz: { used: number; limit: number };
  flashcard: { used: number; limit: number };
  mindmap: { used: number; limit: number };
}

const DEFAULT_USAGE: GenerationUsageData = {
  quiz: { used: 0, limit: 5 },
  flashcard: { used: 0, limit: 5 },
  mindmap: { used: 0, limit: 5 },
};

export function useGenerationUsage() {
  const [usage, setUsage] = useState<GenerationUsageData>(DEFAULT_USAGE);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("jwt_token");
      if (!token) return;

      const res = await fetch(apiUrl("/api/materials/usage/"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch usage");
      const data: GenerationUsageData = await res.json();
      setUsage(data);
    } catch (err) {
      console.error("Failed to load generation usage:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { usage, loading, refetch: fetchUsage };
}
