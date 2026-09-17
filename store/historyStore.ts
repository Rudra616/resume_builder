"use client";

import { create } from "zustand";
import type { ResumeData } from "@/types/resume";

const MAX_HISTORY = 50;

/**
 * Lightweight in-session undo/redo. Snapshots live in memory only — there is no
 * database and no permanent cloud versioning.
 *
 * This store deliberately knows nothing about the resume store so the two can
 * import in one direction only.
 */
interface HistoryState {
  past: ResumeData[];
  future: ResumeData[];
  /** Records the state that existed *before* an edit. */
  push: (snapshot: ResumeData) => void;
  /** Returns the state to restore, moving `current` onto the redo stack. */
  undo: (current: ResumeData) => ResumeData | null;
  redo: (current: ResumeData) => ResumeData | null;
  reset: () => void;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  past: [],
  future: [],

  push: (snapshot) =>
    set((state) => {
      const past = [...state.past, snapshot];
      return {
        past: past.length > MAX_HISTORY ? past.slice(past.length - MAX_HISTORY) : past,
        future: [],
      };
    }),

  undo: (current) => {
    const { past, future } = get();
    if (past.length === 0) return null;
    const previous = past[past.length - 1];
    set({ past: past.slice(0, -1), future: [current, ...future].slice(0, MAX_HISTORY) });
    return previous;
  },

  redo: (current) => {
    const { past, future } = get();
    if (future.length === 0) return null;
    const next = future[0];
    set({ past: [...past, current].slice(-MAX_HISTORY), future: future.slice(1) });
    return next;
  },

  reset: () => set({ past: [], future: [] }),
}));
