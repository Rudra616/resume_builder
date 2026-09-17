import * as React from "react";
import { SectionBody, type SectionStyle } from "@/components/resume/section-content";
import { ContactLinkList, ProfilePhoto } from "@/components/resume/template-parts";
import {
  initials,
  locationLine,
  partitionSections,
  sectionHeading,
} from "@/lib/resume-view";
import { isNonEmpty } from "@/lib/utils";
import type { SectionKey } from "@/types/resume";
import type { TemplateProps } from "@/types/template";

const ASIDE_KEYS: SectionKey[] = ["skills", "languages", "certifications", "links"];

/**
 * Creative Studio — an oversized asymmetric masthead with a monogram tile, and
 * a body that drops into two columns so short factual sections sit beside the
 * narrative instead of below it.
 */
export function CreativeStudio({ resume }: TemplateProps) {
  const { personalInfo, design } = resume;
  const { sidebar, main } = partitionSections(resume, ASIDE_KEYS);
  const location = locationLine(personalInfo);
  const hasPhoto = design.showPhoto && Boolean(personalInfo.photo);

  const baseStyle: SectionStyle = {
    entryLayout: "stacked",
    entryGap: "1em",
    titleClassName: "text-[1.05em] font-bold leading-snug",
    subtitleClassName: "text-[0.92em] font-medium",
    metaClassName: "text-[0.8em] opacity-70",
    dateClassName: "text-[0.8em] font-medium tabular-nums",
    bodyClassName: "text-[0.94em] leading-[1.55]",
    bulletMarker: "◆",
    bulletMarkerClassName: "text-[0.6em] leading-[2.2]",
    bulletMarkerStyle: { color: design.accentColor },
    skillsDisplay: "chips",
    chipClassName: "rounded-full px-[0.65em] py-[0.18em] text-[0.82em] font-medium",
    chipStyle: {
      backgroundColor: `color-mix(in srgb, ${design.accentColor} 14%, #ffffff)`,
      color: `color-mix(in srgb, ${design.accentColor} 80%, #000000)`,
    },
    tagDisplay: "chips",
    linksDisplay: "stacked",
    palette: {
      accent: design.accentColor,
      secondary: design.secondaryColor,
      text: design.textColor,
    },
  };

  const asideStyle: SectionStyle = {
    ...baseStyle,
    entryLayout: "compact",
    entryGap: "0.7em",
    titleClassName: "text-[0.92em] font-semibold leading-snug",
    bodyClassName: "text-[0.88em] leading-[1.5]",
  };

  const Pill = ({ children }: { children: React.ReactNode }) => (
    <h2
      className={`mb-[0.6em] inline-block rounded-full px-[0.9em] py-[0.2em] text-[0.85em] font-bold tracking-[0.12em] ${
        design.uppercaseHeadings ? "uppercase" : ""
      }`}
      style={{ backgroundColor: design.accentColor, color: "#ffffff" }}
    >
      {children}
    </h2>
  );

  return (
    <div>
      <header className="relative overflow-hidden px-[var(--resume-padding)] pt-[1.6em] pb-[1.3em]">
        <div
          className="absolute top-[-6em] right-[-4em] size-[14em] rounded-full"
          style={{
            backgroundColor: `color-mix(in srgb, ${design.accentColor} 12%, #ffffff)`,
          }}
          aria-hidden
        />
        <div className="relative flex items-center gap-[1.1em]">
          {hasPhoto ? (
            <ProfilePhoto resume={resume} size={96} />
          ) : (
            <div
              className="flex size-[3.6em] shrink-0 items-center justify-center rounded-[10px] text-[1.5em] font-bold"
              style={{ backgroundColor: design.accentColor, color: "#ffffff" }}
              aria-hidden
            >
              {initials(personalInfo.fullName) || "RF"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1
              className="text-[2.4em] leading-[1] font-black tracking-[-0.02em]"
              style={{ color: design.secondaryColor }}
            >
              {personalInfo.fullName || "Your Name"}
            </h1>
            {isNonEmpty(personalInfo.jobTitle) ? (
              <p
                className="mt-[0.25em] text-[1.05em] font-semibold"
                style={{ color: design.accentColor }}
              >
                {personalInfo.jobTitle}
              </p>
            ) : null}
          </div>
        </div>

        <div className="relative mt-[1em] flex flex-wrap gap-x-[1.3em] gap-y-[0.25em] text-[0.83em]">
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
            links={resume.links.slice(0, 2)}
            showIcons={design.showIcons}
            className="flex flex-wrap gap-x-[1.3em] gap-y-[0.25em]"
          />
        </div>
      </header>

      <div className="flex gap-[1.6em] px-[var(--resume-padding)] pb-[1.4em]">
        <div className="min-w-0 flex-[1.85]">
          {main.map((key) => (
            <section
              key={key}
              className="resume-section"
              style={{ marginBottom: "var(--resume-section-gap)" }}
            >
              <Pill>{sectionHeading(resume, key)}</Pill>
              <SectionBody resume={resume} sectionKey={key} style={baseStyle} />
            </section>
          ))}
        </div>

        {sidebar.length > 0 ? (
          <aside
            className="min-w-0 flex-1 border-l pl-[1.2em]"
            style={{
              borderColor: `color-mix(in srgb, ${design.accentColor} 25%, #ffffff)`,
            }}
          >
            {sidebar.map((key) => (
              <section
                key={key}
                className="resume-section"
                style={{ marginBottom: "var(--resume-section-gap)" }}
              >
                <h2
                  className={`mb-[0.5em] text-[0.85em] font-bold tracking-[0.14em] ${
                    design.uppercaseHeadings ? "uppercase" : ""
                  }`}
                  style={{ color: design.accentColor }}
                >
                  {sectionHeading(resume, key, true)}
                </h2>
                <SectionBody resume={resume} sectionKey={key} style={asideStyle} />
              </section>
            ))}
          </aside>
        ) : null}
      </div>
    </div>
  );
}
