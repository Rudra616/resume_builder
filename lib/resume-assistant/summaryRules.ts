import { findPuffery, findWeakPhrases } from "@/lib/resume-assistant/contentRules";
import { firstPersonFinding } from "@/lib/resume-assistant/grammarRules";
import { wordCount } from "@/lib/utils";

/** Guidance, not enforcement: roughly two to five concise sentences. */
export const SUMMARY_GUIDANCE = {
  minWords: 25,
  maxWords: 90,
  hardMaxWords: 130,
  minSentences: 2,
  maxSentences: 5,
};

export interface SummaryIssue {
  kind:
    | "missing"
    | "too-short"
    | "too-long"
    | "too-many-sentences"
    | "first-person"
    | "generic"
    | "puffery"
    | "no-role";
  severity: "error" | "warning" | "suggestion";
  message: string;
  detail: string;
}

const GENERIC_OPENERS = [
  /^i am a/i,
  /^i'm a/i,
  /^a (highly )?(motivated|passionate|dedicated|hardworking)/i,
  /^seeking (a|an|the)? ?(challenging|rewarding)? ?(position|role|opportunity)/i,
  /^looking for (a|an)? ?(job|position|role|opportunity)/i,
  /^to (obtain|secure) a (position|role)/i,
  /^hard ?working (and )?(dedicated )?(individual|person|professional)/i,
];

export function analyzeSummaryText(summary: string, hasJobTitle: boolean): SummaryIssue[] {
  const text = summary.trim();
  const issues: SummaryIssue[] = [];

  if (!text) {
    return [
      {
        kind: "missing",
        severity: "suggestion",
        message: "Add a professional summary",
        detail:
          "Two to five sentences describing your focus, your strongest skills and the kind of work you want next.",
      },
    ];
  }

  const count = wordCount(text);
  const sentences = text.split(/(?<=[.!?])\s+/).filter((part) => part.trim().length > 0)
    .length;

  if (count < SUMMARY_GUIDANCE.minWords) {
    issues.push({
      kind: "too-short",
      severity: "suggestion",
      message: `Your summary is only ${count} words`,
      detail:
        "Around two to five concise sentences gives a recruiter enough to place you quickly.",
    });
  }

  if (count > SUMMARY_GUIDANCE.hardMaxWords) {
    issues.push({
      kind: "too-long",
      severity: "warning",
      message: `Your summary is ${count} words — that's very long`,
      detail:
        "Summaries this long usually get skipped. Move the detail into your experience bullets.",
    });
  } else if (count > SUMMARY_GUIDANCE.maxWords) {
    issues.push({
      kind: "too-long",
      severity: "suggestion",
      message: `Your summary is ${count} words`,
      detail: "Tightening it to around 90 words keeps the top of the page scannable.",
    });
  }

  if (sentences > SUMMARY_GUIDANCE.maxSentences) {
    issues.push({
      kind: "too-many-sentences",
      severity: "suggestion",
      message: `Your summary runs to ${sentences} sentences`,
      detail: "Two to five sentences is the range that reads best here.",
    });
  }

  const firstPerson = firstPersonFinding(text);
  if (firstPerson) {
    issues.push({
      kind: "first-person",
      severity: "suggestion",
      message: firstPerson.message,
      detail: firstPerson.detail,
    });
  }

  const generic = GENERIC_OPENERS.find((pattern) => pattern.test(text));
  if (generic) {
    issues.push({
      kind: "generic",
      severity: "suggestion",
      message: "This opening is very generic",
      detail:
        "Openers like this appear on thousands of resumes. Leading with your role and focus is more memorable.",
    });
  }

  const puffery = findPuffery(text);
  if (puffery.length >= 3) {
    issues.push({
      kind: "puffery",
      severity: "suggestion",
      message: "Several self-describing adjectives",
      detail: `Found: ${puffery.join(", ")}. Concrete specifics carry more weight than adjectives.`,
    });
  }

  const weak = findWeakPhrases(text);
  for (const finding of weak.slice(0, 2)) {
    issues.push({
      kind: "generic",
      severity: "suggestion",
      message: `“${finding.phrase}” in your summary`,
      detail: finding.reason,
    });
  }

  if (!hasJobTitle && count > 0) {
    issues.push({
      kind: "no-role",
      severity: "suggestion",
      message: "Add a professional title",
      detail:
        "A title under your name tells the reader what role you're targeting before they read anything else.",
    });
  }

  return issues;
}
