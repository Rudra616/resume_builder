import { uid } from "@/lib/utils";
import type {
  CustomSection,
  EducationEntry,
  ExperienceEntry,
  ProjectEntry,
  ResumeData,
  ResumeDesign,
  SectionKey,
  SectionState,
  SkillGroup,
  TemplateId,
} from "@/types/resume";

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  "summary",
  "experience",
  "projects",
  "education",
  "skills",
  "certifications",
  "languages",
  "awards",
  "volunteering",
  "links",
  "references",
];

export const DEFAULT_DESIGN: ResumeDesign = {
  templateId: "modern-edge",
  accentColor: "#1f4ed8",
  secondaryColor: "#0f172a",
  textColor: "#1f2733",
  fontFamily: "inter",
  headingFontFamily: "inter",
  fontSize: 10.5,
  lineHeight: 1.45,
  sectionSpacing: 18,
  pagePadding: 14,
  headingStyle: "bar",
  showPhoto: true,
  showIcons: true,
  uppercaseHeadings: true,
  dateFormat: "MMM yyyy",
};

export function defaultSectionOrder(): SectionState[] {
  return DEFAULT_SECTION_ORDER.map((key) => ({
    key,
    visible:
      key === "summary" ||
      key === "experience" ||
      key === "education" ||
      key === "skills" ||
      key === "projects" ||
      key === "links",
  }));
}

export function createEmptyExperience(): ExperienceEntry {
  return {
    id: uid("exp"),
    role: "",
    company: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    description: "",
    achievements: [""],
    technologies: [],
  };
}

export function createEmptyEducation(): EducationEntry {
  return {
    id: uid("edu"),
    degree: "",
    institution: "",
    field: "",
    location: "",
    startDate: "",
    endDate: "",
    grade: "",
    description: "",
  };
}

export function createEmptyProject(): ProjectEntry {
  return {
    id: uid("prj"),
    name: "",
    role: "",
    description: "",
    url: "",
    repoUrl: "",
    startDate: "",
    endDate: "",
    technologies: [],
    achievements: [],
  };
}

export function createEmptySkillGroup(category = "Core Skills"): SkillGroup {
  return { id: uid("skl"), category, items: [] };
}

export function createEmptyCustomSection(heading = "Custom Section"): CustomSection {
  return {
    id: uid("cst"),
    heading,
    items: [
      {
        id: uid("cstitem"),
        title: "",
        subtitle: "",
        date: "",
        description: "",
        bullets: [],
      },
    ],
  };
}

export function createEmptyResume(templateId: TemplateId = "modern-edge"): ResumeData {
  const now = new Date().toISOString();
  return {
    personalInfo: {
      fullName: "",
      jobTitle: "",
      email: "",
      phone: "",
      city: "",
      state: "",
      country: "",
      photoShape: "circle",
    },
    summary: "",
    experience: [createEmptyExperience()],
    education: [createEmptyEducation()],
    projects: [],
    skills: [createEmptySkillGroup()],
    links: [],
    certifications: [],
    languages: [],
    awards: [],
    volunteering: [],
    references: [],
    customSections: [],
    unclassifiedContent: [],
    sectionOrder: defaultSectionOrder(),
    design: { ...DEFAULT_DESIGN, templateId },
    confidence: {},
    metadata: {
      source: "blank",
      createdAt: now,
      updatedAt: now,
    },
  };
}

/**
 * Fills in anything missing from a persisted or imported resume so older drafts
 * and partial parser output can always be rendered safely.
 */
export function normalizeResume(input: Partial<ResumeData> | null | undefined): ResumeData {
  const base = createEmptyResume();
  if (!input) return base;

  const sectionOrder = mergeSectionOrder(input.sectionOrder, input.customSections);

  return {
    personalInfo: { ...base.personalInfo, ...(input.personalInfo ?? {}) },
    summary: input.summary ?? "",
    experience: input.experience ?? [],
    education: input.education ?? [],
    projects: input.projects ?? [],
    skills: input.skills ?? [],
    links: input.links ?? [],
    certifications: input.certifications ?? [],
    languages: input.languages ?? [],
    awards: input.awards ?? [],
    volunteering: input.volunteering ?? [],
    references: input.references ?? [],
    customSections: input.customSections ?? [],
    unclassifiedContent: input.unclassifiedContent ?? [],
    sectionOrder,
    design: { ...base.design, ...(input.design ?? {}) },
    confidence: input.confidence ?? {},
    metadata: { ...base.metadata, ...(input.metadata ?? {}) },
  };
}

/** Keeps stored ordering while adding sections that appeared later. */
export function mergeSectionOrder(
  stored: SectionState[] | undefined,
  customSections: CustomSection[] | undefined,
): SectionState[] {
  const expected: SectionKey[] = [
    ...DEFAULT_SECTION_ORDER,
    ...(customSections ?? []).map((section) => `custom:${section.id}` as SectionKey),
  ];

  const storedList = (stored ?? []).filter((entry) => expected.includes(entry.key));
  const seen = new Set(storedList.map((entry) => entry.key));
  const defaults = defaultSectionOrder();

  const additions: SectionState[] = expected
    .filter((key) => !seen.has(key))
    .map((key) => {
      const fallback = defaults.find((entry) => entry.key === key);
      return { key, visible: fallback ? fallback.visible : true };
    });

  return [...storedList, ...additions];
}
