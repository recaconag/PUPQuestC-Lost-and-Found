import { format, parseISO } from "date-fns";

/**
 * Formats a date string or Date object to a consistent format.
 * 
 * @param date - The date to format (string, Date object, or null/undefined)
 * @param formatStr - The format string (default: "MMM dd, yyyy")
 * @returns Formatted date string or empty string if date is invalid
 */
export function formatDate(
  date: string | Date | null | undefined,
  formatStr: string = "MMM dd, yyyy"
): string {
  if (!date) return "";

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch {
    return "";
  }
}

/**
 * Formats a date string or Date object to a short format (MM/dd/yyyy).
 */
export function formatDateShort(date: string | Date | null | undefined): string {
  return formatDate(date, "MM/dd/yyyy");
}

/**
 * Formats a date string or Date object to a long format (MMMM dd, yyyy).
 */
export function formatDateLong(date: string | Date | null | undefined): string {
  return formatDate(date, "MMMM dd, yyyy");
}

/**
 * Formats a date string or Date object to a time format (h:mm a).
 */
export function formatTime(date: string | Date | null | undefined): string {
  return formatDate(date, "h:mm a");
}

/**
 * Formats a date string or Date object to a date and time format (MMM dd, yyyy h:mm a).
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, "MMM dd, yyyy h:mm a");
}
