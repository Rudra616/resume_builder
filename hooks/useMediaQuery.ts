"use client";

import * as React from "react";

/**
 * Subscribes to a media query. Returns null during server rendering and the
 * first client render, so callers can avoid committing a layout that would be
 * replaced immediately after hydration.
 */
export function useMediaQuery(query: string): boolean | null {
  const subscribe = React.useCallback(
    (onStoreChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onStoreChange);
      return () => list.removeEventListener("change", onStoreChange);
    },
    [query],
  );

  return React.useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches as boolean | null,
    () => null,
  );
}
