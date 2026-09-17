/**
 * Builds the binary import fixtures (PDF + DOCX) from the plain-text sources in
 * fixtures/text. Both writers are intentionally dependency-free: the point is to
 * produce ordinary text-bearing documents, not to be a general document library.
 *
 *   node scripts/build-fixtures.mjs
 */

import { deflateRawSync } from "node:zlib";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const textDir = join(root, "fixtures", "text");
const outDir = join(root, "fixtures", "generated");

/* ------------------------------------------------------------------ PDF ---- */

const PAGE_WIDTH = 595.28; // A4 at 72dpi
const PAGE_HEIGHT = 841.89;
const MARGIN = 56;
const LEADING = 13.5;
const BODY_SIZE = 10.5;
const HEADING_SIZE = 12;

/** Escapes the three characters that are special inside a PDF string literal. */
function pdfString(text) {
  return text.replace(/[\\()]/g, (match) => `\\${match}`);
}

/** A heading in these fixtures is an all-caps or title-case standalone line. */
function looksLikeHeading(line) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.length > 34) return false;
  if (/^[•·\-\u2022]/.test(trimmed)) return false;
  return trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
}

function wrap(line, maxChars) {
  if (line.length <= maxChars) return [line];
  const words = line.split(/\s+/);
  const out = [];
  let current = "";
  for (const word of words) {
    if (current && `${current} ${word}`.length > maxChars) {
      out.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) out.push(current);
  return out;
}

/**
 * Splits lines into pages and emits one content stream per page. Text is drawn
 * with Tj operators, so extraction sees real glyphs in reading order.
 */
function buildPdfPages(lines, { columns = 1 } = {}) {
  const usableHeight = PAGE_HEIGHT - MARGIN * 2;
  const linesPerPage = Math.floor(usableHeight / LEADING);
  const columnWidth = (PAGE_WIDTH - MARGIN * 2) / columns;
  const maxChars = Math.floor(columnWidth / (BODY_SIZE * 0.5));

  const flowed = [];
  for (const line of lines) {
    const parts = wrap(line.replace(/\s+$/, ""), maxChars);
    for (const part of parts) flowed.push(part);
  }

  const pages = [];
  for (let index = 0; index < flowed.length; index += linesPerPage * columns) {
    pages.push(flowed.slice(index, index + linesPerPage * columns));
  }
  if (pages.length === 0) pages.push([]);

  return pages.map((pageLines) => {
    const ops = [];
    for (let column = 0; column < columns; column += 1) {
      const slice = pageLines.slice(column * linesPerPage, (column + 1) * linesPerPage);
      if (slice.length === 0) continue;

      const x = MARGIN + column * columnWidth;
      let y = PAGE_HEIGHT - MARGIN;
      for (const line of slice) {
        const heading = looksLikeHeading(line);
        ops.push("BT");
        ops.push(`/F${heading ? 2 : 1} ${heading ? HEADING_SIZE : BODY_SIZE} Tf`);
        ops.push(`1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm`);
        ops.push(`(${pdfString(line)}) Tj`);
        ops.push("ET");
        y -= LEADING;
      }
    }
    return ops.join("\n");
  });
}

function writePdf(path, lines, options) {
  const contents = buildPdfPages(lines, options);
  const objects = [];

  // 1: catalog, 2: pages, 3..: fonts then per-page (page object + content).
  const fontRegular = 3;
  const fontBold = 4;
  const firstPageObject = 5;
  const pageIds = contents.map((_, index) => firstPageObject + index * 2);

  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] =
    `<< /Type /Pages /Count ${contents.length} /Kids [${pageIds
      .map((id) => `${id} 0 R`)
      .join(" ")}] >>`;
  objects[fontRegular] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  objects[fontBold] =
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";

  contents.forEach((stream, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] ` +
      `/Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> ` +
      `/Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`;
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [];
  for (let id = 1; id < objects.length; id += 1) {
    if (!objects[id]) continue;
    offsets[id] = Buffer.byteLength(pdf);
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }

  const xrefOffset = Buffer.byteLength(pdf);
  const maxId = objects.length;
  pdf += `xref\n0 ${maxId}\n0000000000 65535 f \n`;
  for (let id = 1; id < maxId; id += 1) {
    pdf += offsets[id]
      ? `${String(offsets[id]).padStart(10, "0")} 00000 n \n`
      : "0000000000 65535 f \n";
  }
  pdf += `trailer\n<< /Size ${maxId} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  writeFileSync(path, pdf, "latin1");
  return contents.length;
}

/* ----------------------------------------------------------------- DOCX ---- */

function crc32(buffer) {
  let crc = ~0;
  for (let index = 0; index < buffer.length; index += 1) {
    crc ^= buffer[index];
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

/** Minimal ZIP writer (deflate + stored), which is all a .docx container needs. */
function zip(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name, "utf8");
    const raw = Buffer.from(entry.data, "utf8");
    const deflated = deflateRawSync(raw);
    const useDeflate = deflated.length < raw.length;
    const body = useDeflate ? deflated : raw;
    const method = useDeflate ? 8 : 0;
    const checksum = crc32(raw);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);

    chunks.push(local, name, body);

    const header = Buffer.alloc(46);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt16LE(20, 4);
    header.writeUInt16LE(20, 6);
    header.writeUInt16LE(0, 8);
    header.writeUInt16LE(method, 10);
    header.writeUInt16LE(0, 12);
    header.writeUInt16LE(0, 14);
    header.writeUInt32LE(checksum, 16);
    header.writeUInt32LE(body.length, 20);
    header.writeUInt32LE(raw.length, 24);
    header.writeUInt16LE(name.length, 28);
    header.writeUInt16LE(0, 30);
    header.writeUInt16LE(0, 32);
    header.writeUInt16LE(0, 34);
    header.writeUInt16LE(0, 36);
    header.writeUInt32LE(0, 38);
    header.writeUInt32LE(offset, 42);
    central.push(header, name);

    offset += local.length + name.length + body.length;
  }

  const centralBuffer = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...chunks, centralBuffer, end]);
}

function xmlEscape(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const URL_IN_TEXT = /((?:https?:\/\/)?(?:www\.)?[a-z0-9-]+(?:\.[a-z]{2,})+(?:\/[^\s|,]*)?)/i;

/**
 * Builds WordprocessingML with real headings, bullet lists and hyperlink
 * relationships, so Mammoth sees the same structure a Word resume would carry.
 */
function writeDocx(path, lines) {
  const relationships = [];
  const paragraphs = [];

  const runs = (text) => `<w:r><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;

  const hyperlinkRun = (url) => {
    const href = /^https?:\/\//i.test(url) ? url : `https://${url}`;
    const id = `rIdLink${relationships.length + 1}`;
    relationships.push(
      `<Relationship Id="${id}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink" Target="${xmlEscape(
        href,
      )}" TargetMode="External"/>`,
    );
    return `<w:hyperlink r:id="${id}"><w:r><w:rPr><w:rStyle w:val="Hyperlink"/></w:rPr><w:t xml:space="preserve">${xmlEscape(
      url,
    )}</w:t></w:r></w:hyperlink>`;
  };

  /** Splits a line so URLs become real hyperlink runs. */
  const inlineRuns = (text) => {
    const parts = [];
    let rest = text;
    let guard = 0;
    while (guard < 12) {
      guard += 1;
      const match = URL_IN_TEXT.exec(rest);
      if (!match || rest.includes("@")) break;
      const before = rest.slice(0, match.index);
      if (before) parts.push(runs(before));
      parts.push(hyperlinkRun(match[0]));
      rest = rest.slice(match.index + match[0].length);
    }
    if (rest) parts.push(runs(rest));
    return parts.join("");
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push("<w:p/>");
      return;
    }

    if (index === 0) {
      paragraphs.push(
        `<w:p><w:pPr><w:pStyle w:val="Title"/></w:pPr>${runs(trimmed)}</w:p>`,
      );
      return;
    }

    if (looksLikeHeading(trimmed)) {
      paragraphs.push(
        `<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr>${runs(trimmed)}</w:p>`,
      );
      return;
    }

    const bullet = trimmed.match(/^[•·\u2022-]\s+(.*)$/);
    if (bullet) {
      paragraphs.push(
        `<w:p><w:pPr><w:pStyle w:val="ListParagraph"/><w:numPr><w:ilvl w:val="0"/>` +
          `<w:numId w:val="1"/></w:numPr></w:pPr>${inlineRuns(bullet[1])}</w:p>`,
      );
      return;
    }

    paragraphs.push(`<w:p>${inlineRuns(trimmed)}</w:p>`);
  });

  const document =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" ` +
    `xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
    `<w:body>${paragraphs.join("")}</w:body></w:document>`;

  const numbering =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `<w:abstractNum w:abstractNumId="0"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/>` +
    `<w:lvlText w:val="•"/></w:lvl></w:abstractNum>` +
    `<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>`;

  const styles =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">` +
    `<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/></w:style>` +
    `<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>` +
    `<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/></w:style>` +
    `<w:style w:type="character" w:styleId="Hyperlink"><w:name w:val="Hyperlink"/></w:style>` +
    `</w:styles>`;

  const contentTypes =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>` +
    `<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>` +
    `<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>` +
    `</Types>`;

  const rootRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>` +
    `</Relationships>`;

  const documentRels =
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
    `<Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
    `<Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>` +
    relationships.join("") +
    `</Relationships>`;

  writeFileSync(
    path,
    zip([
      { name: "[Content_Types].xml", data: contentTypes },
      { name: "_rels/.rels", data: rootRels },
      { name: "word/document.xml", data: document },
      { name: "word/_rels/document.xml.rels", data: documentRels },
      { name: "word/styles.xml", data: styles },
      { name: "word/numbering.xml", data: numbering },
    ]),
  );
}

/* ----------------------------------------------------------------- main ---- */

const TARGETS = [
  { source: "simple-one-page.txt", pdf: "simple-one-page.pdf", docx: "simple-one-page.docx" },
  { source: "two-page-long-experience.txt", pdf: "two-page-long-experience.pdf" },
  { source: "links-heavy.txt", pdf: "links-heavy.pdf", docx: "links-heavy.docx" },
  { source: "unusual-headings.txt", docx: "unusual-headings.docx" },
  { source: "missing-sections.txt", pdf: "missing-sections.pdf" },
  { source: "two-column.txt", pdf: "two-column.pdf", columns: 2 },
  { source: "messy-writing.txt", docx: "messy-writing.docx" },
];

mkdirSync(outDir, { recursive: true });

for (const target of TARGETS) {
  const lines = readFileSync(join(textDir, target.source), "utf8").split(/\r?\n/);

  if (target.pdf) {
    const pages = writePdf(join(outDir, target.pdf), lines, {
      columns: target.columns ?? 1,
    });
    console.log(`[fixtures] ${target.pdf} (${pages} page${pages === 1 ? "" : "s"})`);
  }

  if (target.docx) {
    writeDocx(join(outDir, target.docx), lines);
    console.log(`[fixtures] ${target.docx}`);
  }
}

// A deliberately broken PDF for the corrupt-file error path.
const corrupt = readFileSync(join(outDir, "simple-one-page.pdf"));
writeFileSync(join(outDir, "corrupt.pdf"), corrupt.subarray(0, 400));
console.log("[fixtures] corrupt.pdf (truncated on purpose)");

// An empty file for the empty-upload error path.
writeFileSync(join(outDir, "empty.txt"), "");
console.log("[fixtures] empty.txt");
