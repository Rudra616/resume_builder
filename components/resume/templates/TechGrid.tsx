import * as React from "react";
import { SectionBody, type SectionStyle } from "@/components/resume/section-content";
import { ContactLinkList, ProfilePhoto } from "@/components/resume/template-parts";
import { locationLine, partitionSections, sectionHeading } from "@/lib/resume-view";
import { isNonEmpty } from "@/lib/utils";
import type { SectionKey } from "@/types/resume";
import type { TemplateProps } from "@/types/template";

const GRID_KEYS: SectionKey[] = [
  "skills",
  "certifications",
  "languages",
  "links",
  "education",
];

/**
 * Tech Grid — monospaced metadata, `//` heading prefixes and a bordered grid
 * that puts the factual sections into two equal cells beneath the narrative.
 */
export function TechGrid({ resume }: TemplateProps) {
  const { personalInfo, design } = resume;
  const { sidebar: gridSections, main } = partitionSections(resume, GRID_KEYS);
  const location = locationLine(personalInfo);
  const rule = `color-mix(in srgb, ${design.textColor} 15%, #ffffff)`;
  const mono = '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace';

  const style: SectionStyle = {
    entryLayout: "stacked",
    entryGap: "1em",
    titleClassName: "text-[1em] font-semibold leading-snug",
    subtitleClassName: "text-[0.9em] font-medium",
    metaClassName: "text-[0.78em] opacity-70",
    dateClassName: "text-[0.78em] tabular-nums opacity-70",
    bodyClassName: "text-[0.93em] leading-[1.55]",
    bulletMarker: "›",
    bulletMarkerClassName: "font-bold",
    bulletMarkerStyle: { color: design.accentColor },
    skillsDisplay: "chips",
    chipClassName: "border px-[0.5em] py-[0.1em] text-[0.8em]",
    chipStyle: { borderColor: rule, color: design.secondaryColor, fontFamily: mono },
    tagDisplay: "chips",
    linksDisplay: "stacked",
    palette: {
      accent: design.accentColor,
      secondary: design.secondaryColor,
      text: design.textColor,
    },
  };

  const Heading = ({ children }: { children: React.ReactNode }) => (
    <h2
      className={`mb-[0.55em] flex items-center gap-[0.5em] text-[0.88em] font-bold tracking-[0.08em] ${
        design.uppercaseHeadings ? "uppercase" : ""
      }`}
      style={{ color: design.secondaryColor, fontFamily: mono }}
    >
      <span style={{ color: design.accentColor }}>{"//"}</span>
      {children}
      <span className="ml-[0.3em] h-[1px] flex-1" style={{ backgroundColor: rule }} />
    </h2>
  );

  return (
    <div>
      <header
        className="px-[var(--resume-padding)] pt-[1.4em] pb-[1.1em]"
        style={{ borderBottom: `1px solid ${rule}` }}
      >
        <div className="flex items-start gap-[1.2em]">
          <div className="min-w-0 flex-1">
            <p
              className="text-[0.8em] tracking-[0.2em] uppercase"
              style={{ color: design.accentColor, fontFamily: mono }}
            >
              {isNonEmpty(personalInfo.jobTitle) ? personalInfo.jobTitle : "Engineer"}
            </p>
            <h1
              className="mt-[0.15em] text-[2.1em] leading-[1.05] font-bold tracking-[-0.01em]"
              style={{ color: design.secondaryColor }}
            >
              {personalInfo.fullName || "Your Name"}
            </h1>
          </div>
          <ProfilePhoto resume={resume} size={70} />
        </div>

        <div
          className="mt-[0.9em] grid grid-cols-2 gap-x-[1.2em] gap-y-[0.2em] text-[0.8em]"
          style={{ fontFamily: mono }}
        >
          {isNonEmpty(personalInfo.email) ? (
            <p className="truncate">
              <span className="opacity-50">email: </span>
              <a href={`mailto:${personalInfo.email}`}>{personalInfo.email}</a>
            </p>
          ) : null}
          {isNonEmpty(personalInfo.phone) ? (
            <p className="truncate">
              <span className="opacity-50">phone: </span>
              <a href={`tel:${personalInfo.phone.replace(/\s+/g, "")}`}>
                {personalInfo.phone}
              </a>
            </p>
          ) : null}
          {location ? (
            <p className="truncate">
              <span className="opacity-50">based: </span>
              {location}
            </p>
          ) : null}
          {resume.links.length > 0 ? (
            <div className="truncate">
              <span className="opacity-50">links: </span>
              <ContactLinkList
                links={resume.links.slice(0, 2)}
                showIcons={false}
                className="inline-flex flex-wrap gap-x-[0.8em]"
              />
            </div>
          ) : null}
        </div>
      </header>

      <div className="px-[var(--resume-padding)] py-[1.2em]">
        {main.map((key) => (
          <section
            key={key}
            className="resume-section"
            style={{ marginBottom: "var(--resume-section-gap)" }}
          >
            <Heading>{sectionHeading(resume, key)}</Heading>
            <SectionBody resume={resume} sectionKey={key} style={style} />
          </section>
        ))}

        {gridSections.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-[1.4em] gap-y-[var(--resume-section-gap)]">
            {gridSections.map((key) => (
              <section key={key} className="resume-section">
                <Heading>{sectionHeading(resume, key, true)}</Heading>
                <SectionBody resume={resume} sectionKey={key} style={style} />
              </section>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
