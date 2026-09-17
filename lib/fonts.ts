import type { FontDefinition } from "@/types/template";
import type { FontKey } from "@/types/resume";

/**
 * System-first font stacks. Nothing is fetched from a third-party font CDN, so
 * resume rendering and PDF export work offline and stay private.
 */
export const FONTS: FontDefinition[] = [
  {
    key: "inter",
    label: "Inter",
    kind: "sans",
    stack: 'var(--font-sans), "Helvetica Neue", Arial, sans-serif',
  },
  {
    key: "sourceSans",
    label: "Source Sans",
    kind: "sans",
    stack: '"Source Sans 3", "Source Sans Pro", Calibri, Candara, sans-serif',
  },
  {
    key: "roboto",
    label: "Roboto",
    kind: "sans",
    stack: 'Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  {
    key: "lato",
    label: "Lato",
    kind: "sans",
    stack: 'Lato, "Trebuchet MS", "Segoe UI", sans-serif',
  },
  {
    key: "merriweather",
    label: "Merriweather",
    kind: "serif",
    stack: 'Merriweather, "Iowan Old Style", Georgia, serif',
  },
  {
    key: "playfair",
    label: "Playfair Display",
    kind: "serif",
    stack: '"Playfair Display", "Didot", "Times New Roman", serif',
  },
  {
    key: "georgia",
    label: "Georgia",
    kind: "serif",
    stack: 'Georgia, "Times New Roman", serif',
  },
  {
    key: "garamond",
    label: "Garamond",
    kind: "serif",
    stack: '"EB Garamond", Garamond, "Apple Garamond", Georgia, serif',
  },
  {
    key: "jetbrains",
    label: "JetBrains Mono",
    kind: "mono",
    stack: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, monospace',
  },
];

const FONT_MAP = new Map<FontKey, FontDefinition>(FONTS.map((font) => [font.key, font]));

export function fontStack(key: FontKey): string {
  return FONT_MAP.get(key)?.stack ?? FONTS[0].stack;
}

export function fontLabel(key: FontKey): string {
  return FONT_MAP.get(key)?.label ?? "Inter";
}
