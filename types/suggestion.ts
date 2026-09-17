import type { ResumeData } from "./resume";

export type SuggestionSeverity = "error" | "warning" | "suggestion" | "success";

export type SuggestionCategory =
  | "spelling"
  | "grammar"
  | "writing"
  | "formatting"
  | "consistency"
  | "completeness"
  | "duplicate"
  | "links";

/**
 * A field path locates the text a suggestion is about, e.g.
 *   "summary"
 *   "experience.2.achievements.0"
 *   "personalInfo.email"
 */
export type FieldPath = string;

export interface SuggestionFix {
  /** Human readable label for the button, e.g. `Use "React Native"`. */
  label: string;
  /** Full replacement value for the target field path. */
  replacement: string;
  /**
   * Safe fixes only correct spelling/casing/whitespace and never change
   * meaning, so they can be batch-applied via "Apply all safe fixes".
   */
  safe: boolean;
}

export interface Suggestion {
  id: string;
  severity: SuggestionSeverity;
  category: SuggestionCategory;
  /** Short headline shown in the card. */
  title: string;
  /** Explanation of why this matters. */
  detail: string;
  /** Human readable location, e.g. "Experience 2 · bullet 1". */
  location: string;
  fieldPath?: FieldPath;
  /** The exact text the suggestion refers to, when applicable. */
  original?: string;
  /** Offered rewrite, when the suggestion can be applied. */
  fix?: SuggestionFix;
  /** Suggestions the user dismissed are keyed by this value. */
  dedupeKey: string;
}

export interface HealthCategoryScore {
  key: string;
  label: string;
  score: number;
  max: number;
  positives: string[];
  negatives: string[];
}

export interface ResumeHealthReport {
  score: number;
  grade: "Excellent" | "Strong" | "Fair" | "Needs work";
  categories: HealthCategoryScore[];
  positives: string[];
  needsAttention: string[];
}

export interface AnalysisResult {
  suggestions: Suggestion[];
  health: ResumeHealthReport;
}

/**
 * Provider interface so an AI backend can be added later without touching the
 * UI. `LocalRuleSuggestionProvider` is the only implementation today and runs
 * fully offline in the browser.
 */
export interface ResumeSuggestionProvider {
  readonly id: string;
  readonly label: string;
  /** True when the provider sends content to a remote service. */
  readonly remote: boolean;
  analyzeSummary(resume: ResumeData): Suggestion[];
  analyzeExperience(resume: ResumeData): Suggestion[];
  analyzeAll(resume: ResumeData): AnalysisResult;
  rewriteBullet(bullet: string): SuggestionFix[];
  suggestSkills(resume: ResumeData): string[];
}
