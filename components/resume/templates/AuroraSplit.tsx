import * as React from "react";
import { SectionBody, type SectionStyle } from "@/components/resume/section-content";
import { ProfilePhoto } from "@/components/resume/template-parts";
import { AtSign, MapPin, Phone } from "@/components/resume/link-icons";
import { locationLine, partitionSections, sectionHeading } from "@/lib/resume-view";
import { isNonEmpty } from "@/lib/utils";
import type { SectionKey } from "@/types/resume";
import type { TemplateProps } from "@/types/template";

const RIGHT_KEYS: SectionKey[] = [
  "skills",
  "links",
  "certifications",
  "languages",
  "awards",
];

/**
 * Aurora Split — the mirror of a classic sidebar layout: content on the left,
 * a gradient rail on the right carrying contact details and the short sections,
 * with the name band spanning the full width at the top.
 */
export function AuroraSplit({ resume }: TemplateProps) {
  const { personalInfo, design } = resume;
  const { sidebar, main } = partitionSections(resume, RIGHT_KEYS);
  const location = locationLine(personalInfo);

  const gradient = `linear-gradient(160deg, ${design.accentColor}, color-mix(in srgb, ${design.secondaryColor} 85%, ${design.accentColor}))`;

  const mainStyle: SectionStyle = {
    entryLayout: "stacked",
    entryGap: "1em",
    titleClassName: "text-[1.05em] font-semibold leading-snug",
    subtitleClassName: "text-[0.95em] font-medium",
    metaClassName: "text-[0.8em] opacity-70",
    dateClassName: "text-[0.8em] font-medium tabular-nums opacity-80",
    bodyClassName: "text-[0.95em] leading-[1.55]",
    bulletMarker: "▸",
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

  const railStyle: SectionStyle = {
    ...mainStyle,
    entryLayout: "compact",
    entryGap: "0.7em",
    titleClassName: "text-[0.9em] font-semibold leading-snug",
    subtitleClassName: "text-[0.85em] opacity-85",
    metaClassName: "text-[0.78em] opacity-75",
    dateClassName: "text-[0.78em] tabular-nums opacity-75",
    bodyClassName: "text-[0.86em] leading-[1.5]",
    skillsDisplay: "meters",
    linksDisplay: "stacked",
    bulletMarker: "·",
    palette: { accent: "#ffffff", secondary: "#ffffff", text: "#ffffff" },
  };

  return (
    <div>
      <header className="px-[var(--resume-padding)] pt-[1.4em] pb-[1em]">
        <div className="flex items-center gap-[1.1em]">
          <ProfilePhoto resume={resume} size={78} />
          <div className="min-w-0 flex-1">
            <h1
              className="text-[2.25em] leading-[1.05] font-light tracking-[0.02em]"
              style={{ color: design.secondaryColor }}
            >
              {personalInfo.fullName || "Your Name"}
            </h1>
            {isNonEmpty(personalInfo.jobTitle) ? (
              <p
                className="mt-[0.2em] text-[1.05em] font-medium tracking-[0.04em]"
                style={{ color: design.accentColor }}
              >
                {personalInfo.jobTitle}
              </p>
            ) : null}
          </div>
        </div>
        <div
          className="mt-[0.9em] h-[3px] w-full rounded-full"
          style={{ background: gradient }}
          aria-hidden
        />
      </header>

      <div className="flex items-stretch">
        <div className="min-w-0 flex-1 pr-[6mm] pb-[1.2em] pl-[var(--resume-padding)]">
          {main.map((key) => (
            <section
              key={key}
              className="resume-section"
              style={{ marginBottom: "var(--resume-section-gap)" }}
            >
              <h2
                className={`mb-[0.55em] flex items-center gap-[0.5em] text-[0.95em] font-semibold tracking-[0.12em] ${
                  design.uppercaseHeadings ? "uppercase" : ""
                }`}
                style={{ color: design.secondaryColor }}
              >
                <span
                  className="inline-block h-[0.85em] w-[3px] rounded-full"
                  style={{ background: gradient }}
                  aria-hidden
                />
                {sectionHeading(resume, key)}
              </h2>
              <SectionBody resume={resume} sectionKey={key} style={mainStyle} />
            </section>
          ))}
        </div>

        <aside
          className="w-[32%] shrink-0 px-[5.5mm] pt-[1.2em] pb-[1.4em]"
          style={{ background: gradient, color: "#ffffff" }}
        >
          <div className="mb-[1.2em] space-y-[0.35em] text-[0.84em]">
            {isNonEmpty(personalInfo.email) ? (
              <p className="flex items-start gap-[0.45em]">
                {design.showIcons ? (
                  <AtSign className="mt-[0.15em] size-[1em] shrink-0" />
                ) : null}
                <a href={`mailto:${personalInfo.email}`} className="min-w-0 break-all">
                  {personalInfo.email}
                </a>
              </p>
            ) : null}
            {isNonEmpty(personalInfo.phone) ? (
              <p className="flex items-start gap-[0.45em]">
                {design.showIcons ? (
                  <Phone className="mt-[0.15em] size-[1em] shrink-0" />
                ) : null}
                <a href={`tel:${personalInfo.phone.replace(/\s+/g, "")}`}>
                  {personalInfo.phone}
                </a>
              </p>
            ) : null}
            {location ? (
              <p className="flex items-start gap-[0.45em]">
                {design.showIcons ? (
                  <MapPin className="mt-[0.15em] size-[1em] shrink-0" />
                ) : null}
                <span>{location}</span>
              </p>
            ) : null}
          </div>

          {sidebar.map((key) => (
            <section key={key} className="resume-section mb-[1.25em] last:mb-0">
              <h2
                className={`mb-[0.5em] text-[0.85em] font-semibold tracking-[0.16em] ${
                  design.uppercaseHeadings ? "uppercase" : ""
                }`}
              >
                {sectionHeading(resume, key, true)}
              </h2>
              <SectionBody resume={resume} sectionKey={key} style={railStyle} />
            </section>
          ))}
        </aside>
      </div>
    </div>
  );
}
