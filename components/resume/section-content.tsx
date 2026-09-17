import * as React from "react";
import {
  BulletList,
  ContactLinkList,
  DateRange,
  ProfilePhoto,
  ResumeLinkAnchor,
  linkIcon,
} from "@/components/resume/template-parts";
import { formatResumeDate } from "@/lib/dates";
import { displayUrl } from "@/lib/resume-view";
import { cn, isNonEmpty } from "@/lib/utils";
import type { ResumeData, SectionKey } from "@/types/resume";

/**
 * Every template composes its own page chrome — masthead, sidebars, grids and
 * heading treatment. What they share is the *body* of each section, because the
 * underlying facts (a role, a company, a date range, bullets) are the same
 * regardless of the visual language. This module renders those bodies against a
 * style contract each template fills in, which is why switching template never
 * touches resume content.
 */
export interface SectionStyle {
  /** `rail` puts dates in a right-hand column, `stacked` puts them under the
   *  subtitle, `compact` is for narrow sidebars. */
  entryLayout: "rail" | "stacked" | "compact";
  entryGap: string;
  titleClassName: string;
  subtitleClassName: string;
  metaClassName: string;
  dateClassName: string;
  bodyClassName: string;
  bulletMarker: React.ReactNode;
  bulletMarkerClassName?: string;
  bulletMarkerStyle?: React.CSSProperties;
  bulletListClassName?: string;
  /** How grouped skills are presented. */
  skillsDisplay: "rows" | "chips" | "inline" | "stacked" | "meters";
  chipClassName?: string;
  /** Inline styles for chips, since template colours come from resume design. */
  chipStyle?: React.CSSProperties;
  /** Technology tags on experience/project entries. */
  tagDisplay: "chips" | "inline" | "hidden";
  linksDisplay: "inline" | "stacked";
  /** Inline colour tokens taken from the resume design. */
  palette: {
    accent: string;
    secondary: string;
    text: string;
  };
  /** Optional right-rail width for `rail` layout. */
  railWidth?: string;
}

function Entry({
  style,
  title,
  subtitle,
  meta,
  dates,
  children,
}: {
  style: SectionStyle;
  title?: string;
  subtitle?: string;
  meta?: string;
  dates?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const head = (
    <>
      {isNonEmpty(title) ? <p className={style.titleClassName}>{title}</p> : null}
      {isNonEmpty(subtitle) ? (
        <p className={style.subtitleClassName}>{subtitle}</p>
      ) : null}
    </>
  );

  if (style.entryLayout === "rail") {
    return (
      <div
        className="resume-block flex gap-[1.3em] last:mb-0"
        style={{ marginBottom: style.entryGap }}
      >
        <div className="min-w-0 flex-1">
          {head}
          {isNonEmpty(meta) ? <p className={style.metaClassName}>{meta}</p> : null}
          {children}
        </div>
        {dates ? (
          <div
            className={cn("shrink-0 text-right", style.dateClassName)}
            style={{ width: style.railWidth ?? "8.5em" }}
          >
            {dates}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="resume-block last:mb-0" style={{ marginBottom: style.entryGap }}>
      {head}
      <div
        className={cn(
          "flex flex-wrap items-baseline gap-x-[0.6em]",
          style.entryLayout === "compact" && "gap-x-[0.4em]",
        )}
      >
        {isNonEmpty(meta) ? <span className={style.metaClassName}>{meta}</span> : null}
        {dates ? <span className={style.dateClassName}>{dates}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Tags({ items, style }: { items: string[]; style: SectionStyle }) {
  const usable = items.filter(isNonEmpty);
  if (usable.length === 0 || style.tagDisplay === "hidden") return null;

  if (style.tagDisplay === "chips") {
    return (
      <div className="mt-[0.4em] flex flex-wrap gap-[0.35em]">
        {usable.map((item) => (
          <span key={item} className={style.chipClassName} style={style.chipStyle}>
            {item}
          </span>
        ))}
      </div>
    );
  }

  return (
    <p className={cn("mt-[0.35em] text-[0.85em] opacity-75")}>{usable.join(" · ")}</p>
  );
}

function Bullets({ items, style }: { items: string[]; style: SectionStyle }) {
  return (
    <BulletList
      items={items}
      className={cn(
        "mt-[0.4em] space-y-[0.3em]",
        style.bodyClassName,
        style.bulletListClassName,
      )}
      marker={style.bulletMarker}
      markerClassName={style.bulletMarkerClassName}
      markerStyle={style.bulletMarkerStyle}
    />
  );
}

export function SkillsBody({
  resume,
  style,
}: {
  resume: ResumeData;
  style: SectionStyle;
}) {
  const groups = resume.skills.filter((group) => group.items.some(isNonEmpty));
  if (groups.length === 0) return null;

  if (style.skillsDisplay === "inline") {
    return (
      <p className={style.bodyClassName}>
        {groups.flatMap((group) => group.items.filter(isNonEmpty)).join(" · ")}
      </p>
    );
  }

  if (style.skillsDisplay === "chips") {
    return (
      <div className="space-y-[0.55em]">
        {groups.map((group) => (
          <div key={group.id}>
            {isNonEmpty(group.category) ? (
              <p className={cn("mb-[0.3em]", style.metaClassName)}>{group.category}</p>
            ) : null}
            <div className="flex flex-wrap gap-[0.35em]">
              {group.items.filter(isNonEmpty).map((item) => (
                <span key={item} className={style.chipClassName} style={style.chipStyle}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (style.skillsDisplay === "stacked") {
    return (
      <div className="space-y-[0.6em]">
        {groups.map((group) => (
          <div key={group.id}>
            {isNonEmpty(group.category) ? (
              <p
                className="text-[0.85em] font-semibold tracking-[0.12em] uppercase"
                style={{ color: style.palette.accent }}
              >
                {group.category}
              </p>
            ) : null}
            <p className={cn("mt-[0.15em]", style.bodyClassName)}>
              {group.items.filter(isNonEmpty).join(", ")}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (style.skillsDisplay === "meters") {
    return (
      <div className="space-y-[0.7em]">
        {groups.map((group) => (
          <div key={group.id}>
            {isNonEmpty(group.category) ? (
              <p className={cn("mb-[0.35em]", style.metaClassName)}>{group.category}</p>
            ) : null}
            <div className="space-y-[0.3em]">
              {group.items.filter(isNonEmpty).map((item) => (
                <div key={item} className={style.bodyClassName}>
                  <span>{item}</span>
                  <div
                    className="mt-[0.2em] h-[2px] w-full"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${style.palette.accent} 35%, transparent)`,
                    }}
                    aria-hidden
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  // rows: category label in a left column, items on the right
  return (
    <div className="space-y-[0.4em]">
      {groups.map((group) => (
        <div key={group.id} className={cn("flex gap-[0.9em]", style.bodyClassName)}>
          <span
            className="w-[8.5em] shrink-0 font-semibold"
            style={{ color: style.palette.secondary }}
          >
            {group.category}
          </span>
          <span className="min-w-0 flex-1">
            {group.items.filter(isNonEmpty).join(" · ")}
          </span>
        </div>
      ))}
    </div>
  );
}

/**
 * Renders the body of one section. Templates call this from their own layout
 * after drawing the section heading themselves.
 */
export function SectionBody({
  resume,
  sectionKey,
  style,
}: {
  resume: ResumeData;
  sectionKey: SectionKey;
  style: SectionStyle;
}) {
  const { design } = resume;

  if (sectionKey.startsWith("custom:")) {
    const section = resume.customSections.find(
      (entry) => entry.id === sectionKey.slice("custom:".length),
    );
    if (!section) return null;
    return (
      <>
        {section.items.map((item) => (
          <Entry
            key={item.id}
            style={style}
            title={item.title}
            subtitle={item.subtitle}
            dates={isNonEmpty(item.date) ? <span>{item.date}</span> : null}
          >
            {isNonEmpty(item.description) ? (
              <p className={cn("mt-[0.3em]", style.bodyClassName)}>{item.description}</p>
            ) : null}
            <Bullets items={item.bullets} style={style} />
          </Entry>
        ))}
      </>
    );
  }

  switch (sectionKey) {
    case "summary":
      return <p className={style.bodyClassName}>{resume.summary}</p>;

    case "experience":
      return (
        <>
          {resume.experience.map((entry) => (
            <Entry
              key={entry.id}
              style={style}
              title={entry.role}
              subtitle={
                style.entryLayout === "compact"
                  ? entry.company
                  : [entry.company, entry.location].filter(isNonEmpty).join(" · ")
              }
              meta={style.entryLayout === "compact" ? entry.location : undefined}
              dates={
                <DateRange
                  start={entry.startDate}
                  end={entry.endDate}
                  current={entry.current}
                  resume={resume}
                />
              }
            >
              {isNonEmpty(entry.description) ? (
                <p className={cn("mt-[0.3em]", style.bodyClassName)}>
                  {entry.description}
                </p>
              ) : null}
              <Bullets items={entry.achievements} style={style} />
              <Tags items={entry.technologies} style={style} />
            </Entry>
          ))}
        </>
      );

    case "education":
      return (
        <>
          {resume.education.map((entry) => (
            <Entry
              key={entry.id}
              style={style}
              title={[entry.degree, entry.field].filter(isNonEmpty).join(", ")}
              subtitle={entry.institution}
              meta={[entry.location, entry.grade].filter(isNonEmpty).join(" · ")}
              dates={
                <DateRange start={entry.startDate} end={entry.endDate} resume={resume} />
              }
            >
              {isNonEmpty(entry.description) ? (
                <p className={cn("mt-[0.25em]", style.bodyClassName)}>
                  {entry.description}
                </p>
              ) : null}
            </Entry>
          ))}
        </>
      );

    case "projects":
      return (
        <>
          {resume.projects.map((entry) => (
            <Entry
              key={entry.id}
              style={style}
              title={entry.name}
              subtitle={entry.role}
              dates={
                <DateRange start={entry.startDate} end={entry.endDate} resume={resume} />
              }
            >
              {isNonEmpty(entry.description) ? (
                <p className={cn("mt-[0.25em]", style.bodyClassName)}>
                  {entry.description}
                </p>
              ) : null}
              <Bullets items={entry.achievements} style={style} />
              <Tags items={entry.technologies} style={style} />
              {isNonEmpty(entry.url) || isNonEmpty(entry.repoUrl) ? (
                <div
                  className={cn(
                    "mt-[0.3em] flex flex-wrap gap-x-[1em] text-[0.85em]",
                    style.entryLayout === "compact" && "flex-col gap-y-[0.15em]",
                  )}
                  style={{ color: style.palette.accent }}
                >
                  {isNonEmpty(entry.url) ? <ResumeLinkAnchor url={entry.url} /> : null}
                  {isNonEmpty(entry.repoUrl) ? (
                    <ResumeLinkAnchor url={entry.repoUrl} />
                  ) : null}
                </div>
              ) : null}
            </Entry>
          ))}
        </>
      );

    case "skills":
      return <SkillsBody resume={resume} style={style} />;

    case "certifications":
      return (
        <>
          {resume.certifications
            .filter((entry) => isNonEmpty(entry.name))
            .map((entry) => (
              <Entry
                key={entry.id}
                style={style}
                title={entry.name}
                subtitle={entry.issuer}
                dates={
                  isNonEmpty(entry.date) ? (
                    <span>{formatResumeDate(entry.date, design.dateFormat)}</span>
                  ) : null
                }
              >
                {isNonEmpty(entry.url) ? (
                  <ResumeLinkAnchor
                    url={entry.url}
                    className="text-[0.85em]"
                  />
                ) : null}
              </Entry>
            ))}
        </>
      );

    case "languages": {
      const languages = resume.languages.filter((entry) => isNonEmpty(entry.name));
      if (languages.length === 0) return null;

      if (style.entryLayout === "compact") {
        return (
          <div className="space-y-[0.25em]">
            {languages.map((entry) => (
              <div
                key={entry.id}
                className={cn("flex justify-between gap-[0.6em]", style.bodyClassName)}
              >
                <span>{entry.name}</span>
                {entry.level ? <span className="opacity-70">{entry.level}</span> : null}
              </div>
            ))}
          </div>
        );
      }

      return (
        <p className={style.bodyClassName}>
          {languages
            .map((entry) => (entry.level ? `${entry.name} (${entry.level})` : entry.name))
            .join(" · ")}
        </p>
      );
    }

    case "awards":
      return (
        <>
          {resume.awards
            .filter((entry) => isNonEmpty(entry.title))
            .map((entry) => (
              <Entry
                key={entry.id}
                style={style}
                title={entry.title}
                subtitle={entry.issuer}
                dates={
                  isNonEmpty(entry.date) ? (
                    <span>{formatResumeDate(entry.date, design.dateFormat)}</span>
                  ) : null
                }
              >
                {isNonEmpty(entry.description) ? (
                  <p className={cn("mt-[0.25em]", style.bodyClassName)}>
                    {entry.description}
                  </p>
                ) : null}
              </Entry>
            ))}
        </>
      );

    case "volunteering":
      return (
        <>
          {resume.volunteering.map((entry) => (
            <Entry
              key={entry.id}
              style={style}
              title={entry.role}
              subtitle={entry.organization}
              dates={
                <DateRange start={entry.startDate} end={entry.endDate} resume={resume} />
              }
            >
              {isNonEmpty(entry.description) ? (
                <p className={cn("mt-[0.25em]", style.bodyClassName)}>
                  {entry.description}
                </p>
              ) : null}
            </Entry>
          ))}
        </>
      );

    case "references":
      return (
        <div
          className={cn(
            "grid gap-[0.8em]",
            style.entryLayout === "compact" ? "grid-cols-1" : "grid-cols-2",
          )}
        >
          {resume.references
            .filter((entry) => isNonEmpty(entry.name))
            .map((entry) => (
              <div key={entry.id} className={cn("resume-block", style.bodyClassName)}>
                <p className="font-semibold">{entry.name}</p>
                <p className="opacity-75">
                  {[entry.relationship, entry.company].filter(isNonEmpty).join(", ")}
                </p>
                <p className="opacity-75">
                  {[entry.email, entry.phone].filter(isNonEmpty).join(" · ")}
                </p>
              </div>
            ))}
        </div>
      );

    case "links":
      if (style.linksDisplay === "stacked") {
        return (
          <div className="space-y-[0.3em]">
            {resume.links
              .filter((link) => isNonEmpty(link.url))
              .map((link) => {
                const Icon = linkIcon(link.kind);
                return (
                  <div
                    key={link.id}
                    className={cn("flex items-start gap-[0.45em]", style.bodyClassName)}
                  >
                    {design.showIcons ? (
                      <Icon
                        className="mt-[0.15em] size-[1em] shrink-0"
                        style={{ color: style.palette.accent }}
                      />
                    ) : null}
                    <ResumeLinkAnchor url={link.url} className="min-w-0 break-all">
                      {link.label || displayUrl(link.url)}
                    </ResumeLinkAnchor>
                  </div>
                );
              })}
          </div>
        );
      }
      return (
        <ContactLinkList
          links={resume.links}
          showIcons={design.showIcons}
          className={cn(
            "flex flex-wrap gap-x-[1.5em] gap-y-[0.3em]",
            style.bodyClassName,
          )}
          iconClassName="opacity-70"
        />
      );

    default:
      return null;
  }
}

export { Entry as SectionEntry, ProfilePhoto };
