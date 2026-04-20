import { useState, useEffect, useCallback } from "react";
import { apiUrl } from "../lib/api";

export interface MindMapNode {
  label: string;
  children?: MindMapNode[];
}

export interface MindMapItem {
  id: number;
  title: string;
  document: number | null;
  data: MindMapNode;
  created_at: string;
}

export function useMindMaps(limit?: number) {
  const [mindMaps, setMindMaps] = useState<MindMapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMindMaps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("jwt_token");
      if (!token) { setMindMaps([]); return; }

      const url = limit
        ? apiUrl(`/api/materials/mindmaps/?ordering=-created_at&limit=${limit}`)
        : apiUrl("/api/materials/mindmaps/?ordering=-created_at");

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch mind maps");
      const data = await res.json();
      setMindMaps(Array.isArray(data) ? data : data.results || []);
    } catch (err: any) {
      setError(err.message || "Failed to load mind maps");
      setMindMaps([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const deleteMindMap = useCallback(async (id: number) => {
    const token = localStorage.getItem("jwt_token");
    const res = await fetch(apiUrl(`/api/materials/mindmaps/${id}/`), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to delete mind map");
    setMindMaps((prev) => prev.filter((m) => m.id !== id));
  }, []);

  useEffect(() => { fetchMindMaps(); }, [fetchMindMaps]);

  return { mindMaps, loading, error, refetch: fetchMindMaps, deleteMindMap };
}
