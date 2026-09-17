import type { CSSProperties } from "react";
import { fontStack } from "@/lib/fonts";
import { isNonEmpty } from "@/lib/utils";
import type {
  PersonalInfo,
  ResumeData,
  ResumeDesign,
  SectionKey,
} from "@/types/resume";

export const SECTION_LABELS: Record<string, string> = {
  summary: "Professional Summary",
  experience: "Experience",
  education: "Education",
  projects: "Projects",
  skills: "Skills",
  certifications: "Certifications",
  languages: "Languages",
  awards: "Awards",
  volunteering: "Volunteering",
  references: "References",
  links: "Links",
};

/** Short labels used by templates with narrow sidebars. */
export const SECTION_LABELS_SHORT: Record<string, string> = {
  ...SECTION_LABELS,
  summary: "Profile",
};

export function sectionHeading(
  resume: ResumeData,
  key: SectionKey,
  short = false,
): string {
  if (key.startsWith("custom:")) {
    const id = key.slice("custom:".length);
    const section = resume.customSections.find((entry) => entry.id === id);
    return section?.heading || "Custom Section";
  }
  const map = short ? SECTION_LABELS_SHORT : SECTION_LABELS;
  return map[key] ?? key;
}

export function hasSectionContent(resume: ResumeData, key: SectionKey): boolean {
  if (key.startsWith("custom:")) {
    const id = key.slice("custom:".length);
    const section = resume.customSections.find((entry) => entry.id === id);
    if (!section) return false;
    return section.items.some(
      (item) =>
        isNonEmpty(item.title) ||
        isNonEmpty(item.subtitle) ||
        isNonEmpty(item.description) ||
        item.bullets.some(isNonEmpty),
    );
  }

  switch (key) {
    case "summary":
      return isNonEmpty(resume.summary);
    case "experience":
      return resume.experience.some(
        (entry) =>
          isNonEmpty(entry.role) ||
          isNonEmpty(entry.company) ||
          entry.achievements.some(isNonEmpty),
      );
    case "education":
      return resume.education.some(
        (entry) => isNonEmpty(entry.degree) || isNonEmpty(entry.institution),
      );
    case "projects":
      return resume.projects.some(
        (entry) => isNonEmpty(entry.name) || isNonEmpty(entry.description),
      );
    case "skills":
      return resume.skills.some((group) => group.items.some(isNonEmpty));
    case "certifications":
      return resume.certifications.some((entry) => isNonEmpty(entry.name));
    case "languages":
      return resume.languages.some((entry) => isNonEmpty(entry.name));
    case "awards":
      return resume.awards.some((entry) => isNonEmpty(entry.title));
    case "volunteering":
      return resume.volunteering.some(
        (entry) => isNonEmpty(entry.role) || isNonEmpty(entry.organization),
      );
    case "references":
      return resume.references.some((entry) => isNonEmpty(entry.name));
    case "links":
      return resume.links.some((entry) => isNonEmpty(entry.url));
    default:
      return false;
  }
}

/** Ordered section keys that are both visible and non-empty. */
export function visibleSections(resume: ResumeData): SectionKey[] {
  return resume.sectionOrder
    .filter((entry) => entry.visible)
    .map((entry) => entry.key)
    .filter((key) => hasSectionContent(resume, key));
}

/**
 * Splits sections for two-column templates: the listed keys go to the sidebar
 * (in the user's chosen order), everything else stays in the main column.
 */
export function partitionSections(
  resume: ResumeData,
  sidebarKeys: SectionKey[],
): { sidebar: SectionKey[]; main: SectionKey[] } {
  const all = visibleSections(resume);
  const wanted = new Set(sidebarKeys);
  return {
    sidebar: all.filter((key) => wanted.has(key)),
    main: all.filter((key) => !wanted.has(key)),
  };
}

export function locationLine(info: PersonalInfo): string {
  return [info.city, info.state, info.country].filter(isNonEmpty).join(", ");
}

export function fullLocation(city: string, state?: string, country?: string): string {
  return [city, state, country].filter(isNonEmpty).join(", ");
}

/** Ensures hrefs are absolute so links stay clickable in the exported PDF. */
export function normalizeHref(url: string): string {
  const value = url.trim();
  if (!value) return "";
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (/^www\./i.test(value)) return `https://${value}`;
  if (/^[\w-]+(\.[\w-]+)+/.test(value)) return `https://${value}`;
  return value;
}

/** Strips scheme and trailing slash for display, keeping the href intact. */
export function displayUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

export function skillsFlat(resume: ResumeData): string[] {
  return resume.skills.flatMap((group) => group.items.filter(isNonEmpty));
}

export interface ResumeCssVars extends CSSProperties {
  "--resume-accent"?: string;
  "--resume-secondary"?: string;
  "--resume-text"?: string;
  "--resume-font"?: string;
  "--resume-heading-font"?: string;
  "--resume-font-size"?: string;
  "--resume-line-height"?: string;
  "--resume-section-gap"?: string;
  "--resume-padding"?: string;
}

/** Turns design settings into CSS custom properties for the resume page. */
export function resumeCssVars(design: ResumeDesign): ResumeCssVars {
  return {
    "--resume-accent": design.accentColor,
    "--resume-secondary": design.secondaryColor,
    "--resume-text": design.textColor,
    "--resume-font": fontStack(design.fontFamily),
    "--resume-heading-font": fontStack(design.headingFontFamily),
    "--resume-font-size": `${design.fontSize}pt`,
    "--resume-line-height": `${design.lineHeight}`,
    "--resume-section-gap": `${design.sectionSpacing}px`,
    "--resume-padding": `${design.pagePadding}mm`,
  };
}

/** Mixes an accent colour with white for subtle tinted backgrounds. */
export function tint(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, #ffffff)`;
}

/** Mixes an accent colour with black for deeper shades. */
export function shade(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, #000000)`;
}

export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
