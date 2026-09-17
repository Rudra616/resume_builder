"use client";

import * as React from "react";
import { Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Suggestion } from "@/types/suggestion";

/**
 * A writing suggestion that changes wording. These are never batch-applied and
 * always show the exact replacement before the user commits to it.
 */
export function ContentSuggestion({
  suggestion,
  onApply,
  onDismiss,
  className,
}: {
  suggestion: Suggestion;
  onApply: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
  className?: string;
}) {
  const hasRewrite = Boolean(suggestion.fix);

  return (
    <div className={cn("rounded-lg border border-border bg-card p-3", className)}>
      <div className="flex items-start gap-2.5">
        <Lightbulb className="mt-0.5 size-4 shrink-0 text-[var(--severity-suggestion)]" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug font-medium">{suggestion.title}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {suggestion.detail}
          </p>

          {hasRewrite && suggestion.original ? (
            <div className="mt-2.5 space-y-1.5 text-xs">
              <p className="rounded-md bg-secondary/70 p-2 leading-relaxed line-through decoration-muted-foreground/50">
                {suggestion.original}
              </p>
              <p className="rounded-md bg-[var(--severity-success-bg)] p-2 leading-relaxed">
                {suggestion.fix?.replacement}
              </p>
            </div>
          ) : null}

          <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
            {suggestion.location}
          </p>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {hasRewrite ? (
              <Button size="xs" onClick={() => onApply(suggestion)}>
                Use Updated
              </Button>
            ) : null}
            <Button size="xs" variant="ghost" onClick={() => onDismiss(suggestion)}>
              {hasRewrite ? "Keep Original" : "Dismiss"}
            </Button>
            {hasRewrite ? (
              <Badge variant="outline" className="ml-auto text-[10px] font-normal">
                Rewording only — no new facts
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
