import { analyzeBullet, analyzeBulletSet } from "@/lib/resume-assistant/bulletRules";
import {
  findDuplicates,
  findSkillDuplicates,
} from "@/lib/resume-assistant/duplicateDetection";
import {
  analyzeDateFormats,
  analyzeExperienceEntry,
  analyzeTenseConsistency,
} from "@/lib/resume-assistant/experienceRules";
import { checkGrammar } from "@/lib/resume-assistant/grammarRules";
import {
  analyzeEducation,
  analyzeLinks,
  analyzeMissingSections,
  analyzePersonalInfo,
  analyzeProjects,
  analyzeSkills,
  type SectionFinding,
} from "@/lib/resume-assistant/sectionRules";
import { applySpellingFix, checkSpelling } from "@/lib/resume-assistant/spelling";
import { analyzeSummaryText } from "@/lib/resume-assistant/summaryRules";
import { applyTechnologyFix } from "@/lib/resume-assistant/technologyNormalization";
import { collectTextBlocks } from "@/lib/resume-assistant/duplicateDetection";
import { isNonEmpty, uid } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";
import type { Suggestion, SuggestionSeverity } from "@/types/suggestion";

interface BuildOptions {
  /** Words the user chose to ignore in the spell checker. */
  ignoredWords?: string[];
}

function make(
  severity: SuggestionSeverity,
  category: Suggestion["category"],
  parts: Omit<Suggestion, "id" | "severity" | "category">,
): Suggestion {
  return { id: uid("sug"), severity, category, ...parts };
}

function fromSectionFinding(
  finding: SectionFinding,
  category: Suggestion["category"],
): Suggestion {
  return make(finding.severity, category, {
    title: finding.message,
    detail: finding.detail,
    location: finding.location,
    fieldPath: finding.fieldPath,
    fix: finding.fix,
    dedupeKey: finding.key,
  });
}

/**
 * Turns every rule module's output into a single ordered list of suggestions.
 *
 * Suggestions are pure data: applying one is always an explicit user action, and
 * anything that would change the meaning of a sentence is marked unsafe so it is
 * excluded from "Apply all safe fixes".
 */
export function buildSuggestions(
  resume: ResumeData,
  options: BuildOptions = {},
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const ignoredWords = options.ignoredWords ?? [];

  // --- structural / section checks ---------------------------------------
  for (const finding of analyzePersonalInfo(resume)) {
    // Casing and formatting corrections sit with the other consistency checks;
    // only genuinely missing details count towards completeness.
    suggestions.push(fromSectionFinding(finding, finding.fix?.safe ? "consistency" : "completeness"));
  }
  for (const finding of analyzeLinks(resume)) {
    suggestions.push(fromSectionFinding(finding, "links"));
  }
  for (const finding of analyzeEducation(resume)) {
    suggestions.push(fromSectionFinding(finding, "completeness"));
  }
  for (const finding of analyzeProjects(resume)) {
    suggestions.push(fromSectionFinding(finding, "completeness"));
  }
  for (const finding of analyzeSkills(resume)) {
    suggestions.push(fromSectionFinding(finding, "consistency"));
  }
  for (const finding of analyzeMissingSections(resume)) {
    suggestions.push(fromSectionFinding(finding, "completeness"));
  }

  // --- summary ------------------------------------------------------------
  for (const issue of analyzeSummaryText(
    resume.summary,
    isNonEmpty(resume.personalInfo.jobTitle),
  )) {
    if (issue.kind === "no-role") continue; // already covered by personal info
    suggestions.push(
      make(issue.severity, "writing", {
        title: issue.message,
        detail: issue.detail,
        location: "Summary",
        fieldPath: "summary",
        dedupeKey: `summary:${issue.kind}`,
      }),
    );
  }

  // --- experience ---------------------------------------------------------
  resume.experience.forEach((entry, index) => {
    const label = entry.role || entry.company || `Experience ${index + 1}`;

    for (const issue of analyzeExperienceEntry(entry, index)) {
      suggestions.push(
        make(issue.severity, "completeness", {
          title: issue.message,
          detail: issue.detail,
          location: label,
          fieldPath: issue.fieldPath,
          dedupeKey: `experience:${index}:${issue.kind}:${issue.fieldPath ?? ""}`,
        }),
      );
    }

    for (const issue of analyzeBulletSet(entry.achievements)) {
      suggestions.push(
        make("suggestion", "consistency", {
          title: issue.message,
          detail: issue.detail,
          location: label,
          dedupeKey: `experience:${index}:set:${issue.kind}`,
        }),
      );
    }

    entry.achievements.forEach((bullet, bulletIndex) => {
      if (!isNonEmpty(bullet)) return;
      const fieldPath = `experience.${index}.achievements.${bulletIndex}`;
      const location = `${label} · bullet ${bulletIndex + 1}`;

      for (const issue of analyzeBullet(bullet)) {
        suggestions.push(
          make(issue.severity, issue.kind === "weak-verb" ? "writing" : "formatting", {
            title: issue.message,
            detail: issue.ideas
              ? `${issue.detail} Try: ${issue.ideas.slice(0, 3).join(" · ")}`
              : issue.detail,
            location,
            fieldPath,
            original: bullet,
            fix: issue.rewrite
              ? { label: "Use the stronger wording", replacement: issue.rewrite, safe: false }
              : undefined,
            dedupeKey: `bullet:${fieldPath}:${issue.kind}`,
          }),
        );
      }
    });
  });

  for (const issue of analyzeTenseConsistency(resume)) {
    suggestions.push(
      make("suggestion", "consistency", {
        title: issue.message,
        detail: issue.detail,
        location: issue.role,
        dedupeKey: `tense:${issue.index}`,
      }),
    );
  }

  // --- projects -----------------------------------------------------------
  resume.projects.forEach((entry, index) => {
    const label = entry.name || `Project ${index + 1}`;
    entry.achievements.forEach((bullet, bulletIndex) => {
      if (!isNonEmpty(bullet)) return;
      const fieldPath = `projects.${index}.achievements.${bulletIndex}`;
      for (const issue of analyzeBullet(bullet)) {
        suggestions.push(
          make(issue.severity, "writing", {
            title: issue.message,
            detail: issue.ideas
              ? `${issue.detail} Try: ${issue.ideas.slice(0, 3).join(" · ")}`
              : issue.detail,
            location: `${label} · bullet ${bulletIndex + 1}`,
            fieldPath,
            original: bullet,
            fix: issue.rewrite
              ? { label: "Use the stronger wording", replacement: issue.rewrite, safe: false }
              : undefined,
            dedupeKey: `bullet:${fieldPath}:${issue.kind}`,
          }),
        );
      }
    });
  });

  // --- spelling, grammar and technology casing over every text block ------
  for (const block of collectTextBlocks(resume)) {
    const spelling = checkSpelling(block.text, ignoredWords);
    for (const issue of spelling) {
      suggestions.push(
        make("warning", "spelling", {
          title: issue.message,
          detail:
            issue.kind === "misspelling"
              ? `Replace “${issue.original}” with “${issue.suggestion}”.`
              : `Suggested correction: “${issue.suggestion}”.`,
          location: block.label,
          fieldPath: block.fieldPath,
          original: issue.original,
          fix: {
            label: `Use “${issue.suggestion}”`,
            replacement: applySpellingFix(block.text, issue),
            safe: true,
          },
          dedupeKey: `spelling:${block.fieldPath}:${issue.index}:${issue.original}`,
        }),
      );
    }

    const { findings, technology } = checkGrammar(block.text);
    for (const finding of findings) {
      suggestions.push(
        make("suggestion", "grammar", {
          title: finding.message,
          detail: finding.detail,
          location: block.label,
          fieldPath: block.fieldPath,
          original: block.text,
          fix: finding.replacement
            ? {
                label: "Apply correction",
                replacement: finding.replacement,
                safe: finding.safe,
              }
            : undefined,
          dedupeKey: `grammar:${block.fieldPath}:${finding.id}`,
        }),
      );
    }

    for (const finding of technology) {
      suggestions.push(
        make("suggestion", "consistency", {
          title: `Capitalize technology: ${finding.suggestion}`,
          detail: `“${finding.original}” is conventionally written as “${finding.suggestion}”.`,
          location: block.label,
          fieldPath: block.fieldPath,
          original: finding.original,
          fix: {
            label: `Use “${finding.suggestion}”`,
            replacement: applyTechnologyFix(block.text, finding),
            safe: true,
          },
          dedupeKey: `technology:${block.fieldPath}:${finding.index}:${finding.suggestion}`,
        }),
      );
    }
  }

  // --- duplicates ---------------------------------------------------------
  for (const duplicate of findDuplicates(resume)) {
    suggestions.push(
      make("warning", "duplicate", {
        title: duplicate.exact
          ? "This content appears twice"
          : "Two passages are very similar",
        detail: `“${duplicate.a.label}” and “${duplicate.b.label}” overlap by ${Math.round(
          duplicate.similarity * 100,
        )}%. This content appears elsewhere in your resume — consider making each section more specific.`,
        location: duplicate.b.label,
        fieldPath: duplicate.b.fieldPath,
        original: duplicate.b.text,
        dedupeKey: `duplicate:${duplicate.a.fieldPath}:${duplicate.b.fieldPath}`,
      }),
    );
  }

  for (const duplicate of findSkillDuplicates(resume)) {
    suggestions.push(
      make("suggestion", "duplicate", {
        title: duplicate.exact
          ? `“${duplicate.duplicate}” is listed twice`
          : `“${duplicate.duplicate}” duplicates “${duplicate.kept}”`,
        detail: "Remove one so the skills list stays tight.",
        location: "Skills",
        dedupeKey: `skill-duplicate:${duplicate.kept}:${duplicate.duplicate}`,
      }),
    );
  }

  // --- resume-wide date formatting ---------------------------------------
  const dateFormats = analyzeDateFormats(resume);
  if (dateFormats.mixed) {
    suggestions.push(
      make("suggestion", "formatting", {
        title: "Your resume uses different date formats",
        detail:
          "Pick one format in Customize → Dates and it will be applied everywhere at once.",
        location: "Dates",
        dedupeKey: "dates:mixed",
      }),
    );
  }

  // --- imported content still waiting to be placed -----------------------
  if (resume.unclassifiedContent.length > 0) {
    suggestions.push(
      make("warning", "completeness", {
        title: `${resume.unclassifiedContent.length} imported ${
          resume.unclassifiedContent.length === 1 ? "block" : "blocks"
        } not placed yet`,
        detail:
          "We found content we couldn't confidently categorise. Move it into a section or ignore it.",
        location: "Imported content",
        dedupeKey: "unclassified:pending",
      }),
    );
  }

  return sortSuggestions(dedupe(suggestions));
}

function dedupe(suggestions: Suggestion[]): Suggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    if (seen.has(suggestion.dedupeKey)) return false;
    seen.add(suggestion.dedupeKey);
    return true;
  });
}

const SEVERITY_ORDER: Record<SuggestionSeverity, number> = {
  error: 0,
  warning: 1,
  suggestion: 2,
  success: 3,
};

export function sortSuggestions(suggestions: Suggestion[]): Suggestion[] {
  return [...suggestions].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity],
  );
}

/** Positive confirmations shown alongside the issues. */
export function buildSuccessNotes(resume: ResumeData): Suggestion[] {
  const notes: Suggestion[] = [];

  const info = resume.personalInfo;
  if (
    isNonEmpty(info.fullName) &&
    isNonEmpty(info.email) &&
    isNonEmpty(info.phone) &&
    (isNonEmpty(info.city) || isNonEmpty(info.country))
  ) {
    notes.push(
      make("success", "completeness", {
        title: "Contact information complete",
        detail: "Name, email, phone and location are all present.",
        location: "Personal information",
        dedupeKey: "success:contact",
      }),
    );
  }

  const linkedin = resume.links.find((link) => link.kind === "linkedin");
  if (linkedin) {
    notes.push(
      make("success", "links", {
        title: "LinkedIn URL is valid",
        detail: linkedin.url,
        location: "Links",
        dedupeKey: "success:linkedin",
      }),
    );
  }

  const github = resume.links.find((link) => link.kind === "github");
  if (github) {
    notes.push(
      make("success", "links", {
        title: "GitHub is present",
        detail: github.url,
        location: "Links",
        dedupeKey: "success:github",
      }),
    );
  }

  const bulletCount = resume.experience.reduce(
    (total, entry) => total + entry.achievements.filter(isNonEmpty).length,
    0,
  );
  if (resume.experience.length >= 2 && bulletCount >= 4) {
    notes.push(
      make("success", "completeness", {
        title: `${resume.experience.length} experience entries with detail`,
        detail: `${bulletCount} accomplishment bullets across your roles.`,
        location: "Experience",
        dedupeKey: "success:experience",
      }),
    );
  }

  return notes;
}

/** The subset that "Apply all safe fixes" will act on. */
export function safeFixes(suggestions: Suggestion[]): Suggestion[] {
  return suggestions.filter(
    (suggestion) => suggestion.fix?.safe && Boolean(suggestion.fieldPath),
  );
}
