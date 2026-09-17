import { isBulletLine, stripBullet, words } from "@/lib/resume-parser/normalizeText";
import { normalizeTechnology } from "@/lib/resume-assistant/technologyNormalization";
import { uid } from "@/lib/utils";
import type { ExtractedLine } from "@/types/parser";
import type { Confidence, SkillGroup } from "@/types/resume";

const SPLIT_PATTERN = /[,;•·|/]|\s{3,}|\s+[-–—]\s+/;

/** `Languages: TypeScript, Go` — the part before the colon is the group name. */
const LABELLED = /^([A-Za-z][A-Za-z0-9\s&+/.#-]{1,40}?)\s*:\s*(.+)$/;

export interface SkillsResult {
  skills: SkillGroup[];
  confidence: Record<string, Confidence>;
}

function splitSkills(text: string): string[] {
  return text
    .split(SPLIT_PATTERN)
    .map((item) => item.trim().replace(/^[-–—•·]+\s*/, "").replace(/[.]$/, ""))
    .filter((item) => item.length > 0 && item.length <= 45)
    // A "skill" of ten words is a sentence, not a skill.
    .filter((item) => words(item).length <= 6);
}

/**
 * Reads the skills block. Grouped resumes ("Frontend: React, Vue") keep their
 * groups; flat lists collapse into a single group. Casing is normalised against
 * the technology dictionary, but only for names we recognise.
 */
export function parseSkills(lines: ExtractedLine[]): SkillsResult {
  const groups: SkillGroup[] = [];
  const flat: string[] = [];
  const confidence: Record<string, Confidence> = {};

  for (const line of lines) {
    const text = stripBullet(line.text).trim();
    if (!text) continue;

    const labelled = text.match(LABELLED);
    if (labelled && splitSkills(labelled[2]).length > 0) {
      const category = labelled[1].trim();
      const items = splitSkills(labelled[2]).map(normalizeTechnology);
      const existing = groups.find(
        (group) => group.category.toLowerCase() === category.toLowerCase(),
      );
      if (existing) existing.items.push(...items);
      else groups.push({ id: uid("skl"), category, items });
      continue;
    }

    const items = splitSkills(text);
    if (items.length === 0) continue;

    // A bullet with a single long phrase is a statement about skills, not a list.
    if (items.length === 1 && words(items[0]).length > 5) continue;

    flat.push(...items.map(normalizeTechnology));
  }

  if (flat.length > 0) {
    groups.push({
      id: uid("skl"),
      category: groups.length > 0 ? "Additional" : "Core Skills",
      items: flat,
    });
  }

  // De-duplicate case-insensitively while keeping the first spelling seen.
  for (const group of groups) {
    const seen = new Map<string, string>();
    for (const item of group.items) {
      const key = item.toLowerCase();
      if (!seen.has(key)) seen.set(key, item);
    }
    group.items = [...seen.values()];
  }

  const usable = groups.filter((group) => group.items.length > 0);
  usable.forEach((group, index) => {
    confidence[`skills.${index}.items`] = group.items.length >= 3 ? "high" : "medium";
  });

  return { skills: usable, confidence };
}

/** Pulls a `Tech: React, Node` style line out of an experience/project block. */
export function extractTechnologiesFromLine(text: string): string[] | null {
  const match = text.match(
    /^(?:tech(?:nologies)?|stack|tools|environment|built with|skills used)\s*[:\-–]\s*(.+)$/i,
  );
  if (!match) return null;
  const items = splitSkills(match[1]).map(normalizeTechnology);
  return items.length > 0 ? items : null;
}

export { isBulletLine };
