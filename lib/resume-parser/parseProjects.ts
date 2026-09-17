import { extractDateRange } from "@/lib/resume-parser/dateRanges";
import {
  isBulletLine,
  looksLikeAllCaps,
  stripBullet,
  words,
} from "@/lib/resume-parser/normalizeText";
import { urlsIn, normalizeUrl } from "@/lib/resume-parser/parseLinks";
import { extractTechnologiesFromLine } from "@/lib/resume-parser/parseSkills";
import { uid } from "@/lib/utils";
import type { ExtractedLine } from "@/types/parser";
import type { Confidence, ProjectEntry } from "@/types/resume";

export interface ProjectsResult {
  projects: ProjectEntry[];
  confidence: Record<string, Confidence>;
}

interface Draft {
  title: string;
  role: string;
  dates: { start: string; end: string } | null;
  bullets: string[];
  paragraphs: string[];
  urls: string[];
  technologies: string[];
}

function newDraft(): Draft {
  return {
    title: "",
    role: "",
    dates: null,
    bullets: [],
    paragraphs: [],
    urls: [],
    technologies: [],
  };
}

function isEmpty(draft: Draft): boolean {
  return (
    !draft.title &&
    draft.bullets.length === 0 &&
    draft.paragraphs.length === 0 &&
    draft.urls.length === 0
  );
}

/**
 * Project blocks are the least standardised part of a resume. A new project
 * starts on a styled/short title line, or when a title line already exists and
 * we meet another one.
 */
export function parseProjects(lines: ExtractedLine[]): ProjectsResult {
  const drafts: Draft[] = [];
  let draft = newDraft();

  const push = () => {
    if (!isEmpty(draft)) drafts.push(draft);
    draft = newDraft();
  };

  for (const line of lines) {
    const text = line.text.trim();
    if (!text) continue;

    if (isBulletLine(text) || line.bullet) {
      const bullet = stripBullet(text);
      const tech = extractTechnologiesFromLine(bullet);
      if (tech) draft.technologies.push(...tech);
      else draft.bullets.push(bullet);
      draft.urls.push(...urlsIn(bullet));
      continue;
    }

    const tech = extractTechnologiesFromLine(text);
    if (tech) {
      draft.technologies.push(...tech);
      continue;
    }

    const range = extractDateRange(text);
    const remainder = range ? range.remainder : text;

    const looksLikeTitle =
      words(remainder).length <= 8 &&
      remainder.length <= 70 &&
      !/[.!?]$/.test(remainder) &&
      (line.heading || line.bold || looksLikeAllCaps(remainder) || Boolean(range));

    if (looksLikeTitle && (draft.title || draft.bullets.length > 0 || draft.paragraphs.length > 0)) {
      push();
    }

    if (range) {
      draft.dates = { start: range.start, end: range.end };
    }

    if (!draft.title && remainder) {
      // "Trailmark — Creator" or "Trailmark (React Native)"
      const separated = remainder.split(/\s+[|•·–—]\s+|\s+\(|\)$/).filter(Boolean);
      draft.title = separated[0]?.trim() ?? remainder;
      if (separated[1]) draft.role = separated[1].trim();
      draft.urls.push(...urlsIn(remainder));
      continue;
    }

    draft.urls.push(...urlsIn(text));
    draft.paragraphs.push(text);
  }

  push();

  const projects: ProjectEntry[] = [];
  const confidence: Record<string, Confidence> = {};

  for (const item of drafts) {
    const repoUrl = item.urls.find((url) => /github\.com|gitlab\.com|bitbucket/i.test(url));
    const liveUrl = item.urls.find((url) => url !== repoUrl);

    const position = projects.length;

    projects.push({
      id: uid("prj"),
      name: item.title.replace(/[–—-]\s*$/, "").trim(),
      role: item.role,
      description: item.paragraphs.join(" ").trim(),
      url: liveUrl ? normalizeUrl(liveUrl) : "",
      repoUrl: repoUrl ? normalizeUrl(repoUrl) : "",
      startDate: item.dates?.start ?? "",
      endDate: item.dates?.end ?? "",
      technologies: [...new Set(item.technologies)],
      achievements: item.bullets,
    });

    confidence[`projects.${position}.name`] = item.title ? "medium" : "low";
    if (!item.paragraphs.length && !item.bullets.length) {
      confidence[`projects.${position}.description`] = "low";
    }
  }

  return { projects, confidence };
}
