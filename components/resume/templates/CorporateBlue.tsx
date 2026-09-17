import * as React from "react";
import { SectionBody, type SectionStyle } from "@/components/resume/section-content";
import { ContactLinkList, ProfilePhoto } from "@/components/resume/template-parts";
import { locationLine, sectionHeading, visibleSections } from "@/lib/resume-view";
import { isNonEmpty } from "@/lib/utils";
import type { TemplateProps } from "@/types/template";

/**
 * Corporate Blue — a conservative, centred header with full-width tinted
 * section bands. Deliberately plain structure so applicant tracking systems
 * read it cleanly.
 */
export function CorporateBlue({ resume }: TemplateProps) {
  const { personalInfo, design } = resume;
  const sections = visibleSections(resume);
  const location = locationLine(personalInfo);

  const style: SectionStyle = {
    entryLayout: "rail",
    entryGap: "0.95em",
    railWidth: "9em",
    titleClassName: "text-[1.02em] font-bold leading-snug",
    subtitleClassName: "text-[0.95em] italic",
    metaClassName: "text-[0.82em] opacity-70",
    dateClassName: "text-[0.85em] font-medium tabular-nums",
    bodyClassName: "text-[0.95em] leading-[1.5]",
    bulletMarker: "•",
    bulletMarkerClassName: "leading-[1.5]",
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
    <div>
      <header
        className="px-[var(--resume-padding)] pt-[1.5em] pb-[1.1em] text-center"
        style={{ borderBottom: `4px solid ${design.accentColor}` }}
      >
        {design.showPhoto && personalInfo.photo ? (
          <div className="mb-[0.7em] flex justify-center">
            <ProfilePhoto resume={resume} size={80} />
          </div>
        ) : null}
        <h1
          className="text-[2em] leading-[1.1] font-bold tracking-[0.04em] uppercase"
          style={{ color: design.secondaryColor }}
        >
          {personalInfo.fullName || "Your Name"}
        </h1>
        {isNonEmpty(personalInfo.jobTitle) ? (
          <p
            className="mt-[0.2em] text-[1.02em] font-medium tracking-[0.1em] uppercase"
            style={{ color: design.accentColor }}
          >
            {personalInfo.jobTitle}
          </p>
        ) : null}
        <div className="mt-[0.7em] flex flex-wrap justify-center gap-x-[1em] gap-y-[0.2em] text-[0.83em]">
          {isNonEmpty(personalInfo.email) ? (
            <a href={`mailto:${personalInfo.email}`}>{personalInfo.email}</a>
          ) : null}
          {isNonEmpty(personalInfo.phone) ? (
            <>
              <span aria-hidden className="opacity-40">
                |
              </span>
              <a href={`tel:${personalInfo.phone.replace(/\s+/g, "")}`}>
                {personalInfo.phone}
              </a>
            </>
          ) : null}
          {location ? (
            <>
              <span aria-hidden className="opacity-40">
                |
              </span>
              <span>{location}</span>
            </>
          ) : null}
        </div>
        <ContactLinkList
          links={resume.links}
          showIcons={design.showIcons}
          className="mt-[0.25em] flex flex-wrap justify-center gap-x-[1.1em] gap-y-[0.2em] text-[0.83em]"
        />
      </header>

      <div className="px-[var(--resume-padding)] py-[1.1em]">
        {sections.map((key) => (
          <section
            key={key}
            className="resume-section"
            style={{ marginBottom: "var(--resume-section-gap)" }}
          >
            <h2
              className={`mb-[0.6em] px-[0.6em] py-[0.25em] text-[0.95em] font-bold tracking-[0.12em] ${
                design.uppercaseHeadings ? "uppercase" : ""
              }`}
              style={{
                backgroundColor: `color-mix(in srgb, ${design.accentColor} 10%, #ffffff)`,
                borderLeft: `3px solid ${design.accentColor}`,
                color: design.secondaryColor,
              }}
            >
              {sectionHeading(resume, key)}
            </h2>
            <div className="px-[0.2em]">
              <SectionBody resume={resume} sectionKey={key} style={style} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
