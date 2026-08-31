import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display in French, tolerating null/undefined/garbage.
 * `new Date(undefined).toLocaleDateString()` renders the literal string
 * "Invalid Date" to the user, which is what several booking screens used to do
 * whenever a related row was missing.
 */
export function formatDateFr(value: string | number | Date | null | undefined, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString("fr-FR");
}

/** Same tolerance as formatDateFr, for comparisons rather than display. */
export function toDateOrNull(value: string | number | Date | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
