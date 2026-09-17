"use client";

import * as React from "react";
import { applyHistorySnapshot, useResumeStore } from "@/store/resumeStore";
import { useHistoryStore } from "@/store/historyStore";

/**
 * Wires the in-memory history stacks to the resume store and adds the standard
 * keyboard shortcuts. History is per-session only — there is no cloud versioning.
 */
export function useUndoRedo() {
  const canUndo = useHistoryStore((state) => state.past.length > 0);
  const canRedo = useHistoryStore((state) => state.future.length > 0);

  const undo = React.useCallback(() => {
    const current = useResumeStore.getState().resume;
    const target = useHistoryStore.getState().undo(current);
    if (target) applyHistorySnapshot(target);
    return Boolean(target);
  }, []);

  const redo = React.useCallback(() => {
    const current = useResumeStore.getState().resume;
    const target = useHistoryStore.getState().redo(current);
    if (target) applyHistorySnapshot(target);
    return Boolean(target);
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (!meta || event.key.toLowerCase() !== "z") return;

      // Let the browser handle undo inside a focused text field.
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      if (event.shiftKey) redo();
      else undo();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo]);

  return { canUndo, canRedo, undo, redo };
}
