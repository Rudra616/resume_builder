import { ResumeParseError, type ExtractionResult } from "@/types/parser";
import { linesFromDocxHtml } from "@/lib/resume-parser/docxHtml";

/**
 * DOCX parsing goes through Mammoth's prebundled browser build, so the document
 * is unzipped and converted to HTML entirely on the user's machine.
 *
 * Converting to HTML first (rather than raw text) preserves the semantics we
 * need: which lines were headings, which were list items, and where hyperlinks
 * pointed.
 */
async function loadMammoth() {
  return import("mammoth/mammoth.browser.min.js");
}

export async function extractDocx(file: File): Promise<ExtractionResult> {
  const mammoth = await loadMammoth();
  const arrayBuffer = await file.arrayBuffer();

  let html: string;
  const warnings: string[] = [];

  try {
    const result = await mammoth.convertToHtml(
      { arrayBuffer },
      {
        // Word resumes frequently mark section titles with these named styles.
        styleMap: [
          "p[style-name='Title'] => h1:fresh",
          "p[style-name='Subtitle'] => h2:fresh",
          "p[style-name='Heading 1'] => h1:fresh",
          "p[style-name='Heading 2'] => h2:fresh",
          "p[style-name='Heading 3'] => h3:fresh",
          "p[style-name='Section Title'] => h2:fresh",
        ],
      },
    );
    html = result.value;
    if (result.messages.some((message) => message.type === "error")) {
      warnings.push("Some parts of this DOCX could not be converted exactly.");
    }
  } catch (error) {
    const message = (error as Error)?.message ?? "";
    if (/zip|end of central directory|not a valid/i.test(message)) {
      throw new ResumeParseError(
        "unsupported-type",
        "This file isn't a valid DOCX document.",
        "Older .doc files aren't supported. Save it as .docx or PDF and try again.",
      );
    }
    throw new ResumeParseError("corrupt", "We could not read this DOCX file.", message);
  }

  const { lines, links } = linesFromDocxHtml(html);
  const rawText = lines.map((line) => line.text).join("\n");

  if (rawText.replace(/\s/g, "").length < 40) {
    throw new ResumeParseError(
      "no-text",
      "We couldn't find any readable text in this document.",
      "The file may be empty or contain only images. Try another file or continue manually.",
    );
  }

  return {
    source: "docx",
    fileName: file.name,
    fileSize: file.size,
    pageCount: 1,
    lines,
    links,
    rawText,
    warnings,
  };
}
