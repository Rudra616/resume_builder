"use client";

import * as React from "react";
import {
  CheckCheck,
  CircleAlert,
  Copy,
  Info,
  Layers,
  Link2,
  ListChecks,
  PanelRightClose,
  RotateCcw,
  Sparkles,
  SpellCheck,
  TriangleAlert,
  Wand2,
} from "lucide-react";
import { ContentSuggestion } from "@/components/assistant/ContentSuggestion";
import { ResumeHealth } from "@/components/assistant/ResumeHealth";
import { SpellingSuggestion } from "@/components/assistant/SpellingSuggestion";
import { SuggestionCard } from "@/components/assistant/SuggestionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PROVIDER_DISCLOSURE } from "@/lib/resume-assistant/suggestionProvider";
import { cn } from "@/lib/utils";
import type { useAssistant } from "@/hooks/useAssistant";
import type { Suggestion } from "@/types/suggestion";

type Assistant = ReturnType<typeof useAssistant>;

export function AssistantPanel({
  assistant,
  onCollapse,
  className,
}: {
  assistant: Assistant;
  onCollapse?: () => void;
  className?: string;
}) {
  const {
    health,
    grouped,
    applySuggestion,
    applyAllSafeFixes,
    dismiss,
    ignoreAllOfWord,
    restoreDismissed,
    dismissedCount,
    safeFixCount,
  } = assistant;

  const spelling = grouped.writing.filter((item) => item.category === "spelling");
  const spellingWarnings = grouped.warnings.filter(
    (item) => item.category === "spelling",
  );
  const allSpelling = [...spellingWarnings, ...spelling];

  const writing = grouped.writing.filter((item) => item.category !== "spelling");
  const otherWarnings = grouped.warnings.filter(
    (item) => item.category !== "spelling" && item.category !== "duplicate",
  );

  const totalIssues =
    grouped.critical.length +
    grouped.warnings.length +
    writing.length +
    grouped.formatting.length +
    grouped.missing.length +
    grouped.links.length +
    grouped.duplicates.length;

  return (
    <aside
      className={cn(
        "flex min-h-0 flex-col border-l border-border bg-background",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Resume Assistant</h2>
          {totalIssues > 0 ? (
            <Badge variant="secondary" className="tabular-nums">
              {totalIssues}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="About these suggestions"
                className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Info className="size-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-72">
              {PROVIDER_DISCLOSURE.summary} {PROVIDER_DISCLOSURE.detail}
            </TooltipContent>
          </Tooltip>
          {onCollapse ? (
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Collapse assistant"
              onClick={onCollapse}
            >
              <PanelRightClose />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim px-4 py-4">
        <ResumeHealth health={health} />

        {safeFixCount > 0 ? (
          <Button variant="outline" className="mt-3 w-full" onClick={applyAllSafeFixes}>
            <CheckCheck />
            Apply All Safe Fixes ({safeFixCount})
          </Button>
        ) : null}

        {safeFixCount > 0 ? (
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            Safe fixes only correct spelling, capitalisation and spacing. Anything that
            changes your wording stays a manual choice.
          </p>
        ) : null}

        <Group
          title="Critical issues"
          icon={CircleAlert}
          count={grouped.critical.length}
          emptyLabel="No blocking problems."
        >
          {grouped.critical.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={applySuggestion}
              onDismiss={dismiss}
            />
          ))}
        </Group>

        <Group
          title="Spelling"
          icon={SpellCheck}
          count={allSpelling.length}
          emptyLabel="No spelling issues detected."
        >
          {allSpelling.map((suggestion) => (
            <SpellingSuggestion
              key={suggestion.id}
              suggestion={suggestion}
              onAccept={applySuggestion}
              onIgnore={dismiss}
              onIgnoreAll={ignoreAllOfWord}
            />
          ))}
        </Group>

        <Group
          title="Writing suggestions"
          icon={Wand2}
          count={writing.length}
          emptyLabel="Nothing to improve right now."
        >
          {writing.map((suggestion) => (
            <ContentSuggestion
              key={suggestion.id}
              suggestion={suggestion}
              onApply={applySuggestion}
              onDismiss={dismiss}
            />
          ))}
        </Group>

        <Group
          title="Duplicated content"
          icon={Copy}
          count={grouped.duplicates.length}
          emptyLabel="No duplicated content."
        >
          {grouped.duplicates.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onDismiss={dismiss}
            />
          ))}
        </Group>

        <Group
          title="Content warnings"
          icon={TriangleAlert}
          count={otherWarnings.length}
          emptyLabel="No warnings."
        >
          {otherWarnings.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={applySuggestion}
              onDismiss={dismiss}
            />
          ))}
        </Group>

        <Group
          title="Formatting"
          icon={Layers}
          count={grouped.formatting.length}
          emptyLabel="Formatting is consistent."
        >
          {grouped.formatting.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={applySuggestion}
              onDismiss={dismiss}
            />
          ))}
        </Group>

        <Group
          title="Links"
          icon={Link2}
          count={grouped.links.length}
          emptyLabel="Links look fine."
        >
          {grouped.links.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={applySuggestion}
              onDismiss={dismiss}
            />
          ))}
        </Group>

        <Group
          title="Missing information"
          icon={ListChecks}
          count={grouped.missing.length}
          emptyLabel="Nothing obvious is missing."
        >
          {grouped.missing.map((suggestion) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              onApply={applySuggestion}
              onDismiss={dismiss}
            />
          ))}
        </Group>

        {grouped.successes.length > 0 ? (
          <Group title="Confirmed" icon={CheckCheck} count={grouped.successes.length}>
            {grouped.successes.map((suggestion) => (
              <SuggestionCard key={suggestion.id} suggestion={suggestion} compact />
            ))}
          </Group>
        ) : null}

        {dismissedCount > 0 ? (
          <>
            <Separator className="my-4" />
            <Button variant="ghost" size="sm" className="w-full" onClick={restoreDismissed}>
              <RotateCcw />
              Restore {dismissedCount} dismissed{" "}
              {dismissedCount === 1 ? "suggestion" : "suggestions"}
            </Button>
          </>
        ) : null}

        <p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">
          {PROVIDER_DISCLOSURE.summary} No suggestion ever adds a metric, technology or
          claim you didn&apos;t write yourself.
        </p>
      </div>
    </aside>
  );
}

function Group({
  title,
  icon: Icon,
  count,
  emptyLabel,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  count: number;
  emptyLabel?: string;
  children?: React.ReactNode;
}) {
  if (count === 0 && !emptyLabel) return null;

  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="size-3.5 text-muted-foreground" />
        <h3 className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {title}
        </h3>
        {count > 0 ? (
          <Badge variant="secondary" className="tabular-nums">
            {count}
          </Badge>
        ) : null}
      </div>
      {count === 0 ? (
        <p className="text-xs text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </section>
  );
}

/** Compact list used inside the mobile assistant tab and field popovers. */
export function SuggestionList({
  suggestions,
  onApply,
  onDismiss,
  onIgnoreWord,
}: {
  suggestions: Suggestion[];
  onApply: (suggestion: Suggestion) => void;
  onDismiss: (suggestion: Suggestion) => void;
  onIgnoreWord?: (word: string) => void;
}) {
  if (suggestions.length === 0) {
    return <p className="text-xs text-muted-foreground">No suggestions for this field.</p>;
  }

  return (
    <div className="space-y-2">
      {suggestions.map((suggestion) => (
        <SuggestionCard
          key={suggestion.id}
          suggestion={suggestion}
          onApply={onApply}
          onDismiss={onDismiss}
          onIgnoreWord={onIgnoreWord}
        />
      ))}
    </div>
  );
}
