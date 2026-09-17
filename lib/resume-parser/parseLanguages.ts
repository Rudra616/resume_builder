import { stripBullet, words } from "@/lib/resume-parser/normalizeText";
import { titleCase, uid } from "@/lib/utils";
import type { ExtractedLine } from "@/types/parser";
import type { Confidence, LanguageEntry, LanguageLevel } from "@/types/resume";

const LEVEL_MAP: Array<{ test: RegExp; level: LanguageLevel }> = [
  { test: /native|mother\s*tongue|first language|c2\b/i, level: "Native" },
  { test: /fluent|bilingual|proficient|advanced|c1\b/i, level: "Fluent" },
  { test: /professional|business|working (knowledge|proficiency)|b2\b/i, level: "Professional" },
  { test: /intermediate|conversational|b1\b/i, level: "Intermediate" },
  { test: /basic|beginner|elementary|a1\b|a2\b/i, level: "Basic" },
];

/** Languages that appear often enough to distinguish from prose. */
const COMMON_LANGUAGES =
  /^(english|hindi|gujarati|marathi|tamil|telugu|kannada|malayalam|bengali|punjabi|urdu|spanish|french|german|italian|portuguese|dutch|russian|polish|swedish|norwegian|danish|finnish|czech|greek|turkish|arabic|hebrew|persian|farsi|mandarin|chinese|cantonese|japanese|korean|thai|vietnamese|indonesian|malay|filipino|tagalog|swahili|afrikaans|ukrainian|romanian|hungarian|catalan|sign language)$/i;

export interface LanguagesResult {
  languages: LanguageEntry[];
  confidence: Record<string, Confidence>;
}

function detectLevel(text: string): LanguageLevel {
  for (const entry of LEVEL_MAP) {
    if (entry.test.test(text)) return entry.level;
  }
  return "";
}

/**
 * Handles the three common shapes: one language per line, comma-separated
 * lists, and `English — Fluent` pairs.
 */
export function parseLanguages(lines: ExtractedLine[]): LanguagesResult {
  const languages: LanguageEntry[] = [];
  const confidence: Record<string, Confidence> = {};
  const seen = new Set<string>();

  const add = (rawName: string, rawLevel: string) => {
    const name = titleCase(rawName.trim().replace(/[.,;]$/, ""));
    if (!name || words(name).length > 3) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);

    const position = languages.length;
    languages.push({ id: uid("lang"), name, level: detectLevel(rawLevel) });
    confidence[`languages.${position}.name`] = COMMON_LANGUAGES.test(name)
      ? "high"
      : "low";
  };

  for (const line of lines) {
    const text = stripBullet(line.text).trim();
    if (!text) continue;

    for (const chunk of text.split(/[,;|]/)) {
      const piece = chunk.trim();
      if (!piece) continue;

      const paired = piece.match(/^([A-Za-z\s]+?)\s*(?:[-–—:(]|\s{2,})\s*(.+?)\)?$/);
      if (paired) {
        add(paired[1], paired[2]);
        continue;
      }
      add(piece, piece);
    }
  }

  return { languages, confidence };
}
