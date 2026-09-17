import {
  isBulletLine,
  looksLikeAllCaps,
  words,
} from "@/lib/resume-parser/normalizeText";
import type {
  CanonicalSection,
  DetectedSection,
  ExtractedLine,
} from "@/types/parser";

/**
 * Heading vocabulary. Resumes use wildly different wording for the same thing,
 * so each canonical section lists the variations we have actually seen.
 */
const HEADING_ALIASES: Record<Exclude<CanonicalSection, "unknown">, string[]> = {
  summary: [
    "summary",
    "professional summary",
    "career summary",
    "executive summary",
    "profile",
    "professional profile",
    "career profile",
    "about",
    "about me",
    "objective",
    "career objective",
    "professional objective",
    "overview",
    "introduction",
    "personal statement",
    "bio",
  ],
  experience: [
    "experience",
    "work experience",
    "working experience",
    "professional experience",
    "employment",
    "employment history",
    "work history",
    "career history",
    "professional background",
    "professional history",
    "relevant experience",
    "industry experience",
    "positions held",
    "where i have worked",
    "where ive worked",
    "where i worked",
    "work",
  ],
  education: [
    "education",
    "education and training",
    "educational background",
    "academic background",
    "academics",
    "academic qualifications",
    "qualifications",
    "educational qualifications",
    "training",
    "schooling",
  ],
  skills: [
    "skills",
    "technical skills",
    "core skills",
    "key skills",
    "core competencies",
    "competencies",
    "areas of expertise",
    "expertise",
    "skills and tools",
    "technologies",
    "technical expertise",
    "tech stack",
    "tools and technologies",
    "proficiencies",
    "skill set",
    "what i know",
    "what i do",
  ],
  projects: [
    "projects",
    "personal projects",
    "professional projects",
    "selected projects",
    "key projects",
    "side projects",
    "portfolio",
    "project experience",
    "notable projects",
    "open source",
    "things i have made",
    "things ive made",
    "things i made",
    "selected work",
    "work samples",
  ],
  certifications: [
    "certifications",
    "certificates",
    "certification",
    "licenses",
    "licences",
    "licenses and certifications",
    "credentials",
    "courses",
    "courses and certifications",
    "professional development",
  ],
  languages: ["languages", "language skills", "languages known", "spoken languages"],
  awards: [
    "awards",
    "honors",
    "honours",
    "awards and honors",
    "achievements",
    "accomplishments",
    "recognition",
    "key achievements",
  ],
  volunteering: [
    "volunteering",
    "volunteer experience",
    "volunteer work",
    "community involvement",
    "community service",
    "extracurricular activities",
    "extra curricular",
  ],
  references: ["references", "referees", "recommendations"],
  interests: ["interests", "hobbies", "hobbies and interests", "personal interests"],
  links: [
    "links",
    "social",
    "social links",
    "online presence",
    "profiles",
    "find me online",
    "contact links",
  ],
  contact: [
    "contact",
    "contact information",
    "contact details",
    "personal information",
    "personal details",
    "get in touch",
  ],
};

const ALIAS_LOOKUP = new Map<string, CanonicalSection>();
for (const [canonical, aliases] of Object.entries(HEADING_ALIASES)) {
  for (const alias of aliases) {
    ALIAS_LOOKUP.set(alias, canonical as CanonicalSection);
  }
}

/** Normalises a heading candidate for dictionary lookup. */
function headingKey(text: string): string {
  return text
    .toLowerCase()
    // Apostrophes are dropped rather than spaced out, so "Where I've Worked"
    // normalises to "where ive worked" instead of "where i ve worked".
    .replace(/['\u2018\u2019]/g, "")
    .replace(/[:•·|_*#]/g, " ")
    .replace(/&/g, "and")
    .replace(/[^a-z\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Maps a line to a canonical section. Returns null when the line is not a
 * recognised heading — we never guess a section from body text.
 */
export function matchHeading(text: string): CanonicalSection | null {
  const key = headingKey(text);
  if (!key || key.length > 45) return null;

  const direct = ALIAS_LOOKUP.get(key);
  if (direct) return direct;

  // "Work Experience & Internships", "Education (Academic)" and friends.
  const tokens = words(key);
  if (tokens.length <= 6) {
    for (const [alias, canonical] of ALIAS_LOOKUP) {
      const aliasTokens = words(alias);
      if (aliasTokens.length > tokens.length) continue;
      const matchesPrefix = aliasTokens.every((token, index) => tokens[index] === token);
      if (matchesPrefix) return canonical;
    }

    for (const [alias, canonical] of ALIAS_LOOKUP) {
      if (alias.includes(" ")) continue;
      if (tokens.includes(alias)) return canonical;
    }
  }

  return fuzzyMatchHeading(key);
}

/** Levenshtein distance, capped early because headings are short. */
function editDistance(a: string, b: string): number {
  if (Math.abs(a.length - b.length) > 2) return 3;
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }

  return previous[b.length];
}

/**
 * Catches misspelled headings such as "Experiance" or "Acheivements". Only
 * single-word headings are considered, and only within one or two edits, so this
 * cannot quietly reinterpret a real word as something else.
 */
function fuzzyMatchHeading(key: string): CanonicalSection | null {
  if (key.includes(" ") || key.length < 5) return null;

  const budget = key.length >= 7 ? 2 : 1;
  let best: { canonical: CanonicalSection; distance: number } | null = null;

  for (const [alias, canonical] of ALIAS_LOOKUP) {
    if (alias.includes(" ") || alias.length < 5) continue;
    const distance = editDistance(key, alias);
    if (distance === 0) return canonical;
    if (distance > budget) continue;
    if (!best || distance < best.distance) best = { canonical, distance };
  }

  return best?.canonical ?? null;
}

/**
 * A heading match we trust even when the document gives us no styling hints,
 * which is the common case in plain-text resumes and in PDFs that lose their
 * font metadata. Loose token matching is deliberately excluded here: "Managed
 * the projects" must never become a Projects heading.
 */
export function matchHeadingStrict(text: string): CanonicalSection | null {
  const key = headingKey(text);
  if (!key || key.length > 45) return null;
  return ALIAS_LOOKUP.get(key) ?? fuzzyMatchHeading(key);
}

/**
 * Decides whether a line is being used as a section heading, combining the
 * document's own styling hints with the text shape.
 */
function isHeadingCandidate(line: ExtractedLine, medianFontSize: number): boolean {
  const text = line.text.trim();
  if (!text || text.length > 60) return false;
  if (isBulletLine(text)) return false;
  if (/[.!?]$/.test(text) && !text.endsWith("...")) return false;
  if (words(text).length > 7) return false;

  if (line.heading) return true;
  if (text.endsWith(":") && words(text).length <= 5) return true;
  if (looksLikeAllCaps(text) && words(text).length <= 6) return true;
  if (line.bold && words(text).length <= 5) return true;
  if (medianFontSize > 0 && (line.fontSize ?? 0) > medianFontSize * 1.15) return true;

  return false;
}

/**
 * Whether the document itself presents this line as a heading. Only real styling
 * counts — the shape-based `heading` hint that plain text produces is too weak to
 * justify cutting a section in two, so "Mumbai University" stays with Education.
 * Dates, grades, contact fragments and prose are never headings.
 */
function looksStyledAsHeading(line: ExtractedLine): boolean {
  const text = line.text.trim();
  if (/\d/.test(text)) return false;
  if (/[@/:]/.test(text)) return false;
  if (/\s[-–—]\s/.test(text)) return false;
  if (words(text).length > 5) return false;
  return looksLikeAllCaps(text) || Boolean(line.bold);
}

/**
 * Splits extracted lines into sections.
 *
 * Everything before the first recognised heading becomes the `contact` block,
 * and any heading we cannot map keeps its original wording under `unknown` so
 * that no text is ever silently dropped.
 */
export function detectSections(lines: ExtractedLine[]): DetectedSection[] {
  const sizes = lines
    .map((line) => line.fontSize ?? 0)
    .filter((size) => size > 0)
    .sort((a, b) => a - b);
  const medianFontSize = sizes.length > 0 ? sizes[Math.floor(sizes.length / 2)] : 0;

  const sections: DetectedSection[] = [];
  let current: DetectedSection = {
    canonical: "contact",
    rawHeading: "",
    lines: [],
    startIndex: 0,
  };

  lines.forEach((line, index) => {
    const styled = isHeadingCandidate(line, medianFontSize);

    // Plain-text resumes often write "Summary" or "Skills" with no styling at
    // all, so a short line whose wording is unmistakably a heading counts too.
    const unstyled =
      !styled &&
      !isBulletLine(line.text) &&
      words(line.text).length <= 5 &&
      !/[.!?,;]$/.test(line.text.trim()) &&
      matchHeadingStrict(line.text) !== null;

    const candidate = styled || unstyled;
    const canonical = candidate ? matchHeading(line.text) : null;

    if (canonical) {
      if (current.lines.length > 0 || current.rawHeading) sections.push(current);
      current = {
        canonical,
        rawHeading: line.text.replace(/:$/, "").trim(),
        lines: [],
        startIndex: index,
      };
      return;
    }

    // An unmatched heading starts an unknown section, but only once we are past
    // the contact block (the name and job title also look like headings) and
    // only when the document itself styles it as one. A short line that merely
    // happens to sit before a blank line — "2012 - 2013", "8.4 CGPA" — is
    // content, and treating it as a heading would cut a section in half.
    if (
      candidate &&
      looksStyledAsHeading(line) &&
      sections.length > 0 &&
      current.lines.length > 0 &&
      !isBulletLine(line.text)
    ) {
      sections.push(current);
      current = {
        canonical: "unknown",
        rawHeading: line.text.replace(/:$/, "").trim(),
        lines: [],
        startIndex: index,
      };
      return;
    }

    current.lines.push(line);
  });

  if (current.lines.length > 0 || current.rawHeading) sections.push(current);

  return mergeDuplicateSections(sections);
}

/** Resumes sometimes repeat a heading across pages; fold those together. */
function mergeDuplicateSections(sections: DetectedSection[]): DetectedSection[] {
  const output: DetectedSection[] = [];

  for (const section of sections) {
    const existing =
      section.canonical !== "unknown"
        ? output.find((entry) => entry.canonical === section.canonical)
        : undefined;

    if (existing) {
      existing.lines.push(...section.lines);
      continue;
    }
    output.push(section);
  }

  return output;
}

export function findSection(
  sections: DetectedSection[],
  canonical: CanonicalSection,
): DetectedSection | undefined {
  return sections.find((section) => section.canonical === canonical);
}

export const SECTION_ALIASES = HEADING_ALIASES;
