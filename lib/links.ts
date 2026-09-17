import type { LinkKind } from "@/types/resume";

export { classifyUrl, labelForUrl, normalizeUrl } from "@/lib/resume-parser/parseLinks";

/** Link types offered in the editor, in the order most resumes use them. */
export const LINK_KIND_OPTIONS: { value: LinkKind; label: string }[] = [
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "portfolio", label: "Portfolio" },
  { value: "website", label: "Website" },
  { value: "behance", label: "Behance" },
  { value: "dribbble", label: "Dribbble" },
  { value: "twitter", label: "X / Twitter" },
  { value: "stackoverflow", label: "Stack Overflow" },
  { value: "medium", label: "Medium" },
  { value: "custom", label: "Other" },
];
