import {
  ResumeParseError,
  type ExtractedLine,
  type ExtractedLink,
  type ExtractionResult,
} from "@/types/parser";
import { normalizeText } from "@/lib/resume-parser/normalizeText";

/** Minimum characters before we consider a PDF machine-readable. */
const MIN_TEXT_LENGTH = 60;

interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
  fontName?: string;
  hasEOL?: boolean;
}

type PdfjsModule = typeof import("pdfjs-dist");

let pdfjsPromise: Promise<PdfjsModule> | null = null;

/**
 * pdf.js is loaded on demand and pointed at a worker served from our own origin,
 * so no part of the document is sent anywhere.
 */
async function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist").then((module) => {
      module.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return module;
    });
  }
  return pdfjsPromise;
}

/** Groups text items that share a baseline into single lines. */
function itemsToLines(items: PdfTextItem[], pageNumber: number): ExtractedLine[] {
  const rows = new Map<number, PdfTextItem[]>();

  for (const item of items) {
    if (!item.str || !item.str.trim()) continue;
    const y = Math.round(item.transform[5] * 2) / 2;
    const bucket = rows.get(y);
    if (bucket) bucket.push(item);
    else rows.set(y, [item]);
  }

  const ordered = [...rows.entries()].sort((a, b) => b[0] - a[0]);

  return ordered.map(([y, rowItems]) => {
    const sorted = [...rowItems].sort((a, b) => a.transform[4] - b.transform[4]);

    // Re-insert the spaces that pdf.js drops between separately positioned runs.
    let text = "";
    let previousEnd: number | null = null;
    for (const item of sorted) {
      const x = item.transform[4];
      if (previousEnd !== null) {
        const gap = x - previousEnd;
        const spaceWidth = Math.max(item.height * 0.22, 1.2);
        if (gap > spaceWidth && !/\s$/.test(text) && !/^\s/.test(item.str)) {
          text += gap > spaceWidth * 6 ? "   " : " ";
        }
      }
      text += item.str;
      previousEnd = x + item.width;
    }

    const fontSize = Math.max(...sorted.map((item) => Math.abs(item.transform[0]) || item.height));
    const bold = sorted.some((item) =>
      /bold|black|heavy|semibold/i.test(item.fontName ?? ""),
    );

    return {
      text: normalizeText(text).trim(),
      page: pageNumber,
      fontSize,
      bold,
      x: sorted[0]?.transform[4],
      y,
    } satisfies ExtractedLine;
  });
}

/**
 * Detects a two-column page and returns lines re-ordered column by column.
 * Without this, a sidebar resume interleaves its sidebar and main content.
 */
function reorderColumns(
  lines: ExtractedLine[],
  pageWidth: number,
): { lines: ExtractedLine[]; twoColumn: boolean } {
  const withX = lines.filter((line) => typeof line.x === "number");
  if (withX.length < 12) return { lines, twoColumn: false };

  const midpoint = pageWidth / 2;
  const left = withX.filter((line) => (line.x ?? 0) < midpoint * 0.85);
  const right = withX.filter((line) => (line.x ?? 0) > midpoint * 1.05);

  // Both sides need real substance, and lines must not straddle the gutter.
  const straddling = withX.filter(
    (line) => (line.x ?? 0) >= midpoint * 0.85 && (line.x ?? 0) <= midpoint * 1.05,
  );

  const balanced =
    left.length >= 5 &&
    right.length >= 5 &&
    straddling.length / withX.length < 0.25 &&
    Math.min(left.length, right.length) / Math.max(left.length, right.length) > 0.18;

  if (!balanced) return { lines, twoColumn: false };

  const byY = (a: ExtractedLine, b: ExtractedLine) => (b.y ?? 0) - (a.y ?? 0);
  return {
    lines: [...left.sort(byY), ...right.sort(byY), ...straddling.sort(byY)],
    twoColumn: true,
  };
}

/** Marks lines that are visually larger or bolder than the body text. */
function flagHeadings(lines: ExtractedLine[]): ExtractedLine[] {
  const sizes = lines
    .map((line) => line.fontSize ?? 0)
    .filter((size) => size > 0)
    .sort((a, b) => a - b);
  if (sizes.length === 0) return lines;

  const median = sizes[Math.floor(sizes.length / 2)];

  return lines.map((line) => ({
    ...line,
    heading:
      line.text.length <= 60 &&
      ((line.fontSize ?? 0) > median * 1.12 || Boolean(line.bold)),
  }));
}

export async function extractPdf(file: File): Promise<ExtractionResult> {
  const pdfjs = await loadPdfjs();
  const buffer = await file.arrayBuffer();

  let doc: Awaited<ReturnType<typeof pdfjs.getDocument>["promise"]>;
  try {
    doc = await pdfjs.getDocument({
      data: new Uint8Array(buffer),
      isEvalSupported: false,
      // Keeps pdf.js from fetching standard font data over the network.
      useSystemFonts: true,
    }).promise;
  } catch (error) {
    const name = (error as { name?: string })?.name ?? "";
    const message = (error as Error)?.message ?? "";

    if (name === "PasswordException" || /password/i.test(message)) {
      throw new ResumeParseError(
        "password-protected",
        "This PDF is password protected.",
        "Remove the password in your PDF viewer and upload it again, or continue manually.",
      );
    }
    if (name === "InvalidPDFException" || /invalid|corrupt|structure/i.test(message)) {
      throw new ResumeParseError(
        "corrupt",
        "This PDF could not be opened.",
        "The file may be damaged. Try re-exporting it, or continue manually.",
      );
    }
    throw new ResumeParseError("unknown", "We could not read this PDF.", message);
  }

  const lines: ExtractedLine[] = [];
  const links: ExtractedLink[] = [];
  const warnings: string[] = [];
  let sawTwoColumnPage = false;

  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });

    const content = await page.getTextContent();
    const pageLines = itemsToLines(content.items as unknown as PdfTextItem[], pageNumber);
    const { lines: ordered, twoColumn } = reorderColumns(pageLines, viewport.width);
    if (twoColumn) sawTwoColumnPage = true;
    lines.push(...ordered);

    // Real PDF hyperlink annotations keep URLs that never appear in the text.
    try {
      const annotations = await page.getAnnotations({ intent: "display" });
      for (const annotation of annotations as Array<{
        subtype?: string;
        url?: string;
        unsafeUrl?: string;
      }>) {
        const url = annotation.url ?? annotation.unsafeUrl;
        if (annotation.subtype === "Link" && url) {
          links.push({ url, page: pageNumber });
        }
      }
    } catch {
      // Annotation extraction is best-effort; text is what matters.
    }

    page.cleanup();
  }

  await doc.destroy();

  if (sawTwoColumnPage) {
    warnings.push(
      "This PDF looks like a two-column layout. We read the columns separately, so double-check the order of your sections.",
    );
  }

  const rawText = lines.map((line) => line.text).join("\n");

  if (rawText.replace(/\s/g, "").length < MIN_TEXT_LENGTH) {
    throw new ResumeParseError(
      "no-text",
      "We couldn't reliably read this PDF. It may contain scanned pages.",
      "Try exporting a text-based PDF from your editor, upload a DOCX, or continue manually.",
    );
  }

  return {
    source: "pdf",
    fileName: file.name,
    fileSize: file.size,
    pageCount: doc.numPages,
    lines: flagHeadings(lines),
    links,
    rawText,
    warnings,
  };
}
