"use client";

import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useResumeStore } from "@/store/resumeStore";
import { isNonEmpty } from "@/lib/utils";

/** Shown only when a locally saved draft already exists. */
export function DraftBanner() {
  const hydrated = useResumeStore((state) => state.hydrated);
  const hasDraft = useResumeStore((state) => state.hasDraft);
  const resume = useResumeStore((state) => state.resume);

  if (!hydrated || !hasDraft) return null;

  const name = resume.personalInfo.fullName;
  const source = resume.metadata.source;
  const label = isNonEmpty(name) ? `${name}'s resume` : "Untitled resume";
  const origin =
    source === "blank"
      ? "Started from scratch"
      : source === "sample"
        ? "Sample content"
        : `Imported from ${resume.metadata.importedFileName ?? source.toUpperCase()}`;

  return (
    <div className="mx-auto mb-8 flex max-w-3xl flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
          <Clock className="size-4 text-muted-foreground" />
        </span>
        <div>
          <p className="text-sm font-medium">Continue where you left off</p>
          <p className="text-xs text-muted-foreground">
            {label} · {origin} · saved locally
          </p>
        </div>
      </div>
      <Button size="sm" asChild className="shrink-0">
        <Link href="/builder">
          Open builder
          <ArrowRight />
        </Link>
      </Button>
    </div>
  );
}
