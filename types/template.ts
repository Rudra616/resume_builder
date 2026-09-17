import type { ComponentType } from "react";
import type { ResumeData, ResumeDesign, TemplateId } from "./resume";

export interface TemplateProps {
  resume: ResumeData;
}

export type TemplateLayout =
  | "single-column"
  | "sidebar-left"
  | "sidebar-right"
  | "split-header"
  | "two-column-grid";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  tagline: string;
  description: string;
  layout: TemplateLayout;
  supportsPhoto: boolean;
  atsFriendly: boolean;
  tags: string[];
  /** Design defaults applied when a user selects the template. */
  defaults: Pick<
    ResumeDesign,
    | "accentColor"
    | "secondaryColor"
    | "textColor"
    | "fontFamily"
    | "headingFontFamily"
    | "fontSize"
    | "lineHeight"
    | "sectionSpacing"
    | "pagePadding"
    | "headingStyle"
    | "uppercaseHeadings"
    | "showIcons"
  >;
  component: ComponentType<TemplateProps>;
}

export type TemplateRegistry = Record<TemplateId, TemplateDefinition>;

export interface FontDefinition {
  key: ResumeDesign["fontFamily"];
  label: string;
  stack: string;
  kind: "sans" | "serif" | "mono";
}

export type { ResumeData };
