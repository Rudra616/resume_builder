import type { ConfidenceMap, ResumeData, ResumeSource } from "./resume";

export interface ExtractedLink {
  url: string;
  text?: string;
  page?: number;
}

export interface ExtractedLine {
  text: string;
  page: number;
  /** Rough font size, when the extractor can provide it. */
  fontSize?: number;
  bold?: boolean;
  /** Set when the source document marked the line as a list item. */
  bullet?: boolean;
  /** Set when the source document marked the line as a heading. */
  heading?: boolean;
  /**
   * Set when a blank line, paragraph break or large vertical gap separates this
   * line from the previous one, which means it starts a new thought and must not
   * be merged into the line above.
   */
  afterBlank?: boolean;
  /** Horizontal offset, used for two-column detection in PDFs. */
  x?: number;
  y?: number;
}

export interface ExtractionResult {
  source: ResumeSource;
  fileName: string;
  fileSize: number;
  pageCount: number;
  lines: ExtractedLine[];
  links: ExtractedLink[];
  rawText: string;
  /** Non-fatal notes shown to the user, e.g. two-column layout detected. */
  warnings: string[];
}

export type ParseFailureCode =
  | "empty-file"
  | "too-large"
  | "unsupported-type"
  | "password-protected"
  | "corrupt"
  | "no-text"
  | "unknown";

export class ResumeParseError extends Error {
  code: ParseFailureCode;
  hint?: string;

  constructor(code: ParseFailureCode, message: string, hint?: string) {
    super(message);
    this.name = "ResumeParseError";
    this.code = code;
    this.hint = hint;
  }
}

export type CanonicalSection =
  | "summary"
  | "experience"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "languages"
  | "awards"
  | "volunteering"
  | "references"
  | "interests"
  | "links"
  | "contact"
  | "unknown";

export interface DetectedSection {
  canonical: CanonicalSection;
  /** The heading exactly as it appeared in the document. */
  rawHeading: string;
  lines: ExtractedLine[];
  startIndex: number;
}

export interface ParseReport {
  fileName: string;
  fileSize: number;
  source: ResumeSource;
  pageCount: number;
  detectedSections: { canonical: string; rawHeading: string; lineCount: number }[];
  unrecognisedBlocks: number;
  linkCount: number;
  warnings: string[];
  /** Field paths that need a human look before continuing. */
  lowConfidenceFields: string[];
}

export interface ParsedResume {
  resume: ResumeData;
  confidence: ConfidenceMap;
  report: ParseReport;
}

export interface ImportProgressState {
  step: 0 | 1 | 2 | 3 | 4 | 5;
  label: string;
  detail: string;
}
