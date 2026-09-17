import { extractDateRange } from "@/lib/resume-parser/dateRanges";
import {
  isBulletLine,
  looksLikeAllCaps,
  stripBullet,
  words,
} from "@/lib/resume-parser/normalizeText";
import { uid } from "@/lib/utils";
import type { ExtractedLine } from "@/types/parser";
import type { Confidence, EducationEntry } from "@/types/resume";

const DEGREE_HINTS =
  /\b(b\.?\s?tech|m\.?\s?tech|b\.?\s?e\.?|m\.?\s?e\.?|b\.?\s?sc|m\.?\s?sc|b\.?\s?a\.?|m\.?\s?a\.?|b\.?\s?com|m\.?\s?com|bca|mca|mba|ph\.?\s?d|bachelor|master|doctorate|diploma|associate|higher secondary|secondary school|high school|hsc|ssc|certificate|degree|engineering|b\.?\s?arch)\b/i;

const INSTITUTION_HINTS =
  /\b(university|college|institute|institution|school|academy|polytechnic|iit|nit|iiit|bits|campus)\b/i;

const GRADE_HINTS =
  /\b(cgpa|gpa|percentage|first class|distinction|honours|honors|grade|\d{1,2}(\.\d{1,2})?\s*\/\s*(10|4|100)|\d{2}(\.\d{1,2})?\s*%)\b/i;

const FIELD_SEPARATOR = /\b(?:in|of)\b/i;

export interface EducationResult {
  education: EducationEntry[];
  confidence: Record<string, Confidence>;
}

interface Draft {
  lines: ExtractedLine[];
  dates: { start: string; end: string } | null;
  bullets: string[];
}

/**
 * Education blocks are short, so entries are split on date lines and on lines
 * that clearly name a degree or an institution.
 */
export function parseEducation(lines: ExtractedLine[]): EducationResult {
  const drafts: Draft[] = [];
  let draft: Draft = { lines: [], dates: null, bullets: [] };

  const push = () => {
    if (draft.lines.length > 0 || draft.bullets.length > 0 || draft.dates) {
      drafts.push(draft);
    }
    draft = { lines: [], dates: null, bullets: [] };
  };

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    if (isBulletLine(text) || line.bullet) {
      draft.bullets.push(stripBullet(text));
      continue;
    }

    const range = extractDateRange(text);
    const startsNewEntry =
      (DEGREE_HINTS.test(text) || INSTITUTION_HINTS.test(text)) &&
      (draft.dates !== null || draft.lines.length >= 2);

    if (startsNewEntry) push();

    if (range) {
      if (draft.dates) push();
      draft.dates = { start: range.start, end: range.end || range.start };
      if (range.remainder && words(range.remainder).length >= 1) {
        draft.lines.push({ ...line, text: range.remainder });
      }
      continue;
    }

    draft.lines.push(line);
  }

  push();

  const education: EducationEntry[] = [];
  const confidence: Record<string, Confidence> = {};

  for (const item of drafts) {
    const parts = item.lines
      .flatMap((line) =>
        line.text
          .split(/\s+[|•·–—]\s+/)
          .map((part) => part.trim())
          .filter(Boolean),
      )
      .filter((part) => part.length > 1);

    if (parts.length === 0 && !item.dates) continue;

    const degreeIndex = parts.findIndex((part) => DEGREE_HINTS.test(part));
    const institutionIndex = parts.findIndex(
      (part, index) => index !== degreeIndex && INSTITUTION_HINTS.test(part),
    );
    const gradeIndex = parts.findIndex(
      (part, index) =>
        index !== degreeIndex && index !== institutionIndex && GRADE_HINTS.test(part),
    );

    const degreeRaw = degreeIndex >= 0 ? parts[degreeIndex] : (parts[0] ?? "");
    const institution =
      institutionIndex >= 0
        ? parts[institutionIndex]
        : (parts.find((_, index) => index !== degreeIndex && index !== gradeIndex) ?? "");
    const grade = gradeIndex >= 0 ? parts[gradeIndex] : "";

    // "B.Tech in Computer Science" → degree + field
    let degree = degreeRaw;
    let field = "";
    const split = degreeRaw.split(FIELD_SEPARATOR);
    if (split.length > 1 && split[0].trim().length > 1) {
      degree = split[0].trim().replace(/[,]$/, "");
      field = split.slice(1).join(" ").trim();
    } else if (degreeRaw.includes(",")) {
      const [first, ...rest] = degreeRaw.split(",");
      if (rest.length > 0 && DEGREE_HINTS.test(first)) {
        degree = first.trim();
        field = rest.join(",").trim();
      }
    }

    const position = education.length;

    education.push({
      id: uid("edu"),
      degree: looksLikeAllCaps(degree) ? toTitle(degree) : degree,
      institution: looksLikeAllCaps(institution) ? toTitle(institution) : institution,
      field,
      location: "",
      startDate: item.dates?.start ?? "",
      endDate: item.dates?.end ?? "",
      grade,
      description: item.bullets.join(" "),
    });

    confidence[`education.${position}.degree`] = degreeIndex >= 0 ? "high" : "low";
    confidence[`education.${position}.institution`] =
      institutionIndex >= 0 ? "high" : "medium";
    if (!item.dates) confidence[`education.${position}.endDate`] = "low";
  }

  return { education, confidence };
}

function toTitle(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
