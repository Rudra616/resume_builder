"use client";

import * as React from "react";
import type { useAssistant } from "@/hooks/useAssistant";

type Assistant = ReturnType<typeof useAssistant>;

const AssistantContext = React.createContext<Assistant | null>(null);

export function AssistantProvider({
  assistant,
  children,
}: {
  assistant: Assistant;
  children: React.ReactNode;
}) {
  return (
    <AssistantContext.Provider value={assistant}>{children}</AssistantContext.Provider>
  );
}

/**
 * Editor fields read the assistant from context so any field can show its own
 * "N suggestions" affordance without the forms having to thread props through.
 * Returns null outside the builder (e.g. in the import review screen).
 */
export function useAssistantContext(): Assistant | null {
  return React.useContext(AssistantContext);
}
