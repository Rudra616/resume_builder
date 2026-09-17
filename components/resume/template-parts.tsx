import * as React from "react";
import {
  AtSign,
  Behance,
  Dribbble,
  Github,
  Globe,
  Linkedin,
  MapPin,
  Phone,
  type LucideIcon,
} from "@/components/resume/link-icons";
import { formatDateRange } from "@/lib/dates";
import { displayUrl, normalizeHref } from "@/lib/resume-view";
import { cn, isNonEmpty } from "@/lib/utils";
import type { LinkKind, ResumeData, ResumeLink } from "@/types/resume";

const LINK_ICONS: Record<LinkKind, LucideIcon> = {
  linkedin: Linkedin,
  github: Github,
  portfolio: Globe,
  website: Globe,
  behance: Behance,
  dribbble: Dribbble,
  twitter: Globe,
  stackoverflow: Globe,
  medium: Globe,
  custom: Globe,
};

export function linkIcon(kind: LinkKind): LucideIcon {
  return LINK_ICONS[kind] ?? Globe;
}

export { AtSign, Github, Globe, Linkedin, MapPin, Phone };

/** Renders an absolute, clickable link that survives PDF export. */
export function ResumeLinkAnchor({
  url,
  children,
  className,
}: {
  url: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const href = normalizeHref(url);
  if (!href) return null;
  return (
    <a href={href} className={className} target="_blank" rel="noreferrer noopener">
      {children ?? displayUrl(url)}
    </a>
  );
}

export function ContactLinkList({
  links,
  showIcons,
  className,
  itemClassName,
  iconClassName,
}: {
  links: ResumeLink[];
  showIcons: boolean;
  className?: string;
  itemClassName?: string;
  iconClassName?: string;
}) {
  const usable = links.filter((link) => isNonEmpty(link.url));
  if (usable.length === 0) return null;

  return (
    <div className={className}>
      {usable.map((link) => {
        const Icon = linkIcon(link.kind);
        return (
          <span key={link.id} className={cn("inline-flex items-center gap-1", itemClassName)}>
            {showIcons ? <Icon className={cn("size-[1em] shrink-0", iconClassName)} /> : null}
            <ResumeLinkAnchor url={link.url}>
              {link.label || displayUrl(link.url)}
            </ResumeLinkAnchor>
          </span>
        );
      })}
    </div>
  );
}

/** Bullet list shared by every template; only the marker styling differs. */
export function BulletList({
  items,
  className,
  itemClassName,
  marker = "•",
  markerClassName,
  markerStyle,
}: {
  items: string[];
  className?: string;
  itemClassName?: string;
  marker?: React.ReactNode;
  markerClassName?: string;
  markerStyle?: React.CSSProperties;
}) {
  const usable = items.filter(isNonEmpty);
  if (usable.length === 0) return null;

  return (
    <ul className={className}>
      {usable.map((item, index) => (
        <li key={index} className={cn("flex gap-[0.5em]", itemClassName)}>
          <span aria-hidden className={cn("shrink-0", markerClassName)} style={markerStyle}>
            {marker}
          </span>
          <span className="min-w-0 flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function TechTags({
  items,
  className,
  itemClassName,
  separator,
}: {
  items: string[];
  className?: string;
  itemClassName?: string;
  separator?: string;
}) {
  const usable = items.filter(isNonEmpty);
  if (usable.length === 0) return null;

  if (separator) {
    return <p className={className}>{usable.join(separator)}</p>;
  }

  return (
    <div className={className}>
      {usable.map((item) => (
        <span key={item} className={itemClassName}>
          {item}
        </span>
      ))}
    </div>
  );
}

export function DateRange({
  start,
  end,
  current,
  resume,
  className,
}: {
  start: string;
  end: string;
  current?: boolean;
  resume: ResumeData;
  className?: string;
}) {
  const value = formatDateRange(start, end, Boolean(current), resume.design.dateFormat);
  if (!value) return null;
  return <span className={className}>{value}</span>;
}

export function ProfilePhoto({
  resume,
  size,
  className,
  style,
}: {
  resume: ResumeData;
  size: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const { photo, photoShape } = resume.personalInfo;
  if (!resume.design.showPhoto || !photo) return null;

  const radius =
    photoShape === "square" ? "0" : photoShape === "rounded" ? "12px" : "9999px";

  return (
    // Data URLs from the user's own device; next/image would add no value here
    // and would break static export of the print view.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={photo}
      alt={resume.personalInfo.fullName || "Profile photo"}
      className={cn("shrink-0 object-cover", className)}
      style={{ width: size, height: size, borderRadius: radius, ...style }}
    />
  );
}

/**
 * Applies the user's chosen heading treatment (plain / underline / bar / boxed)
 * on top of each template's own typography, so the Customize panel affects
 * every template consistently.
 */
export function HeadingFrame({
  resume,
  children,
  className,
  accent,
  style,
}: {
  resume: ResumeData;
  children: React.ReactNode;
  className?: string;
  /** Overrides the accent colour used for rules, bars and tinted boxes. */
  accent?: string;
  style?: React.CSSProperties;
}) {
  const { headingStyle, uppercaseHeadings } = resume.design;
  const color = accent ?? resume.design.accentColor;

  const frameStyle: React.CSSProperties = { ...style };
  let frameClass = "";

  if (headingStyle === "underline") {
    frameClass = "pb-[0.25em] border-b";
    frameStyle.borderBottomColor = color;
    frameStyle.borderBottomWidth = "1px";
  } else if (headingStyle === "bar") {
    frameClass = "pl-[0.55em] border-l-[3px]";
    frameStyle.borderLeftColor = color;
  } else if (headingStyle === "boxed") {
    frameClass = "px-[0.5em] py-[0.2em] rounded-[3px]";
    frameStyle.backgroundColor = `color-mix(in srgb, ${color} 12%, #ffffff)`;
  }

  return (
    <div
      className={cn(
        "resume-heading",
        uppercaseHeadings && "uppercase",
        frameClass,
        className,
      )}
      style={frameStyle}
    >
      {children}
    </div>
  );
}

/** Renders custom-section items using a template-provided item renderer. */
export function CustomSectionBody({
  resume,
  sectionId,
  render,
}: {
  resume: ResumeData;
  sectionId: string;
  render: (item: {
    id: string;
    title: string;
    subtitle: string;
    date: string;
    description: string;
    bullets: string[];
  }) => React.ReactNode;
}) {
  const section = resume.customSections.find((entry) => entry.id === sectionId);
  if (!section) return null;
  return <>{section.items.map((item) => render(item))}</>;
}
