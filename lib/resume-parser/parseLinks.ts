import { uid } from "@/lib/utils";
import type { ExtractedLink, ExtractedLine } from "@/types/parser";
import type { LinkKind, ResumeLink } from "@/types/resume";

// The final label must look like a real TLD, which keeps "8.4 CGPA" and "B.E."
// out of the link list.
const URL_PATTERN =
  /((?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.[a-z]{2,24}(?:\/[^\s,;)"'<>]*)?)/gi;

/**
 * Bare hostnames are only accepted when the TLD is one people actually put on a
 * resume. Anything with an explicit scheme skips this check, because the user
 * typed a real URL.
 */
const KNOWN_TLDS = new Set([
  "com", "net", "org", "io", "dev", "app", "ai", "co", "me", "info", "biz",
  "pro", "name", "edu", "gov", "ac", "tech", "design", "studio", "art", "site",
  "space", "xyz", "online", "page", "blog", "cloud", "digital", "agency",
  "works", "media", "network", "systems", "tools", "live", "life", "world",
  "email", "wiki", "codes", "software", "engineer", "engineering", "dev",
  "graphics", "photography", "gallery", "ninja", "guru", "consulting",
  "in", "us", "uk", "ca", "au", "nz", "de", "fr", "es", "it", "nl", "se", "no",
  "fi", "dk", "ch", "at", "be", "pl", "pt", "ie", "cz", "gr", "ro", "hu", "ru",
  "ua", "tr", "il", "ae", "sa", "za", "ng", "ke", "eg", "br", "mx", "ar", "cl",
  "pe", "co.uk", "jp", "cn", "kr", "sg", "hk", "tw", "my", "id", "ph", "th",
  "vn", "pk", "bd", "lk", "np", "eu",
]);

/** Extensions that show up in prose ("Node.js", "app.py") but are never links. */
const FILE_LIKE_TLDS = new Set([
  "js", "mjs", "cjs", "ts", "tsx", "jsx", "py", "rb", "go", "rs", "sh", "md",
  "json", "yml", "yaml", "css", "scss", "html", "sql", "java", "cs", "php",
  "png", "jpg", "jpeg", "svg", "pdf", "doc", "docx", "xls", "csv", "zip",
]);

/** Domains that are never a personal link on a resume. */
const IGNORED_HOSTS = [
  "example.com",
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
];

const KIND_RULES: Array<{ kind: LinkKind; test: RegExp; label: string }> = [
  { kind: "linkedin", test: /linkedin\.com/i, label: "LinkedIn" },
  { kind: "github", test: /github\.(com|io)/i, label: "GitHub" },
  { kind: "behance", test: /behance\.net/i, label: "Behance" },
  { kind: "dribbble", test: /dribbble\.com/i, label: "Dribbble" },
  { kind: "twitter", test: /(twitter\.com|x\.com)/i, label: "X" },
  { kind: "stackoverflow", test: /stackoverflow\.com/i, label: "Stack Overflow" },
  { kind: "medium", test: /medium\.com/i, label: "Medium" },
];

const PORTFOLIO_TLDS = /\.(dev|design|me|studio|portfolio|art|io|xyz|site|space)$/i;

export function classifyUrl(url: string): { kind: LinkKind; label: string } {
  for (const rule of KIND_RULES) {
    if (rule.test.test(url)) return { kind: rule.kind, label: rule.label };
  }

  try {
    const host = new URL(normalizeUrl(url)).hostname.replace(/^www\./, "");
    if (PORTFOLIO_TLDS.test(host)) return { kind: "portfolio", label: host };
    return { kind: "website", label: host };
  } catch {
    return { kind: "custom", label: url };
  }
}

/** Adds a scheme and strips trailing punctuation picked up from prose. */
export function normalizeUrl(raw: string): string {
  let url = raw.trim().replace(/[),.;:'"]+$/, "");
  if (!url) return "";
  if (url.startsWith("mailto:") || url.startsWith("tel:")) return url;
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url;
}

/** Human-friendly label, e.g. `linkedin.com/in/rudra` from a long URL. */
export function labelForUrl(url: string, kind: LinkKind): string {
  const normalized = normalizeUrl(url);
  try {
    const parsed = new URL(normalized);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/$/, "");

    if (kind === "linkedin" || kind === "github" || kind === "behance" || kind === "dribbble") {
      return `${host}${path}`;
    }
    return path && path !== "/" ? `${host}${path}` : host;
  } catch {
    return url;
  }
}

function isUsableUrl(url: string): boolean {
  const normalized = normalizeUrl(url);
  if (!normalized) return false;

  try {
    const host = new URL(normalized).hostname.replace(/^www\./, "");
    if (!host.includes(".")) return false;
    if (IGNORED_HOSTS.includes(host)) return false;

    const tld = host.slice(host.lastIndexOf(".") + 1).toLowerCase();
    if (FILE_LIKE_TLDS.has(tld)) return false;

    // Bare hostnames must use a plausible TLD; explicit schemes are trusted.
    const hadScheme = /^https?:\/\//i.test(url.trim());
    if (!hadScheme && !KNOWN_TLDS.has(tld)) return false;

    return true;
  } catch {
    return false;
  }
}

/** Finds link-like substrings, skipping anything that is part of an email. */
function urlMatchesIn(text: string): string[] {
  const results: string[] = [];
  for (const match of text.matchAll(URL_PATTERN)) {
    const value = match[0];
    const index = match.index ?? 0;
    const before = text[index - 1] ?? "";
    const after = text[index + value.length] ?? "";
    // `name.surname@host` and `host` inside an address are both skipped.
    if (before === "@" || after === "@" || value.includes("@")) continue;
    results.push(value);
  }
  return results;
}

/**
 * Collects links from document hyperlink metadata *and* visible text, then
 * de-duplicates them. PDF/DOCX annotations often hold the real target while the
 * visible text only says "LinkedIn".
 */
export function parseLinks(
  lines: ExtractedLine[],
  documentLinks: ExtractedLink[],
): ResumeLink[] {
  const found = new Map<string, ResumeLink>();

  const add = (rawUrl: string, preferredLabel?: string) => {
    if (!isUsableUrl(rawUrl)) return;
    const url = normalizeUrl(rawUrl);
    const { kind } = classifyUrl(url);
    const key = url.toLowerCase().replace(/\/$/, "");
    if (found.has(key)) return;

    const useLabel =
      preferredLabel && preferredLabel.length <= 40 && !/^https?:/i.test(preferredLabel)
        ? preferredLabel
        : labelForUrl(url, kind);

    found.set(key, { id: uid("link"), kind, label: useLabel, url });
  };

  for (const link of documentLinks) {
    if (link.url.startsWith("mailto:") || link.url.startsWith("tel:")) continue;
    add(link.url, link.text);
  }

  for (const line of lines) {
    for (const match of urlMatchesIn(line.text)) add(match);
  }

  // Keep the most relevant links first.
  const priority: LinkKind[] = [
    "linkedin",
    "github",
    "portfolio",
    "website",
    "behance",
    "dribbble",
    "stackoverflow",
    "medium",
    "twitter",
    "custom",
  ];

  return [...found.values()].sort(
    (a, b) => priority.indexOf(a.kind) - priority.indexOf(b.kind),
  );
}

/** Finds URLs inside a single string, used when parsing project entries. */
export function urlsIn(text: string): string[] {
  return urlMatchesIn(text).filter(isUsableUrl);
}
