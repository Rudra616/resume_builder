import { AuroraSplit } from "@/components/resume/templates/AuroraSplit";
import { ClassicSerif } from "@/components/resume/templates/ClassicSerif";
import { CorporateBlue } from "@/components/resume/templates/CorporateBlue";
import { CreativeStudio } from "@/components/resume/templates/CreativeStudio";
import { ExecutiveNoir } from "@/components/resume/templates/ExecutiveNoir";
import { ModernEdge } from "@/components/resume/templates/ModernEdge";
import { NordicMinimal } from "@/components/resume/templates/NordicMinimal";
import { ProfileLuxe } from "@/components/resume/templates/ProfileLuxe";
import { SidebarPro } from "@/components/resume/templates/SidebarPro";
import { TechGrid } from "@/components/resume/templates/TechGrid";
import type { TemplateId } from "@/types/resume";
import type { TemplateDefinition, TemplateRegistry } from "@/types/template";

export const TEMPLATES: TemplateRegistry = {
  "executive-noir": {
    id: "executive-noir",
    name: "Executive Noir",
    tagline: "Dark masthead, right-rail dates",
    description:
      "A near-black header band over a single disciplined column. Dates live in a right-hand rail, which suits senior and leadership roles.",
    layout: "single-column",
    supportsPhoto: true,
    atsFriendly: true,
    tags: ["Leadership", "Formal", "One column"],
    defaults: {
      accentColor: "#b08b4f",
      secondaryColor: "#14181f",
      textColor: "#20252e",
      fontFamily: "lato",
      headingFontFamily: "lato",
      fontSize: 10.4,
      lineHeight: 1.45,
      sectionSpacing: 18,
      pagePadding: 15,
      headingStyle: "underline",
      uppercaseHeadings: true,
      showIcons: false,
    },
    component: ExecutiveNoir,
  },

  "modern-edge": {
    id: "modern-edge",
    name: "Modern Edge",
    tagline: "Accent stripe and timeline gutter",
    description:
      "A gradient stripe down the page edge with dotted timeline markers beside every section. Reads as contemporary without being loud.",
    layout: "single-column",
    supportsPhoto: true,
    atsFriendly: true,
    tags: ["Popular", "Tech", "One column"],
    defaults: {
      accentColor: "#1f4ed8",
      secondaryColor: "#0f172a",
      textColor: "#1f2733",
      fontFamily: "inter",
      headingFontFamily: "inter",
      fontSize: 10.5,
      lineHeight: 1.45,
      sectionSpacing: 17,
      pagePadding: 13,
      headingStyle: "plain",
      uppercaseHeadings: true,
      showIcons: true,
    },
    component: ModernEdge,
  },

  "nordic-minimal": {
    id: "nordic-minimal",
    name: "Nordic Minimal",
    tagline: "Whitespace and hairlines only",
    description:
      "No colour fills anywhere. Section labels sit in the left gutter in wide-tracked lowercase, letting the writing carry the page.",
    layout: "single-column",
    supportsPhoto: true,
    atsFriendly: true,
    tags: ["Minimal", "Editorial", "ATS safe"],
    defaults: {
      accentColor: "#3f4753",
      secondaryColor: "#1b1f26",
      textColor: "#262b33",
      fontFamily: "sourceSans",
      headingFontFamily: "sourceSans",
      fontSize: 10.4,
      lineHeight: 1.55,
      sectionSpacing: 22,
      pagePadding: 18,
      headingStyle: "plain",
      uppercaseHeadings: false,
      showIcons: false,
    },
    component: NordicMinimal,
  },

  "sidebar-pro": {
    id: "sidebar-pro",
    name: "Sidebar Pro",
    tagline: "Tinted left column",
    description:
      "A dark 34% sidebar holds your photo, contact details, skills and education so the main column stays dedicated to experience.",
    layout: "sidebar-left",
    supportsPhoto: true,
    atsFriendly: false,
    tags: ["Photo", "Two column", "Skills forward"],
    defaults: {
      accentColor: "#f0a03c",
      secondaryColor: "#1f2a3a",
      textColor: "#242a33",
      fontFamily: "roboto",
      headingFontFamily: "roboto",
      fontSize: 10.2,
      lineHeight: 1.45,
      sectionSpacing: 16,
      pagePadding: 12,
      headingStyle: "underline",
      uppercaseHeadings: true,
      showIcons: true,
    },
    component: SidebarPro,
  },

  "creative-studio": {
    id: "creative-studio",
    name: "Creative Studio",
    tagline: "Monogram tile, pill headings",
    description:
      "An asymmetric masthead with a monogram or portrait tile, pill-shaped headings and a narrower right column for skills.",
    layout: "two-column-grid",
    supportsPhoto: true,
    atsFriendly: false,
    tags: ["Design", "Bold", "Portfolio"],
    defaults: {
      accentColor: "#d6455a",
      secondaryColor: "#171a21",
      textColor: "#252a32",
      fontFamily: "inter",
      headingFontFamily: "inter",
      fontSize: 10.2,
      lineHeight: 1.45,
      sectionSpacing: 16,
      pagePadding: 13,
      headingStyle: "plain",
      uppercaseHeadings: true,
      showIcons: true,
    },
    component: CreativeStudio,
  },

  "corporate-blue": {
    id: "corporate-blue",
    name: "Corporate Blue",
    tagline: "Centred header, banded sections",
    description:
      "A conservative centred header with tinted section bands and italic company names. A safe choice for corporate and finance roles.",
    layout: "single-column",
    supportsPhoto: true,
    atsFriendly: true,
    tags: ["Corporate", "Traditional", "ATS safe"],
    defaults: {
      accentColor: "#1d4ed8",
      secondaryColor: "#152238",
      textColor: "#1f2733",
      fontFamily: "sourceSans",
      headingFontFamily: "sourceSans",
      fontSize: 10.5,
      lineHeight: 1.4,
      sectionSpacing: 16,
      pagePadding: 14,
      headingStyle: "boxed",
      uppercaseHeadings: true,
      showIcons: false,
    },
    component: CorporateBlue,
  },

  "tech-grid": {
    id: "tech-grid",
    name: "Tech Grid",
    tagline: "Monospace meta, bordered grid",
    description:
      "Key/value contact metadata in monospace, `//` heading prefixes and a two-cell grid for skills, education and certifications.",
    layout: "two-column-grid",
    supportsPhoto: true,
    atsFriendly: true,
    tags: ["Engineering", "Developer", "Grid"],
    defaults: {
      accentColor: "#0f9d76",
      secondaryColor: "#101720",
      textColor: "#212832",
      fontFamily: "inter",
      headingFontFamily: "jetbrains",
      fontSize: 10.2,
      lineHeight: 1.5,
      sectionSpacing: 16,
      pagePadding: 13,
      headingStyle: "plain",
      uppercaseHeadings: true,
      showIcons: false,
    },
    component: TechGrid,
  },

  "profile-luxe": {
    id: "profile-luxe",
    name: "Profile Luxe",
    tagline: "Portrait masthead, gutter labels",
    description:
      "A framed portrait centred at the top, then section titles in a right-aligned gutter opposite their content.",
    layout: "split-header",
    supportsPhoto: true,
    atsFriendly: false,
    tags: ["Photo", "Elegant", "Consulting"],
    defaults: {
      accentColor: "#8c6f4a",
      secondaryColor: "#1c1a17",
      textColor: "#2a2723",
      fontFamily: "merriweather",
      headingFontFamily: "playfair",
      fontSize: 10,
      lineHeight: 1.5,
      sectionSpacing: 18,
      pagePadding: 16,
      headingStyle: "plain",
      uppercaseHeadings: true,
      showIcons: true,
    },
    component: ProfileLuxe,
  },

  "classic-serif": {
    id: "classic-serif",
    name: "Classic Serif",
    tagline: "Traditional one-column CV",
    description:
      "Centred name, small-caps headings on a full-width rule, no colour fills and no sidebars. The most machine-readable option.",
    layout: "single-column",
    supportsPhoto: false,
    atsFriendly: true,
    tags: ["Academic", "ATS safe", "Serif"],
    defaults: {
      accentColor: "#33302b",
      secondaryColor: "#17150f",
      textColor: "#22201c",
      fontFamily: "garamond",
      headingFontFamily: "garamond",
      fontSize: 11,
      lineHeight: 1.45,
      sectionSpacing: 16,
      pagePadding: 18,
      headingStyle: "underline",
      uppercaseHeadings: true,
      showIcons: false,
    },
    component: ClassicSerif,
  },

  "aurora-split": {
    id: "aurora-split",
    name: "Aurora Split",
    tagline: "Gradient rail on the right",
    description:
      "A full-width name band, content on the left and a gradient rail on the right carrying contact details and skill meters.",
    layout: "sidebar-right",
    supportsPhoto: true,
    atsFriendly: false,
    tags: ["Modern", "Gradient", "Two column"],
    defaults: {
      accentColor: "#6d5ae0",
      secondaryColor: "#1a1d2b",
      textColor: "#242835",
      fontFamily: "inter",
      headingFontFamily: "inter",
      fontSize: 10.2,
      lineHeight: 1.5,
      sectionSpacing: 16,
      pagePadding: 13,
      headingStyle: "plain",
      uppercaseHeadings: true,
      showIcons: true,
    },
    component: AuroraSplit,
  },
};

export const TEMPLATE_LIST: TemplateDefinition[] = Object.values(TEMPLATES);

export const TEMPLATE_IDS = TEMPLATE_LIST.map((template) => template.id);

export function getTemplate(id: TemplateId): TemplateDefinition {
  return TEMPLATES[id] ?? TEMPLATES["modern-edge"];
}

export function isTemplateId(value: string): value is TemplateId {
  return value in TEMPLATES;
}
