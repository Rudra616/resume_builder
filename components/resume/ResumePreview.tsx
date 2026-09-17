"use client";

import * as React from "react";
import { Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { ResumeDocument } from "@/components/resume/ResumeDocument";
import { Button } from "@/components/ui/button";
import { clamp, cn } from "@/lib/utils";
import type { ResumeData } from "@/types/resume";

const MM_TO_PX = 96 / 25.4;
const PAGE_WIDTH_PX = 210 * MM_TO_PX;

/**
 * Scrollable A4 stage. Zoom is a CSS transform on a real HTML document, so what
 * you see is exactly what gets printed.
 */
export function ResumePreview({
  resume,
  zoom,
  onZoomChange,
  printRef,
  className,
  fitToWidth = true,
}: {
  resume: ResumeData;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  printRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
  fitToWidth?: boolean;
}) {
  const stageRef = React.useRef<HTMLDivElement | null>(null);
  const [pageCount, setPageCount] = React.useState(1);
  const [autoScale, setAutoScale] = React.useState(1);

  // Fits the page to the available width until the user zooms manually.
  React.useEffect(() => {
    if (!fitToWidth) return;
    const node = stageRef.current;
    if (!node) return;

    const measure = () => {
      const available = node.clientWidth - 48;
      setAutoScale(clamp(available / PAGE_WIDTH_PX, 0.32, 1));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [fitToWidth]);

  const scale = autoScale * zoom;

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <div className="print-hidden flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <p className="text-xs text-muted-foreground">
          A4 · {pageCount} {pageCount === 1 ? "page" : "pages"}
        </p>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom out"
            onClick={() => onZoomChange(clamp(Number((zoom - 0.1).toFixed(2)), 0.5, 2))}
          >
            <ZoomOut />
          </Button>
          <span className="w-11 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(scale * 100)}%
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Zoom in"
            onClick={() => onZoomChange(clamp(Number((zoom + 0.1).toFixed(2)), 0.5, 2))}
          >
            <ZoomIn />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={zoom === 1 ? "Zoom to full size" : "Fit to width"}
            onClick={() => onZoomChange(zoom === 1 ? 1 / autoScale : 1)}
          >
            {zoom === 1 ? <Maximize2 /> : <Minimize2 />}
          </Button>
        </div>
      </div>

      <div
        ref={stageRef}
        className="min-h-0 flex-1 overflow-auto scrollbar-slim bg-[#e9ecf2] p-6"
      >
        {/* `zoom` rather than `transform` so the scaled page still occupies
            layout space and the scroll container sizes itself correctly. */}
        <div className="mx-auto w-fit" style={{ zoom: scale }}>
          <ResumeDocument
            ref={printRef}
            id="resume-print-root"
            resume={resume}
            showPageGuides
            onPageCountChange={setPageCount}
            className="resume-shell"
          />
        </div>
      </div>
    </div>
  );
}
