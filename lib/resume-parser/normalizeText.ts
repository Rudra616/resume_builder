import type { ExtractedLine } from "@/types/parser";

/** Characters real resumes use as list markers. */
export const BULLET_CHARS = "•·‣▪▫◦●○∙*-–—»›→+";

const BULLET_PREFIX = new RegExp(`^\\s*[${escapeForClass(BULLET_CHARS)}]\\s+`);
const NUMBERED_PREFIX = /^\s*(\d{1,2}[.)]|[a-z][.)])\s+/i;

function escapeForClass(chars: string): string {
  return chars.replace(/[\\\]^-]/g, "\\$&");
}

const LIGATURES: Array<[RegExp, string]> = [
  [/\uFB00/g, "ff"],
  [/\uFB01/g, "fi"],
  [/\uFB02/g, "fl"],
  [/\uFB03/g, "ffi"],
  [/\uFB04/g, "ffl"],
];

/**
 * Cleans up the text artefacts that PDF and DOCX extraction leave behind:
 * ligatures, smart punctuation, non-breaking spaces and stray control codes.
 */
export function normalizeText(input: string): string {
  let text = input.replace(/\r\n?/g, "\n");

  for (const [pattern, replacement] of LIGATURES) {
    text = text.replace(pattern, replacement);
  }

  return text
    .replace(/\u00a0/g, " ")
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\u2026/g, "...")
    .replace(/[\u200b-\u200d\ufeff]/g, "")
    .replace(/[\t\f\v]+/g, " ")
    .replace(/ {2,}/g, " ");
}

export function isBulletLine(text: string): boolean {
  return BULLET_PREFIX.test(text) || NUMBERED_PREFIX.test(text);
}

/** Removes a leading bullet glyph or list number from a line. */
export function stripBullet(text: string): string {
  return text.replace(BULLET_PREFIX, "").replace(NUMBERED_PREFIX, "").trim();
}

/** True for lines that are only decoration, e.g. `-----` or `======`. */
export function isDecorativeLine(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3) return false;
  return /^[-_=*·•~—–\s]{3,}$/.test(trimmed);
}

/**
 * PDF extraction often breaks a sentence across lines and hyphenates it.
 * Rejoins `develop-\nment` into `development`.
 */
export function dehyphenate(lines: string[]): string[] {
  const output: string[] = [];
  for (const line of lines) {
    const previous = output[output.length - 1];
    if (previous && /[a-z]-$/.test(previous) && /^[a-z]/.test(line)) {
      output[output.length - 1] = previous.slice(0, -1) + line;
      continue;
    }
    output.push(line);
  }
  return output;
}

/**
 * Joins wrapped continuation lines back onto their parent line. A line is a
 * continuation when the previous line did not end a sentence and this line does
 * not look like a new bullet, heading or date entry.
 */
export function joinWrappedLines(lines: ExtractedLine[]): ExtractedLine[] {
  const output: ExtractedLine[] = [];

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    const previous = output[output.length - 1];
    const startsNewThought =
      line.bullet ||
      line.heading ||
      // A blank line or paragraph break above means this is a new block, not the
      // tail of the sentence before it.
      line.afterBlank ||
      isBulletLine(text) ||
      /^[A-Z0-9]/.test(text) ||
      text.startsWith("(") ||
      // Contact fragments stand alone even when they start in lower case, which
      // is what keeps "email | phone | city" off the end of a job title.
      isContactFragment(text);

    const previousLooksIncomplete =
      previous &&
      // The opening line of a resume is the name, which stands alone even when
      // it is written in lower case.
      output.length > 1 &&
      !previous.heading &&
      !/[.!?:;]$/.test(previous.text.trim()) &&
      previous.text.trim().length > 0 &&
      /[a-z,(&/-]$/.test(previous.text.trim()) &&
      // A short title-case line is a name, role or company on its own row, not
      // the first half of a wrapped sentence.
      !isStandaloneLabel(previous.text.trim());

    if (previous && previousLooksIncomplete && !startsNewThought) {
      previous.text = `${previous.text.trim()} ${text}`;
      continue;
    }

    output.push({ ...line, text });
  }

  return output;
}

/** Email, URL or phone-like content, which is never a sentence continuation. */
function isContactFragment(text: string): boolean {
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) return true;
  if (/(https?:\/\/|www\.)/i.test(text)) return true;
  if (/\b(?:linkedin|github|behance|dribbble|medium|stackoverflow)\./i.test(text)) {
    return true;
  }
  return /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);
}

function isStandaloneLabel(text: string): boolean {
  if (/[,&/-]$/.test(text)) return false;
  const tokens = words(text);
  if (tokens.length === 0 || tokens.length > 6) return false;
  return looksLikeTitleCase(text) || looksLikeAllCaps(text);
}

export function collapseBlankRuns(lines: ExtractedLine[]): ExtractedLine[] {
  return lines.filter(
    (line) => line.text.trim().length > 0 && !isDecorativeLine(line.text),
  );
}

/** Counts words, used throughout the parser for heuristics. */
export function words(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean);
}

export function looksLikeAllCaps(text: string): boolean {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2) return false;
  return letters === letters.toUpperCase();
}

export function looksLikeTitleCase(text: string): boolean {
  const tokens = words(text).filter((token) => /^[A-Za-z]/.test(token));
  if (tokens.length === 0) return false;
  const capitalised = tokens.filter((token) => /^[A-Z]/.test(token));
  return capitalised.length / tokens.length >= 0.6;
}
