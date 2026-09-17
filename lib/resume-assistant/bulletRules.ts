import { startsWithStrongVerb, suggestVerbs } from "@/lib/resume-assistant/actionVerbs";
import { findFillerWords, findWeakPhrases } from "@/lib/resume-assistant/contentRules";
import { wordCount } from "@/lib/utils";

/**
 * Bullet-level analysis. Thresholds are guidance rather than hard limits — the
 * assistant explains what it noticed and lets the user decide.
 */
export const BULLET_LIMITS = {
  /** Below this, a bullet rarely carries an accomplishment. */
  short: 5,
  /** Above this, a bullet usually holds more than one idea. */
  long: 32,
  /** Clearly a paragraph rather than a bullet. */
  veryLong: 45,
};

export type BulletIssueKind =
  | "too-long"
  | "too-short"
  | "multiple-ideas"
  | "weak-verb"
  | "no-verb"
  | "filler"
  | "ends-inconsistently"
  | "repetitive-opener"
  | "gerund-opener";

export interface BulletIssue {
  kind: BulletIssueKind;
  message: string;
  detail: string;
  severity: "warning" | "suggestion";
  /** Offered rewrite of the bullet, when one can be produced safely. */
  rewrite?: string;
  /** Non-destructive ideas shown as text. */
  ideas?: string[];
}

/** Counts independent clauses to spot bullets carrying several ideas at once. */
function countIdeas(text: string): number {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean).length;
  const conjunctions = (
    text.match(/\b(and also|as well as|additionally|moreover|furthermore)\b/gi) ?? []
  ).length;
  const semicolons = (text.match(/;/g) ?? []).length;
  return Math.max(sentences, 1) + conjunctions + semicolons;
}

export function analyzeBullet(text: string): BulletIssue[] {
  const bullet = text.trim();
  if (!bullet) return [];

  const issues: BulletIssue[] = [];
  const count = wordCount(bullet);

  if (count > BULLET_LIMITS.veryLong) {
    issues.push({
      kind: "too-long",
      severity: "warning",
      message: `This bullet is ${count} words long`,
      detail:
        "Consider splitting it into two concise accomplishments so a recruiter can scan it in one pass.",
    });
  } else if (count > BULLET_LIMITS.long) {
    issues.push({
      kind: "too-long",
      severity: "suggestion",
      message: `This bullet is ${count} words long`,
      detail: "Bullets land best at one or two lines. Trimming setup detail usually helps.",
    });
  }

  if (count > 0 && count < BULLET_LIMITS.short) {
    issues.push({
      kind: "too-short",
      severity: "suggestion",
      message: "This bullet is very short",
      detail: "Add what you did and what changed as a result.",
    });
  }

  if (countIdeas(bullet) > 2 && count > 20) {
    issues.push({
      kind: "multiple-ideas",
      severity: "suggestion",
      message: "This bullet covers more than one idea",
      detail: "Splitting each accomplishment onto its own line makes both easier to read.",
    });
  }

  const weak = findWeakPhrases(bullet);
  for (const finding of weak) {
    issues.push({
      kind: "weak-verb",
      severity: "suggestion",
      message: `“${finding.phrase}” weakens this bullet`,
      detail: finding.reason,
      rewrite: finding.rewrite,
      ideas: finding.alternatives,
    });
  }

  if (weak.length === 0 && !startsWithStrongVerb(bullet)) {
    if (/^\w+ing\b/i.test(bullet)) {
      issues.push({
        kind: "gerund-opener",
        severity: "suggestion",
        message: "Start with a finished action",
        detail:
          'Openers like "Developing…" read as ongoing. Past tense signals completed work.',
        ideas: suggestVerbs(bullet, 4),
      });
    } else {
      issues.push({
        kind: "no-verb",
        severity: "suggestion",
        message: "Start this bullet with an action verb",
        detail: "Leading with the verb puts your contribution first.",
        ideas: suggestVerbs(bullet, 4),
      });
    }
  }

  const filler = findFillerWords(bullet);
  if (filler.length >= 2) {
    issues.push({
      kind: "filler",
      severity: "suggestion",
      message: "Several filler words here",
      detail: `Found: ${filler.join(", ")}. Removing them tightens the sentence.`,
    });
  }

  return issues;
}

export interface BulletSetIssue {
  kind: "ends-inconsistently" | "repetitive-opener";
  message: string;
  detail: string;
}

/** Checks a whole set of bullets for patterns only visible together. */
export function analyzeBulletSet(bullets: string[]): BulletSetIssue[] {
  const usable = bullets.map((bullet) => bullet.trim()).filter(Boolean);
  if (usable.length < 2) return [];

  const issues: BulletSetIssue[] = [];

  const withPeriod = usable.filter((bullet) => /[.]$/.test(bullet)).length;
  if (withPeriod > 0 && withPeriod < usable.length) {
    issues.push({
      kind: "ends-inconsistently",
      message: "Bullet endings are inconsistent",
      detail: `${withPeriod} of ${usable.length} bullets end with a full stop. Pick one style and use it everywhere.`,
    });
  }

  const openers = usable.map(
    (bullet) => bullet.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "") ?? "",
  );
  const counts = new Map<string, number>();
  for (const opener of openers) {
    if (!opener) continue;
    counts.set(opener, (counts.get(opener) ?? 0) + 1);
  }
  for (const [opener, count] of counts) {
    if (count >= 3 || (count === usable.length && usable.length >= 2)) {
      issues.push({
        kind: "repetitive-opener",
        message: `${count} bullets start with “${opener}”`,
        detail: "Varying the opening verb keeps the section from reading as a list of the same job.",
      });
      break;
    }
  }

  return issues;
}
