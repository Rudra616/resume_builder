"use client";

import * as React from "react";
import { getTemplate } from "@/lib/templates";
import { resumeCssVars } from "@/lib/resume-view";
import { cn } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

const A4_HEIGHT_MM = 297;
const MM_TO_PX = 96 / 25.4;

/**
 * Renders ResumeData at true A4 width as live HTML — never as an image — so the
 * exported PDF keeps selectable text and clickable links.
 *
 * Content flows continuously and the browser paginates on print. On screen we
 * draw guide lines where each A4 page ends so the user can see where breaks
 * will fall.
 */
export const ResumeDocument = React.forwardRef<
  HTMLDivElement,
  {
    resume: ResumeData;
    className?: string;
    id?: string;
    /** Draws page-break guides and reports page count. Off for print/thumbnails. */
    showPageGuides?: boolean;
    onPageCountChange?: (pages: number) => void;
  }
>(function ResumeDocument(
  { resume, className, id, showPageGuides = false, onPageCountChange },
  ref,
) {
  const Template = getTemplate(resume.design.templateId).component;
  const innerRef = React.useRef<HTMLDivElement | null>(null);
  const [pageCount, setPageCount] = React.useState(1);

  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  // Measures rendered height so the builder can show an accurate page count.
  React.useEffect(() => {
    const node = innerRef.current;
    if (!node) return;

    const measure = () => {
      const pageHeightPx = A4_HEIGHT_MM * MM_TO_PX;
      const pages = Math.max(1, Math.ceil(node.scrollHeight / pageHeightPx - 0.02));
      setPageCount(pages);
      onPageCountChange?.(pages);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [onPageCountChange, resume]);

  return (
    <div
      ref={setRefs}
      id={id}
      data-resume-document
      className={cn("resume-page", className)}
      style={resumeCssVars(resume.design)}
    >
      <Template resume={resume} />

      {showPageGuides && pageCount > 1
        ? Array.from({ length: pageCount - 1 }, (_, index) => (
            <div
              key={index}
              aria-hidden
              data-print="hidden"
              className="pointer-events-none absolute left-0 flex w-full items-center gap-2 border-t border-dashed border-[#c2c8d4]"
              style={{ top: `${(index + 1) * A4_HEIGHT_MM}mm` }}
            >
              <span className="absolute right-2 -translate-y-1/2 rounded bg-[#eef1f6] px-1.5 py-0.5 text-[8pt] font-medium text-[#626c7d]">
                Page {index + 2}
              </span>
            </div>
          ))
        : null}
    </div>
  );
});

/**
 * Fixed-width thumbnail that scales a full A4 render down with a CSS transform.
 * The DOM stays real text, so thumbnails and the live document cannot drift.
 */
export function ResumeThumbnail({
  resume,
  width,
  className,
  ratio = A4_HEIGHT_MM / 210,
}: {
  resume: ResumeData;
  width: number;
  className?: string;
  ratio?: number;
}) {
  const pageWidthPx = 210 * MM_TO_PX;
  const scale = width / pageWidthPx;

  return (
    <div
      className={cn("relative overflow-hidden bg-white", className)}
      style={{ width, height: width * ratio }}
      aria-hidden
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: pageWidthPx,
        }}
      >
        <ResumeDocument resume={resume} />
      </div>
    </div>
  );
}
