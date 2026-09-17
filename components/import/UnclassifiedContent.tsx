"use client";

import * as React from "react";
import { FileQuestion, FolderPlus, MoveRight, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UNCLASSIFIED_DESTINATIONS,
  moveUnclassifiedBlock,
  type UnclassifiedDestination,
} from "@/lib/unclassified";
import type { ResumeData } from "@/types/resume";

/**
 * Content the parser could not confidently categorise is shown here rather than
 * being silently dropped. The user decides where each block belongs.
 */
export function UnclassifiedContent({
  resume,
  onChange,
}: {
  resume: ResumeData;
  onChange: (next: ResumeData) => void;
}) {
  const blocks = resume.unclassifiedContent;
  const [choices, setChoices] = React.useState<Record<string, UnclassifiedDestination>>(
    {},
  );

  if (blocks.length === 0) return null;

  return (
    <Card className="border-[color-mix(in_srgb,var(--severity-warning)_35%,transparent)]">
      <CardContent className="p-5 pt-5">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--severity-warning-bg)]">
            <FileQuestion className="size-4 text-[var(--severity-warning)]" />
          </span>
          <div>
            <h3 className="font-semibold">Other content we found</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              We found some content that we couldn&apos;t confidently categorize. Nothing
              here has been deleted — tell us where it belongs, or ignore it.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {blocks.map((block) => (
            <div
              key={block.id}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                {block.heading ? (
                  <Badge variant="outline">{block.heading}</Badge>
                ) : (
                  <Badge variant="secondary">Unlabelled block</Badge>
                )}
                <span className="text-xs text-muted-foreground">
                  {block.lines.length} {block.lines.length === 1 ? "line" : "lines"}
                  {block.page ? ` · page ${block.page}` : ""}
                </span>
              </div>

              <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                {block.lines.slice(0, 6).map((line, index) => (
                  <li key={index} className="line-clamp-2">
                    {line}
                  </li>
                ))}
                {block.lines.length > 6 ? (
                  <li className="text-xs italic">
                    …and {block.lines.length - 6} more lines
                  </li>
                ) : null}
              </ul>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Select
                  value={choices[block.id] ?? ""}
                  onValueChange={(value) =>
                    setChoices((current) => ({
                      ...current,
                      [block.id]: value as UnclassifiedDestination,
                    }))
                  }
                >
                  <SelectTrigger size="sm" className="w-[190px]">
                    <SelectValue placeholder="Move to another section" />
                  </SelectTrigger>
                  <SelectContent>
                    {UNCLASSIFIED_DESTINATIONS.map((destination) => (
                      <SelectItem key={destination.value} value={destination.value}>
                        {destination.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  variant="outline"
                  disabled={!choices[block.id]}
                  onClick={() =>
                    onChange(moveUnclassifiedBlock(resume, block, choices[block.id]))
                  }
                >
                  <MoveRight />
                  Move
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onChange(moveUnclassifiedBlock(resume, block, "custom"))}
                >
                  <FolderPlus />
                  Add as custom section
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onChange(moveUnclassifiedBlock(resume, block, "ignore"))}
                >
                  <X />
                  Ignore
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
