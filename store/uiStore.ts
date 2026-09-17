"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type BuilderMobileTab = "edit" | "preview" | "assistant";

interface UIState {
  assistantOpen: boolean;
  mobileTab: BuilderMobileTab;
  activeEditorSection: string;
  zoom: number;
  setAssistantOpen: (open: boolean) => void;
  toggleAssistant: () => void;
  setMobileTab: (tab: BuilderMobileTab) => void;
  setActiveEditorSection: (section: string) => void;
  setZoom: (zoom: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      assistantOpen: true,
      mobileTab: "edit",
      activeEditorSection: "personal",
      zoom: 1,
      setAssistantOpen: (open) => set({ assistantOpen: open }),
      toggleAssistant: () => set((state) => ({ assistantOpen: !state.assistantOpen })),
      setMobileTab: (tab) => set({ mobileTab: tab }),
      setActiveEditorSection: (section) => set({ activeEditorSection: section }),
      setZoom: (zoom) => set({ zoom }),
    }),
    {
      name: "resumeforge.ui.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        assistantOpen: state.assistantOpen,
        zoom: state.zoom,
        activeEditorSection: state.activeEditorSection,
      }),
    },
  ),
);
