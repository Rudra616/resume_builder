import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractionFromText } from "@/lib/resume-parser/extractTxt";
import { buildResumeFromExtraction } from "@/lib/resume-parser/resumeParser";
import type { ParsedResume } from "@/types/parser";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export const FIXTURES = {
  simple: "simple-one-page.txt",
  twoPage: "two-page-long-experience.txt",
  unusual: "unusual-headings.txt",
  missing: "missing-sections.txt",
  links: "links-heavy.txt",
  twoColumn: "two-column.txt",
  textOnly: "text-only.txt",
  messy: "messy-writing.txt",
} as const;

export function fixtureText(name: string): string {
  return readFileSync(join(root, "fixtures", "text", name), "utf8");
}

/** Runs a text fixture through the same pipeline a TXT upload would take. */
export function parseFixture(name: string): ParsedResume {
  return buildResumeFromExtraction(extractionFromText(fixtureText(name), name));
}
