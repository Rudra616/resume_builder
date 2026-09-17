import * as React from "react";
import { SectionBody, type SectionStyle } from "@/components/resume/section-content";
import { ContactLinkList, ProfilePhoto } from "@/components/resume/template-parts";
import { locationLine, sectionHeading, visibleSections } from "@/lib/resume-view";
import { isNonEmpty } from "@/lib/utils";
import type { TemplateProps } from "@/types/template";

/**
 * Nordic Minimal — no colour blocks at all. Structure comes from whitespace,
 * hairline rules and a wide-tracked lowercase heading label sitting in the left
 * gutter beside each section.
 */
export function NordicMinimal({ resume }: TemplateProps) {
  const { personalInfo, design } = resume;
  const sections = visibleSections(resume);
  const location = locationLine(personalInfo);
  const hairline = `color-mix(in srgb, ${design.textColor} 16%, #ffffff)`;

  const style: SectionStyle = {
    entryLayout: "stacked",
    entryGap: "1.15em",
    titleClassName: "text-[1em] font-semibold leading-snug",
    subtitleClassName: "text-[0.95em] opacity-80",
    metaClassName: "text-[0.8em] tracking-[0.06em] opacity-55",
    dateClassName: "text-[0.8em] tracking-[0.06em] tabular-nums opacity-55",
    bodyClassName: "text-[0.95em] leading-[1.6]",
    bulletMarker: "·",
    bulletMarkerClassName: "opacity-45",
    bulletListClassName: "space-y-[0.32em]",
    skillsDisplay: "stacked",
    tagDisplay: "inline",
    linksDisplay: "inline",
    palette: {
      accent: design.accentColor,
      secondary: design.secondaryColor,
      text: design.textColor,
    },
  };

  return (
    <div className="px-[var(--resume-padding)] py-[calc(var(--resume-padding)+2mm)]">
      <header className="flex items-start justify-between gap-[1.5em] pb-[1.4em]">
        <div className="min-w-0">
          <h1 className="text-[1.9em] leading-[1.15] font-normal tracking-[0.02em]">
            {personalInfo.fullName || "Your Name"}
          </h1>
          {isNonEmpty(personalInfo.jobTitle) ? (
            <p className="mt-[0.35em] text-[0.9em] tracking-[0.28em] uppercase opacity-60">
              {personalInfo.jobTitle}
            </p>
          ) : null}
        </div>
        <ProfilePhoto resume={resume} size={64} />
      </header>

      <div className="border-t border-b py-[0.7em]" style={{ borderColor: hairline }}>
        <div className="flex flex-wrap gap-x-[1.8em] gap-y-[0.25em] text-[0.82em] opacity-75">
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
            showIcons={false}
            className="flex flex-wrap gap-x-[1.8em] gap-y-[0.25em]"
          />
        </div>
      </div>

      <div className="pt-[1.4em]">
        {sections.map((key) => (
          <section
            key={key}
            className="resume-section flex gap-[1.6em]"
            style={{ marginBottom: "var(--resume-section-gap)" }}
          >
            <div className="w-[7.5em] shrink-0 pt-[0.15em]">
              <p className="text-[0.78em] tracking-[0.2em] lowercase opacity-45">
                {sectionHeading(resume, key, true)}
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <SectionBody resume={resume} sectionKey={key} style={style} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
