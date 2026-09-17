"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  Check,
  ChevronDown,
  Cloud,
  Columns3,
  Download,
  Eye,
  FilePlus2,
  FileText,
  Palette,
  PanelRightOpen,
  Redo2,
  RotateCcw,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toast";
import { healthTone } from "@/lib/resume-assistant/resumeScore";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import { useUIStore } from "@/store/uiStore";
import type { ResumeHealthReport } from "@/types/suggestion";

const TONE_BADGE = {
  success: "success",
  info: "secondary",
  warning: "warning",
  error: "error",
} as const;

export function BuilderTopBar({
  health,
  suggestionCount,
  onOpenTemplates,
  onOpenCustomize,
  onExport,
  isExporting,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: {
  health: ResumeHealthReport;
  suggestionCount: number;
  onOpenTemplates: () => void;
  onOpenCustomize: () => void;
  onExport: () => void;
  isExporting: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}) {
  const router = useRouter();
  const lastSavedAt = useResumeStore((state) => state.lastSavedAt);
  const clearResume = useResumeStore((state) => state.clearResume);
  const startBlankResume = useResumeStore((state) => state.startBlankResume);
  const templateId = useResumeStore((state) => state.resume.design.templateId);
  const assistantOpen = useUIStore((state) => state.assistantOpen);
  const setAssistantOpen = useUIStore((state) => state.setAssistantOpen);

  const [startOverOpen, setStartOverOpen] = React.useState(false);
  const tone = healthTone(health.score);

  return (
    <header className="print-hidden sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
            <FileText className="size-4" />
          </span>
          <span className="hidden text-sm font-semibold sm:inline">ResumeForge</span>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              File
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Resume</DropdownMenuLabel>
            <DropdownMenuItem
              onSelect={() => {
                startBlankResume(templateId);
                toast.success("New blank resume", "Your previous draft was replaced.");
              }}
            >
              <FilePlus2 />
              New Resume
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/import")}>
              <Upload />
              Import Resume
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push("/compare")}>
              <Columns3 />
              Compare Templates
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setStartOverOpen(true)}>
              <RotateCcw />
              Start Over…
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => {
                clearResume();
                toast.show({
                  title: "Resume cleared",
                  description: "This browser no longer holds a draft.",
                });
              }}
            >
              <Trash2 />
              Clear Resume
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="sm" onClick={onOpenTemplates}>
          <FileText />
          <span className="hidden sm:inline">Template</span>
        </Button>

        <Button variant="ghost" size="sm" onClick={onOpenCustomize}>
          <Palette />
          <span className="hidden sm:inline">Customize</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAssistantOpen(!assistantOpen)}
          className="gap-1.5"
        >
          <Activity />
          <span className="hidden sm:inline">Resume Health</span>
          <Badge variant={TONE_BADGE[tone]} className="tabular-nums">
            {health.score}
          </Badge>
          {suggestionCount > 0 ? (
            <Badge variant="secondary" className="hidden tabular-nums lg:inline-flex">
              {suggestionCount}
            </Badge>
          ) : null}
        </Button>

        <div className="ml-auto flex items-center gap-1">
          <div className="mr-1 hidden items-center gap-0.5 sm:flex">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Undo"
                  disabled={!canUndo}
                  onClick={onUndo}
                >
                  <Undo2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo (⌘Z)</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Redo"
                  disabled={!canRedo}
                  onClick={onRedo}
                >
                  <Redo2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo (⇧⌘Z)</TooltipContent>
            </Tooltip>
          </div>

          <SavedIndicator lastSavedAt={lastSavedAt} />

          {!assistantOpen ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Open assistant"
              className="hidden xl:inline-flex"
              onClick={() => setAssistantOpen(true)}
            >
              <PanelRightOpen />
            </Button>
          ) : null}

          <Button variant="outline" size="sm" asChild>
            <Link href="/preview">
              <Eye />
              <span className="hidden sm:inline">Preview</span>
            </Link>
          </Button>

          <Button size="sm" onClick={onExport} disabled={isExporting}>
            <Download />
            <span className="hidden sm:inline">
              {isExporting ? "Preparing…" : "Download PDF"}
            </span>
          </Button>
        </div>
      </div>

      <StartOverDialog
        open={startOverOpen}
        onOpenChange={setStartOverOpen}
        onBlank={() => {
          startBlankResume(templateId);
          setStartOverOpen(false);
          toast.success("Blank resume ready");
        }}
        onImport={() => {
          setStartOverOpen(false);
          router.push("/import");
        }}
        onClear={() => {
          clearResume();
          setStartOverOpen(false);
          router.push("/");
        }}
      />
    </header>
  );
}

function SavedIndicator({ lastSavedAt }: { lastSavedAt: string | null }) {
  const label = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          // Re-keying on the timestamp restarts the CSS pulse on every autosave.
          key={lastSavedAt ?? "unsaved"}
          className={cn(
            "mr-1 hidden items-center gap-1.5 rounded-md px-2 py-1 text-[11px] text-muted-foreground md:inline-flex",
            lastSavedAt && "saved-pulse",
          )}
        >
          {lastSavedAt ? <Check className="size-3.5" /> : <Cloud className="size-3.5" />}
          Saved locally
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {label
          ? `Autosaved to this browser at ${label}. Nothing is uploaded.`
          : "Your draft is stored in this browser only."}
      </TooltipContent>
    </Tooltip>
  );
}

export function StartOverDialog({
  open,
  onOpenChange,
  onBlank,
  onImport,
  onClear,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBlank: () => void;
  onImport: () => void;
  onClear: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Start over</DialogTitle>
          <DialogDescription>
            Your current draft lives in this browser only. Choose how you want to begin
            again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <button
            type="button"
            onClick={onBlank}
            className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/60"
          >
            <p className="flex items-center gap-2 text-sm font-medium">
              <FilePlus2 className="size-4" />
              Create blank resume
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Keeps your current template, clears all content.
            </p>
          </button>

          <button
            type="button"
            onClick={onImport}
            className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary/60"
          >
            <p className="flex items-center gap-2 text-sm font-medium">
              <Upload className="size-4" />
              Import a different resume
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Upload a PDF, DOCX or TXT file and replace this draft.
            </p>
          </button>

          <button
            type="button"
            onClick={onClear}
            className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-[var(--severity-error-bg)]"
          >
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--severity-error)]">
              <Trash2 className="size-4" />
              Clear existing draft
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Removes the resume from this browser and returns to the home page.
            </p>
          </button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
