import { suggestVerbs } from "@/lib/resume-assistant/actionVerbs";
import { findWeakPhrases } from "@/lib/resume-assistant/contentRules";
import { calculateResumeHealth } from "@/lib/resume-assistant/resumeHealth";
import { checkSpelling, applyAllSpellingFixes } from "@/lib/resume-assistant/spelling";
import { analyzeSummaryText } from "@/lib/resume-assistant/summaryRules";
import { buildSuccessNotes, buildSuggestions } from "@/lib/resume-assistant/suggestions";
import { TECHNOLOGY_CANONICAL } from "@/lib/resume-assistant/technologyNormalization";
import { isNonEmpty, uid } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";
import type {
  AnalysisResult,
  ResumeSuggestionProvider,
  Suggestion,
  SuggestionFix,
} from "@/types/suggestion";

/**
 * The only provider that ships today: every check runs locally from the rule
 * modules in this folder. Nothing is sent anywhere, and nothing here is labelled
 * "AI" because no model is involved.
 *
 * A future `RemoteSuggestionProvider` can implement the same interface against
 * OpenAI, Gemini, Claude or anything else. The UI depends on this interface
 * rather than on the rules, so adding one requires no component changes — and the
 * app remains fully functional without it.
 */
export class LocalRuleSuggestionProvider implements ResumeSuggestionProvider {
  readonly id = "local-rules";
  readonly label = "Smart Suggestions";
  readonly remote = false;

  private ignoredWords: string[];

  constructor(options: { ignoredWords?: string[] } = {}) {
    this.ignoredWords = options.ignoredWords ?? [];
  }

  analyzeSummary(resume: ResumeData): Suggestion[] {
    return analyzeSummaryText(
      resume.summary,
      isNonEmpty(resume.personalInfo.jobTitle),
    ).map((issue) => ({
      id: uid("sug"),
      severity: issue.severity,
      category: "writing" as const,
      title: issue.message,
      detail: issue.detail,
      location: "Summary",
      fieldPath: "summary",
      dedupeKey: `summary:${issue.kind}`,
    }));
  }

  analyzeExperience(resume: ResumeData): Suggestion[] {
    return buildSuggestions(resume, { ignoredWords: this.ignoredWords }).filter(
      (suggestion) => suggestion.fieldPath?.startsWith("experience"),
    );
  }

  analyzeAll(resume: ResumeData): AnalysisResult {
    const suggestions = buildSuggestions(resume, { ignoredWords: this.ignoredWords });
    const successes = buildSuccessNotes(resume);
    return {
      suggestions: [...suggestions, ...successes],
      health: calculateResumeHealth(resume),
    };
  }

  /**
   * Offers rewrites of a single bullet. Every option is derived from the user's
   * own words — no metrics, technologies or outcomes are invented.
   */
  rewriteBullet(bullet: string): SuggestionFix[] {
    const fixes: SuggestionFix[] = [];
    const text = bullet.trim();
    if (!text) return fixes;

    const spelling = checkSpelling(text, this.ignoredWords);
    if (spelling.length > 0) {
      fixes.push({
        label: "Fix spelling",
        replacement: applyAllSpellingFixes(text, spelling),
        safe: true,
      });
    }

    for (const weak of findWeakPhrases(text)) {
      if (!weak.rewrite) continue;
      fixes.push({
        label: `Replace “${weak.phrase}”`,
        replacement: weak.rewrite,
        safe: false,
      });
    }

    return fixes;
  }

  /**
   * Suggests skills the resume already demonstrates but doesn't list. It only
   * proposes technologies that literally appear in the user's own text.
   */
  suggestSkills(resume: ResumeData): string[] {
    const listed = new Set(
      resume.skills
        .flatMap((group) => group.items)
        .map((item) => item.toLowerCase().replace(/[^a-z0-9]/g, "")),
    );

    const corpus = [
      resume.summary,
      ...resume.experience.flatMap((entry) => [
        entry.description,
        ...entry.achievements,
        ...entry.technologies,
      ]),
      ...resume.projects.flatMap((entry) => [
        entry.description,
        ...entry.achievements,
        ...entry.technologies,
      ]),
    ]
      .filter(isNonEmpty)
      .join(" ");

    const mentioned = new Set<string>();
    for (const canonical of Object.values(TECHNOLOGY_CANONICAL)) {
      const key = canonical.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (listed.has(key)) continue;
      const escaped = canonical.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`(?<![A-Za-z0-9])${escaped}(?![A-Za-z0-9])`, "i").test(corpus)) {
        mentioned.add(canonical);
      }
    }

    return [...mentioned].slice(0, 12);
  }

  /** Contextual action verbs for the bullet editor. */
  verbIdeas(text: string): string[] {
    return suggestVerbs(text, 6);
  }
}

/** Shared instance factory so components don't rebuild rule tables per render. */
export function createSuggestionProvider(ignoredWords: string[] = []) {
  return new LocalRuleSuggestionProvider({ ignoredWords });
}

export const PROVIDER_DISCLOSURE = {
  name: "Smart Suggestions",
  summary:
    "All writing checks run locally in your browser using ResumeForge's own rule set.",
  detail:
    "No AI model is involved and your resume text is never sent to a server or a third-party service. If a remote provider is ever added, it will be opt-in and disclosed here.",
} as const;
