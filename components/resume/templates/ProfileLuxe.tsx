import * as React from "react";
import { SectionBody, type SectionStyle } from "@/components/resume/section-content";
import { ContactLinkList, ProfilePhoto } from "@/components/resume/template-parts";
import { initials, locationLine, sectionHeading, visibleSections } from "@/lib/resume-view";
import { isNonEmpty } from "@/lib/utils";
import type { TemplateProps } from "@/types/template";

/**
 * Profile Luxe — a centred portrait masthead with a hairline frame, then a
 * label-in-the-gutter body where each section title sits in a narrow left
 * column opposite its content.
 */
export function ProfileLuxe({ resume }: TemplateProps) {
  const { personalInfo, design } = resume;
  const sections = visibleSections(resume);
  const location = locationLine(personalInfo);
  const hairline = `color-mix(in srgb, ${design.secondaryColor} 20%, #ffffff)`;
  const hasPhoto = design.showPhoto && Boolean(personalInfo.photo);

  const style: SectionStyle = {
    entryLayout: "stacked",
    entryGap: "1.05em",
    titleClassName: "text-[1.05em] font-semibold leading-snug",
    subtitleClassName: "text-[0.95em] italic opacity-85",
    metaClassName: "text-[0.8em] tracking-[0.05em] opacity-60",
    dateClassName: "text-[0.8em] tracking-[0.05em] tabular-nums opacity-60",
    bodyClassName: "text-[0.95em] leading-[1.6]",
    bulletMarker: "—",
    bulletMarkerClassName: "opacity-45",
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
    <div className="px-[var(--resume-padding)] py-[calc(var(--resume-padding)*0.9)]">
      <header className="flex flex-col items-center pb-[1.3em] text-center">
        {hasPhoto ? (
          <div className="relative mb-[0.9em]">
            <span
              className="absolute inset-[-6px] rounded-full border"
              style={{ borderColor: design.accentColor }}
              aria-hidden
            />
            <ProfilePhoto resume={resume} size={104} />
          </div>
        ) : (
          <div
            className="mb-[0.9em] flex size-[3.2em] items-center justify-center rounded-full border text-[1.2em] font-medium tracking-[0.1em]"
            style={{ borderColor: design.accentColor, color: design.accentColor }}
            aria-hidden
          >
            {initials(personalInfo.fullName) || "RF"}
          </div>
        )}

        <h1
          className="text-[2.15em] leading-[1.1] font-normal tracking-[0.08em]"
          style={{ color: design.secondaryColor }}
        >
          {personalInfo.fullName || "Your Name"}
        </h1>
        {isNonEmpty(personalInfo.jobTitle) ? (
          <p className="mt-[0.4em] text-[0.85em] tracking-[0.3em] uppercase opacity-70">
            {personalInfo.jobTitle}
          </p>
        ) : null}

        <div
          className="mt-[0.9em] flex flex-wrap justify-center gap-x-[1.3em] gap-y-[0.2em] border-t border-b py-[0.5em] text-[0.82em]"
          style={{ borderColor: hairline }}
        >
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
            className="flex flex-wrap justify-center gap-x-[1.3em] gap-y-[0.2em]"
          />
        </div>
      </header>

      <div>
        {sections.map((key) => (
          <section
            key={key}
            className="resume-section flex gap-[1.5em]"
            style={{ marginBottom: "var(--resume-section-gap)" }}
          >
            <div
              className="w-[8em] shrink-0 border-r pr-[1em] pt-[0.2em] text-right"
              style={{ borderColor: hairline }}
            >
              <h2
                className={`text-[0.8em] leading-[1.35] font-semibold tracking-[0.16em] ${
                  design.uppercaseHeadings ? "uppercase" : ""
                }`}
                style={{ color: design.accentColor }}
              >
                {sectionHeading(resume, key, true)}
              </h2>
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
