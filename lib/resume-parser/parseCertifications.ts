import { extractDateRange } from "@/lib/resume-parser/dateRanges";
import { stripBullet, words } from "@/lib/resume-parser/normalizeText";
import { normalizeUrl, urlsIn } from "@/lib/resume-parser/parseLinks";
import { uid } from "@/lib/utils";
import type { ExtractedLine } from "@/types/parser";
import type { AwardEntry, CertificationEntry, Confidence } from "@/types/resume";

const ISSUER_SEPARATOR = /\s+(?:[|•·–—]|by|from|,)\s+/;

const KNOWN_ISSUERS =
  /(amazon web services|aws|microsoft|google|oracle|cisco|coursera|udemy|udacity|edx|linkedin learning|hubspot|scrum\.org|scrum alliance|pmi|comptia|red hat|salesforce|meta|ibm|adobe|figma|nptel|hackerrank)/i;

export interface CertificationsResult {
  certifications: CertificationEntry[];
  confidence: Record<string, Confidence>;
}

/**
 * One certification per line is the overwhelming convention, so each non-empty
 * line becomes an entry with the issuer and date pulled out where present.
 */
export function parseCertifications(lines: ExtractedLine[]): CertificationsResult {
  const certifications: CertificationEntry[] = [];
  const confidence: Record<string, Confidence> = {};

  for (const line of lines) {
    const text = stripBullet(line.text).trim();
    if (!text || words(text).length < 2) continue;

    const range = extractDateRange(text);
    const withoutDate = range ? range.remainder : text;
    const urls = urlsIn(withoutDate);
    const withoutUrl = urls
      .reduce((acc, url) => acc.replace(url, " "), withoutDate)
      .replace(/\s{2,}/g, " ")
      .trim();

    const parts = withoutUrl
      .split(ISSUER_SEPARATOR)
      .map((part) => part.trim())
      .filter(Boolean);

    const issuerIndex = parts.findIndex((part) => KNOWN_ISSUERS.test(part));
    const name = issuerIndex === 0 ? (parts[1] ?? parts[0]) : parts[0];
    const issuer =
      issuerIndex >= 0
        ? parts[issuerIndex]
        : (parts.slice(1).find((part) => part.length > 1) ?? "");

    if (!name) continue;

    const position = certifications.length;
    certifications.push({
      id: uid("cert"),
      name,
      issuer: issuer === name ? "" : issuer,
      date: range?.start ?? "",
      url: urls[0] ? normalizeUrl(urls[0]) : "",
    });

    confidence[`certifications.${position}.name`] = "medium";
    if (!issuer) confidence[`certifications.${position}.issuer`] = "low";
  }

  return { certifications, confidence };
}

export interface AwardsResult {
  awards: AwardEntry[];
  confidence: Record<string, Confidence>;
}

/** Awards and achievements share the same one-line-per-entry shape. */
export function parseAwards(lines: ExtractedLine[]): AwardsResult {
  const awards: AwardEntry[] = [];
  const confidence: Record<string, Confidence> = {};

  for (const line of lines) {
    const text = stripBullet(line.text).trim();
    if (!text || words(text).length < 2) continue;

    const range = extractDateRange(text);
    const remainder = range ? range.remainder : text;
    const parts = remainder
      .split(ISSUER_SEPARATOR)
      .map((part) => part.trim())
      .filter(Boolean);

    const position = awards.length;
    awards.push({
      id: uid("award"),
      title: parts[0] ?? remainder,
      issuer: parts.length > 1 && words(parts[1]).length <= 6 ? parts[1] : "",
      date: range?.start ?? "",
      description: parts.length > 2 ? parts.slice(2).join(", ") : "",
    });

    confidence[`awards.${position}.title`] = "medium";
  }

  return { awards, confidence };
}
