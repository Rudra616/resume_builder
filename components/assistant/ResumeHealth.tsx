"use client";

import * as React from "react";
import { Check, ChevronDown, Info, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { healthTone } from "@/lib/resume-assistant/resumeScore";
import { cn } from "@/lib/utils";
import type { ResumeHealthReport } from "@/types/suggestion";

const TONE_CLASS = {
  success: "text-[var(--severity-success)]",
  info: "text-[var(--severity-suggestion)]",
  warning: "text-[var(--severity-warning)]",
  error: "text-[var(--severity-error)]",
} as const;

const BAR_CLASS = {
  success: "bg-[var(--severity-success)]",
  info: "bg-[var(--severity-suggestion)]",
  warning: "bg-[var(--severity-warning)]",
  error: "bg-[var(--severity-error)]",
} as const;

/**
 * Resume Health — a transparent local score. Deliberately not presented as an
 * ATS score, because no applicant tracking system was consulted to produce it.
 */
export function ResumeHealth({
  health,
  className,
}: {
  health: ResumeHealthReport;
  className?: string;
}) {
  const tone = healthTone(health.score);

  return (
    <div className={cn("rounded-xl border border-border bg-card p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm font-semibold">Resume Health</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label="How this score works"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Info className="size-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                A transparent checklist of our own rules — not an ATS score. Every point is
                explained in the categories below.
              </TooltipContent>
            </Tooltip>
          </div>
          <p className={cn("mt-0.5 text-xs font-medium", TONE_CLASS[tone])}>
            {health.grade}
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl leading-none font-semibold tabular-nums">
            {health.score}
            <span className="text-sm font-normal text-muted-foreground"> / 100</span>
          </p>
        </div>
      </div>

      <Progress
        value={health.score}
        className="mt-3 h-1.5"
        indicatorClassName={BAR_CLASS[tone]}
      />

      <Accordion type="multiple" className="mt-3">
        <AccordionItem value="categories" className="border-0">
          <AccordionTrigger className="py-2 text-xs text-muted-foreground hover:no-underline [&>svg]:size-3.5">
            Why this score
          </AccordionTrigger>
          <AccordionContent className="pb-2">
            <ul className="space-y-2">
              {health.categories.map((category) => {
                const ratio = category.max === 0 ? 0 : category.score / category.max;
                const categoryTone = healthTone(Math.round(ratio * 100));
                return (
                  <li key={category.key}>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span>{category.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {category.score}/{category.max}
                      </span>
                    </div>
                    <Progress
                      value={ratio * 100}
                      className="mt-1 h-1"
                      indicatorClassName={BAR_CLASS[categoryTone]}
                    />
                  </li>
                );
              })}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {health.needsAttention.length > 0 ? (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Needs attention
          </p>
          <ul className="space-y-1">
            {health.needsAttention.slice(0, 6).map((item) => (
              <li key={item} className="flex gap-1.5 text-xs leading-relaxed">
                <X className="mt-0.5 size-3 shrink-0 text-[var(--severity-warning)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          {health.needsAttention.length > 6 ? (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <ChevronDown className="size-3" />
              and {health.needsAttention.length - 6} more below
            </p>
          ) : null}
        </div>
      ) : null}

      {health.positives.length > 0 ? (
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            Working well
          </p>
          <ul className="space-y-1">
            {health.positives.slice(0, 5).map((item) => (
              <li key={item} className="flex gap-1.5 text-xs leading-relaxed">
                <Check className="mt-0.5 size-3 shrink-0 text-[var(--severity-success)]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
