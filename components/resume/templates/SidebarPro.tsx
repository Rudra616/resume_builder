import * as React from "react";
import { SectionBody, type SectionStyle } from "@/components/resume/section-content";
import { HeadingFrame, ProfilePhoto } from "@/components/resume/template-parts";
import { AtSign, MapPin, Phone } from "@/components/resume/link-icons";
import { locationLine, partitionSections, sectionHeading } from "@/lib/resume-view";
import { isNonEmpty } from "@/lib/utils";
import type { SectionKey } from "@/types/resume";
import type { TemplateProps } from "@/types/template";

const SIDEBAR_KEYS: SectionKey[] = [
  "skills",
  "links",
  "languages",
  "certifications",
  "education",
];

/**
 * Sidebar Pro — a tinted 34% left column carrying photo, contact and the short
 * factual sections, leaving the right column entirely for narrative content.
 */
export function SidebarPro({ resume }: TemplateProps) {
  const { personalInfo, design } = resume;
  const { sidebar, main } = partitionSections(resume, SIDEBAR_KEYS);
  const location = locationLine(personalInfo);

  const sidebarTint = `color-mix(in srgb, ${design.secondaryColor} 92%, #000000)`;

  const mainStyle: SectionStyle = {
    entryLayout: "stacked",
    entryGap: "1em",
    titleClassName: "text-[1.05em] font-semibold leading-snug",
    subtitleClassName: "text-[0.95em] font-medium",
    metaClassName: "text-[0.82em] opacity-70",
    dateClassName: "text-[0.82em] tabular-nums opacity-70",
    bodyClassName: "text-[0.95em] leading-[1.55]",
    bulletMarker: "•",
    bulletMarkerClassName: "leading-[1.55]",
    bulletMarkerStyle: { color: design.accentColor },
    skillsDisplay: "rows",
    tagDisplay: "inline",
    linksDisplay: "inline",
    palette: {
      accent: design.accentColor,
      secondary: design.secondaryColor,
      text: design.textColor,
    },
  };

  const sideStyle: SectionStyle = {
    ...mainStyle,
    entryLayout: "compact",
    entryGap: "0.75em",
    titleClassName: "text-[0.92em] font-semibold leading-snug",
    subtitleClassName: "text-[0.88em] opacity-85",
    metaClassName: "text-[0.78em] opacity-70",
    dateClassName: "text-[0.78em] tabular-nums opacity-70",
    bodyClassName: "text-[0.88em] leading-[1.5]",
    skillsDisplay: "stacked",
    linksDisplay: "stacked",
    bulletMarker: "·",
    palette: { ...mainStyle.palette, accent: "#ffffff", secondary: "#ffffff" },
  };

  return (
    <div className="flex min-h-full">
      <aside
        className="w-[34%] shrink-0 px-[6mm] py-[calc(var(--resume-padding)*0.8)]"
        style={{ backgroundColor: sidebarTint, color: "#ffffff" }}
      >
        {design.showPhoto && personalInfo.photo ? (
          <div className="mb-[1.1em] flex justify-center">
            <ProfilePhoto
              resume={resume}
              size={104}
              style={{ border: `3px solid ${design.accentColor}` }}
            />
          </div>
        ) : null}

        <div className="mb-[1.2em]">
          <h1 className="text-[1.5em] leading-[1.15] font-semibold">
            {personalInfo.fullName || "Your Name"}
          </h1>
          {isNonEmpty(personalInfo.jobTitle) ? (
            <p
              className="mt-[0.25em] text-[0.9em] tracking-[0.1em] uppercase"
              style={{ color: design.accentColor }}
            >
              {personalInfo.jobTitle}
            </p>
          ) : null}
        </div>

        <div className="mb-[1.3em] space-y-[0.35em] text-[0.85em]">
          {isNonEmpty(personalInfo.email) ? (
            <p className="flex items-start gap-[0.45em]">
              {design.showIcons ? <AtSign className="mt-[0.15em] size-[1em] shrink-0" /> : null}
              <a href={`mailto:${personalInfo.email}`} className="min-w-0 break-all">
                {personalInfo.email}
              </a>
            </p>
          ) : null}
          {isNonEmpty(personalInfo.phone) ? (
            <p className="flex items-start gap-[0.45em]">
              {design.showIcons ? <Phone className="mt-[0.15em] size-[1em] shrink-0" /> : null}
              <a href={`tel:${personalInfo.phone.replace(/\s+/g, "")}`}>
                {personalInfo.phone}
              </a>
            </p>
          ) : null}
          {location ? (
            <p className="flex items-start gap-[0.45em]">
              {design.showIcons ? <MapPin className="mt-[0.15em] size-[1em] shrink-0" /> : null}
              <span>{location}</span>
            </p>
          ) : null}
        </div>

        {sidebar.map((key) => (
          <section key={key} className="resume-section mb-[1.3em] last:mb-0">
            <h2
              className={`mb-[0.5em] border-b pb-[0.25em] text-[0.88em] font-semibold tracking-[0.14em] ${
                design.uppercaseHeadings ? "uppercase" : ""
              }`}
              style={{ borderColor: `color-mix(in srgb, #ffffff 35%, transparent)` }}
            >
              {sectionHeading(resume, key, true)}
            </h2>
            <SectionBody resume={resume} sectionKey={key} style={sideStyle} />
          </section>
        ))}
      </aside>

      <div className="min-w-0 flex-1 px-[7mm] py-[calc(var(--resume-padding)*0.8)]">
        {main.map((key) => (
          <section
            key={key}
            className="resume-section"
            style={{ marginBottom: "var(--resume-section-gap)" }}
          >
            <HeadingFrame
              resume={resume}
              className="mb-[0.6em] text-[1.02em] font-bold tracking-[0.1em]"
              style={{ color: design.secondaryColor }}
            >
              {sectionHeading(resume, key)}
            </HeadingFrame>
            <SectionBody resume={resume} sectionKey={key} style={mainStyle} />
          </section>
        ))}
      </div>
    </div>
  );
}
