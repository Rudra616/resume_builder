import {
  createEmptyResume,
  mergeSectionOrder,
} from "@/lib/resume-defaults";
import { detectSections, findSection } from "@/lib/resume-parser/detectSections";
import { extractDocx } from "@/lib/resume-parser/extractDocx";
import { extractPdf } from "@/lib/resume-parser/extractPdf";
import { extractTxt } from "@/lib/resume-parser/extractTxt";
import {
  collapseBlankRuns,
  joinWrappedLines,
  stripBullet,
  words,
} from "@/lib/resume-parser/normalizeText";
import { parseAwards, parseCertifications } from "@/lib/resume-parser/parseCertifications";
import { parseContact } from "@/lib/resume-parser/parseContact";
import { parseEducation } from "@/lib/resume-parser/parseEducation";
import { parseExperience } from "@/lib/resume-parser/parseExperience";
import { parseLanguages } from "@/lib/resume-parser/parseLanguages";
import { parseLinks } from "@/lib/resume-parser/parseLinks";
import { parseProjects } from "@/lib/resume-parser/parseProjects";
import { parseSkills } from "@/lib/resume-parser/parseSkills";
import { uid } from "@/lib/utils";
import {
  ResumeParseError,
  type ExtractionResult,
  type ParseReport,
  type ParsedResume,
} from "@/types/parser";
import type {
  Confidence,
  ConfidenceMap,
  ResumeData,
  SectionKey,
  TemplateId,
  UnclassifiedBlock,
  VolunteeringEntry,
} from "@/types/resume";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ACCEPTED_EXTENSIONS = [".pdf", ".docx", ".txt"] as const;

export function detectFileKind(file: File): "pdf" | "docx" | "txt" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf") || file.type === "application/pdf") return "pdf";
  if (
    name.endsWith(".docx") ||
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }
  if (name.endsWith(".txt") || file.type === "text/plain") return "txt";
  return null;
}

export function validateFile(file: File): void {
  if (file.size === 0) {
    throw new ResumeParseError(
      "empty-file",
      "That file is empty.",
      "Choose a file that contains your resume.",
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new ResumeParseError(
      "too-large",
      "That file is larger than 10 MB.",
      "Export a lighter version of your resume, or remove embedded images.",
    );
  }
  if (!detectFileKind(file)) {
    throw new ResumeParseError(
      "unsupported-type",
      `We can't read ${file.name.split(".").pop()?.toUpperCase() ?? "this format"} files.`,
      `Supported formats are ${ACCEPTED_EXTENSIONS.join(", ")}.`,
    );
  }
}

/** Runs the right extractor for the uploaded file, all inside the browser. */
export async function extractFile(file: File): Promise<ExtractionResult> {
  validateFile(file);
  const kind = detectFileKind(file);

  if (kind === "pdf") return extractPdf(file);
  if (kind === "docx") return extractDocx(file);
  return extractTxt(file);
}

/** Summary text can be a paragraph or a few bullets; keep both readable. */
function buildSummary(lines: { text: string }[]): string {
  return lines
    .map((line) => stripBullet(line.text).trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function parseVolunteering(lines: { text: string }[]): VolunteeringEntry[] {
  const entries: VolunteeringEntry[] = [];
  for (const line of lines) {
    const text = stripBullet(line.text).trim();
    if (!text || words(text).length < 2) continue;
    const parts = text.split(/\s+[|•·–—]\s+|\s+at\s+/i).map((part) => part.trim());
    entries.push({
      id: uid("vol"),
      role: parts[0] ?? text,
      organization: parts[1] ?? "",
      startDate: "",
      endDate: "",
      description: parts.slice(2).join(" "),
    });
  }
  return entries;
}

/**
 * Converts an extraction result into ResumeData.
 *
 * Two rules govern everything here:
 *   1. Never invent content. Empty is better than wrong.
 *   2. Never drop content. Anything we cannot categorise is preserved in
 *      `unclassifiedContent` for the user to place.
 */
export function buildResumeFromExtraction(
  extraction: ExtractionResult,
  templateId: TemplateId = "modern-edge",
): ParsedResume {
  const cleaned = joinWrappedLines(collapseBlankRuns(extraction.lines));
  const sections = detectSections(cleaned);

  const resume: ResumeData = createEmptyResume(templateId);
  const confidence: ConfidenceMap = {};
  const lowConfidenceFields: string[] = [];

  const absorb = (map: Record<string, Confidence>) => {
    for (const [path, value] of Object.entries(map)) {
      confidence[path] = value;
      if (value === "low") lowConfidenceFields.push(path);
    }
  };

  // --- identity & contact -------------------------------------------------
  const contactSection = findSection(sections, "contact");
  const explicitContact = findSection(sections, "links");
  const contactLines = [
    ...(contactSection?.lines ?? []),
    ...(explicitContact?.lines ?? []),
  ];
  const contact = parseContact(
    contactLines.length > 0 ? contactLines : cleaned.slice(0, 12),
  );
  resume.personalInfo = contact.personalInfo;
  absorb(contact.confidence);

  resume.links = parseLinks(cleaned, extraction.links);

  // --- narrative sections -------------------------------------------------
  const summarySection = findSection(sections, "summary");
  if (summarySection) {
    resume.summary = buildSummary(summarySection.lines);
    confidence.summary = resume.summary.length > 40 ? "high" : "medium";
  }

  const experienceSection = findSection(sections, "experience");
  if (experienceSection) {
    const result = parseExperience(experienceSection.lines);
    resume.experience = result.experience;
    absorb(result.confidence);
  } else {
    resume.experience = [];
  }

  const educationSection = findSection(sections, "education");
  if (educationSection) {
    const result = parseEducation(educationSection.lines);
    resume.education = result.education;
    absorb(result.confidence);
  } else {
    resume.education = [];
  }

  const projectsSection = findSection(sections, "projects");
  if (projectsSection) {
    const result = parseProjects(projectsSection.lines);
    resume.projects = result.projects;
    absorb(result.confidence);
  }

  const skillsSection = findSection(sections, "skills");
  if (skillsSection) {
    const result = parseSkills(skillsSection.lines);
    resume.skills = result.skills;
    absorb(result.confidence);
  } else {
    resume.skills = [];
  }

  const certificationsSection = findSection(sections, "certifications");
  if (certificationsSection) {
    const result = parseCertifications(certificationsSection.lines);
    resume.certifications = result.certifications;
    absorb(result.confidence);
  }

  const languagesSection = findSection(sections, "languages");
  if (languagesSection) {
    const result = parseLanguages(languagesSection.lines);
    resume.languages = result.languages;
    absorb(result.confidence);
  }

  const awardsSection = findSection(sections, "awards");
  if (awardsSection) {
    const result = parseAwards(awardsSection.lines);
    resume.awards = result.awards;
    absorb(result.confidence);
  }

  const volunteeringSection = findSection(sections, "volunteering");
  if (volunteeringSection) {
    resume.volunteering = parseVolunteering(volunteeringSection.lines);
  }

  // --- anything we could not place ---------------------------------------
  const unclassified: UnclassifiedBlock[] = [];

  for (const section of sections) {
    if (section.canonical !== "unknown" && section.canonical !== "interests") continue;
    const lines = section.lines.map((line) => line.text.trim()).filter(Boolean);
    if (lines.length === 0 && !section.rawHeading) continue;
    unclassified.push({
      id: uid("unc"),
      heading: section.rawHeading || undefined,
      lines,
      page: section.lines[0]?.page,
    });
  }

  // Contact-block leftovers that were not used for identity or links.
  if (contactSection) {
    const leftover = contactSection.lines
      .map((line, index) => ({ line, index }))
      .filter(({ line, index }) => {
        if (contact.consumedLines.has(index)) return false;
        const text = line.text.trim();
        if (!text) return false;
        if (text === resume.personalInfo.fullName) return false;
        if (text === resume.personalInfo.jobTitle) return false;
        if (text.includes(resume.personalInfo.email) && resume.personalInfo.email) return false;
        if (resume.links.some((link) => text.includes(link.label))) return false;
        // Bare URLs already became links.
        if (/^https?:\/\/\S+$/i.test(text)) return false;
        return words(text).length >= 3;
      })
      .map(({ line }) => line.text.trim());

    if (leftover.length > 0) {
      unclassified.push({ id: uid("unc"), heading: undefined, lines: leftover, page: 1 });
    }
  }

  resume.unclassifiedContent = unclassified;

  // --- section visibility mirrors what we actually found ------------------
  const populated: SectionKey[] = [];
  if (resume.summary) populated.push("summary");
  if (resume.experience.length > 0) populated.push("experience");
  if (resume.projects.length > 0) populated.push("projects");
  if (resume.education.length > 0) populated.push("education");
  if (resume.skills.length > 0) populated.push("skills");
  if (resume.certifications.length > 0) populated.push("certifications");
  if (resume.languages.length > 0) populated.push("languages");
  if (resume.awards.length > 0) populated.push("awards");
  if (resume.volunteering.length > 0) populated.push("volunteering");
  if (resume.links.length > 0) populated.push("links");

  resume.sectionOrder = mergeSectionOrder(
    populated.map((key) => ({ key, visible: true })),
    resume.customSections,
  ).map((entry) => ({
    ...entry,
    visible: populated.includes(entry.key),
  }));

  resume.confidence = confidence;
  resume.metadata = {
    ...resume.metadata,
    source: extraction.source,
    importedFileName: extraction.fileName,
    importedAt: new Date().toISOString(),
    reviewCompleted: false,
  };

  const report: ParseReport = {
    fileName: extraction.fileName,
    fileSize: extraction.fileSize,
    source: extraction.source,
    pageCount: extraction.pageCount,
    detectedSections: sections
      .filter((section) => section.canonical !== "contact")
      .map((section) => ({
        canonical: section.canonical,
        rawHeading: section.rawHeading,
        lineCount: section.lines.length,
      })),
    unrecognisedBlocks: unclassified.length,
    linkCount: resume.links.length,
    warnings: [...extraction.warnings],
    lowConfidenceFields,
  };

  if (resume.experience.length === 0) {
    report.warnings.push(
      "We couldn't find a work experience section. You can add roles manually in the builder.",
    );
  }
  if (!resume.personalInfo.fullName) {
    report.warnings.push("We couldn't confidently identify your name — please add it.");
  }

  return { resume, confidence, report };
}

/** End-to-end: file in, editable ResumeData out. */
export async function parseResumeFile(
  file: File,
  templateId: TemplateId = "modern-edge",
): Promise<ParsedResume> {
  const extraction = await extractFile(file);
  return buildResumeFromExtraction(extraction, templateId);
}
