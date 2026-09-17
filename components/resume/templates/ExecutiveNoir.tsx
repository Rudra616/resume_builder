import * as React from "react";
import { SectionBody, type SectionStyle } from "@/components/resume/section-content";
import { HeadingFrame, ProfilePhoto } from "@/components/resume/template-parts";
import { locationLine, sectionHeading, visibleSections } from "@/lib/resume-view";
import { isNonEmpty } from "@/lib/utils";
import type { TemplateProps } from "@/types/template";

/**
 * Executive Noir — a full-bleed dark masthead over a disciplined single column,
 * with every date pushed into a right-hand rail so the page scans like a
 * briefing document.
 */
export function ExecutiveNoir({ resume }: TemplateProps) {
  const { personalInfo, design } = resume;
  const sections = visibleSections(resume);
  const location = locationLine(personalInfo);

  const style: SectionStyle = {
    entryLayout: "rail",
    entryGap: "1.05em",
    railWidth: "8.5em",
    titleClassName: "text-[1.02em] font-semibold leading-snug",
    subtitleClassName: "text-[0.95em] font-medium",
    metaClassName: "text-[0.85em] opacity-65",
    dateClassName: "pt-[0.15em] text-[0.82em] tracking-wide tabular-nums opacity-70",
    bodyClassName: "text-[0.95em] leading-[1.55]",
    bulletMarker: "—",
    bulletMarkerClassName: "opacity-50",
    skillsDisplay: "rows",
    tagDisplay: "inline",
    linksDisplay: "inline",
    palette: {
      accent: design.accentColor,
      secondary: design.secondaryColor,
      text: design.textColor,
    },
  };

  return (
    <>
      <header
        className="flex items-center gap-[1.4em] px-[var(--resume-padding)] py-[1.5em]"
        style={{ backgroundColor: design.secondaryColor, color: "#ffffff" }}
      >
        <ProfilePhoto
          resume={resume}
          size={82}
          style={{ border: `2px solid ${design.accentColor}` }}
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-[2.1em] leading-[1.05] font-semibold tracking-[0.06em] uppercase">
            {personalInfo.fullName || "Your Name"}
          </h1>
          {isNonEmpty(personalInfo.jobTitle) ? (
            <p
              className="mt-[0.3em] text-[1em] tracking-[0.22em] uppercase"
              style={{ color: design.accentColor }}
            >
              {personalInfo.jobTitle}
            </p>
          ) : null}
          <div className="mt-[0.7em] flex flex-wrap gap-x-[1.4em] gap-y-[0.2em] text-[0.85em] opacity-90">
            {isNonEmpty(personalInfo.email) ? (
              <a href={`mailto:${personalInfo.email}`}>{personalInfo.email}</a>
            ) : null}
            {isNonEmpty(personalInfo.phone) ? (
              <a href={`tel:${personalInfo.phone.replace(/\s+/g, "")}`}>
                {personalInfo.phone}
              </a>
            ) : null}
            {location ? <span>{location}</span> : null}
          </div>
        </div>
      </header>

      <div
        className="h-[3px] w-full"
        style={{ backgroundColor: design.accentColor }}
        aria-hidden
      />

      <div className="px-[var(--resume-padding)] py-[1.3em]">
        {sections.map((key) => (
          <section
            key={key}
            className="resume-section"
            style={{ marginBottom: "var(--resume-section-gap)" }}
          >
            <HeadingFrame
              resume={resume}
              className="mb-[0.7em] text-[1.02em] font-semibold tracking-[0.16em]"
              style={{ color: design.secondaryColor }}
            >
              {sectionHeading(resume, key)}
            </HeadingFrame>
            <SectionBody resume={resume} sectionKey={key} style={style} />
          </section>
        ))}
      </div>
    </>
  );
}
