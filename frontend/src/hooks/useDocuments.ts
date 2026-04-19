import { useState, useEffect, useCallback } from "react";

export interface DocumentItem {
  id: number;
  title: string;
  status: "processing" | "completed" | "error";
  uploaded_at: string;
}

/**
 * Fetches all documents for the authenticated user.
 * Provides delete capability used by the Upload page and Chat page document picker.
 */
export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("jwt_token");
      if (!token) {
        setDocuments([]);
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/materials/documents/?ordering=-uploaded_at`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to fetch documents");

      const data = await response.json();
      const results: DocumentItem[] = Array.isArray(data)
        ? data
        : data.results || [];
      setDocuments(results);
    } catch (err: any) {
      console.error("Failed to load documents:", err);
      setError(err.message || "Failed to load documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDocument = useCallback(async (id: number) => {
    const token = localStorage.getItem("jwt_token");
    const response = await fetch(
      `http://localhost:8000/api/materials/documents/${id}/`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    if (!response.ok) throw new Error("Failed to delete document");
    // Optimistically remove from local state
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, error, refetch: fetchDocuments, deleteDocument };
}
