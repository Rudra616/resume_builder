"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const IMPORT_STEPS = [
  { label: "Reading your resume...", detail: "Opening the file in your browser." },
  {
    label: "Extracting content...",
    detail: "Pulling out text, line order and hyperlinks.",
  },
  {
    label: "Finding your experience, education and skills...",
    detail: "Identifying resume sections from the headings we recognise.",
  },
  {
    label: "Reviewing information...",
    detail: "Working out which fields need a second look.",
  },
  { label: "Almost ready.", detail: "Opening the review screen." },
] as const;

export function ImportProgress({
  step,
  fileName,
}: {
  /** 0-based index of the step currently running. */
  step: number;
  fileName: string;
}) {
  const percent = Math.round(((step + 1) / IMPORT_STEPS.length) * 100);

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {IMPORT_STEPS[Math.min(step, IMPORT_STEPS.length - 1)].label}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {fileName} · processed entirely on your device
        </p>
      </div>

      <Progress value={percent} className="mb-8" />

      <ol className="space-y-2">
        {IMPORT_STEPS.map((item, index) => {
          const done = index < step;
          const active = index === step;
          return (
            <li
              key={item.label}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                active
                  ? "border-primary/40 bg-card"
                  : done
                    ? "border-border bg-card/60"
                    : "border-transparent bg-transparent",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                  done
                    ? "bg-[var(--severity-success)] text-white"
                    : active
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="size-3" />
                ) : active ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  index + 1
                )}
              </span>
              <div>
                <p
                  className={cn(
                    "text-sm",
                    active ? "font-medium" : done ? "" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </p>
                {active ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
