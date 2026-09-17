import { detectDateShape, isSuspiciousDate, parseLooseDate } from "@/lib/dates";
import { analyzeBullet, analyzeBulletSet } from "@/lib/resume-assistant/bulletRules";
import { isNonEmpty, wordCount } from "@/lib/utils";
import type { ExperienceEntry, ResumeData } from "@/types/resume";

export interface ExperienceEntryIssue {
  kind:
    | "missing-role"
    | "missing-company"
    | "missing-dates"
    | "invalid-dates"
    | "reversed-dates"
    | "no-bullets"
    | "paragraph-instead-of-bullets"
    | "too-many-bullets";
  severity: "error" | "warning" | "suggestion";
  message: string;
  detail: string;
  fieldPath?: string;
}

/** Structural checks on one role. Content checks live in the bullet rules. */
export function analyzeExperienceEntry(
  entry: ExperienceEntry,
  index: number,
): ExperienceEntryIssue[] {
  const issues: ExperienceEntryIssue[] = [];
  const base = `experience.${index}`;

  if (!isNonEmpty(entry.role)) {
    issues.push({
      kind: "missing-role",
      severity: "warning",
      message: "This role has no job title",
      detail: "Add the title you held so the entry reads as a position.",
      fieldPath: `${base}.role`,
    });
  }

  if (!isNonEmpty(entry.company)) {
    issues.push({
      kind: "missing-company",
      severity: "warning",
      message: "This role has no company",
      detail: "Add the organisation name, or “Freelance” if you worked independently.",
      fieldPath: `${base}.company`,
    });
  }

  if (!isNonEmpty(entry.startDate)) {
    issues.push({
      kind: "missing-dates",
      severity: "warning",
      message: "This role has no start date",
      detail: "Employment dates help a reader follow your career timeline.",
      fieldPath: `${base}.startDate`,
    });
  } else if (isSuspiciousDate(entry.startDate)) {
    issues.push({
      kind: "invalid-dates",
      severity: "error",
      message: `“${entry.startDate}” isn't a date we can read`,
      detail: "Use a form like Mar 2023, 03/2023 or 2023.",
      fieldPath: `${base}.startDate`,
    });
  }

  if (!entry.current && !isNonEmpty(entry.endDate) && isNonEmpty(entry.startDate)) {
    issues.push({
      kind: "missing-dates",
      severity: "suggestion",
      message: "This role has no end date",
      detail: 'Add an end date, or mark the role as current if you still hold it.',
      fieldPath: `${base}.endDate`,
    });
  }

  if (isNonEmpty(entry.startDate) && isNonEmpty(entry.endDate) && !entry.current) {
    const start = parseLooseDate(entry.startDate);
    const end = parseLooseDate(entry.endDate);
    if (start && end && end < start) {
      issues.push({
        kind: "reversed-dates",
        severity: "error",
        message: "End date is before the start date",
        detail: `${entry.startDate} → ${entry.endDate}. One of these looks wrong.`,
        fieldPath: `${base}.endDate`,
      });
    }
  }

  const bullets = entry.achievements.filter(isNonEmpty);

  if (bullets.length === 0 && !isNonEmpty(entry.description)) {
    issues.push({
      kind: "no-bullets",
      severity: "warning",
      message: "This role has no accomplishments",
      detail: "Two to four bullets describing what you delivered make the strongest case.",
      fieldPath: `${base}.achievements.0`,
    });
  }

  if (bullets.length === 0 && wordCount(entry.description) > 35) {
    issues.push({
      kind: "paragraph-instead-of-bullets",
      severity: "suggestion",
      message: "This role is written as a paragraph",
      detail: `${wordCount(entry.description)} words in one block. Bullets are far easier to scan.`,
      fieldPath: `${base}.description`,
    });
  }

  if (bullets.length > 8) {
    issues.push({
      kind: "too-many-bullets",
      severity: "suggestion",
      message: `${bullets.length} bullets in one role`,
      detail: "Keeping the strongest four to six gives each one more weight.",
    });
  }

  return issues;
}

export interface TenseIssue {
  index: number;
  role: string;
  message: string;
  detail: string;
}

/**
 * Flags past roles written in present tense. Only past roles are checked — a
 * current role legitimately uses present tense.
 */
export function analyzeTenseConsistency(resume: ResumeData): TenseIssue[] {
  const issues: TenseIssue[] = [];
  const PRESENT_OPENER =
    /^(develop|build|design|manage|lead|create|implement|maintain|write|test|deploy|support|coordinate|handle|work|help|review|integrate|automate|mentor|own|run|collaborate)(s)?\b/i;

  resume.experience.forEach((entry, index) => {
    if (entry.current) return;
    const present = entry.achievements.filter(
      (bullet) => isNonEmpty(bullet) && PRESENT_OPENER.test(bullet.trim()),
    );
    if (present.length === 0) return;

    issues.push({
      index,
      role: entry.role || `Experience ${index + 1}`,
      message: `${present.length} ${
        present.length === 1 ? "bullet" : "bullets"
      } use present tense in a past role`,
      detail:
        "This role has ended, so past tense (“Developed”, “Led”) reads as completed work.",
    });
  });

  return issues;
}

/** Detects a resume that mixes date formats across all sections. */
export function analyzeDateFormats(resume: ResumeData): {
  mixed: boolean;
  shapes: string[];
} {
  const values: string[] = [];

  for (const entry of resume.experience) values.push(entry.startDate, entry.endDate);
  for (const entry of resume.education) values.push(entry.startDate, entry.endDate);
  for (const entry of resume.projects) values.push(entry.startDate, entry.endDate);
  for (const entry of resume.certifications) values.push(entry.date);
  for (const entry of resume.awards) values.push(entry.date);

  const shapes = new Set<string>();
  for (const value of values) {
    if (!isNonEmpty(value)) continue;
    const shape = detectDateShape(value);
    if (shape !== "unknown") shapes.add(shape);
  }

  // `iso` is our own storage format and renders through the date preference, so
  // it never counts as an inconsistency by itself.
  const visible = [...shapes].filter((shape) => shape !== "iso");

  return { mixed: visible.length > 1, shapes: [...shapes] };
}

/** Groups per-bullet analysis for the whole experience section. */
export function analyzeExperienceBullets(resume: ResumeData) {
  return resume.experience.map((entry, index) => ({
    index,
    entry,
    bulletIssues: entry.achievements.map((bullet, bulletIndex) => ({
      bulletIndex,
      bullet,
      issues: analyzeBullet(bullet),
    })),
    setIssues: analyzeBulletSet(entry.achievements),
  }));
}
