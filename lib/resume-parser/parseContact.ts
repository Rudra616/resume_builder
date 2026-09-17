import { looksLikeAllCaps, words } from "@/lib/resume-parser/normalizeText";
import { titleCase } from "@/lib/utils";
import type { Confidence, PersonalInfo } from "@/types/resume";
import type { ExtractedLine } from "@/types/parser";

const EMAIL_PATTERN = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

/** Deliberately permissive: resumes format phone numbers every possible way. */
const PHONE_PATTERN =
  /(?:\+\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3,5}[\s.-]?\d{3,5}(?:[\s.-]?\d{2,5})?/;

const ROLE_KEYWORDS = [
  "engineer",
  "developer",
  "designer",
  "manager",
  "analyst",
  "consultant",
  "architect",
  "specialist",
  "administrator",
  "scientist",
  "researcher",
  "lead",
  "director",
  "officer",
  "intern",
  "associate",
  "accountant",
  "marketer",
  "writer",
  "editor",
  "recruiter",
  "coordinator",
  "technician",
  "programmer",
  "strategist",
  "producer",
  "teacher",
  "nurse",
  "advocate",
  "founder",
  "freelance",
  "student",
];

/** Countries seen often enough on resumes to recognise without a full dataset. */
const COUNTRIES = [
  "india",
  "united states",
  "usa",
  "united kingdom",
  "uk",
  "canada",
  "australia",
  "germany",
  "france",
  "spain",
  "italy",
  "netherlands",
  "ireland",
  "singapore",
  "japan",
  "china",
  "brazil",
  "mexico",
  "poland",
  "portugal",
  "sweden",
  "norway",
  "denmark",
  "finland",
  "switzerland",
  "austria",
  "belgium",
  "new zealand",
  "south africa",
  "uae",
  "united arab emirates",
  "qatar",
  "saudi arabia",
  "pakistan",
  "bangladesh",
  "sri lanka",
  "nepal",
  "philippines",
  "indonesia",
  "malaysia",
  "thailand",
  "vietnam",
  "turkey",
  "israel",
  "egypt",
  "nigeria",
  "kenya",
  "ghana",
  "argentina",
  "chile",
  "colombia",
  "peru",
];

/** US state and Indian state abbreviations that appear in "City, ST" strings. */
const STATE_ABBR =
  /^(A[LKZR]|C[AOT]|D[EC]|FL|GA|HI|I[DLNA]|K[SY]|LA|M[EDAINSOT]|N[EVHJMYCD]|O[HKR]|P[AR]|RI|S[CD]|T[NX]|UT|V[TA]|W[AVIY]|MH|GJ|KA|TN|TS|UP|MP|WB|RJ|PB|HR|KL|AP|OR|BR|JH|CG|AS|GA|ON|BC|QC|AB|NS|NB|MB|SK)$/i;

export interface ContactResult {
  personalInfo: PersonalInfo;
  confidence: Record<string, Confidence>;
  /** Lines from the contact block that were used, so they aren't re-used. */
  consumedLines: Set<number>;
}

/**
 * Two-column layouts extract as interleaved rows, so the name often arrives with
 * the sidebar's first heading glued to it ("Aiden Brooks CONTACT"). Trailing
 * all-caps section words are dropped; everything else is left alone.
 */
const TRAILING_HEADING =
  /\s+(CONTACT|CONTACT DETAILS|CONTACT INFORMATION|DETAILS|PROFILE|SUMMARY|ABOUT|ABOUT ME|SKILLS|EDUCATION|EXPERIENCE|LINKS|LANGUAGES|PERSONAL DETAILS)$/;

function stripTrailingHeading(text: string): string {
  return text.replace(TRAILING_HEADING, "").trim();
}

function looksLikeName(text: string): boolean {
  const trimmed = stripTrailingHeading(text.trim());
  if (!trimmed || trimmed.length > 45) return false;
  if (EMAIL_PATTERN.test(trimmed)) return false;
  if (/\d/.test(trimmed)) return false;
  if (/[@|/\\]/.test(trimmed)) return false;

  const tokens = words(trimmed);
  if (tokens.length < 2 || tokens.length > 5) return false;

  // Reject role-like lines: a name rarely contains a job keyword.
  const lower = trimmed.toLowerCase();
  if (ROLE_KEYWORDS.some((keyword) => lower.includes(keyword))) return false;

  const capitalised = tokens.filter((token) => /^[A-Z][a-z'’.-]*$/.test(token));
  return capitalised.length >= tokens.length - 1 || looksLikeAllCaps(trimmed);
}

/**
 * Some resumes type the name in lower case. On the very first line, a short
 * word pair with no contact punctuation is still almost certainly the name, so we
 * take it with low confidence and let the review screen ask about it.
 */
function looksLikeLowercaseName(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 45) return false;
  if (/[\d@|/\\,]/.test(trimmed)) return false;
  const tokens = words(trimmed);
  if (tokens.length < 2 || tokens.length > 4) return false;
  const lower = trimmed.toLowerCase();
  if (ROLE_KEYWORDS.some((keyword) => lower.includes(keyword))) return false;
  return tokens.every((token) => /^[a-z][a-z'’.-]*$/.test(token));
}

function looksLikeJobTitle(text: string): boolean {
  const lower = text.toLowerCase();
  if (text.length > 70) return false;
  if (EMAIL_PATTERN.test(text)) return false;
  return ROLE_KEYWORDS.some((keyword) => lower.includes(keyword));
}

function extractLocation(text: string): {
  city: string;
  state: string;
  country: string;
} | null {
  const cleaned = text
    .replace(EMAIL_PATTERN, " ")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/\|/g, ",")
    .replace(/[•·]/g, ",")
    .trim();

  const lower = cleaned.toLowerCase();
  const countryMatch = COUNTRIES.find((country) =>
    new RegExp(`(^|[,\\s])${country}([,\\s]|$)`, "i").test(lower),
  );

  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length < 30 && !/\d{4}/.test(part));

  if (countryMatch) {
    const country = titleCase(countryMatch);
    const rest = parts.filter(
      (part) => part.toLowerCase() !== countryMatch.toLowerCase(),
    );
    return {
      city: rest[0] ?? "",
      state: rest.length > 1 ? rest[1] : "",
      country,
    };
  }

  // "Bengaluru, KA" style
  if (parts.length >= 2 && STATE_ABBR.test(parts[1].replace(/\./g, ""))) {
    return { city: parts[0], state: parts[1].toUpperCase(), country: "" };
  }

  // "City, Region" where both look like place names
  if (
    parts.length === 2 &&
    parts.every((part) => /^[A-Z][A-Za-z\s'’-]+$/.test(part)) &&
    !looksLikeJobTitle(cleaned) &&
    words(cleaned).length <= 5
  ) {
    return { city: parts[0], state: parts[1], country: "" };
  }

  return null;
}

function cleanPhone(raw: string): string {
  return raw.replace(/[^\d+()\s.-]/g, "").replace(/\s{2,}/g, " ").trim();
}

/**
 * Reads the block above the first section heading, where nearly every resume
 * puts identity and contact details.
 *
 * Anything uncertain is reported with `medium`/`low` confidence rather than
 * being presented as fact — the review screen highlights those fields.
 */
export function parseContact(lines: ExtractedLine[]): ContactResult {
  const personalInfo: PersonalInfo = {
    fullName: "",
    jobTitle: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    country: "",
    photoShape: "circle",
  };
  const confidence: Record<string, Confidence> = {};
  const consumedLines = new Set<number>();

  // Contact details are reliable wherever they appear, so scan a wide window.
  const searchWindow = lines.slice(0, Math.min(lines.length, 40));

  searchWindow.forEach((line, index) => {
    if (!personalInfo.email) {
      const match = line.text.match(EMAIL_PATTERN);
      if (match) {
        personalInfo.email = match[0].toLowerCase();
        confidence["personalInfo.email"] = "high";
        consumedLines.add(index);
      }
    }

    if (!personalInfo.phone) {
      // Avoid catching years, zip codes and date ranges.
      const candidate = line.text
        .replace(/\b(19|20)\d{2}\s*[-–—]\s*((19|20)\d{2}|present)\b/gi, " ")
        .replace(/\b(19|20)\d{2}\b/g, " ");
      const match = candidate.match(PHONE_PATTERN);
      const digits = match ? match[0].replace(/\D/g, "") : "";
      if (match && digits.length >= 8 && digits.length <= 15) {
        personalInfo.phone = cleanPhone(match[0]);
        confidence["personalInfo.phone"] = digits.length >= 10 ? "high" : "medium";
        consumedLines.add(index);
      }
    }
  });

  // The name is nearly always in the first handful of lines.
  const headerLines = lines.slice(0, Math.min(lines.length, 8));

  headerLines.forEach((line, index) => {
    if (personalInfo.fullName) return;
    if (!looksLikeName(line.text)) return;
    const candidate = stripTrailingHeading(line.text.trim());
    personalInfo.fullName = looksLikeAllCaps(candidate)
      ? titleCase(candidate)
      : candidate;
    // Largest text on the page is a strong signal; otherwise ask for a check.
    confidence["personalInfo.fullName"] = line.heading || index === 0 ? "high" : "medium";
    consumedLines.add(index);
  });

  if (!personalInfo.fullName && lines[0] && looksLikeLowercaseName(lines[0].text)) {
    personalInfo.fullName = titleCase(lines[0].text.trim());
    confidence["personalInfo.fullName"] = "low";
    consumedLines.add(0);
  }

  headerLines.forEach((line, index) => {
    if (personalInfo.jobTitle || consumedLines.has(index)) return;
    if (!looksLikeJobTitle(line.text)) return;
    const value = line.text.split(/[|•·]/)[0].trim();
    personalInfo.jobTitle = value.replace(/\s{2,}/g, " ");
    confidence["personalInfo.jobTitle"] = "medium";
    consumedLines.add(index);
  });

  headerLines.forEach((line, index) => {
    if (personalInfo.city || personalInfo.country) return;
    const location = extractLocation(line.text);
    if (!location) return;
    personalInfo.city = location.city;
    personalInfo.state = location.state;
    personalInfo.country = location.country;
    confidence["personalInfo.city"] = location.country ? "medium" : "low";
    consumedLines.add(index);
  });

  if (!personalInfo.fullName) confidence["personalInfo.fullName"] = "low";
  if (!personalInfo.email) confidence["personalInfo.email"] = "low";

  return { personalInfo, confidence, consumedLines };
}
