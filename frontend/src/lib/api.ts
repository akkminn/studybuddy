/**
 * Centralized API base URL utility.
 * Uses VITE_API_URL env var in production, falls back to localhost for dev.
 */
export const API_BASE =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8000";

/** Build a full API URL from a relative path (e.g. "/api/auth/user/") */
export const apiUrl = (path: string): string => `${API_BASE}${path}`;
