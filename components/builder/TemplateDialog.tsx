"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Columns3, User } from "lucide-react";
import { ResumeThumbnail } from "@/components/resume/ResumeDocument";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { sampleResumeForPreview } from "@/lib/sample-resume";
import { TEMPLATE_LIST } from "@/lib/templates";
import { cn, isNonEmpty } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import type { ResumeData } from "@/types/resume";

/**
 * The in-builder template picker. Cards render the user's own content by default
 * so switching is a genuine preview rather than a guess.
 */
export function TemplateDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const resume = useResumeStore((state) => state.resume);
  const setTemplate = useResumeStore((state) => state.setTemplate);
  const [useMyContent, setUseMyContent] = React.useState(true);
  const [keepColors, setKeepColors] = React.useState(false);

  const hasOwnContent =
    isNonEmpty(resume.personalInfo.fullName) ||
    resume.experience.length > 0 ||
    isNonEmpty(resume.summary);

  const sample = React.useMemo(() => sampleResumeForPreview(), []);
  const base = useMyContent && hasOwnContent ? resume : sample;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Choose a template</DialogTitle>
          <DialogDescription>
            Your content stays exactly as it is — only the layout changes. Switch as often
            as you like.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-4 border-b border-border pb-3">
          {hasOwnContent ? (
            <div className="flex items-center gap-2">
              <Switch
                id="template-dialog-own"
                checked={useMyContent}
                onCheckedChange={setUseMyContent}
              />
              <Label htmlFor="template-dialog-own" className="cursor-pointer text-xs">
                <User className="size-3.5" />
                Preview with my information
              </Label>
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Switch
              id="template-dialog-colors"
              checked={keepColors}
              onCheckedChange={setKeepColors}
            />
            <Label htmlFor="template-dialog-colors" className="cursor-pointer text-xs">
              Keep my current colours and fonts
            </Label>
          </div>

          <Button variant="ghost" size="sm" className="ml-auto" asChild>
            <Link href="/compare">
              <Columns3 />
              Compare side by side
            </Link>
          </Button>
        </div>

        <div className="-mx-1 max-h-[62vh] overflow-y-auto scrollbar-slim px-1 py-1">
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {TEMPLATE_LIST.map((template) => {
              const isCurrent = resume.design.templateId === template.id;
              const previewResume: ResumeData = {
                ...base,
                design: keepColors
                  ? { ...base.design, templateId: template.id }
                  : {
                      ...base.design,
                      ...template.defaults,
                      templateId: template.id,
                      showPhoto: base.design.showPhoto,
                    },
              };

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setTemplate(template.id, !keepColors);
                    toast.success(
                      `${template.name} applied`,
                      "Nothing was lost — undo is in the top bar if you want the old look back.",
                    );
                    onOpenChange(false);
                  }}
                  className={cn(
                    "group overflow-hidden rounded-lg border bg-card text-left transition-shadow hover:shadow-md",
                    isCurrent
                      ? "border-primary/60 ring-2 ring-primary/15"
                      : "border-border",
                  )}
                >
                  <div className="relative flex justify-center border-b border-border bg-[#eef0f5] p-2.5">
                    <div className="overflow-hidden rounded shadow-sm ring-1 ring-black/5">
                      <ResumeThumbnail resume={previewResume} width={190} ratio={0.7} />
                    </div>
                    {isCurrent ? (
                      <Badge className="absolute top-2 right-2 gap-1 text-[10px]">
                        <Check className="size-2.5" />
                        Current
                      </Badge>
                    ) : null}
                  </div>
                  <div className="p-3">
                    <p className="text-[13px] font-medium">{template.name}</p>
                    <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                      {template.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
