import { analyzeBulletSet, BULLET_LIMITS } from "@/lib/resume-assistant/bulletRules";
import { findDuplicates, findSkillDuplicates } from "@/lib/resume-assistant/duplicateDetection";
import {
  analyzeDateFormats,
  analyzeTenseConsistency,
} from "@/lib/resume-assistant/experienceRules";
import { startsWithStrongVerb } from "@/lib/resume-assistant/actionVerbs";
import { checkSpelling } from "@/lib/resume-assistant/spelling";
import { SUMMARY_GUIDANCE } from "@/lib/resume-assistant/summaryRules";
import { collectTextBlocks } from "@/lib/resume-assistant/duplicateDetection";
import { isValidUrl } from "@/lib/validation";
import { clamp, isNonEmpty, wordCount } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";
import type { HealthCategoryScore, ResumeHealthReport } from "@/types/suggestion";

/**
 * Resume Health is a transparent local rubric, not an ATS score.
 *
 * Every point is earned or lost by a rule stated in plain language below, and
 * the panel shows the user exactly which ones fired. There is no model, no
 * benchmark dataset and no claim of predictive accuracy.
 */

interface Rubric {
  key: string;
  label: string;
  max: number;
  evaluate: (resume: ResumeData) => { score: number; positives: string[]; negatives: string[] };
}

const RUBRIC: Rubric[] = [
  {
    key: "completeness",
    label: "Content completeness",
    max: 22,
    evaluate: (resume) => {
      const positives: string[] = [];
      const negatives: string[] = [];
      let score = 0;

      const info = resume.personalInfo;
      const contactFields = [info.fullName, info.email, info.phone, info.city];
      const filled = contactFields.filter(isNonEmpty).length;
      if (filled === contactFields.length) {
        score += 6;
        positives.push("Contact information complete");
      } else {
        score += Math.round((filled / contactFields.length) * 6);
        negatives.push(
          `${contactFields.length - filled} contact ${
            contactFields.length - filled === 1 ? "field is" : "fields are"
          } missing`,
        );
      }

      if (isNonEmpty(info.jobTitle)) {
        score += 2;
        positives.push("Professional title present");
      } else {
        negatives.push("No professional title under your name");
      }

      if (isNonEmpty(resume.summary)) {
        score += 3;
        positives.push("Professional summary included");
      } else {
        negatives.push("No professional summary");
      }

      const roles = resume.experience.filter(
        (entry) => isNonEmpty(entry.role) || isNonEmpty(entry.company),
      ).length;
      if (roles >= 2) {
        score += 6;
        positives.push(`${roles} experience entries`);
      } else if (roles === 1) {
        score += 3;
        positives.push("1 experience entry");
        negatives.push("Only one role listed");
      } else {
        negatives.push("No work experience listed");
      }

      if (resume.education.some((entry) => isNonEmpty(entry.institution))) {
        score += 3;
        positives.push("Education included");
      } else {
        negatives.push("No education entries");
      }

      if (resume.skills.some((group) => group.items.filter(isNonEmpty).length > 0)) {
        score += 2;
        positives.push("Skills section included");
      } else {
        negatives.push("No skills listed");
      }

      return { score: clamp(score, 0, 22), positives, negatives };
    },
  },

  {
    key: "experience-detail",
    label: "Experience detail",
    max: 18,
    evaluate: (resume) => {
      const positives: string[] = [];
      const negatives: string[] = [];

      if (resume.experience.length === 0) {
        return { score: 0, positives, negatives: ["No experience to assess"] };
      }

      let score = 0;
      const withBullets = resume.experience.filter(
        (entry) => entry.achievements.filter(isNonEmpty).length >= 2,
      ).length;
      const ratio = withBullets / resume.experience.length;
      score += Math.round(ratio * 9);

      if (ratio === 1) positives.push("Every role has accomplishment bullets");
      else if (withBullets === 0) negatives.push("No role has accomplishment bullets");
      else
        negatives.push(
          `${resume.experience.length - withBullets} of ${resume.experience.length} roles have fewer than two bullets`,
        );

      const allBullets = resume.experience.flatMap((entry) =>
        entry.achievements.filter(isNonEmpty),
      );
      const strong = allBullets.filter(startsWithStrongVerb).length;
      if (allBullets.length > 0) {
        const strongRatio = strong / allBullets.length;
        score += Math.round(strongRatio * 6);
        if (strongRatio >= 0.8) positives.push("Bullets lead with strong action verbs");
        else
          negatives.push(
            `${allBullets.length - strong} of ${allBullets.length} bullets don't start with an action verb`,
          );
      }

      const dated = resume.experience.filter((entry) => isNonEmpty(entry.startDate)).length;
      if (dated === resume.experience.length) {
        score += 3;
        positives.push("All roles have dates");
      } else {
        negatives.push(`${resume.experience.length - dated} roles are missing dates`);
      }

      return { score: clamp(score, 0, 18), positives, negatives };
    },
  },

  {
    key: "readability",
    label: "Readability",
    max: 16,
    evaluate: (resume) => {
      const positives: string[] = [];
      const negatives: string[] = [];
      let score = 16;

      const bullets = [
        ...resume.experience.flatMap((entry) => entry.achievements),
        ...resume.projects.flatMap((entry) => entry.achievements),
      ].filter(isNonEmpty);

      const overLong = bullets.filter(
        (bullet) => wordCount(bullet) > BULLET_LIMITS.veryLong,
      ).length;
      const longish = bullets.filter(
        (bullet) =>
          wordCount(bullet) > BULLET_LIMITS.long &&
          wordCount(bullet) <= BULLET_LIMITS.veryLong,
      ).length;

      if (overLong > 0) {
        score -= Math.min(7, overLong * 3);
        negatives.push(
          `${overLong} ${overLong === 1 ? "bullet is" : "bullets are"} over ${BULLET_LIMITS.veryLong} words`,
        );
      }
      if (longish > 0) {
        score -= Math.min(4, longish);
        negatives.push(
          `${longish} ${longish === 1 ? "bullet is" : "bullets are"} over ${BULLET_LIMITS.long} words`,
        );
      }
      if (overLong === 0 && longish === 0 && bullets.length > 0) {
        positives.push("Bullet lengths are comfortable");
      }

      const summaryWords = wordCount(resume.summary);
      if (summaryWords > SUMMARY_GUIDANCE.hardMaxWords) {
        score -= 5;
        negatives.push(`Professional summary is very long (${summaryWords} words)`);
      } else if (summaryWords > SUMMARY_GUIDANCE.maxWords) {
        score -= 2;
        negatives.push(`Professional summary is a little long (${summaryWords} words)`);
      } else if (summaryWords >= SUMMARY_GUIDANCE.minWords) {
        positives.push("Summary length is well judged");
      }

      const paragraphRoles = resume.experience.filter(
        (entry) =>
          entry.achievements.filter(isNonEmpty).length === 0 &&
          wordCount(entry.description) > 40,
      ).length;
      if (paragraphRoles > 0) {
        score -= paragraphRoles * 2;
        negatives.push(`${paragraphRoles} ${paragraphRoles === 1 ? "role is" : "roles are"} written as a long paragraph`);
      }

      return { score: clamp(score, 0, 16), positives, negatives };
    },
  },

  {
    key: "consistency",
    label: "Consistency",
    max: 14,
    evaluate: (resume) => {
      const positives: string[] = [];
      const negatives: string[] = [];
      let score = 14;

      const dates = analyzeDateFormats(resume);
      if (dates.mixed) {
        score -= 4;
        negatives.push("Your resume uses different date formats");
      } else {
        positives.push("Date formats are consistent");
      }

      const tense = analyzeTenseConsistency(resume);
      if (tense.length > 0) {
        score -= Math.min(4, tense.length * 2);
        negatives.push(`${tense.length} past ${tense.length === 1 ? "role uses" : "roles use"} present tense`);
      } else if (resume.experience.length > 0) {
        positives.push("Verb tense matches each role's status");
      }

      const inconsistentEndings = resume.experience.filter(
        (entry) =>
          analyzeBulletSet(entry.achievements).some(
            (issue) => issue.kind === "ends-inconsistently",
          ),
      ).length;
      if (inconsistentEndings > 0) {
        score -= Math.min(3, inconsistentEndings);
        negatives.push(
          `${inconsistentEndings} ${inconsistentEndings === 1 ? "role mixes" : "roles mix"} bullet endings`,
        );
      }

      const duplicates = findDuplicates(resume);
      const skillDuplicates = findSkillDuplicates(resume);
      if (duplicates.length > 0) {
        score -= Math.min(4, duplicates.length * 2);
        negatives.push(
          `${duplicates.length} duplicated ${duplicates.length === 1 ? "passage" : "passages"} found`,
        );
      }
      if (skillDuplicates.length > 0) {
        score -= Math.min(2, skillDuplicates.length);
        negatives.push(`${skillDuplicates.length} duplicate skills`);
      }
      if (duplicates.length === 0 && skillDuplicates.length === 0) {
        positives.push("No duplicated content");
      }

      return { score: clamp(score, 0, 14), positives, negatives };
    },
  },

  {
    key: "writing",
    label: "Writing quality",
    max: 14,
    evaluate: (resume) => {
      const positives: string[] = [];
      const negatives: string[] = [];
      let score = 14;

      const blocks = collectTextBlocks(resume);
      const spellingIssues = blocks.flatMap((block) => checkSpelling(block.text));

      if (spellingIssues.length > 0) {
        score -= Math.min(8, spellingIssues.length * 2);
        negatives.push(
          `${spellingIssues.length} spelling ${spellingIssues.length === 1 ? "issue" : "issues"} detected`,
        );
      } else if (blocks.length > 0) {
        positives.push("No spelling issues detected");
      }

      const firstPerson = blocks.filter((block) =>
        /\b(I|my|me)\b/.test(block.text),
      ).length;
      if (firstPerson > 2) {
        score -= 3;
        negatives.push(`First-person pronouns appear in ${firstPerson} places`);
      }

      return { score: clamp(score, 0, 14), positives, negatives };
    },
  },

  {
    key: "links",
    label: "Links",
    max: 8,
    evaluate: (resume) => {
      const positives: string[] = [];
      const negatives: string[] = [];
      let score = 0;

      const usable = resume.links.filter((link) => isNonEmpty(link.url));
      const invalid = usable.filter((link) => !isValidUrl(link.url));
      const kinds = new Set(usable.map((link) => link.kind));

      if (kinds.has("linkedin")) {
        score += 3;
        positives.push("LinkedIn URL is valid");
      } else {
        negatives.push("LinkedIn profile is not included");
      }

      if (kinds.has("github")) {
        score += 2;
        positives.push("GitHub is present");
      } else {
        negatives.push("GitHub profile is not included");
      }

      if (kinds.has("portfolio") || kinds.has("website")) {
        score += 2;
        positives.push("Portfolio or website included");
      }

      if (usable.length > 0 && invalid.length === 0) score += 1;
      if (invalid.length > 0) {
        score = Math.max(0, score - 2);
        negatives.push(
          invalid.length === 1
            ? `${invalid[0].label || "One link"} is not a valid URL`
            : `${invalid.length} links are not valid URLs`,
        );
      }

      return { score: clamp(score, 0, 8), positives, negatives };
    },
  },

  {
    key: "skills",
    label: "Skills",
    max: 4,
    evaluate: (resume) => {
      const positives: string[] = [];
      const negatives: string[] = [];
      const items = resume.skills.flatMap((group) => group.items).filter(isNonEmpty);

      if (items.length === 0) {
        return { score: 0, positives, negatives: ["No skills listed"] };
      }

      let score = 2;
      if (items.length >= 6) {
        score += 1;
        positives.push(`${items.length} skills listed`);
      } else {
        negatives.push("Only a few skills listed");
      }

      if (resume.skills.filter((group) => group.items.length > 0).length > 1) {
        score += 1;
        positives.push("Skills are grouped by category");
      }

      return { score: clamp(score, 0, 4), positives, negatives };
    },
  },

  {
    key: "formatting",
    label: "Formatting",
    max: 4,
    evaluate: (resume) => {
      const positives: string[] = [];
      const negatives: string[] = [];
      let score = 4;

      const visible = resume.sectionOrder.filter((entry) => entry.visible).length;
      if (visible < 3) {
        score -= 2;
        negatives.push("Very few sections are visible");
      } else {
        positives.push(`${visible} sections enabled`);
      }

      if (resume.unclassifiedContent.length > 0) {
        score -= 2;
        negatives.push(
          `${resume.unclassifiedContent.length} imported ${
            resume.unclassifiedContent.length === 1 ? "block hasn't" : "blocks haven't"
          } been placed yet`,
        );
      }

      return { score: clamp(score, 0, 4), positives, negatives };
    },
  },
];

export const HEALTH_MAX = RUBRIC.reduce((total, rubric) => total + rubric.max, 0);

function gradeFor(score: number): ResumeHealthReport["grade"] {
  if (score >= 88) return "Excellent";
  if (score >= 72) return "Strong";
  if (score >= 55) return "Fair";
  return "Needs work";
}

export function calculateResumeHealth(resume: ResumeData): ResumeHealthReport {
  const categories: HealthCategoryScore[] = [];
  const positives: string[] = [];
  const needsAttention: string[] = [];
  let total = 0;

  for (const rubric of RUBRIC) {
    const result = rubric.evaluate(resume);
    total += result.score;
    categories.push({
      key: rubric.key,
      label: rubric.label,
      score: result.score,
      max: rubric.max,
      positives: result.positives,
      negatives: result.negatives,
    });
    positives.push(...result.positives);
    needsAttention.push(...result.negatives);
  }

  const score = Math.round((total / HEALTH_MAX) * 100);

  return { score, grade: gradeFor(score), categories, positives, needsAttention };
}
