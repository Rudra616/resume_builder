"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, FileText, Palette, Pencil, Sparkles } from "lucide-react";
import { AssistantPanel } from "@/components/assistant/AssistantPanel";
import { BuilderTopBar } from "@/components/builder/BuilderTopBar";
import { CustomizePanel } from "@/components/builder/CustomizePanel";
import { EditorPanel } from "@/components/builder/EditorPanel";
import { TemplateDialog } from "@/components/builder/TemplateDialog";
import { AssistantProvider } from "@/components/builder/assistant-context";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssistant } from "@/hooks/useAssistant";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { usePdfExport } from "@/hooks/usePdfExport";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import { useUIStore } from "@/store/uiStore";

export function BuilderShell() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const hydrated = useResumeStore((state) => state.hydrated);
  const hasDraft = useResumeStore((state) => state.hasDraft);
  const resume = useResumeStore((state) => state.resume);
  const startBlankResume = useResumeStore((state) => state.startBlankResume);

  const assistantOpen = useUIStore((state) => state.assistantOpen);
  const setAssistantOpen = useUIStore((state) => state.setAssistantOpen);
  const mobileTab = useUIStore((state) => state.mobileTab);
  const setMobileTab = useUIStore((state) => state.setMobileTab);
  const zoom = useUIStore((state) => state.zoom);
  const setZoom = useUIStore((state) => state.setZoom);

  const assistant = useAssistant();
  const { canUndo, canRedo, undo, redo } = useUndoRedo();

  // One resume document is mounted at a time, and it is always the print target,
  // so what the user sees is exactly what the PDF contains.
  const printRef = React.useRef<HTMLDivElement | null>(null);
  const { exportPdf, isExporting } = usePdfExport(printRef, resume);

  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const [templateOpen, setTemplateOpen] = React.useState(
    searchParams.get("panel") === "template",
  );
  const [customizeOpen, setCustomizeOpen] = React.useState(
    searchParams.get("panel") === "customize",
  );
  const [importedNotice, setImportedNotice] = React.useState(
    searchParams.get("imported") === "1",
  );

  // Landing on /builder with nothing stored would be a dead end, so give the
  // user a draft to edit. `?new=1` always starts clean.
  const wantsNew = searchParams.get("new") === "1";
  React.useEffect(() => {
    if (!hydrated) return;
    if (wantsNew) {
      startBlankResume(resume.design.templateId);
      router.replace("/builder");
      return;
    }
    if (!hasDraft) startBlankResume(resume.design.templateId);
    // Only reacts to hydration and the explicit "new" intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, wantsNew]);

  if (!hydrated || isDesktop === null) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="size-4 animate-pulse" />
          Restoring your resume from this browser…
        </div>
      </div>
    );
  }

  const issueCount = assistant.suggestions.filter(
    (item) => item.severity !== "success",
  ).length;

  return (
    <AssistantProvider assistant={assistant}>
      <div className="flex h-dvh flex-col overflow-hidden">
        <BuilderTopBar
          health={assistant.health}
          suggestionCount={issueCount}
          onOpenTemplates={() => setTemplateOpen(true)}
          onOpenCustomize={() => setCustomizeOpen(true)}
          onExport={exportPdf}
          isExporting={isExporting}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />

        {isDesktop ? (
          // Editor | Resume preview | Assistant
          <div className="flex min-h-0 flex-1">
            <EditorPanel className="w-[clamp(360px,32%,520px)] border-r border-border" />

            <div className="flex min-w-0 flex-1 flex-col bg-[#eef0f5]">
              <ResumePreview
                resume={resume}
                zoom={zoom}
                onZoomChange={setZoom}
                printRef={printRef}
                className="flex-1"
              />
            </div>

            {assistantOpen ? (
              <AssistantPanel
                assistant={assistant}
                onCollapse={() => setAssistantOpen(false)}
                className="w-[clamp(300px,24%,380px)]"
              />
            ) : (
              <button
                type="button"
                onClick={() => setAssistantOpen(true)}
                className="flex w-10 shrink-0 flex-col items-center gap-3 border-l border-border bg-background py-4 text-muted-foreground hover:text-foreground"
              >
                <Sparkles className="size-4" />
                <span className="text-[11px] [writing-mode:vertical-rl]">
                  Resume Assistant
                  {issueCount > 0 ? ` · ${issueCount}` : ""}
                </span>
              </button>
            )}
          </div>
        ) : (
          <Tabs
            value={mobileTab}
            onValueChange={(value) => setMobileTab(value as typeof mobileTab)}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="mx-3 mt-3 grid shrink-0 grid-cols-3">
              <TabsTrigger value="edit">
                <Pencil className="size-3.5" />
                Edit
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="size-3.5" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="assistant">
                <Sparkles className="size-3.5" />
                Assistant
                {issueCount > 0 ? (
                  <span className="ml-1 rounded-full bg-secondary px-1.5 text-[10px] tabular-nums">
                    {issueCount}
                  </span>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <div className="min-h-0 flex-1">
              {mobileTab === "edit" ? <EditorPanel className="h-full" /> : null}
              {mobileTab === "preview" ? (
                <div className="flex h-full flex-col bg-[#eef0f5]">
                  <ResumePreview
                    resume={resume}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    printRef={printRef}
                    className="flex-1"
                  />
                </div>
              ) : null}
              {mobileTab === "assistant" ? (
                <AssistantPanel assistant={assistant} className="h-full border-l-0" />
              ) : null}
            </div>

            <div
              className={cn(
                "flex shrink-0 items-center gap-2 border-t border-border px-3 py-2",
              )}
            >
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setTemplateOpen(true)}
              >
                <FileText />
                Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setCustomizeOpen(true)}
              >
                <Palette />
                Customize
              </Button>
            </div>
          </Tabs>
        )}
      </div>

      <TemplateDialog open={templateOpen} onOpenChange={setTemplateOpen} />

      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Customize</DialogTitle>
            <DialogDescription>
              Colours, type, spacing and section order. Everything here is design only —
              your words are untouched.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-y-auto scrollbar-slim pr-1">
            <CustomizePanel />
          </div>
        </DialogContent>
      </Dialog>

      {importedNotice ? (
        <ImportedNotice
          onDismiss={() => {
            setImportedNotice(false);
            router.replace("/builder");
          }}
        />
      ) : null}
    </AssistantProvider>
  );
}

function ImportedNotice({ onDismiss }: { onDismiss: () => void }) {
  const fileName = useResumeStore((state) => state.resume.metadata.importedFileName);

  return (
    <Dialog open onOpenChange={onDismiss}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Your resume is in the builder</DialogTitle>
          <DialogDescription>
            {fileName
              ? `Everything we could read from ${fileName} is now editable content.`
              : "Everything we could read is now editable content."}{" "}
            The original file was never stored — only this editable draft, in your browser.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm leading-relaxed text-muted-foreground">
          The Resume Assistant has already reviewed your writing. Work through its
          suggestions, switch template whenever you like, then download a PDF.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" asChild>
            <Link href="/compare">Compare templates</Link>
          </Button>
          <Button onClick={onDismiss}>Start editing</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
