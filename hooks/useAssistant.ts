"use client";

import * as React from "react";
import { toast } from "@/components/ui/toast";
import { createSuggestionProvider } from "@/lib/resume-assistant/suggestionProvider";
import { safeFixes } from "@/lib/resume-assistant/suggestions";
import { getByPath, setByPath } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import type { ResumeData } from "@/types/resume";
import type { Suggestion } from "@/types/suggestion";

/**
 * Runs the local rule provider over the current resume and exposes the actions
 * the assistant UI needs. Analysis is debounced so typing stays responsive.
 */
export function useAssistant() {
  const resume = useResumeStore((state) => state.resume);
  const dismissed = useResumeStore((state) => state.dismissedSuggestions);
  const ignoredWords = useResumeStore((state) => state.ignoredWords);
  const dismissSuggestion = useResumeStore((state) => state.dismissSuggestion);
  const clearDismissed = useResumeStore((state) => state.clearDismissed);
  const ignoreWord = useResumeStore((state) => state.ignoreWord);
  const setFieldByPath = useResumeStore((state) => state.setFieldByPath);
  const updateResume = useResumeStore((state) => state.updateResume);
  const { undo } = useUndoRedo();

  const [debouncedResume, setDebouncedResume] = React.useState(resume);

  React.useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedResume(resume), 280);
    return () => window.clearTimeout(timer);
  }, [resume]);

  const analysis = React.useMemo(() => {
    const provider = createSuggestionProvider(ignoredWords);
    return provider.analyzeAll(debouncedResume);
  }, [debouncedResume, ignoredWords]);

  const dismissedSet = React.useMemo(() => new Set(dismissed), [dismissed]);

  const visible = React.useMemo(
    () => analysis.suggestions.filter((item) => !dismissedSet.has(item.dedupeKey)),
    [analysis.suggestions, dismissedSet],
  );

  const grouped = React.useMemo(() => {
    const critical = visible.filter((item) => item.severity === "error");
    const warnings = visible.filter((item) => item.severity === "warning");
    const writing = visible.filter(
      (item) =>
        item.severity === "suggestion" &&
        (item.category === "writing" ||
          item.category === "grammar" ||
          item.category === "spelling"),
    );
    const formatting = visible.filter(
      (item) =>
        item.severity === "suggestion" &&
        (item.category === "formatting" || item.category === "consistency"),
    );
    const missing = visible.filter(
      (item) => item.severity === "suggestion" && item.category === "completeness",
    );
    const duplicates = visible.filter((item) => item.category === "duplicate");
    const successes = visible.filter((item) => item.severity === "success");
    const links = visible.filter(
      (item) => item.severity === "suggestion" && item.category === "links",
    );

    return {
      critical,
      warnings,
      writing,
      formatting,
      missing,
      duplicates,
      links,
      successes,
    };
  }, [visible]);

  /** Suggestions attached to one field, for the inline field badge. */
  const forField = React.useCallback(
    (fieldPath: string) =>
      visible.filter(
        (item) => item.fieldPath === fieldPath && item.severity !== "success",
      ),
    [visible],
  );

  const applySuggestion = React.useCallback(
    (suggestion: Suggestion) => {
      if (!suggestion.fix || !suggestion.fieldPath) return;

      const before = getByPath(useResumeStore.getState().resume, suggestion.fieldPath);
      setFieldByPath(suggestion.fieldPath, suggestion.fix.replacement);

      toast.show({
        title: "Suggestion applied",
        description: suggestion.title,
        tone: "success",
        action: {
          label: "Undo",
          onClick: () => {
            // Prefer the history stack so the whole edit is reverted atomically.
            if (!undo() && suggestion.fieldPath) {
              setFieldByPath(suggestion.fieldPath, before);
            }
          },
        },
      });
    },
    [setFieldByPath, undo],
  );

  const applyAllSafeFixes = React.useCallback(() => {
    const candidates = safeFixes(visible);
    if (candidates.length === 0) {
      toast.show({ title: "No safe fixes to apply" });
      return;
    }

    // Applying in one commit keeps undo to a single step. Each path is applied
    // once, because a second fix for the same field would be computed against
    // stale text.
    const seen = new Set<string>();
    updateResume((draft) => {
      let next: ResumeData = draft;
      for (const suggestion of candidates) {
        const path = suggestion.fieldPath;
        if (!path || seen.has(path) || !suggestion.fix) continue;
        seen.add(path);
        next = setByPath(next, path, suggestion.fix.replacement);
      }
      return next;
    });

    toast.show({
      title: `Applied ${seen.size} safe ${seen.size === 1 ? "fix" : "fixes"}`,
      description: "Spelling, casing and formatting only — no wording was changed.",
      tone: "success",
      action: { label: "Undo", onClick: () => undo() },
    });
  }, [undo, updateResume, visible]);

  const dismiss = React.useCallback(
    (suggestion: Suggestion) => {
      dismissSuggestion(suggestion.dedupeKey);
    },
    [dismissSuggestion],
  );

  const ignoreAllOfWord = React.useCallback(
    (word: string) => {
      ignoreWord(word);
      toast.show({
        title: `Ignoring “${word}”`,
        description: "It won't be flagged again in this resume.",
      });
    },
    [ignoreWord],
  );

  return {
    health: analysis.health,
    suggestions: visible,
    grouped,
    forField,
    applySuggestion,
    applyAllSafeFixes,
    dismiss,
    ignoreAllOfWord,
    restoreDismissed: clearDismissed,
    dismissedCount: dismissed.length,
    safeFixCount: safeFixes(visible).length,
    /** True while the debounced analysis is behind the current resume. */
    isStale: debouncedResume !== resume,
  };
}
