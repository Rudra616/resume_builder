import {
  ResumeParseError,
  type ExtractedLine,
  type ExtractionResult,
} from "@/types/parser";
import {
  isBulletLine,
  looksLikeAllCaps,
  normalizeText,
} from "@/lib/resume-parser/normalizeText";

/**
 * Plain text has no styling to lean on, so headings are inferred from shape:
 * short lines in all caps, or short lines followed by a blank line.
 *
 * Exported separately from `extractTxt` so the same shaping can be exercised
 * without a File and a FileReader.
 */
export function linesFromPlainText(raw: string): ExtractedLine[] {
  const rawLines = normalizeText(raw).split("\n");
  const lines: ExtractedLine[] = [];

  rawLines.forEach((line, index) => {
    const text = line.trim();
    if (!text) return;

    const nextBlank = (rawLines[index + 1] ?? "").trim().length === 0;
    const afterBlank = index === 0 || (rawLines[index - 1] ?? "").trim().length === 0;
    const bullet = isBulletLine(text);
    const heading =
      !bullet &&
      text.length <= 48 &&
      !text.includes(",") &&
      (looksLikeAllCaps(text) || (nextBlank && text.split(/\s+/).length <= 5));

    lines.push({ text, page: 1, heading, bullet, afterBlank });
  });

  return lines;
}

/** Builds an extraction result from already-read text (TXT files and tests). */
export function extractionFromText(
  raw: string,
  fileName: string,
  fileSize = raw.length,
): ExtractionResult {
  const lines = linesFromPlainText(raw);
  return {
    source: "txt",
    fileName,
    fileSize,
    pageCount: 1,
    lines,
    links: [],
    rawText: lines.map((line) => line.text).join("\n"),
    warnings: [],
  };
}

export async function extractTxt(file: File): Promise<ExtractionResult> {
  let raw: string;
  try {
    raw = normalizeText(await file.text());
  } catch {
    throw new ResumeParseError("unknown", "We could not read this file.");
  }

  if (raw.replace(/\s/g, "").length < 40) {
    throw new ResumeParseError(
      "no-text",
      "This file looks empty.",
      "Choose a file that contains your resume text.",
    );
  }

  return extractionFromText(raw, file.name, file.size);
}
