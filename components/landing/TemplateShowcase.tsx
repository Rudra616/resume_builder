"use client";

import * as React from "react";
import { ResumeThumbnail } from "@/components/resume/ResumeDocument";
import { getTemplate } from "@/lib/templates";
import { sampleResumeForPreview } from "@/lib/sample-resume";
import { cn } from "@/lib/utils";
import type { TemplateId } from "@/types/resume";

const SHOWCASE: TemplateId[] = ["modern-edge", "sidebar-pro", "executive-noir"];

/**
 * A small fan of real template renders. These are the same components the
 * builder uses, so nothing on the landing page can drift from the product.
 */
export function TemplateShowcase() {
  const resume = React.useMemo(() => sampleResumeForPreview(), []);

  return (
    <div className="relative mx-auto flex h-[320px] w-full max-w-md items-center justify-center sm:h-[380px]">
      {SHOWCASE.map((id, index) => {
        const template = getTemplate(id);
        const offset = index - 1;
        return (
          <div
            key={id}
            className={cn(
              "absolute overflow-hidden rounded-lg border border-border/80 bg-white shadow-xl transition-transform",
              index === 1 ? "z-20" : "z-10",
            )}
            style={{
              transform: `translateX(${offset * 46}%) rotate(${offset * 6}deg) scale(${
                index === 1 ? 1 : 0.9
              })`,
            }}
            aria-hidden
          >
            <ResumeThumbnail
              resume={{ ...resume, design: { ...resume.design, ...template.defaults, templateId: id } }}
              width={index === 1 ? 232 : 208}
            />
          </div>
        );
      })}
    </div>
  );
}
