"use client";

import * as React from "react";
import { create } from "zustand";
import { CheckCircle2, Info, TriangleAlert, Undo2, X } from "lucide-react";
import { cn, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ToastTone = "default" | "success" | "warning" | "error";

interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
  action?: ToastAction;
  duration: number;
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, "id" | "tone" | "duration"> & {
    tone?: ToastTone;
    duration?: number;
  }) => string;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  push: ({ tone = "default", duration = 5000, ...rest }) => {
    const id = uid("toast");
    set((state) => ({ toasts: [...state.toasts, { id, tone, duration, ...rest }] }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** Imperative helper usable outside of React components. */
export const toast = {
  show: (options: Parameters<ToastState["push"]>[0]) => useToastStore.getState().push(options),
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, tone: "success" }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, tone: "error", duration: 7000 }),
  warning: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, tone: "warning" }),
};

const TONE_ICON: Record<ToastTone, React.ComponentType<{ className?: string }>> = {
  default: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: TriangleAlert,
};

const TONE_CLASS: Record<ToastTone, string> = {
  default: "text-[var(--severity-suggestion)]",
  success: "text-[var(--severity-success)]",
  warning: "text-[var(--severity-warning)]",
  error: "text-[var(--severity-error)]",
};

function Toast({ item }: { item: ToastItem }) {
  const dismiss = useToastStore((state) => state.dismiss);
  const Icon = TONE_ICON[item.tone];

  React.useEffect(() => {
    if (item.duration <= 0) return;
    const timer = window.setTimeout(() => dismiss(item.id), item.duration);
    return () => window.clearTimeout(timer);
  }, [dismiss, item.duration, item.id]);

  return (
    <div
      role="status"
      className="animate-in slide-in-from-bottom-3 fade-in pointer-events-auto flex w-[min(24rem,calc(100vw-2rem))] items-start gap-3 rounded-xl border border-border bg-card p-3.5 shadow-lg"
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", TONE_CLASS[item.tone])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{item.title}</p>
        {item.description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            {item.description}
          </p>
        ) : null}
        {item.action ? (
          <Button
            variant="outline"
            size="xs"
            className="mt-2"
            onClick={() => {
              item.action?.onClick();
              dismiss(item.id);
            }}
          >
            <Undo2 className="size-3" />
            {item.action.label}
          </Button>
        ) : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => dismiss(item.id)}
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  return (
    <div className="print-hidden pointer-events-none fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2 sm:right-4 sm:left-auto sm:translate-x-0 sm:items-end">
      {toasts.map((item) => (
        <Toast key={item.id} item={item} />
      ))}
    </div>
  );
}
