import {
  findTechnologyIssues,
  type TechnologyFinding,
} from "@/lib/resume-assistant/technologyNormalization";

/**
 * Rule-based writing checks. Everything here is deterministic and explainable —
 * these are not model outputs, and nothing is applied without the user asking.
 */
export interface GrammarFinding {
  id: string;
  message: string;
  detail: string;
  /** A safe fix only touches casing, spacing or punctuation. */
  safe: boolean;
  /** The corrected version of the whole input string. */
  replacement?: string;
  original?: string;
}

/** Capitalises the standalone pronoun "i". */
function lowercasePronoun(text: string): GrammarFinding | null {
  if (!/(^|\s)i(\s|'|$)/.test(text)) return null;
  return {
    id: "pronoun-i",
    message: 'Capitalize the pronoun "I"',
    detail: 'The standalone pronoun "i" should be written as "I".',
    safe: true,
    original: text,
    replacement: text.replace(/(^|\s)i(?=\s|'|$)/g, (match) =>
      match.replace("i", "I"),
    ),
  };
}

/** Capitalises the first letter of the line. */
function sentenceStart(text: string): GrammarFinding | null {
  const trimmed = text.trimStart();
  if (!trimmed) return null;
  const first = trimmed[0];
  if (!/[a-z]/.test(first)) return null;
  return {
    id: "sentence-start",
    message: "Start this line with a capital letter",
    detail: "Resume bullets and sentences read better when they start capitalised.",
    safe: true,
    original: text,
    replacement: text.replace(trimmed, trimmed[0].toUpperCase() + trimmed.slice(1)),
  };
}

/** Collapses double spaces and fixes space-before-punctuation. */
function spacingIssues(text: string): GrammarFinding | null {
  const fixed = text
    .replace(/ {2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/([,;:])(?=[^\s])/g, "$1 ")
    .trim();
  if (fixed === text.trim()) return null;
  return {
    id: "spacing",
    message: "Tidy up spacing and punctuation",
    detail: "There are extra spaces or a space before punctuation.",
    safe: true,
    original: text,
    replacement: fixed,
  };
}

/** `a application` → `an application`. */
function articleAgreement(text: string): GrammarFinding | null {
  const pattern = /\ba\s+(?=[aeiou][a-z]{2,})/gi;
  const wrongAn = /\ban\s+(?=[bcdfgjklmnpqrstvwyz][a-z]{2,})/gi;

  // Words that break the naive vowel rule.
  const exceptions = /\ba\s+(un[a-z]+|uni[a-z]+|user|useful|one|once|euro[a-z]*)\b/gi;

  const hasA = pattern.test(text) && !exceptions.test(text);
  const hasAn = wrongAn.test(text) && !/\ban\s+(hour|honest|honor)/i.test(text);
  if (!hasA && !hasAn) return null;

  let replacement = text;
  if (hasA) {
    replacement = replacement.replace(
      /\b(a)(\s+)(?=[aeiou][a-z]{2,})/gi,
      (_match, article: string, space: string) =>
        `${article === "A" ? "An" : "an"}${space}`,
    );
  }
  if (hasAn) {
    replacement = replacement.replace(
      /\b(an)(\s+)(?=[bcdfgjklmnpqrstvwyz][a-z]{2,})/gi,
      (_match, article: string, space: string) =>
        `${article === "An" ? "A" : "a"}${space}`,
    );
  }

  if (replacement === text) return null;

  return {
    id: "article",
    message: 'Check "a" and "an"',
    detail: 'Use "an" before a vowel sound and "a" before a consonant sound.',
    safe: true,
    original: text,
    replacement,
  };
}

/** Flags present-tense verbs in a role that has ended. */
const PRESENT_TENSE_OPENERS =
  /^(develop|build|design|manage|lead|create|implement|maintain|write|test|deploy|support|coordinate|analyse|analyze|handle|work|help|review|optimise|optimize|integrate|automate|mentor|own|run)(s|ing)?\b/i;

export function pastTenseFinding(text: string): GrammarFinding | null {
  const trimmed = text.trim();
  const match = trimmed.match(PRESENT_TENSE_OPENERS);
  if (!match) return null;
  // `-ing` openers are a different problem, handled by the bullet rules.
  if (match[2] === "ing") return null;

  return {
    id: "past-tense",
    message: "Use past tense for a role that has ended",
    detail: `This bullet starts with "${match[1]}". For previous roles, past tense reads as completed work.`,
    safe: false,
  };
}

/** Flags first-person pronouns, which resumes conventionally omit. */
export function firstPersonFinding(text: string): GrammarFinding | null {
  const matches = text.match(/\b(I|me|my|mine|myself)\b/g);
  if (!matches || matches.length === 0) return null;
  return {
    id: "first-person",
    message: "Consider removing first-person pronouns",
    detail: `Found ${matches.length} first-person ${
      matches.length === 1 ? "pronoun" : "pronouns"
    }. Resumes usually drop "I" and "my" and start with the verb instead.`,
    safe: false,
  };
}

/** Inconsistent bullet endings — some with a full stop, some without. */
export function endingConsistency(bullets: string[]): boolean {
  const usable = bullets.map((bullet) => bullet.trim()).filter(Boolean);
  if (usable.length < 2) return true;
  const withPeriod = usable.filter((bullet) => /[.]$/.test(bullet)).length;
  return withPeriod === 0 || withPeriod === usable.length;
}

/**
 * Runs the safe, mechanical checks over one string. Technology casing is
 * returned separately because each name is its own suggestion.
 */
export function checkGrammar(text: string): {
  findings: GrammarFinding[];
  technology: TechnologyFinding[];
} {
  if (!text.trim()) return { findings: [], technology: [] };

  const findings = [
    lowercasePronoun(text),
    sentenceStart(text),
    spacingIssues(text),
    articleAgreement(text),
  ].filter((finding): finding is GrammarFinding => finding !== null);

  return { findings, technology: findTechnologyIssues(text) };
}
