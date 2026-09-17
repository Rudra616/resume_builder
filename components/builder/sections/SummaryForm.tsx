"use client";

import * as React from "react";
import { TextAreaField } from "@/components/builder/fields";
import { useResumeStore } from "@/store/resumeStore";
import { wordCount } from "@/lib/utils";

export function SummaryForm() {
  const summary = useResumeStore((state) => state.resume.summary);
  const setFieldByPath = useResumeStore((state) => state.setFieldByPath);

  const sentences = summary
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;

  return (
    <div className="space-y-2">
      <TextAreaField
        label="Professional summary"
        value={summary}
        onChange={(value) => setFieldByPath("summary", value)}
        fieldPath="summary"
        rows={6}
        showWordCount
        placeholder="React Native developer with four years building cross-platform apps…"
        guidance="Around 2–5 concise sentences reads best. Write in third person and lead with what you do."
      />
      {summary.trim() ? (
        <p className="text-[11px] text-muted-foreground">
          {sentences} {sentences === 1 ? "sentence" : "sentences"} · {wordCount(summary)}{" "}
          words
        </p>
      ) : null}
    </div>
  );
}
