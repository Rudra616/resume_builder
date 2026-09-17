import { parseLooseDate } from "@/lib/dates";

// Non-capturing on purpose: these fragments are nested inside the patterns
// below, and extra capture groups would shift the group indices callers rely on.
const MONTH =
  "(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|june|july|august|september|october|november|december)";

const PRESENT = "(?:present|current|now|to\\s?date|till\\s?date|ongoing|date)";

const SINGLE_DATE = `(?:${MONTH}\\.?\\s*'?\\d{2,4}|\\d{1,2}[/.]\\d{4}|\\d{4}|${PRESENT})`;

const RANGE_SEPARATOR = "\\s*(?:[-–—]{1,2}|to|until|through|~)\\s*";

const RANGE_PATTERN = new RegExp(
  `(${SINGLE_DATE})${RANGE_SEPARATOR}(${SINGLE_DATE})`,
  "i",
);

const SINGLE_PATTERN = new RegExp(`(?:^|[\\s(|,])(${SINGLE_DATE})(?:[\\s)|,.]|$)`, "i");

const PRESENT_PATTERN = new RegExp(`^${PRESENT}$`, "i");

export interface DateRangeMatch {
  start: string;
  end: string;
  current: boolean;
  /** The line with the date text removed. */
  remainder: string;
  /** True when only one date was present, so the range is a guess. */
  partial: boolean;
}

/** Converts `Mar 2021`, `03/2021`, `2021` into the stored `yyyy-MM` form. */
export function canonicalizeDate(raw: string): string {
  const value = raw.trim().replace(/\.$/, "");
  if (!value) return "";
  if (PRESENT_PATTERN.test(value)) return "";

  // Two-digit years such as `Jan '19`.
  const shortYear = value.match(new RegExp(`^(${MONTH})\\.?\\s*'(\\d{2})$`, "i"));
  if (shortYear) {
    const year = Number(shortYear[2]) > 50 ? `19${shortYear[2]}` : `20${shortYear[2]}`;
    const parsed = parseLooseDate(`${shortYear[1]} ${year}`);
    if (parsed) return formatMonth(parsed);
  }

  const parsed = parseLooseDate(value);
  if (!parsed) return value;

  if (/^\d{4}$/.test(value)) return value;
  return formatMonth(parsed);
}

function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

/** Pulls a date range out of a resume line, if there is one. */
export function extractDateRange(text: string): DateRangeMatch | null {
  const range = text.match(RANGE_PATTERN);
  if (range) {
    const [full, rawStart, rawEnd] = range;
    const current = PRESENT_PATTERN.test(rawEnd.trim());
    return {
      start: canonicalizeDate(rawStart),
      end: current ? "" : canonicalizeDate(rawEnd),
      current,
      remainder: cleanRemainder(text.replace(full, " ")),
      partial: false,
    };
  }

  const single = text.match(SINGLE_PATTERN);
  if (single) {
    const value = single[1].trim();
    if (PRESENT_PATTERN.test(value)) return null;
    // A lone year inside a long sentence is not an employment date.
    if (text.trim().length > 60) return null;
    return {
      start: canonicalizeDate(value),
      end: "",
      current: false,
      remainder: cleanRemainder(text.replace(single[1], " ")),
      partial: true,
    };
  }

  return null;
}

export function hasDateRange(text: string): boolean {
  return RANGE_PATTERN.test(text);
}

function cleanRemainder(text: string): string {
  return text
    .replace(/\(\s*\)/g, " ")
    .replace(/[|•·]\s*$/g, " ")
    .replace(/^\s*[|•·,–—-]\s*/g, " ")
    .replace(/\s*[|•·,–—-]\s*$/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** Detects a resume that mixes date formats, e.g. `Jan 2024` with `03/2025`. */
export function detectDateFormats(values: string[]): Set<string> {
  const shapes = new Set<string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (/^\d{4}-\d{2}$/.test(trimmed)) shapes.add("yyyy-MM");
    else if (/^\d{4}$/.test(trimmed)) shapes.add("yyyy");
    else if (/^\d{1,2}\/\d{4}$/.test(trimmed)) shapes.add("MM/yyyy");
    else if (new RegExp(`^${MONTH}\\.?\\s+\\d{4}$`, "i").test(trimmed)) {
      shapes.add(trimmed.split(/\s+/)[0].length > 4 ? "MMMM yyyy" : "MMM yyyy");
    } else shapes.add("other");
  }
  return shapes;
}
