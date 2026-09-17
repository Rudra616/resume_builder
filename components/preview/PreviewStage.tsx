"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, Pencil } from "lucide-react";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { Button } from "@/components/ui/button";
import { usePdfExport } from "@/hooks/usePdfExport";
import { sampleResumeForPreview } from "@/lib/sample-resume";
import { TEMPLATE_IDS, getTemplate } from "@/lib/templates";
import { useResumeStore } from "@/store/resumeStore";
import { useUIStore } from "@/store/uiStore";
import type { ResumeData, TemplateId } from "@/types/resume";

/**
 * Full-page preview. Without a stored draft it shows the sample resume, so the
 * template gallery's preview links always lead somewhere useful.
 */
export function PreviewStage() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("template");

  const hydrated = useResumeStore((state) => state.hydrated);
  const hasDraft = useResumeStore((state) => state.hasDraft);
  const stored = useResumeStore((state) => state.resume);
  const zoom = useUIStore((state) => state.zoom);
  const setZoom = useUIStore((state) => state.setZoom);

  const printRef = React.useRef<HTMLDivElement | null>(null);

  const templateId =
    requested && (TEMPLATE_IDS as readonly string[]).includes(requested)
      ? (requested as TemplateId)
      : null;

  const sample = React.useMemo(() => sampleResumeForPreview(), []);
  const base = hydrated && hasDraft ? stored : sample;

  const resume: ResumeData = React.useMemo(() => {
    if (!templateId || templateId === base.design.templateId) return base;
    const template = getTemplate(templateId);
    return {
      ...base,
      design: { ...base.design, ...template.defaults, templateId },
    };
  }, [base, templateId]);

  const { exportPdf, isExporting } = usePdfExport(printRef, resume);
  const usingSample = !(hydrated && hasDraft);

  return (
    <div className="flex h-dvh flex-col overflow-hidden">
      <header className="print-hidden flex h-14 shrink-0 items-center gap-2 border-b border-border px-3 sm:px-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={usingSample ? "/templates" : "/builder"}>
            <ArrowLeft />
            {usingSample ? "Templates" : "Back to builder"}
          </Link>
        </Button>

        <div className="ml-1 min-w-0">
          <p className="truncate text-sm font-medium">
            {getTemplate(resume.design.templateId).name}
          </p>
          <p className="truncate text-[11px] text-muted-foreground">
            {usingSample
              ? "Sample content — your own resume will replace it"
              : resume.personalInfo.fullName || "Your resume"}
          </p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {usingSample ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/builder?new=1`}>
                <Pencil />
                Use this template
              </Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/builder">
                <Pencil />
                Edit
              </Link>
            </Button>
          )}
          <Button size="sm" onClick={exportPdf} disabled={isExporting}>
            <Download />
            {isExporting ? "Preparing…" : "Download PDF"}
          </Button>
        </div>
      </header>

      <div className="min-h-0 flex-1 bg-[#eef0f5]">
        <ResumePreview
          resume={resume}
          zoom={zoom}
          onZoomChange={setZoom}
          printRef={printRef}
          className="h-full"
        />
      </div>
    </div>
  );
}
