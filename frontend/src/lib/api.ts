/**
 * Centralized API base URL utility.
 *
 * - Production (monorepo): VITE_API_URL is empty → relative paths like /api/...
 *   which automatically hit the same domain the frontend is served from.
 * - Development: falls back to http://localhost:8000 so local dev still works.
 */
const envUrl = import.meta.env.VITE_API_URL as string | undefined;
export const API_BASE =
  envUrl !== undefined && envUrl !== "" ? envUrl : (import.meta.env.DEV ? "http://localhost:8000" : "");

/** Build a full API URL from a relative path (e.g. "/api/auth/user/") */
export const apiUrl = (path: string): string => `${API_BASE}${path}`;
