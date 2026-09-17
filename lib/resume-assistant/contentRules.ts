import { suggestVerbs } from "@/lib/resume-assistant/actionVerbs";

/**
 * Weak-phrase detection.
 *
 * Every rewrite offered here only restates what the user already wrote with a
 * stronger verb. We never add a number, a technology, a scope or an outcome the
 * user did not type — a resume that claims "improved performance by 40%" when
 * the user never said so is a liability, not a feature.
 */
export interface WeakPhraseFinding {
  phrase: string;
  index: number;
  length: number;
  /** Why this phrasing is weak. */
  reason: string;
  /** Concrete alternatives, in the user's own words where possible. */
  alternatives: string[];
  /** A full-string rewrite when a safe mechanical swap exists. */
  rewrite?: string;
}

interface WeakPhraseRule {
  pattern: RegExp;
  reason: string;
  /** Builds a rewrite of the whole bullet, or returns null if not possible. */
  rewrite?: (text: string, match: RegExpMatchArray) => string | null;
  alternatives?: (rest: string) => string[];
}

/** Uppercases the first character without touching the rest. */
function capitaliseFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function stripLeadingArticles(text: string): string {
  return text.replace(/^(the|a|an)\s+/i, "");
}

/** "Responsible for developing X" → "Developed X" */
function verbFromGerund(gerund: string): string | null {
  const word = gerund.toLowerCase();
  if (!word.endsWith("ing")) return null;
  const stem = word.slice(0, -3);

  const irregular: Record<string, string> = {
    lead: "Led",
    writ: "Wrote",
    runn: "Ran",
    mak: "Made",
    tak: "Took",
    build: "Built",
    hold: "Held",
    keep: "Kept",
    tak0: "Took",
  };
  if (irregular[stem]) return irregular[stem];

  // manag(ing) → managed, develop(ing) → developed, plann(ing) → planned
  if (/[^aeiou]$/.test(stem) && /[aeiou][^aeiou]$/.test(stem) && stem.length <= 4) {
    return capitaliseFirst(`${stem}ed`);
  }
  if (stem.endsWith("e")) return capitaliseFirst(`${stem}d`);
  if (/([^aeiou])\1$/.test(stem)) return capitaliseFirst(`${stem.slice(0, -1)}ed`);
  return capitaliseFirst(`${stem}ed`);
}

const RULES: WeakPhraseRule[] = [
  {
    pattern: /\bresponsible for\b\s*/i,
    reason:
      "“Responsible for” describes a job description rather than something you accomplished.",
    rewrite: (text) => {
      const match = text.match(/\bresponsible for\s+(\w+ing)\b\s*(.*)$/i);
      if (match) {
        const verb = verbFromGerund(match[1]);
        if (verb) return `${verb} ${match[2]}`.trim();
      }
      const nounMatch = text.match(/\bresponsible for\s+(.*)$/i);
      if (nounMatch) return `Managed ${stripLeadingArticles(nounMatch[1])}`.trim();
      return null;
    },
    alternatives: (rest) => [`Managed ${rest}`, `Owned ${rest}`, `Led ${rest}`],
  },
  {
    pattern: /\bworked on\b\s*/i,
    reason: "“Worked on” doesn't say what you actually did.",
    rewrite: (text) => {
      const match = text.match(/\bworked on\s+(.*)$/i);
      if (!match) return null;
      return `Developed ${stripLeadingArticles(match[1])}`.trim();
    },
    alternatives: (rest) => [
      `Developed ${rest}`,
      `Built ${rest}`,
      `Maintained ${rest}`,
    ],
  },
  {
    pattern: /\bhelped (with|in|to)?\b\s*/i,
    reason: "“Helped with” understates your contribution.",
    rewrite: (text) => {
      const match = text.match(/\bhelped (?:with|in|to)?\s*(\w+ing|\w+)\s*(.*)$/i);
      if (!match) return null;
      const verb = verbFromGerund(match[1]) ?? capitaliseFirst(match[1]);
      return `Contributed to ${verb.toLowerCase()} ${match[2]}`.replace(/\s+/g, " ").trim();
    },
    alternatives: (rest) => [`Supported ${rest}`, `Contributed to ${rest}`],
  },
  {
    pattern: /\b(?:i\s+)?(?:did|done)\b\s*/i,
    reason: "“Did” is vague — name the actual work.",
    alternatives: (rest) => [`Delivered ${rest}`, `Completed ${rest}`, `Executed ${rest}`],
  },
  {
    pattern: /\bmade\b\s*/i,
    reason: "“Made” is weaker than the specific verb for the work.",
    alternatives: (rest) => [`Built ${rest}`, `Created ${rest}`, `Produced ${rest}`],
  },
  {
    pattern: /\b(?:am\s+)?good at\b\s*/i,
    reason: "“Good at” is a self-assessment. Show the skill through work instead.",
    alternatives: (rest) => [`Experienced in ${rest}`, `Skilled in ${rest}`],
  },
  {
    pattern: /\bknow\b\s*/i,
    reason: "“Know” is vague. State the level or the outcome.",
    alternatives: (rest) => [`Proficient in ${rest}`, `Experienced with ${rest}`],
  },
  {
    pattern: /\bhard[- ]working\b/i,
    reason: "“Hard working” is a claim every resume makes.",
    alternatives: () => ["Show it with a concrete result instead"],
  },
  {
    pattern: /\bteam player\b/i,
    reason: "“Team player” is a cliché. Describe a collaboration you led.",
    alternatives: () => ["Collaborated with …", "Partnered with … to …"],
  },
  {
    pattern: /\bvery good\b/i,
    reason: "“Very good” adds no information.",
    alternatives: () => ["Name the specific skill or result"],
  },
  {
    pattern: /\bassisted (with|in)?\b\s*/i,
    reason: "“Assisted with” hides your own contribution.",
    alternatives: (rest) => [`Supported ${rest}`, `Delivered ${rest}`],
  },
  {
    pattern: /\bvarious\b|\bseveral\b|\bnumerous\b/i,
    reason: "Vague quantities read as filler. Name them, or drop the word.",
    alternatives: () => ["Name the specific items"],
  },
  {
    pattern: /\betc\.?\b/i,
    reason: "“etc.” trails off. List what matters and stop there.",
    alternatives: () => ["Remove “etc.”"],
  },
  {
    pattern: /\bthings\b|\bstuff\b/i,
    reason: "“Things” and “stuff” are placeholders for real detail.",
    alternatives: () => ["Name the deliverables"],
  },
  {
    pattern: /\bpart of (a|the) team\b/i,
    reason: "Being on a team isn't an accomplishment — your contribution is.",
    alternatives: () => ["Describe what you personally delivered"],
  },
];

export const FILLER_WORDS = [
  "basically",
  "actually",
  "really",
  "quite",
  "just",
  "very",
  "simply",
  "literally",
  "definitely",
  "totally",
  "sort of",
  "kind of",
  "a lot of",
  "in order to",
  "as well as",
  "utilise",
  "utilize",
  "leverage",
  "synergy",
  "synergies",
  "go-getter",
  "think outside the box",
  "results-driven",
  "self-starter",
  "detail-oriented",
  "go the extra mile",
];

export function findWeakPhrases(text: string): WeakPhraseFinding[] {
  if (!text.trim()) return [];
  const findings: WeakPhraseFinding[] = [];

  for (const rule of RULES) {
    const match = text.match(rule.pattern);
    if (!match || match.index === undefined) continue;

    const rest = text
      .slice(match.index + match[0].length)
      .trim()
      .replace(/[.]$/, "");

    const rewrite = rule.rewrite?.(text, match) ?? undefined;

    findings.push({
      phrase: match[0].trim(),
      index: match.index,
      length: match[0].trim().length,
      reason: rule.reason,
      alternatives:
        rule.alternatives?.(rest || "…").slice(0, 3) ??
        suggestVerbs(text, 3).map((verb) => `${verb} ${rest || "…"}`),
      rewrite: rewrite && rewrite !== text ? rewrite : undefined,
    });
  }

  return findings.sort((a, b) => a.index - b.index);
}

export function findFillerWords(text: string): string[] {
  const lower = text.toLowerCase();
  return FILLER_WORDS.filter((word) =>
    new RegExp(`\\b${word.replace(/[-/]/g, "[-/ ]")}\\b`, "i").test(lower),
  );
}

/** Counts adjectives from a small resume-specific list, for summary checks. */
const PUFFERY = [
  "passionate",
  "dynamic",
  "innovative",
  "motivated",
  "enthusiastic",
  "dedicated",
  "hardworking",
  "creative",
  "exceptional",
  "outstanding",
  "excellent",
  "expert",
  "guru",
  "ninja",
  "rockstar",
  "world-class",
  "cutting-edge",
  "seasoned",
  "proven",
  "extensive",
  "highly",
];

export function findPuffery(text: string): string[] {
  return PUFFERY.filter((word) => new RegExp(`\\b${word}\\b`, "i").test(text));
}
