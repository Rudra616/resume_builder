"use client";

import * as React from "react";
import { ChevronDown, FileQuestion, FolderPlus, MoveRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  UNCLASSIFIED_DESTINATIONS,
  moveUnclassifiedBlock,
  type UnclassifiedDestination,
} from "@/lib/unclassified";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";

/**
 * Imported text that never got categorised follows the user into the builder, so
 * it can still be placed (or dismissed) after the review step.
 */
export function UnclassifiedPanel({ className }: { className?: string }) {
  const blocks = useResumeStore((state) => state.resume.unclassifiedContent);
  const updateResume = useResumeStore((state) => state.updateResume);
  const [open, setOpen] = React.useState(false);
  const [choice, setChoice] = React.useState<Record<string, UnclassifiedDestination>>({});

  if (blocks.length === 0) return null;

  const apply = (blockId: string, destination: UnclassifiedDestination) => {
    updateResume((draft) => {
      const block = draft.unclassifiedContent.find((entry) => entry.id === blockId);
      if (!block) return draft;
      return moveUnclassifiedBlock(draft, block, destination);
    });
    if (destination !== "ignore") {
      toast.success("Content moved", "Undo is available in the top bar.");
    }
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-[color-mix(in_srgb,var(--severity-warning)_35%,transparent)] bg-[var(--severity-warning-bg)]/40",
        className,
      )}
    >
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <FileQuestion className="size-4 shrink-0 text-[var(--severity-warning)]" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium">
            {blocks.length} uncategorised{" "}
            {blocks.length === 1 ? "block" : "blocks"} from your import
          </span>
          <span className="block text-[11px] text-muted-foreground">
            Nothing was deleted. Place it, or ignore it.
          </span>
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="space-y-2 px-3 pb-3">
          {blocks.map((block) => (
            <div key={block.id} className="rounded-md border border-border bg-card p-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {block.heading ? (
                  <Badge variant="outline" className="text-[10px]">
                    {block.heading}
                  </Badge>
                ) : null}
                <span className="text-[11px] text-muted-foreground">
                  {block.lines.length} {block.lines.length === 1 ? "line" : "lines"}
                </span>
              </div>

              <ul className="mt-1.5 space-y-0.5 text-[11px] leading-relaxed text-muted-foreground">
                {block.lines.slice(0, 3).map((line, index) => (
                  <li key={index} className="line-clamp-1">
                    {line}
                  </li>
                ))}
                {block.lines.length > 3 ? (
                  <li className="italic">…{block.lines.length - 3} more</li>
                ) : null}
              </ul>

              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <select
                  aria-label="Destination section"
                  value={choice[block.id] ?? ""}
                  onChange={(event) =>
                    setChoice((current) => ({
                      ...current,
                      [block.id]: event.target.value as UnclassifiedDestination,
                    }))
                  }
                  className="h-7 rounded-md border border-input bg-transparent px-1.5 text-[11px] outline-none focus-visible:border-ring"
                >
                  <option value="">Move to…</option>
                  {UNCLASSIFIED_DESTINATIONS.map((destination) => (
                    <option key={destination.value} value={destination.value}>
                      {destination.label.replace("Move to ", "")}
                    </option>
                  ))}
                </select>

                <Button
                  size="xs"
                  variant="outline"
                  disabled={!choice[block.id]}
                  onClick={() => apply(block.id, choice[block.id])}
                >
                  <MoveRight />
                  Move
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => apply(block.id, "custom")}
                >
                  <FolderPlus />
                  Custom section
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => apply(block.id, "ignore")}
                >
                  <X />
                  Ignore
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
