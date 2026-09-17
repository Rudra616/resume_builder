import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let counter = 0;

/** Stable-enough unique id that works in both the browser and during SSR. */
export function uid(prefix = "id"): string {
  counter += 1;
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}_${random}${counter.toString(36)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value >= 10 || i === 0 ? Math.round(value) : value.toFixed(1)} ${units[i]}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function isNonEmpty(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function titleCase(text: string): string {
  const minor = new Set([
    "a",
    "an",
    "and",
    "as",
    "at",
    "but",
    "by",
    "for",
    "in",
    "nor",
    "of",
    "on",
    "or",
    "the",
    "to",
    "with",
  ]);
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && minor.has(word)) return word;
      // Hyphenated and O'Brien-style names capitalise on both sides.
      return word.replace(/(^|[-'’])([a-z])/g, (_, prefix, letter) =>
        `${prefix}${letter.toUpperCase()}`,
      );
    })
    .join(" ");
}

/** Reads a nested value using a dotted path such as `experience.0.role`. */
export function getByPath(target: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc === null || acc === undefined) return undefined;
    if (Array.isArray(acc)) return acc[Number(key)];
    if (typeof acc === "object") return (acc as Record<string, unknown>)[key];
    return undefined;
  }, target);
}

/** Returns a structural clone with `path` replaced by `value`. */
export function setByPath<T>(target: T, path: string, value: unknown): T {
  const keys = path.split(".");

  const walk = (node: unknown, index: number): unknown => {
    const key = keys[index];
    const last = index === keys.length - 1;

    if (Array.isArray(node)) {
      const copy = [...node];
      const arrayIndex = Number(key);
      copy[arrayIndex] = last ? value : walk(copy[arrayIndex], index + 1);
      return copy;
    }

    const source = (node ?? {}) as Record<string, unknown>;
    const copy: Record<string, unknown> = { ...source };
    copy[key] = last ? value : walk(source[key], index + 1);
    return copy;
  };

  return walk(target, 0) as T;
}

export function move<T>(items: T[], from: number, to: number): T[] {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}

export function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}
