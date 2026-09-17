import { defaultSectionOrder, DEFAULT_DESIGN } from "@/lib/resume-defaults";
import type { ResumeData } from "@/types/resume";

/**
 * Demo content for the template gallery and comparison previews. It is never
 * written into a user draft unless they explicitly load the sample.
 */
export const SAMPLE_RESUME: ResumeData = {
  personalInfo: {
    fullName: "Rudra Panchal",
    jobTitle: "Senior React Native Developer",
    email: "rudra.panchal@example.com",
    phone: "+91 98250 41122",
    city: "Ahmedabad",
    state: "Gujarat",
    country: "India",
    photoShape: "circle",
  },
  summary:
    "React Native developer with six years building cross-platform products for fintech and logistics teams. Leads mobile architecture, release automation and design-system work. Comfortable owning a feature from discovery through store release.",
  experience: [
    {
      id: "sample-exp-1",
      role: "Senior React Native Developer",
      company: "Northwind Logistics",
      location: "Remote",
      startDate: "2023-03",
      endDate: "",
      current: true,
      description: "",
      achievements: [
        "Rebuilt the driver application on React Native with an offline-first sync layer used across three countries.",
        "Introduced a shared design system package adopted by the mobile and web teams.",
        "Automated release pipelines with Fastlane and GitHub Actions, cutting manual release work each cycle.",
      ],
      technologies: ["React Native", "TypeScript", "Reanimated", "GraphQL"],
    },
    {
      id: "sample-exp-2",
      role: "Mobile Engineer",
      company: "Fintrail Payments",
      location: "Bengaluru, India",
      startDate: "2020-07",
      endDate: "2023-02",
      current: false,
      description: "",
      achievements: [
        "Delivered card management, KYC and statement modules for a consumer banking app.",
        "Migrated the legacy navigation stack to React Navigation with typed routes.",
        "Mentored three junior engineers through code review and pairing sessions.",
      ],
      technologies: ["React Native", "Redux Toolkit", "Node.js", "Detox"],
    },
    {
      id: "sample-exp-3",
      role: "Frontend Developer",
      company: "Studio Bluebird",
      location: "Ahmedabad, India",
      startDate: "2018-08",
      endDate: "2020-06",
      current: false,
      description: "",
      achievements: [
        "Built marketing sites and dashboards in React for agency clients.",
        "Implemented accessible component patterns used across client projects.",
      ],
      technologies: ["React", "JavaScript", "SCSS"],
    },
  ],
  education: [
    {
      id: "sample-edu-1",
      degree: "B.E. Computer Engineering",
      institution: "Gujarat Technological University",
      field: "Computer Engineering",
      location: "Ahmedabad, India",
      startDate: "2014-07",
      endDate: "2018-05",
      grade: "First Class",
      description: "",
    },
  ],
  projects: [
    {
      id: "sample-prj-1",
      name: "Trailmark",
      role: "Creator",
      description:
        "Offline hiking companion that records routes and syncs them once the device is back online.",
      url: "https://trailmark.app",
      repoUrl: "https://github.com/rudrapanchal/trailmark",
      startDate: "2024-01",
      endDate: "",
      technologies: ["Expo", "SQLite", "MapLibre"],
      achievements: [
        "Published to both app stores with a shared TypeScript codebase.",
      ],
    },
    {
      id: "sample-prj-2",
      name: "Formkit Native",
      role: "Maintainer",
      description:
        "Open-source form primitives for React Native with schema validation helpers.",
      url: "",
      repoUrl: "https://github.com/rudrapanchal/formkit-native",
      startDate: "2022-05",
      endDate: "2023-11",
      technologies: ["TypeScript", "Zod"],
      achievements: [],
    },
  ],
  skills: [
    {
      id: "sample-skl-1",
      category: "Mobile",
      items: ["React Native", "Expo", "Reanimated", "React Navigation", "Detox"],
    },
    {
      id: "sample-skl-2",
      category: "Web & Backend",
      items: ["React", "Next.js", "TypeScript", "Node.js", "GraphQL", "PostgreSQL"],
    },
    {
      id: "sample-skl-3",
      category: "Practices",
      items: ["Design systems", "CI/CD", "Testing", "Code review", "Mentoring"],
    },
  ],
  links: [
    {
      id: "sample-link-1",
      kind: "linkedin",
      label: "linkedin.com/in/rudrapanchal",
      url: "https://linkedin.com/in/rudrapanchal",
    },
    {
      id: "sample-link-2",
      kind: "github",
      label: "github.com/rudrapanchal",
      url: "https://github.com/rudrapanchal",
    },
    {
      id: "sample-link-3",
      kind: "portfolio",
      label: "rudra.dev",
      url: "https://rudra.dev",
    },
  ],
  certifications: [
    {
      id: "sample-cert-1",
      name: "AWS Certified Developer — Associate",
      issuer: "Amazon Web Services",
      date: "2023-09",
      url: "",
    },
  ],
  languages: [
    { id: "sample-lang-1", name: "English", level: "Professional" },
    { id: "sample-lang-2", name: "Hindi", level: "Native" },
    { id: "sample-lang-3", name: "Gujarati", level: "Native" },
  ],
  awards: [
    {
      id: "sample-award-1",
      title: "Engineering Excellence Award",
      issuer: "Fintrail Payments",
      date: "2022-12",
      description: "Recognised for the card management module release.",
    },
  ],
  volunteering: [
    {
      id: "sample-vol-1",
      role: "Mentor",
      organization: "Ahmedabad JS Community",
      startDate: "2021-01",
      endDate: "",
      description: "Runs monthly workshops on React Native fundamentals.",
    },
  ],
  references: [],
  customSections: [],
  unclassifiedContent: [],
  sectionOrder: defaultSectionOrder().map((entry) =>
    entry.key === "certifications" || entry.key === "languages"
      ? { ...entry, visible: true }
      : entry,
  ),
  design: { ...DEFAULT_DESIGN },
  confidence: {},
  metadata: {
    source: "sample",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
  },
};

/** Content used for the small template thumbnails in the gallery. */
export function sampleResumeForPreview(): ResumeData {
  return JSON.parse(JSON.stringify(SAMPLE_RESUME)) as ResumeData;
}
