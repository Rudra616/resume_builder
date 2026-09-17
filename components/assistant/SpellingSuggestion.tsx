"use client";

import * as React from "react";
import { SpellCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Suggestion } from "@/types/suggestion";

/**
 * The compact spelling row: the flagged word with a wavy underline, the proposed
 * correction, and Accept / Ignore / Ignore All.
 */
export function SpellingSuggestion({
  suggestion,
  onAccept,
  onIgnore,
  onIgnoreAll,
  className,
}: {
  suggestion: Suggestion;
  onAccept: (suggestion: Suggestion) => void;
  onIgnore: (suggestion: Suggestion) => void;
  onIgnoreAll?: (word: string) => void;
  className?: string;
}) {
  const word = suggestion.original ?? "";
  // The detail text carries the correction; pull it out for a compact display.
  const corrected = suggestion.detail.match(/with “(.+?)”/)?.[1] ?? null;

  return (
    <div className={cn("rounded-lg border border-border bg-card p-3", className)}>
      <div className="flex items-start gap-2.5">
        <SpellCheck className="mt-0.5 size-4 shrink-0 text-[var(--severity-warning)]" />
        <div className="min-w-0 flex-1">
          <p className="text-[13px]">
            <span className="spell-underline font-medium">{word}</span>
            {corrected ? (
              <>
                <span className="mx-1.5 text-muted-foreground" aria-hidden>
                  →
                </span>
                <span className="font-medium text-[var(--severity-success)]">
                  {corrected}
                </span>
              </>
            ) : null}
          </p>
          <p className="mt-1 truncate text-[11px] text-muted-foreground">
            {suggestion.location}
          </p>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <Button size="xs" onClick={() => onAccept(suggestion)}>
              Accept
            </Button>
            <Button size="xs" variant="ghost" onClick={() => onIgnore(suggestion)}>
              Ignore
            </Button>
            {onIgnoreAll && word ? (
              <Button size="xs" variant="ghost" onClick={() => onIgnoreAll(word)}>
                Ignore All
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
