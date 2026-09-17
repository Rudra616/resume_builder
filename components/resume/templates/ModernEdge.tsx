import * as React from "react";
import { SectionBody, type SectionStyle } from "@/components/resume/section-content";
import {
  ContactLinkList,
  HeadingFrame,
  ProfilePhoto,
} from "@/components/resume/template-parts";
import { locationLine, sectionHeading, visibleSections } from "@/lib/resume-view";
import { isNonEmpty } from "@/lib/utils";
import type { TemplateProps } from "@/types/template";

/**
 * Modern Edge — an accent stripe running down the page edge, a timeline gutter
 * with dots beside every section, and contact details in a light header strip.
 */
export function ModernEdge({ resume }: TemplateProps) {
  const { personalInfo, design } = resume;
  const sections = visibleSections(resume);
  const location = locationLine(personalInfo);

  const style: SectionStyle = {
    entryLayout: "stacked",
    entryGap: "0.95em",
    titleClassName: "text-[1.05em] font-semibold leading-snug",
    subtitleClassName: "text-[0.95em] font-medium",
    metaClassName: "text-[0.82em] opacity-70",
    dateClassName: "text-[0.82em] font-medium tabular-nums",
    bodyClassName: "text-[0.95em] leading-[1.55]",
    bulletMarker: "▪",
    bulletMarkerClassName: "text-[0.75em] leading-[1.9]",
    bulletListClassName: "",
    skillsDisplay: "chips",
    chipClassName:
      "rounded-[4px] border px-[0.5em] py-[0.15em] text-[0.85em] leading-[1.5]",
    chipStyle: {
      borderColor: `color-mix(in srgb, ${design.accentColor} 30%, #ffffff)`,
      backgroundColor: `color-mix(in srgb, ${design.accentColor} 8%, #ffffff)`,
      color: design.secondaryColor,
    },
    tagDisplay: "chips",
    linksDisplay: "inline",
    palette: {
      accent: design.accentColor,
      secondary: design.secondaryColor,
      text: design.textColor,
    },
  };

  return (
    <div className="relative flex min-h-full">
      <div
        className="w-[7mm] shrink-0"
        style={{
          background: `linear-gradient(180deg, ${design.accentColor}, color-mix(in srgb, ${design.accentColor} 55%, ${design.secondaryColor}))`,
        }}
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <header
          className="px-[var(--resume-padding)] pt-[1.4em] pb-[1em]"
          style={{ backgroundColor: `color-mix(in srgb, ${design.accentColor} 6%, #ffffff)` }}
        >
          <div className="flex items-start gap-[1.2em]">
            <div className="min-w-0 flex-1">
              <h1
                className="text-[2.3em] leading-[1.05] font-bold tracking-[-0.01em]"
                style={{ color: design.secondaryColor }}
              >
                {personalInfo.fullName || "Your Name"}
              </h1>
              {isNonEmpty(personalInfo.jobTitle) ? (
                <p
                  className="mt-[0.15em] text-[1.1em] font-medium"
                  style={{ color: design.accentColor }}
                >
                  {personalInfo.jobTitle}
                </p>
              ) : null}
              <div
                className="mt-[0.15em] h-[2px] w-[3.5em]"
                style={{ backgroundColor: design.accentColor }}
                aria-hidden
              />
            </div>
            <ProfilePhoto resume={resume} size={76} />
          </div>

          <div className="mt-[0.85em] flex flex-wrap gap-x-[1.4em] gap-y-[0.25em] text-[0.85em]">
            {isNonEmpty(personalInfo.email) ? (
              <a href={`mailto:${personalInfo.email}`}>{personalInfo.email}</a>
            ) : null}
            {isNonEmpty(personalInfo.phone) ? (
              <a href={`tel:${personalInfo.phone.replace(/\s+/g, "")}`}>
                {personalInfo.phone}
              </a>
            ) : null}
            {location ? <span>{location}</span> : null}
            <ContactLinkList
              links={resume.links}
              showIcons={design.showIcons}
              className="flex flex-wrap gap-x-[1.4em] gap-y-[0.25em]"
              iconClassName="opacity-70"
            />
          </div>
        </header>

        <div className="px-[var(--resume-padding)] py-[1.2em]">
          {sections.map((key) => (
            <section
              key={key}
              className="resume-section relative pl-[1.4em]"
              style={{ marginBottom: "var(--resume-section-gap)" }}
            >
              <span
                className="absolute top-[0.42em] left-0 block size-[0.5em] rounded-full"
                style={{ backgroundColor: design.accentColor }}
                aria-hidden
              />
              <span
                className="absolute top-[1.15em] bottom-[-0.4em] left-[0.22em] block w-[1px]"
                style={{
                  backgroundColor: `color-mix(in srgb, ${design.accentColor} 25%, #ffffff)`,
                }}
                aria-hidden
              />
              <HeadingFrame
                resume={resume}
                className="mb-[0.6em] text-[1em] font-bold tracking-[0.1em]"
                style={{ color: design.secondaryColor }}
              >
                {sectionHeading(resume, key)}
              </HeadingFrame>
              <SectionBody resume={resume} sectionKey={key} style={style} />
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
