import { isSuspiciousDate, parseLooseDate } from "@/lib/dates";
import { findTechnologyIssues } from "@/lib/resume-assistant/technologyNormalization";
import {
  formatPhoneHint,
  isGitHubUrl,
  isLinkedInUrl,
  isValidEmail,
  isValidPhone,
  isValidUrl,
} from "@/lib/validation";
import { isNonEmpty, titleCase } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

/** A generic finding shape the suggestion builder turns into cards. */
export interface SectionFinding {
  severity: "error" | "warning" | "suggestion" | "success";
  message: string;
  detail: string;
  fieldPath?: string;
  location: string;
  /** A safe corrected value for `fieldPath`, when one exists. */
  fix?: { label: string; replacement: string; safe: boolean };
  key: string;
}

export function analyzePersonalInfo(resume: ResumeData): SectionFinding[] {
  const info = resume.personalInfo;
  const findings: SectionFinding[] = [];
  const location = "Personal information";

  if (!isNonEmpty(info.fullName)) {
    findings.push({
      severity: "error",
      message: "Your name is missing",
      detail: "A resume needs a name at the top.",
      fieldPath: "personalInfo.fullName",
      location,
      key: "personal:name-missing",
    });
  }

  if (!isNonEmpty(info.email)) {
    findings.push({
      severity: "error",
      message: "Your email address is missing",
      detail: "Without an email address, a recruiter has no way to reply.",
      fieldPath: "personalInfo.email",
      location,
      key: "personal:email-missing",
    });
  } else if (!isValidEmail(info.email)) {
    findings.push({
      severity: "error",
      message: "That email address isn't valid",
      detail: `“${info.email}” doesn't look like a working address.`,
      fieldPath: "personalInfo.email",
      location,
      key: "personal:email-invalid",
    });
  }

  if (!isNonEmpty(info.phone)) {
    findings.push({
      severity: "suggestion",
      message: "Add a phone number",
      detail: "Many recruiters still call first.",
      fieldPath: "personalInfo.phone",
      location,
      key: "personal:phone-missing",
    });
  } else if (!isValidPhone(info.phone)) {
    findings.push({
      severity: "warning",
      message: "That phone number looks incomplete",
      detail: `“${info.phone}” has an unusual number of digits. Include the country code if you're applying abroad.`,
      fieldPath: "personalInfo.phone",
      location,
      key: "personal:phone-invalid",
    });
  } else {
    const hint = formatPhoneHint(info.phone);
    if (hint && hint !== info.phone) {
      findings.push({
        severity: "suggestion",
        message: "Tidy up your phone number formatting",
        detail: `“${info.phone}” → “${hint}”`,
        fieldPath: "personalInfo.phone",
        location,
        fix: { label: `Use ${hint}`, replacement: hint, safe: true },
        key: "personal:phone-format",
      });
    }
  }

  if (!isNonEmpty(info.city) && !isNonEmpty(info.country)) {
    findings.push({
      severity: "suggestion",
      message: "Add your location",
      detail: "A city and country help with role matching and time zones.",
      fieldPath: "personalInfo.city",
      location,
      key: "personal:location-missing",
    });
  }

  if (!isNonEmpty(info.jobTitle)) {
    findings.push({
      severity: "warning",
      message: "Add a professional title",
      detail: "A title under your name frames everything a reader sees next.",
      fieldPath: "personalInfo.jobTitle",
      location,
      key: "personal:title-missing",
    });
  } else {
    const technology = findTechnologyIssues(info.jobTitle);
    if (technology.length > 0) {
      const fixed = technology.reduce(
        (acc, finding) =>
          acc.replace(new RegExp(`\\b${finding.original}\\b`), finding.suggestion),
        info.jobTitle,
      );
      if (fixed !== info.jobTitle) {
        findings.push({
          severity: "suggestion",
          message: "Fix the capitalisation in your title",
          detail: `“${info.jobTitle}” → “${fixed}”`,
          fieldPath: "personalInfo.jobTitle",
          location,
          fix: { label: `Use “${fixed}”`, replacement: fixed, safe: true },
          key: "personal:title-technology-case",
        });
      }
    }

    // "react native developer" → "React Native Developer"
    const words = info.jobTitle.trim().split(/\s+/);
    const lowercaseWords = words.filter((word) => /^[a-z]/.test(word));
    if (lowercaseWords.length > words.length / 2 && words.length > 1) {
      const suggested = titleCase(info.jobTitle);
      findings.push({
        severity: "suggestion",
        message: "Capitalise your job title",
        detail: `Job titles are conventionally title case: “${suggested}”.`,
        fieldPath: "personalInfo.jobTitle",
        location,
        fix: { label: `Use “${suggested}”`, replacement: suggested, safe: true },
        key: "personal:title-case",
      });
    }
  }

  return findings;
}

export function analyzeLinks(resume: ResumeData): SectionFinding[] {
  const findings: SectionFinding[] = [];
  const location = "Links";

  resume.links.forEach((link, index) => {
    if (!isNonEmpty(link.url)) {
      findings.push({
        severity: "warning",
        message: `“${link.label || "Link"}” has no address`,
        detail: "Either add the URL or remove the link.",
        fieldPath: `links.${index}.url`,
        location,
        key: `links:empty:${link.id}`,
      });
      return;
    }

    if (!isValidUrl(link.url)) {
      findings.push({
        severity: "error",
        message: `${link.label || "This link"} isn't a valid URL`,
        detail: `“${link.url}” can't be opened as a web address.`,
        fieldPath: `links.${index}.url`,
        location,
        key: `links:invalid:${link.id}`,
      });
      return;
    }

    if (!/^https?:\/\//i.test(link.url)) {
      const fixed = `https://${link.url.replace(/^\/+/, "")}`;
      findings.push({
        severity: "suggestion",
        message: `Add https:// to ${link.label || "this link"}`,
        detail: "Full URLs stay clickable in the exported PDF.",
        fieldPath: `links.${index}.url`,
        location,
        fix: { label: "Add https://", replacement: fixed, safe: true },
        key: `links:scheme:${link.id}`,
      });
    }

    if (link.kind === "linkedin" && !isLinkedInUrl(link.url)) {
      findings.push({
        severity: "warning",
        message: "This LinkedIn link looks wrong",
        detail: "A profile URL normally looks like linkedin.com/in/your-name.",
        fieldPath: `links.${index}.url`,
        location,
        key: `links:linkedin-shape:${link.id}`,
      });
    }

    if (link.kind === "github" && !isGitHubUrl(link.url)) {
      findings.push({
        severity: "warning",
        message: "This GitHub link looks wrong",
        detail: "A profile URL normally looks like github.com/your-username.",
        fieldPath: `links.${index}.url`,
        location,
        key: `links:github-shape:${link.id}`,
      });
    }
  });

  const kinds = new Set(resume.links.map((link) => link.kind));
  if (!kinds.has("linkedin")) {
    findings.push({
      severity: "suggestion",
      message: "Add your LinkedIn profile",
      detail: "It's the link recruiters look for first.",
      location,
      key: "links:no-linkedin",
    });
  }

  return findings;
}

export function analyzeEducation(resume: ResumeData): SectionFinding[] {
  const findings: SectionFinding[] = [];

  resume.education.forEach((entry, index) => {
    const location = `Education ${index + 1}`;

    if (!isNonEmpty(entry.institution)) {
      findings.push({
        severity: "warning",
        message: "This entry has no institution",
        detail: "Add the school, college or university name.",
        fieldPath: `education.${index}.institution`,
        location,
        key: `education:${index}:institution`,
      });
    }

    if (!isNonEmpty(entry.degree)) {
      findings.push({
        severity: "warning",
        message: "This entry has no qualification",
        detail: "Add the degree, diploma or certificate you earned.",
        fieldPath: `education.${index}.degree`,
        location,
        key: `education:${index}:degree`,
      });
    }

    if (!isNonEmpty(entry.endDate)) {
      findings.push({
        severity: "suggestion",
        message: "Education end date is missing",
        detail: "Add the year you finished, or your expected completion date.",
        fieldPath: `education.${index}.endDate`,
        location,
        key: `education:${index}:end-date`,
      });
    } else if (isSuspiciousDate(entry.endDate)) {
      findings.push({
        severity: "error",
        message: `“${entry.endDate}” isn't a date we can read`,
        detail: "Use a form like 2022, 05/2022 or May 2022.",
        fieldPath: `education.${index}.endDate`,
        location,
        key: `education:${index}:end-date-invalid`,
      });
    }

    if (isNonEmpty(entry.startDate) && isNonEmpty(entry.endDate)) {
      const start = parseLooseDate(entry.startDate);
      const end = parseLooseDate(entry.endDate);
      if (start && end && end < start) {
        findings.push({
          severity: "error",
          message: "Education dates are reversed",
          detail: `${entry.startDate} → ${entry.endDate}.`,
          fieldPath: `education.${index}.endDate`,
          location,
          key: `education:${index}:reversed`,
        });
      }
    }
  });

  return findings;
}

export function analyzeProjects(resume: ResumeData): SectionFinding[] {
  const findings: SectionFinding[] = [];

  resume.projects.forEach((entry, index) => {
    const location = entry.name || `Project ${index + 1}`;

    if (!isNonEmpty(entry.description) && entry.achievements.filter(isNonEmpty).length === 0) {
      findings.push({
        severity: "warning",
        message: `“${location}” has no description`,
        detail: "One or two sentences on what it does and what you built.",
        fieldPath: `projects.${index}.description`,
        location,
        key: `projects:${index}:no-description`,
      });
    }

    if (entry.technologies.filter(isNonEmpty).length === 0) {
      findings.push({
        severity: "suggestion",
        message: `Add the technologies used in “${location}”`,
        detail: "Naming the stack makes the project searchable and concrete.",
        fieldPath: `projects.${index}.technologies`,
        location,
        key: `projects:${index}:no-technologies`,
      });
    }

    if (isNonEmpty(entry.url) && !isValidUrl(entry.url)) {
      findings.push({
        severity: "error",
        message: `The link for “${location}” isn't valid`,
        detail: `“${entry.url}” can't be opened as a web address.`,
        fieldPath: `projects.${index}.url`,
        location,
        key: `projects:${index}:url-invalid`,
      });
    }

    if (isNonEmpty(entry.repoUrl)) {
      if (!isValidUrl(entry.repoUrl)) {
        findings.push({
          severity: "error",
          message: `The repository link for “${location}” isn't valid`,
          detail: `“${entry.repoUrl}” can't be opened as a web address.`,
          fieldPath: `projects.${index}.repoUrl`,
          location,
          key: `projects:${index}:repo-invalid`,
        });
      } else if (!/github|gitlab|bitbucket/i.test(entry.repoUrl)) {
        findings.push({
          severity: "suggestion",
          message: `Check the repository link for “${location}”`,
          detail: "This doesn't point at GitHub, GitLab or Bitbucket.",
          fieldPath: `projects.${index}.repoUrl`,
          location,
          key: `projects:${index}:repo-host`,
        });
      }
    }
  });

  return findings;
}

export function analyzeSkills(resume: ResumeData): SectionFinding[] {
  const findings: SectionFinding[] = [];
  const location = "Skills";

  const allItems = resume.skills.flatMap((group) => group.items);
  const usable = allItems.filter(isNonEmpty);

  if (usable.length === 0) {
    findings.push({
      severity: "warning",
      message: "Your skills section is empty",
      detail: "List the tools and technologies you actually work with.",
      location,
      key: "skills:empty",
    });
    return findings;
  }

  if (allItems.length !== usable.length) {
    findings.push({
      severity: "suggestion",
      message: "Some skill entries are blank",
      detail: `${allItems.length - usable.length} empty ${
        allItems.length - usable.length === 1 ? "entry" : "entries"
      } will render as gaps.`,
      location,
      key: "skills:blank-entries",
    });
  }

  resume.skills.forEach((group, groupIndex) => {
    group.items.forEach((item, itemIndex) => {
      if (!isNonEmpty(item)) return;
      const technology = findTechnologyIssues(item);
      const exact = technology.find(
        (finding) => finding.original.toLowerCase() === item.trim().toLowerCase(),
      );
      if (!exact) return;
      findings.push({
        severity: "suggestion",
        message: `Write “${item}” as “${exact.suggestion}”`,
        detail: "Using the conventional spelling helps both readers and keyword matching.",
        fieldPath: `skills.${groupIndex}.items.${itemIndex}`,
        location,
        fix: {
          label: `Use “${exact.suggestion}”`,
          replacement: exact.suggestion,
          safe: true,
        },
        key: `skills:case:${groupIndex}:${itemIndex}:${exact.suggestion}`,
      });
    });
  });

  if (usable.length > 40) {
    findings.push({
      severity: "suggestion",
      message: `${usable.length} skills listed`,
      detail:
        "Long lists dilute the strong entries. Keeping the most relevant ones reads with more confidence.",
      location,
      key: "skills:too-many",
    });
  }

  return findings;
}

/** Notices sections that are missing but usually worth adding. */
export function analyzeMissingSections(resume: ResumeData): SectionFinding[] {
  const findings: SectionFinding[] = [];
  const location = "Missing information";

  if (!isNonEmpty(resume.summary)) {
    findings.push({
      severity: "suggestion",
      message: "No professional summary",
      detail: "A short summary at the top gives context to everything below it.",
      fieldPath: "summary",
      location,
      key: "missing:summary",
    });
  }

  if (resume.experience.length === 0) {
    findings.push({
      severity: "warning",
      message: "No work experience yet",
      detail: "Add roles, internships or freelance work — whichever applies.",
      location,
      key: "missing:experience",
    });
  }

  if (resume.education.length === 0) {
    findings.push({
      severity: "suggestion",
      message: "No education section",
      detail: "Most employers expect at least your highest qualification.",
      location,
      key: "missing:education",
    });
  }

  if (resume.projects.length === 0 && resume.experience.length <= 1) {
    findings.push({
      severity: "suggestion",
      message: "Consider adding projects",
      detail:
        "With a short work history, projects are the clearest evidence of what you can build.",
      location,
      key: "missing:projects",
    });
  }

  if (resume.certifications.length === 0) {
    findings.push({
      severity: "suggestion",
      message: "No certifications listed",
      detail: "Optional, but relevant certifications are quick credibility.",
      location,
      key: "missing:certifications",
    });
  }

  return findings;
}
