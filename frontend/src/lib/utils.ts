import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | Date | undefined | null) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "N/A";
  
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/**
 * Extracts a human-readable error message from an API response or error object.
 * Avoids verbose technical details while providing actionable feedback.
 */
export async function getErrorMessage(err: any): Promise<string> {
  // 1. If it's a string, return it
  if (typeof err === "string") return err;

  // 2. If it's a Response object (from fetch)
  if (err instanceof Response) {
    if (err.status === 429) return "You've reached the daily limit for this action. Please try again tomorrow.";
    if (err.status === 401) return "Your session has expired. Please log in again.";
    if (err.status === 403) return "You don't have permission to perform this action.";
    if (err.status >= 500) return "We're having trouble reaching our servers. Please try again later.";

    try {
      const data = await err.json();
      
      // Look for explicit error field
      if (data.error && typeof data.error === "string") return data.error;
      if (data.detail && typeof data.detail === "string") return data.detail;
      if (data.message && typeof data.message === "string") return data.message;

      // Handle DRF field errors (e.g., {"email": ["This field is required."]})
      const firstKey = Object.keys(data)[0];
      if (firstKey) {
        const firstError = data[firstKey];
        if (Array.isArray(firstError)) return firstError[0];
        if (typeof firstError === "string") return firstError;
      }
    } catch {
      // Not JSON or parsing failed
      if (err.status === 404) return "The requested resource was not found.";
    }
    
    return "An unexpected error occurred. Please try again.";
  }

  // 3. If it's a standard Error object
  if (err instanceof Error) {
    return err.message;
  }

  // 4. Fallback
  return "Something went wrong. Please try again.";
}

