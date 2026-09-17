import * as React from "react";
import { SectionBody, type SectionStyle } from "@/components/resume/section-content";
import { ContactLinkList } from "@/components/resume/template-parts";
import { locationLine, sectionHeading, visibleSections } from "@/lib/resume-view";
import { isNonEmpty } from "@/lib/utils";
import type { TemplateProps } from "@/types/template";

/**
 * Classic Serif — the traditional one-column CV: centred name, small-caps
 * headings on a full-width rule, no colour fills and no sidebars. This is the
 * safest choice for strict applicant tracking systems.
 */
export function ClassicSerif({ resume }: TemplateProps) {
  const { personalInfo, design } = resume;
  const sections = visibleSections(resume);
  const location = locationLine(personalInfo);

  const style: SectionStyle = {
    entryLayout: "rail",
    entryGap: "0.9em",
    railWidth: "8em",
    titleClassName: "text-[1.02em] font-bold leading-snug",
    subtitleClassName: "text-[0.98em] italic",
    metaClassName: "text-[0.85em] opacity-75",
    dateClassName: "text-[0.88em] tabular-nums",
    bodyClassName: "text-[0.98em] leading-[1.5]",
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
    <div className="px-[var(--resume-padding)] py-[calc(var(--resume-padding)*0.95)]">
      <header className="pb-[1em] text-center">
        <h1
          className="text-[2.05em] leading-[1.1] font-bold tracking-[0.06em]"
          style={{ color: design.secondaryColor }}
        >
          {personalInfo.fullName || "Your Name"}
        </h1>
        {isNonEmpty(personalInfo.jobTitle) ? (
          <p className="mt-[0.15em] text-[1em] tracking-[0.08em]">
            {personalInfo.jobTitle}
          </p>
        ) : null}
        <div className="mt-[0.5em] flex flex-wrap justify-center gap-x-[0.9em] gap-y-[0.15em] text-[0.85em]">
          {[
            isNonEmpty(personalInfo.email) ? (
              <a key="email" href={`mailto:${personalInfo.email}`}>
                {personalInfo.email}
              </a>
            ) : null,
            isNonEmpty(personalInfo.phone) ? (
              <a key="phone" href={`tel:${personalInfo.phone.replace(/\s+/g, "")}`}>
                {personalInfo.phone}
              </a>
            ) : null,
            location ? <span key="loc">{location}</span> : null,
          ]
            .filter(Boolean)
            .map((node, index) => (
              <React.Fragment key={index}>
                {index > 0 ? (
                  <span aria-hidden className="opacity-40">
                    •
                  </span>
                ) : null}
                {node}
              </React.Fragment>
            ))}
        </div>
        <ContactLinkList
          links={resume.links}
          showIcons={false}
          className="mt-[0.2em] flex flex-wrap justify-center gap-x-[0.9em] gap-y-[0.15em] text-[0.85em]"
        />
      </header>

      <div>
        {sections.map((key) => (
          <section
            key={key}
            className="resume-section"
            style={{ marginBottom: "var(--resume-section-gap)" }}
          >
            <h2
              className={`mb-[0.55em] border-b pb-[0.15em] text-[0.95em] font-bold tracking-[0.18em] ${
                design.uppercaseHeadings ? "uppercase" : ""
              }`}
              style={{
                borderColor: `color-mix(in srgb, ${design.textColor} 45%, #ffffff)`,
                color: design.secondaryColor,
              }}
            >
              {sectionHeading(resume, key)}
            </h2>
            <SectionBody resume={resume} sectionKey={key} style={style} />
          </section>
        ))}
      </div>
    </div>
  );
}
