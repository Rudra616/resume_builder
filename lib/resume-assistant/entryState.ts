import { isNonEmpty } from "@/lib/utils";
import type {
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeData,
} from "@/types/resume";

/**
 * A repeatable section always keeps one blank row on screen so there is
 * somewhere to type. Those untouched rows are not mistakes, so every check that
 * reports what an entry is missing skips them — otherwise a brand new resume
 * opens with a list of complaints about fields the user hasn't reached yet.
 */

function anyFilled(...values: (string | undefined)[]): boolean {
  return values.some((value) => isNonEmpty(value));
}

export function isBlankExperience(entry: ExperienceEntry): boolean {
  return (
    !anyFilled(
      entry.role,
      entry.company,
      entry.location,
      entry.startDate,
      entry.endDate,
      entry.description,
    ) &&
    entry.achievements.filter(isNonEmpty).length === 0 &&
    entry.technologies.filter(isNonEmpty).length === 0
  );
}

export function isBlankEducation(entry: EducationEntry): boolean {
  return !anyFilled(
    entry.degree,
    entry.institution,
    entry.field,
    entry.location,
    entry.startDate,
    entry.endDate,
    entry.grade,
    entry.description,
  );
}

export function isBlankProject(entry: ProjectEntry): boolean {
  return (
    !anyFilled(
      entry.name,
      entry.role,
      entry.description,
      entry.startDate,
      entry.endDate,
      entry.url,
      entry.repoUrl,
    ) &&
    entry.achievements.filter(isNonEmpty).length === 0 &&
    entry.technologies.filter(isNonEmpty).length === 0
  );
}

/**
 * The resume as the health report should see it: started entries only.
 *
 * Only safe where positions don't matter — filtering shifts array indexes, so
 * anything that reports a `fieldPath` must skip blank entries in place instead.
 */
export function withoutBlankEntries(resume: ResumeData): ResumeData {
  return {
    ...resume,
    experience: resume.experience.filter((entry) => !isBlankExperience(entry)),
    education: resume.education.filter((entry) => !isBlankEducation(entry)),
    projects: resume.projects.filter((entry) => !isBlankProject(entry)),
  };
}
