"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  createEmptyResume,
  mergeSectionOrder,
  normalizeResume,
} from "@/lib/resume-defaults";
import { getTemplate } from "@/lib/templates";
import { move, setByPath, uid } from "@/lib/utils";
import { useHistoryStore } from "@/store/historyStore";
import type {
  Confidence,
  CustomSection,
  ResumeData,
  ResumeDesign,
  SectionKey,
  TemplateId,
  UnclassifiedBlock,
} from "@/types/resume";
import type { ParseReport } from "@/types/parser";

export const RESUME_STORAGE_KEY = "resumeforge.draft.v1";

export interface PendingImport {
  resume: ResumeData;
  report: ParseReport;
}

interface ResumeState {
  resume: ResumeData;
  hasDraft: boolean;
  lastSavedAt: string | null;
  dismissedSuggestions: string[];
  ignoredWords: string[];
  /** Parsed-but-not-yet-accepted import, held in memory between routes. */
  pendingImport: PendingImport | null;

  // lifecycle
  hydrated: boolean;
  setHydrated: (value: boolean) => void;

  // whole-document operations
  replaceResume: (resume: ResumeData, options?: { recordHistory?: boolean }) => void;
  updateResume: (
    updater: (draft: ResumeData) => ResumeData,
    options?: { recordHistory?: boolean },
  ) => void;
  setFieldByPath: (path: string, value: unknown) => void;
  startBlankResume: (templateId?: TemplateId) => void;
  loadSample: () => void;
  clearResume: () => void;

  // import handoff
  setPendingImport: (payload: PendingImport | null) => void;
  acceptPendingImport: () => void;

  // design
  setTemplate: (templateId: TemplateId, applyDefaults?: boolean) => void;
  setDesign: (patch: Partial<ResumeDesign>) => void;

  // sections
  setSectionOrder: (order: SectionKey[]) => void;
  moveSection: (from: number, to: number) => void;
  toggleSection: (key: SectionKey, visible?: boolean) => void;
  addCustomSection: (heading?: string, items?: CustomSection["items"]) => string;
  removeCustomSection: (id: string) => void;

  // list helpers
  addListItem: <K extends ListKey>(key: K, item: ResumeData[K][number]) => void;
  updateListItem: <K extends ListKey>(
    key: K,
    id: string,
    patch: Partial<ResumeData[K][number]>,
  ) => void;
  removeListItem: (key: ListKey, id: string) => void;
  moveListItem: (key: ListKey, from: number, to: number) => void;

  // unclassified content
  removeUnclassified: (id: string) => void;
  setUnclassified: (blocks: UnclassifiedBlock[]) => void;

  // confidence
  setConfidence: (path: string, value: Confidence | null) => void;
  clearConfidence: (path?: string) => void;

  // suggestions
  dismissSuggestion: (dedupeKey: string) => void;
  restoreSuggestion: (dedupeKey: string) => void;
  clearDismissed: () => void;
  ignoreWord: (word: string) => void;
  clearIgnoredWords: () => void;
}

export type ListKey =
  | "experience"
  | "education"
  | "projects"
  | "skills"
  | "links"
  | "certifications"
  | "languages"
  | "awards"
  | "volunteering"
  | "references";

function touch(resume: ResumeData): ResumeData {
  return {
    ...resume,
    metadata: { ...resume.metadata, updatedAt: new Date().toISOString() },
  };
}

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => {
      /** Applies an update and pushes the previous state onto the undo stack. */
      const commit = (
        producer: (draft: ResumeData) => ResumeData,
        recordHistory = true,
      ) => {
        const previous = get().resume;
        if (recordHistory) {
          useHistoryStore.getState().push(previous);
        }
        const next = touch(producer(previous));
        set({
          resume: next,
          hasDraft: true,
          lastSavedAt: new Date().toISOString(),
        });
      };

      return {
        resume: createEmptyResume(),
        hasDraft: false,
        lastSavedAt: null,
        dismissedSuggestions: [],
        ignoredWords: [],
        pendingImport: null,
        hydrated: false,

        setHydrated: (value) => set({ hydrated: value }),

        replaceResume: (resume, options) =>
          commit(() => normalizeResume(resume), options?.recordHistory ?? true),

        updateResume: (updater, options) =>
          commit(updater, options?.recordHistory ?? true),

        setFieldByPath: (path, value) =>
          commit((draft) => setByPath(draft, path, value)),

        startBlankResume: (templateId) => {
          useHistoryStore.getState().reset();
          set({
            resume: createEmptyResume(templateId),
            hasDraft: true,
            lastSavedAt: new Date().toISOString(),
            dismissedSuggestions: [],
            ignoredWords: [],
            pendingImport: null,
          });
        },

        loadSample: () => {
          // Imported lazily to keep the sample out of the initial store payload.
          import("@/lib/sample-resume").then(({ sampleResumeForPreview }) => {
            useHistoryStore.getState().reset();
            set({
              resume: normalizeResume(sampleResumeForPreview()),
              hasDraft: true,
              lastSavedAt: new Date().toISOString(),
            });
          });
        },

        clearResume: () => {
          useHistoryStore.getState().reset();
          set({
            resume: createEmptyResume(),
            hasDraft: false,
            lastSavedAt: null,
            dismissedSuggestions: [],
            ignoredWords: [],
            pendingImport: null,
          });
        },

        setPendingImport: (payload) => set({ pendingImport: payload }),

        acceptPendingImport: () => {
          const pending = get().pendingImport;
          if (!pending) return;
          useHistoryStore.getState().reset();
          set({
            resume: normalizeResume({
              ...pending.resume,
              metadata: { ...pending.resume.metadata, reviewCompleted: true },
            }),
            hasDraft: true,
            lastSavedAt: new Date().toISOString(),
            dismissedSuggestions: [],
            pendingImport: null,
          });
        },

        setTemplate: (templateId, applyDefaults = true) =>
          commit((draft) => {
            const template = getTemplate(templateId);
            const design: ResumeDesign = applyDefaults
              ? { ...draft.design, ...template.defaults, templateId }
              : { ...draft.design, templateId };
            return { ...draft, design };
          }),

        setDesign: (patch) =>
          commit((draft) => ({ ...draft, design: { ...draft.design, ...patch } })),

        setSectionOrder: (order) =>
          commit((draft) => ({
            ...draft,
            sectionOrder: order.map((key) => {
              const existing = draft.sectionOrder.find((entry) => entry.key === key);
              return { key, visible: existing?.visible ?? true };
            }),
          })),

        moveSection: (from, to) =>
          commit((draft) => ({
            ...draft,
            sectionOrder: move(draft.sectionOrder, from, to),
          })),

        toggleSection: (key, visible) =>
          commit((draft) => ({
            ...draft,
            sectionOrder: draft.sectionOrder.map((entry) =>
              entry.key === key
                ? { ...entry, visible: visible ?? !entry.visible }
                : entry,
            ),
          })),

        addCustomSection: (heading = "Custom Section", items) => {
          const id = uid("cst");
          commit((draft) => {
            const section: CustomSection = {
              id,
              heading,
              items:
                items && items.length > 0
                  ? items
                  : [
                      {
                        id: uid("cstitem"),
                        title: "",
                        subtitle: "",
                        date: "",
                        description: "",
                        bullets: [],
                      },
                    ],
            };
            const customSections = [...draft.customSections, section];
            return {
              ...draft,
              customSections,
              sectionOrder: mergeSectionOrder(draft.sectionOrder, customSections),
            };
          });
          return id;
        },

        removeCustomSection: (id) =>
          commit((draft) => ({
            ...draft,
            customSections: draft.customSections.filter((section) => section.id !== id),
            sectionOrder: draft.sectionOrder.filter(
              (entry) => entry.key !== `custom:${id}`,
            ),
          })),

        addListItem: (key, item) =>
          commit((draft) => ({
            ...draft,
            [key]: [...(draft[key] as unknown[]), item],
          })),

        updateListItem: (key, id, patch) =>
          commit((draft) => ({
            ...draft,
            [key]: (draft[key] as { id: string }[]).map((entry) =>
              entry.id === id ? { ...entry, ...patch } : entry,
            ),
          })),

        removeListItem: (key, id) =>
          commit((draft) => ({
            ...draft,
            [key]: (draft[key] as { id: string }[]).filter((entry) => entry.id !== id),
          })),

        moveListItem: (key, from, to) =>
          commit((draft) => ({
            ...draft,
            [key]: move(draft[key] as unknown[], from, to),
          })),

        removeUnclassified: (id) =>
          commit((draft) => ({
            ...draft,
            unclassifiedContent: draft.unclassifiedContent.filter(
              (block) => block.id !== id,
            ),
          })),

        setUnclassified: (blocks) =>
          commit((draft) => ({ ...draft, unclassifiedContent: blocks })),

        setConfidence: (path, value) =>
          commit((draft) => {
            const confidence = { ...draft.confidence };
            if (value === null) delete confidence[path];
            else confidence[path] = value;
            return { ...draft, confidence };
          }, false),

        clearConfidence: (path) =>
          commit((draft) => {
            if (!path) return { ...draft, confidence: {} };
            const confidence = { ...draft.confidence };
            delete confidence[path];
            return { ...draft, confidence };
          }, false),

        dismissSuggestion: (dedupeKey) =>
          set((state) =>
            state.dismissedSuggestions.includes(dedupeKey)
              ? state
              : { dismissedSuggestions: [...state.dismissedSuggestions, dedupeKey] },
          ),

        restoreSuggestion: (dedupeKey) =>
          set((state) => ({
            dismissedSuggestions: state.dismissedSuggestions.filter(
              (key) => key !== dedupeKey,
            ),
          })),

        clearDismissed: () => set({ dismissedSuggestions: [] }),

        ignoreWord: (word) =>
          set((state) => {
            const normalized = word.toLowerCase();
            return state.ignoredWords.includes(normalized)
              ? state
              : { ignoredWords: [...state.ignoredWords, normalized] };
          }),

        clearIgnoredWords: () => set({ ignoredWords: [] }),
      };
    },
    {
      name: RESUME_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        resume: state.resume,
        hasDraft: state.hasDraft,
        lastSavedAt: state.lastSavedAt,
        dismissedSuggestions: state.dismissedSuggestions,
        ignoredWords: state.ignoredWords,
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<ResumeState>;
        return {
          ...current,
          ...saved,
          resume: normalizeResume(saved.resume),
          pendingImport: null,
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);

/** Restores a state captured by the history store. */
export function applyHistorySnapshot(resume: ResumeData) {
  useResumeStore.setState({
    resume: normalizeResume(resume),
    lastSavedAt: new Date().toISOString(),
  });
}
