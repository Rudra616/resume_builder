import { isNonEmpty } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

/**
 * Duplicate detection across the whole resume. The same sentence appearing in an
 * experience bullet and a project description is one of the most common
 * self-inflicted resume problems, and it is invisible while editing one section
 * at a time.
 */
export interface TextLocation {
  fieldPath: string;
  label: string;
  text: string;
}

export interface DuplicateFinding {
  a: TextLocation;
  b: TextLocation;
  /** 0–1 similarity; 1 means identical after normalisation. */
  similarity: number;
  exact: boolean;
}

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "but",
  "for",
  "of",
  "to",
  "in",
  "on",
  "at",
  "by",
  "with",
  "from",
  "as",
  "is",
  "was",
  "were",
  "be",
  "been",
  "that",
  "this",
  "it",
  "its",
  "using",
  "used",
  "use",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

/** Jaccard similarity over content words — cheap, and good enough here. */
function similarity(a: string, b: string): number {
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (setA.size === 0 || setB.size === 0) return 0;

  let shared = 0;
  for (const token of setA) if (setB.has(token)) shared += 1;

  return shared / (setA.size + setB.size - shared);
}

function normalizeExact(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Collects every meaningful block of prose in the resume with its location. */
export function collectTextBlocks(resume: ResumeData): TextLocation[] {
  const blocks: TextLocation[] = [];

  if (isNonEmpty(resume.summary)) {
    blocks.push({ fieldPath: "summary", label: "Summary", text: resume.summary });
  }

  resume.experience.forEach((entry, index) => {
    const name = entry.role || entry.company || `Experience ${index + 1}`;
    if (isNonEmpty(entry.description)) {
      blocks.push({
        fieldPath: `experience.${index}.description`,
        label: `${name} · description`,
        text: entry.description,
      });
    }
    entry.achievements.forEach((bullet, bulletIndex) => {
      if (!isNonEmpty(bullet)) return;
      blocks.push({
        fieldPath: `experience.${index}.achievements.${bulletIndex}`,
        label: `${name} · bullet ${bulletIndex + 1}`,
        text: bullet,
      });
    });
  });

  resume.projects.forEach((entry, index) => {
    const name = entry.name || `Project ${index + 1}`;
    if (isNonEmpty(entry.description)) {
      blocks.push({
        fieldPath: `projects.${index}.description`,
        label: `${name} · description`,
        text: entry.description,
      });
    }
    entry.achievements.forEach((bullet, bulletIndex) => {
      if (!isNonEmpty(bullet)) return;
      blocks.push({
        fieldPath: `projects.${index}.achievements.${bulletIndex}`,
        label: `${name} · bullet ${bulletIndex + 1}`,
        text: bullet,
      });
    });
  });

  resume.education.forEach((entry, index) => {
    if (!isNonEmpty(entry.description)) return;
    blocks.push({
      fieldPath: `education.${index}.description`,
      label: `${entry.institution || `Education ${index + 1}`} · description`,
      text: entry.description,
    });
  });

  resume.customSections.forEach((section, sectionIndex) => {
    section.items.forEach((item, itemIndex) => {
      if (isNonEmpty(item.description)) {
        blocks.push({
          fieldPath: `customSections.${sectionIndex}.items.${itemIndex}.description`,
          label: `${section.heading} · ${item.title || `item ${itemIndex + 1}`}`,
          text: item.description,
        });
      }
      item.bullets.forEach((bullet, bulletIndex) => {
        if (!isNonEmpty(bullet)) return;
        blocks.push({
          fieldPath: `customSections.${sectionIndex}.items.${itemIndex}.bullets.${bulletIndex}`,
          label: `${section.heading} · bullet ${bulletIndex + 1}`,
          text: bullet,
        });
      });
    });
  });

  return blocks;
}

export const DUPLICATE_THRESHOLD = 0.72;

export function findDuplicates(resume: ResumeData): DuplicateFinding[] {
  const blocks = collectTextBlocks(resume).filter(
    (block) => tokenize(block.text).length >= 4,
  );
  const findings: DuplicateFinding[] = [];

  for (let i = 0; i < blocks.length; i += 1) {
    for (let j = i + 1; j < blocks.length; j += 1) {
      const a = blocks[i];
      const b = blocks[j];
      const exact = normalizeExact(a.text) === normalizeExact(b.text);
      const score = exact ? 1 : similarity(a.text, b.text);
      if (score < DUPLICATE_THRESHOLD) continue;
      findings.push({ a, b, similarity: score, exact });
    }
  }

  return findings.sort((x, y) => y.similarity - x.similarity);
}

/** Duplicate and near-duplicate skills, e.g. `React` twice or `React`/`ReactJS`. */
export interface SkillDuplicate {
  kept: string;
  duplicate: string;
  groupIndexes: number[];
  exact: boolean;
}

export function findSkillDuplicates(resume: ResumeData): SkillDuplicate[] {
  const seen = new Map<string, { value: string; group: number }>();
  const duplicates: SkillDuplicate[] = [];

  resume.skills.forEach((group, groupIndex) => {
    group.items.forEach((item) => {
      if (!isNonEmpty(item)) return;
      const key = item.toLowerCase().replace(/[^a-z0-9]/g, "");
      const existing = seen.get(key);
      if (existing) {
        duplicates.push({
          kept: existing.value,
          duplicate: item,
          groupIndexes: [existing.group, groupIndex],
          exact: existing.value === item,
        });
        return;
      }
      seen.set(key, { value: item, group: groupIndex });
    });
  });

  return duplicates;
}
