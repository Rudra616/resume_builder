import { format, isValid, parse } from "date-fns";
import type { DateFormatPreference } from "@/types/resume";

const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

const MONTH_ABBR = MONTHS.map((month) => month.slice(0, 3));

export type DateShape = "MMM yyyy" | "MMMM yyyy" | "MM/yyyy" | "yyyy" | "iso" | "unknown";

/** Detects which of the supported human formats a raw date string uses. */
export function detectDateShape(raw: string): DateShape {
  const value = raw.trim();
  if (!value) return "unknown";
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(value)) return "iso";
  if (/^\d{4}$/.test(value)) return "yyyy";
  if (/^\d{1,2}\/\d{4}$/.test(value)) return "MM/yyyy";

  const monthWord = value.match(/^([A-Za-z]+)\.?\s+\d{4}$/);
  if (monthWord) {
    const word = monthWord[1].toLowerCase();
    if (MONTHS.includes(word)) return "MMMM yyyy";
    if (MONTH_ABBR.includes(word.slice(0, 3))) return "MMM yyyy";
  }
  return "unknown";
}

/** Parses the loose date strings found in real resumes into a Date. */
export function parseLooseDate(raw: string): Date | null {
  const value = raw.trim().replace(/\./g, "");
  if (!value) return null;

  const patterns = [
    "yyyy-MM-dd",
    "yyyy-MM",
    "yyyy",
    "MM/yyyy",
    "M/yyyy",
    "MM/dd/yyyy",
    "MMM yyyy",
    "MMMM yyyy",
    "MMM d yyyy",
    "MMMM d yyyy",
  ];

  for (const pattern of patterns) {
    const parsed = parse(value, pattern, new Date(2000, 0, 1));
    if (isValid(parsed)) return parsed;
  }
  return null;
}

const PRESENT_WORDS = new Set([
  "present",
  "current",
  "now",
  "ongoing",
  "till date",
  "to date",
  "présent",
]);

export function isPresent(raw: string): boolean {
  return PRESENT_WORDS.has(raw.trim().toLowerCase());
}

/** Renders a stored date using the resume-wide format preference. */
export function formatResumeDate(
  raw: string,
  preference: DateFormatPreference,
): string {
  const value = raw?.trim() ?? "";
  if (!value) return "";
  if (isPresent(value)) return "Present";

  const parsed = parseLooseDate(value);
  if (!parsed) return value;

  if (preference === "yyyy") return format(parsed, "yyyy");
  if (preference === "MM/yyyy") return format(parsed, "MM/yyyy");
  if (preference === "MMMM yyyy") return format(parsed, "MMMM yyyy");
  return format(parsed, "MMM yyyy");
}

export function formatDateRange(
  start: string,
  end: string,
  current: boolean,
  preference: DateFormatPreference,
): string {
  const from = formatResumeDate(start, preference);
  const to = current ? "Present" : formatResumeDate(end, preference);
  if (from && to) return `${from} — ${to}`;
  return from || to || "";
}

/** True when the value looks like a date but cannot be understood. */
export function isSuspiciousDate(raw: string): boolean {
  const value = raw?.trim() ?? "";
  if (!value || isPresent(value)) return false;
  return parseLooseDate(value) === null;
}
