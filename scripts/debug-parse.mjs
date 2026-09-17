/**
 * Prints what the parser makes of a text fixture. Handy when a parsing rule
 * changes and you want to see the structured result rather than a diff of tests.
 *
 *   node --import ./tests/register.mjs scripts/debug-parse.mjs simple-one-page.txt
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractionFromText } from "../lib/resume-parser/extractTxt.ts";
import {
  buildResumeFromExtraction,
} from "../lib/resume-parser/resumeParser.ts";
import { detectSections } from "../lib/resume-parser/detectSections.ts";
import {
  collapseBlankRuns,
  joinWrappedLines,
} from "../lib/resume-parser/normalizeText.ts";

const name = process.argv[2] ?? "simple-one-page.txt";
const raw = readFileSync(join("fixtures", "text", name), "utf8");
const extraction = extractionFromText(raw, name);

const cleaned = joinWrappedLines(collapseBlankRuns(extraction.lines));
console.log("--- detected sections ---");
for (const section of detectSections(cleaned)) {
  console.log(
    `${section.canonical.padEnd(16)} heading=${JSON.stringify(section.rawHeading)} lines=${section.lines.length}`,
  );
}

const { resume, report } = buildResumeFromExtraction(extraction);

console.log("\n--- personal ---");
console.log(resume.personalInfo);
console.log("\n--- links ---");
console.log(resume.links.map((link) => `${link.kind}: ${link.url}`));
console.log("\n--- summary ---");
console.log(resume.summary);
console.log("\n--- experience ---");
for (const entry of resume.experience) {
  console.log({
    role: entry.role,
    company: entry.company,
    location: entry.location,
    start: entry.startDate,
    end: entry.endDate,
    current: entry.current,
    achievements: entry.achievements,
  });
}
console.log("\n--- education ---");
console.log(resume.education);
console.log("\n--- skills ---");
console.log(resume.skills);
console.log("\n--- projects ---");
console.log(resume.projects);
console.log("\n--- certifications / languages / awards ---");
console.log(resume.certifications, resume.languages, resume.awards);
console.log("\n--- unclassified ---");
console.log(resume.unclassifiedContent);
console.log("\n--- report ---");
console.log(report);
