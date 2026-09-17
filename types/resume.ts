/**
 * The single universal resume data structure.
 *
 * Templates NEVER own content — they only render ResumeData. That is what makes
 * "imported old resume -> any template" and "blank resume -> any template" work
 * without ever resetting the user's information.
 */

export type ResumeSource = "blank" | "pdf" | "docx" | "txt" | "sample";

export type Confidence = "high" | "medium" | "low";

/** Per-field extraction confidence, keyed by a dotted field path. */
export type ConfidenceMap = Record<string, Confidence>;

export interface PersonalInfo {
  fullName: string;
  jobTitle: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  photo?: string; // data URL, resized in-browser
  photoShape?: "circle" | "rounded" | "square";
}

export type LinkKind =
  | "linkedin"
  | "github"
  | "portfolio"
  | "website"
  | "behance"
  | "dribbble"
  | "twitter"
  | "stackoverflow"
  | "medium"
  | "custom";

export interface ResumeLink {
  id: string;
  kind: LinkKind;
  label: string;
  url: string;
}

export interface ExperienceEntry {
  id: string;
  role: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
  technologies: string[];
}

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  field: string;
  location: string;
  startDate: string;
  endDate: string;
  grade: string;
  description: string;
}

export interface ProjectEntry {
  id: string;
  name: string;
  role: string;
  description: string;
  url: string;
  repoUrl: string;
  startDate: string;
  endDate: string;
  technologies: string[];
  achievements: string[];
}

export interface SkillGroup {
  id: string;
  category: string;
  items: string[];
}

export interface CertificationEntry {
  id: string;
  name: string;
  issuer: string;
  date: string;
  url: string;
}

export type LanguageLevel =
  | "Native"
  | "Fluent"
  | "Professional"
  | "Intermediate"
  | "Basic"
  | "";

export interface LanguageEntry {
  id: string;
  name: string;
  level: LanguageLevel;
}

export interface AwardEntry {
  id: string;
  title: string;
  issuer: string;
  date: string;
  description: string;
}

export interface VolunteeringEntry {
  id: string;
  role: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface ReferenceEntry {
  id: string;
  name: string;
  relationship: string;
  company: string;
  email: string;
  phone: string;
}

export interface CustomSectionItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
  bullets: string[];
}

export interface CustomSection {
  id: string;
  heading: string;
  items: CustomSectionItem[];
}

/** Text the parser found but could not confidently categorise. */
export interface UnclassifiedBlock {
  id: string;
  heading?: string;
  lines: string[];
  page?: number;
}

export interface ResumeMetadata {
  source: ResumeSource;
  importedFileName?: string;
  importedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Set when an import produced low-confidence fields the user should review. */
  reviewCompleted?: boolean;
}

export type SectionKey =
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "certifications"
  | "languages"
  | "awards"
  | "volunteering"
  | "references"
  | "links"
  | `custom:${string}`;

export interface SectionState {
  key: SectionKey;
  visible: boolean;
}

export type DateFormatPreference =
  | "MMM yyyy"
  | "MMMM yyyy"
  | "MM/yyyy"
  | "yyyy";

export interface ResumeDesign {
  templateId: TemplateId;
  accentColor: string;
  secondaryColor: string;
  textColor: string;
  fontFamily: FontKey;
  headingFontFamily: FontKey;
  fontSize: number; // pt, body text
  lineHeight: number;
  sectionSpacing: number; // px
  pagePadding: number; // mm
  headingStyle: "plain" | "underline" | "bar" | "boxed";
  showPhoto: boolean;
  showIcons: boolean;
  uppercaseHeadings: boolean;
  dateFormat: DateFormatPreference;
}

export type FontKey =
  | "inter"
  | "sourceSans"
  | "roboto"
  | "lato"
  | "merriweather"
  | "playfair"
  | "georgia"
  | "garamond"
  | "jetbrains";

export type TemplateId =
  | "executive-noir"
  | "modern-edge"
  | "nordic-minimal"
  | "sidebar-pro"
  | "creative-studio"
  | "corporate-blue"
  | "tech-grid"
  | "profile-luxe"
  | "classic-serif"
  | "aurora-split";

export interface ResumeData {
  personalInfo: PersonalInfo;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  projects: ProjectEntry[];
  skills: SkillGroup[];
  links: ResumeLink[];
  certifications: CertificationEntry[];
  languages: LanguageEntry[];
  awards: AwardEntry[];
  volunteering: VolunteeringEntry[];
  references: ReferenceEntry[];
  customSections: CustomSection[];
  unclassifiedContent: UnclassifiedBlock[];
  sectionOrder: SectionState[];
  design: ResumeDesign;
  confidence: ConfidenceMap;
  metadata: ResumeMetadata;
}
