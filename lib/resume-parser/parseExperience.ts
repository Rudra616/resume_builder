import { extractDateRange } from "@/lib/resume-parser/dateRanges";
import {
  isBulletLine,
  looksLikeAllCaps,
  stripBullet,
  words,
} from "@/lib/resume-parser/normalizeText";
import { uid } from "@/lib/utils";
import type { ExtractedLine } from "@/types/parser";
import type { Confidence, ExperienceEntry } from "@/types/resume";

const ROLE_HINTS =
  /(engineer|developer|designer|manager|analyst|consultant|architect|specialist|administrator|scientist|researcher|lead|director|officer|intern|associate|assistant|head|president|founder|owner|programmer|technician|coordinator|strategist|producer|editor|writer|accountant|recruiter|teacher|nurse|advocate|trainee|apprentice|supervisor)/i;

const COMPANY_HINTS =
  /(inc\.?|llc|ltd\.?|limited|corp\.?|corporation|company|co\.|technologies|technology|solutions|systems|labs|studio|studios|group|consulting|services|software|media|agency|bank|university|college|institute|hospital|foundation|gmbh|pvt|private|s\.?a\.?|b\.?v\.?)\b/i;

const LOCATION_HINTS =
  /(remote|hybrid|on-?site|onsite|,\s*[A-Z]{2}\b|\b(bengaluru|bangalore|mumbai|delhi|pune|hyderabad|chennai|ahmedabad|kolkata|london|manchester|berlin|munich|paris|madrid|barcelona|amsterdam|dublin|toronto|vancouver|new york|san francisco|seattle|austin|chicago|boston|los angeles|sydney|melbourne|singapore|tokyo|dubai|warsaw|lisbon|stockholm)\b)/i;

const SEPARATOR = /\s+(?:[|•·–—]|at|@|,)\s+/;

export interface ExperienceResult {
  experience: ExperienceEntry[];
  confidence: Record<string, Confidence>;
}

interface Draft {
  headerLines: ExtractedLine[];
  dates: { start: string; end: string; current: boolean; partial: boolean } | null;
  bullets: string[];
  paragraphs: string[];
}

function newDraft(): Draft {
  return { headerLines: [], dates: null, bullets: [], paragraphs: [] };
}

function isEmptyDraft(draft: Draft): boolean {
  return (
    draft.headerLines.length === 0 &&
    draft.bullets.length === 0 &&
    draft.paragraphs.length === 0 &&
    !draft.dates
  );
}

/**
 * Splits the experience block into entries.
 *
 * A new entry starts when we hit a date range while the current draft already
 * has one, or when a clearly-styled heading appears after we have collected
 * body content. This handles both "Role / Company / Dates" stacks and the
 * "Role — Company — Dates" single-line style.
 */
function splitEntries(lines: ExtractedLine[]): Draft[] {
  const drafts: Draft[] = [];
  let draft = newDraft();

  /**
   * Short lines that arrive after a draft already has body content. They are
   * usually the role and company of the *next* entry, so they are held back
   * until we see what follows: a date or a bullet means a new entry started,
   * anything else means they were just short sentences.
   */
  let pendingHeader: ExtractedLine[] = [];

  const push = () => {
    if (!isEmptyDraft(draft)) drafts.push(draft);
    draft = newDraft();
  };

  /** Starts the next entry, carrying any held-back header lines into it. */
  const startNextEntry = () => {
    const carried = pendingHeader;
    pendingHeader = [];
    push();
    draft.headerLines.push(...carried);
  };

  const flushPendingToBody = () => {
    if (pendingHeader.length === 0) return;
    for (const held of pendingHeader) draft.paragraphs.push(held.text.trim());
    pendingHeader = [];
  };

  const hasBody = () => draft.bullets.length > 0 || draft.paragraphs.length > 0;

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    if (isBulletLine(text) || line.bullet) {
      if (pendingHeader.length > 0) startNextEntry();
      draft.bullets.push(stripBullet(text));
      continue;
    }

    const range = extractDateRange(text);

    if (range && !range.partial) {
      if (Boolean(draft.dates) || hasBody() || pendingHeader.length > 0) {
        startNextEntry();
      }

      draft.dates = {
        start: range.start,
        end: range.end,
        current: range.current,
        partial: range.partial,
      };
      if (range.remainder && words(range.remainder).length >= 1) {
        draft.headerLines.push({ ...line, text: range.remainder });
      }
      continue;
    }

    const looksLikeHeader =
      (line.heading || line.bold || looksLikeAllCaps(text)) && words(text).length <= 12;

    if (looksLikeHeader && hasBody()) {
      startNextEntry();
      draft.headerLines.push(line);
      continue;
    }

    // Header lines near the top of an entry.
    if (
      !hasBody() &&
      pendingHeader.length === 0 &&
      draft.headerLines.length < 3 &&
      words(text).length <= 12
    ) {
      if (range?.partial) {
        draft.dates = {
          start: range.start,
          end: range.end,
          current: range.current,
          partial: true,
        };
        if (range.remainder) draft.headerLines.push({ ...line, text: range.remainder });
        continue;
      }
      draft.headerLines.push(line);
      continue;
    }

    // A short, unpunctuated line after body content probably belongs to the
    // next entry. Hold it until the following line tells us which it is.
    if (
      pendingHeader.length < 3 &&
      words(text).length <= 8 &&
      !/[.!?]$/.test(text) &&
      !range
    ) {
      pendingHeader.push(line);
      continue;
    }

    flushPendingToBody();
    draft.paragraphs.push(text);
  }

  flushPendingToBody();
  push();
  return drafts;
}

/** Assigns role, company and location from the collected header lines. */
function resolveHeader(headerLines: ExtractedLine[]): {
  role: string;
  company: string;
  location: string;
  certain: boolean;
} {
  const parts: string[] = [];
  for (const line of headerLines) {
    const pieces = line.text
      .split(SEPARATOR)
      .map((piece) => piece.trim())
      .filter(Boolean);
    parts.push(...(pieces.length > 0 ? pieces : [line.text.trim()]));
  }

  const cleaned = parts
    .map((part) => part.replace(/^[-–—•·|,\s]+|[-–—•·|,\s]+$/g, "").trim())
    .filter((part) => part.length > 1);

  let location = "";

  // "Northwind Labs, Ahmedabad" and "Kite Studio, Remote" put the company and
  // the place in one string; peel the place off the end when it reads like one.
  for (let index = 0; index < cleaned.length; index += 1) {
    const match = cleaned[index].match(/^(.*?),\s*([^,]+)$/);
    if (!match) continue;
    const [, head, tail] = match;
    if (!LOCATION_HINTS.test(tail) || words(tail).length > 3) continue;
    if (words(head).length === 0) continue;
    location = tail.trim();
    cleaned[index] = head.trim();
    break;
  }

  if (!location) {
    const locationIndex = cleaned.findIndex(
      (part) => LOCATION_HINTS.test(part) && words(part).length <= 4,
    );
    if (locationIndex >= 0) {
      location = cleaned[locationIndex];
      cleaned.splice(locationIndex, 1);
    }
  }

  const roleIndex = cleaned.findIndex((part) => ROLE_HINTS.test(part));
  const companyIndex = cleaned.findIndex(
    (part, index) => index !== roleIndex && COMPANY_HINTS.test(part),
  );

  let role = "";
  let company = "";
  let certain = false;

  if (roleIndex >= 0) {
    role = cleaned[roleIndex];
    certain = true;
    const remaining = cleaned.filter((_, index) => index !== roleIndex);
    company = companyIndex >= 0 ? cleaned[companyIndex] : (remaining[0] ?? "");
  } else if (companyIndex >= 0) {
    company = cleaned[companyIndex];
    role = cleaned.filter((_, index) => index !== companyIndex)[0] ?? "";
  } else {
    // No keyword to lean on: assume the conventional role-then-company order.
    role = cleaned[0] ?? "";
    company = cleaned[1] ?? "";
  }

  if (looksLikeAllCaps(role) && role.length > 3) role = toSentenceCase(role);
  if (looksLikeAllCaps(company) && company.length > 3) company = toSentenceCase(company);

  return { role, company, location, certain };
}

function toSentenceCase(text: string): string {
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function parseExperience(lines: ExtractedLine[]): ExperienceResult {
  const drafts = splitEntries(lines);
  const experience: ExperienceEntry[] = [];
  const confidence: Record<string, Confidence> = {};

  drafts.forEach((draft, index) => {
    const { role, company, location, certain } = resolveHeader(draft.headerLines);
    const description = draft.paragraphs.join(" ").trim();

    // A draft with nothing but a stray line is not an entry.
    if (!role && !company && draft.bullets.length === 0 && !description) return;

    const entry: ExperienceEntry = {
      id: uid("exp"),
      role,
      company,
      location,
      startDate: draft.dates?.start ?? "",
      endDate: draft.dates?.end ?? "",
      current: draft.dates?.current ?? false,
      description: draft.bullets.length > 0 ? "" : description,
      achievements:
        draft.bullets.length > 0
          ? draft.bullets
          : splitParagraphIntoBullets(description),
      technologies: [],
    };

    const position = experience.length;
    experience.push(entry);

    confidence[`experience.${position}.role`] = certain && role ? "high" : role ? "medium" : "low";
    confidence[`experience.${position}.company`] = company ? "medium" : "low";
    if (!draft.dates) {
      confidence[`experience.${position}.startDate`] = "low";
    } else if (draft.dates.partial) {
      confidence[`experience.${position}.startDate`] = "low";
      confidence[`experience.${position}.endDate`] = "low";
    } else {
      confidence[`experience.${position}.startDate`] = "high";
    }

    void index;
  });

  return { experience, confidence };
}

/**
 * Some resumes write achievements as one dense paragraph. Splitting on sentence
 * boundaries gives the user editable bullets without inventing any content.
 */
function splitParagraphIntoBullets(paragraph: string): string[] {
  if (!paragraph) return [];
  if (words(paragraph).length < 30) return paragraph ? [paragraph] : [];

  const sentences = paragraph
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);

  return sentences.length > 1 ? sentences : [paragraph];
}
