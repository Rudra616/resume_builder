"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check, Columns3, Eye, User } from "lucide-react";
import { ResumeThumbnail } from "@/components/resume/ResumeDocument";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { sampleResumeForPreview } from "@/lib/sample-resume";
import { TEMPLATE_LIST } from "@/lib/templates";
import { hasSectionContent } from "@/lib/resume-view";
import { cn, isNonEmpty } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import type { ResumeData, TemplateId } from "@/types/resume";

/** True when the stored draft has enough content to preview meaningfully. */
function draftHasContent(resume: ResumeData): boolean {
  return (
    isNonEmpty(resume.personalInfo.fullName) ||
    hasSectionContent(resume, "experience") ||
    hasSectionContent(resume, "summary")
  );
}

export function TemplateGallery() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const intent = searchParams.get("intent");

  const hydrated = useResumeStore((state) => state.hydrated);
  const hasDraft = useResumeStore((state) => state.hasDraft);
  const resume = useResumeStore((state) => state.resume);
  const setTemplate = useResumeStore((state) => state.setTemplate);
  const startBlankResume = useResumeStore((state) => state.startBlankResume);

  // null = follow whether a usable draft exists; a boolean means the user chose.
  const [previewChoice, setPreviewChoice] = React.useState<boolean | null>(null);
  const [pendingTemplate, setPendingTemplate] = React.useState<TemplateId | null>(null);

  const sample = React.useMemo(() => sampleResumeForPreview(), []);
  const canUseOwnContent = hydrated && hasDraft && draftHasContent(resume);

  const useMyContent = previewChoice ?? canUseOwnContent;

  const previewBase = useMyContent && canUseOwnContent ? resume : sample;

  const applyTemplate = (templateId: TemplateId, mode: "keep" | "fresh") => {
    if (mode === "fresh") {
      startBlankResume(templateId);
      toast.success(
        "Blank resume created",
        `${TEMPLATE_LIST.find((t) => t.id === templateId)?.name} is ready to fill in.`,
      );
    } else {
      setTemplate(templateId);
      toast.success(
        "Template applied",
        "Your content moved across unchanged. Undo is available in the builder.",
      );
    }
    router.push("/builder");
  };

  const handleSelect = (templateId: TemplateId) => {
    // Starting fresh over an existing draft is destructive, so confirm first.
    if (intent === "new" && hydrated && hasDraft && draftHasContent(resume)) {
      setPendingTemplate(templateId);
      return;
    }
    applyTemplate(templateId, intent === "new" && !hasDraft ? "fresh" : "keep");
  };

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            {intent === "new" ? "Choose a template" : "Templates"}
          </h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            {intent === "new"
              ? "Pick a starting point. You can switch template at any time without losing a single word."
              : "Ten genuinely different layouts. Selecting one applies it to your current resume — content is never reset."}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {canUseOwnContent ? (
            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2">
              <Switch
                id="use-my-content"
                checked={useMyContent}
                onCheckedChange={setPreviewChoice}
              />
              <Label htmlFor="use-my-content" className="cursor-pointer">
                <User className="size-3.5" />
                Preview with my information
              </Label>
            </div>
          ) : null}
          {canUseOwnContent ? (
            <Button variant="outline" asChild>
              <Link href="/compare">
                <Columns3 />
                Compare
              </Link>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATE_LIST.map((template) => {
          const isCurrent = hydrated && hasDraft && resume.design.templateId === template.id;
          const previewResume: ResumeData = {
            ...previewBase,
            design: {
              ...previewBase.design,
              ...template.defaults,
              templateId: template.id,
              showPhoto: previewBase.design.showPhoto,
            },
          };

          return (
            <article
              key={template.id}
              id={template.id}
              className={cn(
                "group flex scroll-mt-24 flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md",
                isCurrent ? "border-primary/60 ring-2 ring-primary/15" : "border-border",
              )}
            >
              <div className="relative flex justify-center overflow-hidden border-b border-border bg-[#eef0f5] p-4">
                <div className="overflow-hidden rounded-md shadow-sm ring-1 ring-black/5">
                  <ResumeThumbnail resume={previewResume} width={280} ratio={0.82} />
                </div>
                {isCurrent ? (
                  <Badge className="absolute top-3 right-3 gap-1">
                    <Check className="size-3" />
                    Current
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{template.name}</h2>
                    <p className="text-xs text-muted-foreground">{template.tagline}</p>
                  </div>
                  {template.atsFriendly ? (
                    <Badge variant="success" className="shrink-0">
                      ATS safe
                    </Badge>
                  ) : null}
                </div>

                <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {template.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {template.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <Button
                    className="flex-1"
                    variant={isCurrent ? "outline" : "default"}
                    onClick={() => handleSelect(template.id)}
                  >
                    {isCurrent ? "Open in builder" : "Use this template"}
                    <ArrowRight />
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Preview full page" asChild>
                    <Link href={`/preview?template=${template.id}`}>
                      <Eye />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <Dialog
        open={pendingTemplate !== null}
        onOpenChange={(open) => !open && setPendingTemplate(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>You already have a draft</DialogTitle>
            <DialogDescription>
              Starting a blank resume will clear the draft currently saved in this browser.
              You can also apply this template to your existing content instead.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPendingTemplate(null)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (pendingTemplate) applyTemplate(pendingTemplate, "keep");
                setPendingTemplate(null);
              }}
            >
              Keep my content
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (pendingTemplate) applyTemplate(pendingTemplate, "fresh");
                setPendingTemplate(null);
              }}
            >
              Start blank
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
