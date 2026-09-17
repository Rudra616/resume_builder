import { uid } from "@/lib/utils";
import type { ResumeData, SectionKey, UnclassifiedBlock } from "@/types/resume";

export type UnclassifiedDestination =
  | "summary"
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "custom"
  | "ignore";

export const UNCLASSIFIED_DESTINATIONS: {
  value: UnclassifiedDestination;
  label: string;
}[] = [
  { value: "summary", label: "Move to Summary" },
  { value: "experience", label: "Move to Experience" },
  { value: "education", label: "Move to Education" },
  { value: "projects", label: "Move to Projects" },
  { value: "skills", label: "Move to Skills" },
];

/**
 * Moves one unclassified block into a real section and drops it from the
 * unclassified list. "ignore" only removes the block — the original text is
 * never silently merged somewhere the user didn't choose.
 */
export function moveUnclassifiedBlock(
  resume: ResumeData,
  block: UnclassifiedBlock,
  destination: UnclassifiedDestination,
): ResumeData {
  const text = block.lines.join(" ").trim();
  let next: ResumeData = { ...resume };

  switch (destination) {
    case "summary":
      next = {
        ...next,
        summary: [next.summary, text].filter(Boolean).join(" ").trim(),
      };
      break;

    case "experience":
      next = {
        ...next,
        experience: [
          ...next.experience,
          {
            id: uid("exp"),
            role: block.heading ?? "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
            achievements: block.lines,
            technologies: [],
          },
        ],
      };
      break;

    case "education":
      next = {
        ...next,
        education: [
          ...next.education,
          {
            id: uid("edu"),
            degree: block.heading ?? block.lines[0] ?? "",
            institution: block.lines[1] ?? "",
            field: "",
            location: "",
            startDate: "",
            endDate: "",
            grade: "",
            description: block.lines.slice(2).join(" "),
          },
        ],
      };
      break;

    case "projects":
      next = {
        ...next,
        projects: [
          ...next.projects,
          {
            id: uid("prj"),
            name: block.heading ?? block.lines[0] ?? "",
            role: "",
            description: block.heading ? text : block.lines.slice(1).join(" "),
            url: "",
            repoUrl: "",
            startDate: "",
            endDate: "",
            technologies: [],
            achievements: [],
          },
        ],
      };
      break;

    case "skills": {
      const items = block.lines
        .flatMap((line) => line.split(/[,;•·|]/))
        .map((item) => item.trim())
        .filter(Boolean);
      next = {
        ...next,
        skills: [
          ...next.skills,
          { id: uid("skl"), category: block.heading ?? "Additional", items },
        ],
      };
      break;
    }

    case "custom": {
      const section = {
        id: uid("cst"),
        heading: block.heading ?? "Additional Information",
        items: [
          {
            id: uid("cstitem"),
            title: "",
            subtitle: "",
            date: "",
            description: block.lines.length === 1 ? block.lines[0] : "",
            bullets: block.lines.length > 1 ? block.lines : [],
          },
        ],
      };
      next = {
        ...next,
        customSections: [...next.customSections, section],
        sectionOrder: [
          ...next.sectionOrder,
          { key: `custom:${section.id}` as SectionKey, visible: true },
        ],
      };
      break;
    }

    case "ignore":
      break;
  }

  return {
    ...next,
    unclassifiedContent: next.unclassifiedContent.filter(
      (entry) => entry.id !== block.id,
    ),
  };
}
