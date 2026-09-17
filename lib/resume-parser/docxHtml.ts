import { normalizeText } from "@/lib/resume-parser/normalizeText";
import type { ExtractedLine, ExtractedLink } from "@/types/parser";

/**
 * Turns the HTML Mammoth produces into resume lines.
 *
 * Mammoth emits a small, predictable subset of HTML — paragraphs, headings,
 * lists, tables, anchors and inline emphasis — so this walks the markup directly
 * instead of going through the DOM. That keeps the whole parser usable outside a
 * browser (tests, and any future stateless endpoint) while behaving identically
 * inside one.
 */

const BLOCK_TAGS = new Set(["p", "h1", "h2", "h3", "h4", "h5", "h6", "li", "td", "th", "div"]);
const HEADING_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);
const BOLD_TAGS = new Set(["strong", "b"]);

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
  hellip: "…",
  bull: "•",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, body: string) => {
    if (body.startsWith("#")) {
      const code = body.toLowerCase().startsWith("#x")
        ? Number.parseInt(body.slice(2), 16)
        : Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : match;
    }
    return ENTITIES[body.toLowerCase()] ?? match;
  });
}

interface Token {
  kind: "open" | "close" | "text";
  name: string;
  text: string;
  attributes: string;
  selfClosing: boolean;
}

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /<\/?([a-z][a-z0-9]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>/gi;
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(html)) !== null) {
    if (match.index > cursor) {
      tokens.push({
        kind: "text",
        name: "",
        text: html.slice(cursor, match.index),
        attributes: "",
        selfClosing: false,
      });
    }
    tokens.push({
      kind: match[0].startsWith("</") ? "close" : "open",
      name: match[1].toLowerCase(),
      text: "",
      attributes: match[2] ?? "",
      selfClosing: match[3] === "/",
    });
    cursor = pattern.lastIndex;
  }

  if (cursor < html.length) {
    tokens.push({
      kind: "text",
      name: "",
      text: html.slice(cursor),
      attributes: "",
      selfClosing: false,
    });
  }

  return tokens;
}

function attribute(attributes: string, name: string): string | null {
  const match = new RegExp(`${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i").exec(attributes);
  if (!match) return null;
  return decodeEntities(match[2] ?? match[3] ?? "");
}

interface Block {
  tag: string;
  text: string;
  boldText: string;
}

export function linesFromDocxHtml(html: string): {
  lines: ExtractedLine[];
  links: ExtractedLink[];
} {
  const lines: ExtractedLine[] = [];
  const links: ExtractedLink[] = [];

  let block: Block | null = null;
  let boldDepth = 0;
  let anchorText: string | null = null;
  let anchorHref: string | null = null;
  // Table cells are collected per row so a row reads as one line. They are joined
  // with a pipe, the delimiter the section parsers already understand.
  const row: string[] = [];

  const flushRow = () => {
    if (row.length === 0) return;
    pushLine(row.join(" | "));
    row.length = 0;
  };

  const pushLine = (
    text: string,
    options: { heading?: boolean; bullet?: boolean; bold?: boolean } = {},
  ) => {
    const clean = normalizeText(text).trim();
    if (!clean) return;
    lines.push({ text: clean, page: 1, afterBlank: true, ...options });
  };

  const flush = () => {
    if (!block) return;
    const { tag, text, boldText } = block;
    block = null;

    if (tag === "td" || tag === "th") {
      const cell = text.trim();
      if (cell) row.push(cell);
      return;
    }

    if (HEADING_TAGS.has(tag)) {
      pushLine(text, { heading: true, bold: true });
      return;
    }

    if (tag === "li") {
      pushLine(text, { bullet: true });
      return;
    }

    // A short paragraph that is bold from end to end is almost always a heading.
    const trimmed = text.trim();
    const wholeLineBold =
      boldText.trim().length > 0 && boldText.trim().length >= trimmed.length - 1;
    pushLine(text, {
      heading: wholeLineBold && trimmed.length <= 60,
      bold: boldText.trim().length > 0,
    });
  };

  for (const token of tokenize(html)) {
    if (token.kind === "text") {
      const text = decodeEntities(token.text);
      if (block) block.text += text;
      if (block && boldDepth > 0) block.boldText += text;
      if (anchorText !== null) anchorText += text;
      continue;
    }

    if (token.kind === "open") {
      if (BLOCK_TAGS.has(token.name)) {
        flush();
        block = { tag: token.name, text: "", boldText: "" };
        boldDepth = 0;
        continue;
      }
      if (BOLD_TAGS.has(token.name)) {
        boldDepth += 1;
        continue;
      }
      if (token.name === "br") {
        if (block) block.text += " ";
        continue;
      }
      if (token.name === "a") {
        anchorHref = attribute(token.attributes, "href");
        anchorText = "";
        continue;
      }
      continue;
    }

    // Closing tags.
    if (BLOCK_TAGS.has(token.name)) {
      flush();
      continue;
    }
    if (BOLD_TAGS.has(token.name)) {
      boldDepth = Math.max(0, boldDepth - 1);
      continue;
    }
    if (token.name === "a") {
      if (anchorHref && !anchorHref.startsWith("#")) {
        links.push({ url: anchorHref, text: (anchorText ?? "").trim(), page: 1 });
      }
      anchorHref = null;
      anchorText = null;
      continue;
    }
    if (token.name === "tr") {
      flush();
      flushRow();
      continue;
    }
  }

  flush();
  flushRow();

  return { lines, links };
}
