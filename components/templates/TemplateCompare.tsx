"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Info, Plus, X } from "lucide-react";
import { ResumeThumbnail } from "@/components/resume/ResumeDocument";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { sampleResumeForPreview } from "@/lib/sample-resume";
import { TEMPLATE_LIST } from "@/lib/templates";
import { cn, isNonEmpty } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import type { ResumeData, TemplateId } from "@/types/resume";

const MAX_SELECTION = 3;

/**
 * Puts the user's actual resume into up to three templates at once. Most useful
 * straight after an import, when the same content is being judged on layout.
 */
export function TemplateCompare() {
  const router = useRouter();
  const hydrated = useResumeStore((state) => state.hydrated);
  const hasDraft = useResumeStore((state) => state.hasDraft);
  const resume = useResumeStore((state) => state.resume);
  const setTemplate = useResumeStore((state) => state.setTemplate);

  const sample = React.useMemo(() => sampleResumeForPreview(), []);
  const ownContent =
    hydrated &&
    hasDraft &&
    (isNonEmpty(resume.personalInfo.fullName) || resume.experience.length > 0);

  const [useMyContent, setUseMyContent] = React.useState(true);
  const [keepColors, setKeepColors] = React.useState(false);
  const [selected, setSelected] = React.useState<TemplateId[]>(() => {
    const current = resume.design.templateId;
    const others = TEMPLATE_LIST.map((template) => template.id).filter(
      (id) => id !== current,
    );
    return [current, others[0], others[1]].filter(Boolean).slice(0, MAX_SELECTION);
  });

  const base = useMyContent && ownContent ? resume : sample;

  const toggle = (templateId: TemplateId) => {
    setSelected((current) => {
      if (current.includes(templateId)) {
        return current.filter((id) => id !== templateId);
      }
      if (current.length >= MAX_SELECTION) {
        toast.show({
          title: `Comparing ${MAX_SELECTION} at a time`,
          description: "Remove one of the current picks to add another.",
        });
        return current;
      }
      return [...current, templateId];
    });
  };

  const resumeFor = (templateId: TemplateId): ResumeData => {
    const template = TEMPLATE_LIST.find((entry) => entry.id === templateId);
    return {
      ...base,
      design: keepColors
        ? { ...base.design, templateId }
        : {
            ...base.design,
            ...(template?.defaults ?? {}),
            templateId,
            showPhoto: base.design.showPhoto,
          },
    };
  };

  const choose = (templateId: TemplateId) => {
    setTemplate(templateId, !keepColors);
    toast.success(
      `${TEMPLATE_LIST.find((t) => t.id === templateId)?.name} applied`,
      "Your content came across unchanged.",
    );
    router.push("/builder");
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button variant="ghost" size="sm" className="mb-3 -ml-2" asChild>
            <Link href={ownContent ? "/builder" : "/templates"}>
              <ArrowLeft />
              {ownContent ? "Back to builder" : "Back to templates"}
            </Link>
          </Button>
          <h1 className="text-3xl font-semibold tracking-tight">Compare templates</h1>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
            Pick up to three layouts and see the same resume in each. Choosing one applies
            it to your draft — nothing is rewritten.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {ownContent ? (
            <div className="flex items-center gap-2">
              <Switch
                id="compare-own"
                checked={useMyContent}
                onCheckedChange={setUseMyContent}
              />
              <Label htmlFor="compare-own" className="cursor-pointer text-xs">
                Use my information
              </Label>
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <Switch
              id="compare-colors"
              checked={keepColors}
              onCheckedChange={setKeepColors}
            />
            <Label htmlFor="compare-colors" className="cursor-pointer text-xs">
              Keep my colours and fonts
            </Label>
          </div>
        </div>
      </div>

      {!ownContent ? (
        <p className="mb-6 flex items-start gap-2 rounded-lg border border-border bg-secondary/50 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          You don&apos;t have a draft in this browser yet, so these previews use sample
          content.{" "}
          <Link href="/import" className="font-medium text-foreground underline">
            Import your resume
          </Link>{" "}
          to compare with your own.
        </p>
      ) : null}

      <div className="mb-6 flex flex-wrap gap-1.5">
        {TEMPLATE_LIST.map((template) => {
          const isSelected = selected.includes(template.id);
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => toggle(template.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
                isSelected
                  ? "border-foreground/25 bg-secondary font-medium"
                  : "border-border text-muted-foreground hover:bg-secondary/60",
              )}
            >
              {isSelected ? <Check className="size-3" /> : <Plus className="size-3" />}
              {template.name}
            </button>
          );
        })}
      </div>

      {selected.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Select up to three templates above to compare them.
        </p>
      ) : (
        <div
          className={cn(
            "grid gap-5",
            selected.length === 1 && "sm:grid-cols-1 lg:max-w-md",
            selected.length === 2 && "sm:grid-cols-2",
            selected.length === 3 && "sm:grid-cols-2 lg:grid-cols-3",
          )}
        >
          {selected.map((templateId) => {
            const template = TEMPLATE_LIST.find((entry) => entry.id === templateId);
            if (!template) return null;
            const isCurrent = resume.design.templateId === templateId;

            return (
              <article
                key={templateId}
                className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
              >
                <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-semibold">{template.name}</h2>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {template.tagline}
                    </p>
                  </div>
                  {isCurrent ? <Badge variant="secondary">Current</Badge> : null}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${template.name} from comparison`}
                    className="text-muted-foreground"
                    onClick={() => toggle(templateId)}
                  >
                    <X />
                  </Button>
                </div>

                <div className="flex justify-center bg-[#eef0f5] p-4">
                  <div className="overflow-hidden rounded-md shadow-sm ring-1 ring-black/5">
                    <ResumeThumbnail
                      resume={resumeFor(templateId)}
                      width={330}
                      ratio={1.414}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 p-4">
                  <Button
                    className="flex-1"
                    variant={isCurrent ? "outline" : "default"}
                    onClick={() => choose(templateId)}
                  >
                    {isCurrent ? "Keep this one" : "Use this template"}
                  </Button>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/preview?template=${templateId}`}>Full size</Link>
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
