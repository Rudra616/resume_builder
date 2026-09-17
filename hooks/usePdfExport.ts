"use client";

import * as React from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "@/components/ui/toast";
import type { ResumeData } from "@/types/resume";

function fileNameFor(resume: ResumeData): string {
  const name = resume.personalInfo.fullName.trim() || "Resume";
  const role = resume.personalInfo.jobTitle.trim();
  return [name, role].filter(Boolean).join(" — ").replace(/[\\/:*?"<>|]/g, "");
}

/**
 * Sends the live resume DOM to the browser print pipeline. Nothing is
 * rasterised, so the resulting PDF keeps selectable text, real typography and
 * working hyperlinks.
 */
export function usePdfExport(
  contentRef: React.RefObject<HTMLDivElement | null>,
  resume: ResumeData,
) {
  const [isExporting, setIsExporting] = React.useState(false);

  const print = useReactToPrint({
    contentRef,
    documentTitle: fileNameFor(resume),
    pageStyle: `
      @page { size: A4; margin: 0; }
      html, body { margin: 0 !important; padding: 0 !important; background: #ffffff !important; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      .resume-page { box-shadow: none !important; border: none !important; }
      [data-print="hidden"] { display: none !important; }
    `,
    onBeforePrint: async () => {
      setIsExporting(true);
    },
    onAfterPrint: () => setIsExporting(false),
    onPrintError: (_location, error) => {
      setIsExporting(false);
      toast.error(
        "Could not open the print dialog",
        error?.message ?? "Try again, or use your browser's Print command.",
      );
    },
  });

  const exportPdf = React.useCallback(() => {
    if (!contentRef.current) {
      toast.error("Nothing to export yet", "Add some content to your resume first.");
      return;
    }
    toast.show({
      title: "Opening your browser's print dialog",
      description: 'Choose "Save as PDF" as the destination for a text-based file.',
      duration: 6000,
    });
    print();
  }, [contentRef, print]);

  return { exportPdf, isExporting };
}
