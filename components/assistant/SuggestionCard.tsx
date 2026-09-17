"use client";

import * as React from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Suggestion, SuggestionSeverity } from "@/types/suggestion";

const SEVERITY_META: Record<
  SuggestionSeverity,
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  error: {
    icon: CircleAlert,
    label: "Error",
    color: "text-[var(--severity-error)]",
    bg: "bg-[var(--severity-error-bg)]",
    border: "border-[color-mix(in_srgb,var(--severity-error)_28%,transparent)]",
  },
  warning: {
    icon: TriangleAlert,
    label: "Warning",
    color: "text-[var(--severity-warning)]",
    bg: "bg-[var(--severity-warning-bg)]",
    border: "border-[color-mix(in_srgb,var(--severity-warning)_28%,transparent)]",
  },
  suggestion: {
    icon: Info,
    label: "Suggestion",
    color: "text-[var(--severity-suggestion)]",
    bg: "bg-[var(--severity-suggestion-bg)]",
    border: "border-[color-mix(in_srgb,var(--severity-suggestion)_25%,transparent)]",
  },
  success: {
    icon: CircleCheck,
    label: "Looks good",
    color: "text-[var(--severity-success)]",
    bg: "bg-[var(--severity-success-bg)]",
    border: "border-[color-mix(in_srgb,var(--severity-success)_25%,transparent)]",
  },
};

/**
 * One suggestion. Nothing here changes the resume until the user presses Apply,
 * and every applied change can be undone from the toast or the top bar.
 */
export function SuggestionCard({
  suggestion,
  onApply,
  onDismiss,
  onIgnoreWord,
  compact,
}: {
  suggestion: Suggestion;
  onApply?: (suggestion: Suggestion) => void;
  onDismiss?: (suggestion: Suggestion) => void;
  onIgnoreWord?: (word: string) => void;
  compact?: boolean;
}) {
  const meta = SEVERITY_META[suggestion.severity];
  const Icon = meta.icon;
  const canApply = Boolean(suggestion.fix && suggestion.fieldPath && onApply);
  const [showDiff, setShowDiff] = React.useState(false);

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        meta.border,
        suggestion.severity === "success" ? meta.bg : "bg-card",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Icon className={cn("mt-0.5 size-4 shrink-0", meta.color)} />

        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug font-medium">{suggestion.title}</p>

          {!compact ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {suggestion.detail}
            </p>
          ) : null}

          <p className="mt-1.5 truncate text-[11px] text-muted-foreground">
            {suggestion.location}
          </p>

          {/* Original vs updated, so the user can see exactly what changes. */}
          {canApply && showDiff && suggestion.original ? (
            <div className="mt-2.5 space-y-2 rounded-md bg-secondary/70 p-2.5 text-xs">
              <div>
                <p className="mb-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Original
                </p>
                <p className="leading-relaxed">{suggestion.original}</p>
              </div>
              <div>
                <p className="mb-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Updated
                </p>
                <p className="leading-relaxed">{suggestion.fix?.replacement}</p>
              </div>
            </div>
          ) : null}

          {suggestion.severity !== "success" ? (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {canApply ? (
                <>
                  <Button size="xs" onClick={() => onApply?.(suggestion)}>
                    {suggestion.fix?.safe ? "Apply" : "Use Updated"}
                  </Button>
                  {suggestion.original && suggestion.original !== suggestion.fix?.replacement ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => setShowDiff((value) => !value)}
                    >
                      {showDiff ? "Hide comparison" : "Compare"}
                    </Button>
                  ) : null}
                </>
              ) : null}

              {onDismiss ? (
                <Button size="xs" variant="ghost" onClick={() => onDismiss(suggestion)}>
                  {canApply ? "Keep Original" : "Dismiss"}
                </Button>
              ) : null}

              {onIgnoreWord && suggestion.category === "spelling" && suggestion.original ? (
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => onIgnoreWord(suggestion.original as string)}
                >
                  Ignore All
                </Button>
              ) : null}

              {!suggestion.fix?.safe && canApply ? (
                <Badge variant="outline" className="ml-auto text-[10px] font-normal">
                  Changes wording
                </Badge>
              ) : null}
            </div>
          ) : null}
        </div>

        {onDismiss && suggestion.severity === "success" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Dismiss"
            onClick={() => onDismiss(suggestion)}
          >
            <X />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export { SEVERITY_META };
