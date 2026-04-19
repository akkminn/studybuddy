import { useState, useCallback } from "react";
import { DocumentItem } from "./useDocuments";

const MAX_SELECTED_DOCUMENTS = 5;

export interface StudyContext {
  selectedDocuments: DocumentItem[];
  selectDocument: (doc: DocumentItem) => boolean;
  deselectDocument: (docId: number) => void;
  clearSelection: () => void;
  isSelected: (docId: number) => boolean;
  canSelectMore: boolean;
  /** Convenience: titles of selected documents joined */
  contextTitle: string | null;
  /** Convenience: list of selected document IDs */
  selectedDocumentIds: number[];
}

/**
 * Manages document selection for chat RAG context.
 * Supports multi-select with a configurable max limit.
 */
export function useStudyContext(): StudyContext {
  const [selectedDocuments, setSelectedDocuments] = useState<DocumentItem[]>([]);

  const selectDocument = useCallback((doc: DocumentItem): boolean => {
    // Only allow completed documents
    if (doc.status !== "completed") return false;

    let added = false;
    setSelectedDocuments((prev) => {
      if (prev.length >= MAX_SELECTED_DOCUMENTS) return prev;
      if (prev.some((d) => d.id === doc.id)) return prev;
      added = true;
      return [...prev, doc];
    });
    return added;
  }, []);

  const deselectDocument = useCallback((docId: number) => {
    setSelectedDocuments((prev) => prev.filter((d) => d.id !== docId));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedDocuments([]);
  }, []);

  const isSelected = useCallback(
    (docId: number) => selectedDocuments.some((d) => d.id === docId),
    [selectedDocuments]
  );

  const contextTitle =
    selectedDocuments.length > 0
      ? selectedDocuments.map((d) => d.title).join(", ")
      : null;

  const selectedDocumentIds = selectedDocuments.map((d) => d.id);

  return {
    selectedDocuments,
    selectDocument,
    deselectDocument,
    clearSelection,
    isSelected,
    canSelectMore: selectedDocuments.length < MAX_SELECTED_DOCUMENTS,
    contextTitle,
    selectedDocumentIds,
  };
}
