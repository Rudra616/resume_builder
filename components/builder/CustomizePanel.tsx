"use client";

import * as React from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";
import { RotateCcw } from "lucide-react";
import { SectionManager } from "@/components/builder/SectionManager";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { FONTS } from "@/lib/fonts";
import { getTemplate } from "@/lib/templates";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import type {
  DateFormatPreference,
  FontKey,
  ResumeDesign,
} from "@/types/resume";

const ACCENT_PRESETS = [
  "#1f3a8a",
  "#0f766e",
  "#b45309",
  "#7c2d12",
  "#4c1d95",
  "#0e7490",
  "#b91c1c",
  "#111827",
];

const HEADING_STYLES: { value: ResumeDesign["headingStyle"]; label: string }[] = [
  { value: "plain", label: "Plain" },
  { value: "underline", label: "Underline" },
  { value: "bar", label: "Accent bar" },
  { value: "boxed", label: "Boxed" },
];

const DATE_FORMATS: { value: DateFormatPreference; label: string; example: string }[] = [
  { value: "MMM yyyy", label: "MMM YYYY", example: "Jan 2024" },
  { value: "MMMM yyyy", label: "MMMM YYYY", example: "January 2024" },
  { value: "MM/yyyy", label: "MM/YYYY", example: "01/2024" },
  { value: "yyyy", label: "YYYY", example: "2024" },
];

export function CustomizePanel() {
  const design = useResumeStore((state) => state.resume.design);
  const setDesign = useResumeStore((state) => state.setDesign);
  const setTemplate = useResumeStore((state) => state.setTemplate);

  const template = getTemplate(design.templateId);

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold">Colours</h3>
          <Button
            type="button"
            size="xs"
            variant="ghost"
            className="text-muted-foreground"
            onClick={() => setTemplate(design.templateId, true)}
          >
            <RotateCcw />
            Reset to {template.name}
          </Button>
        </div>

        <div className="space-y-2.5">
          <ColorRow
            label="Accent"
            value={design.accentColor}
            onChange={(accentColor) => setDesign({ accentColor })}
            presets={ACCENT_PRESETS}
          />
          <ColorRow
            label="Secondary"
            value={design.secondaryColor}
            onChange={(secondaryColor) => setDesign({ secondaryColor })}
          />
          <ColorRow
            label="Body text"
            value={design.textColor}
            onChange={(textColor) => setDesign({ textColor })}
          />
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="mb-2 text-xs font-semibold">Typography</h3>
        <div className="space-y-3">
          <FontSelect
            label="Body font"
            value={design.fontFamily}
            onChange={(fontFamily) => setDesign({ fontFamily })}
          />
          <FontSelect
            label="Heading font"
            value={design.headingFontFamily}
            onChange={(headingFontFamily) => setDesign({ headingFontFamily })}
          />

          <SliderRow
            label="Body size"
            value={design.fontSize}
            min={8.5}
            max={12}
            step={0.25}
            format={(value) => `${value} pt`}
            onChange={(fontSize) => setDesign({ fontSize })}
          />
          <SliderRow
            label="Line height"
            value={design.lineHeight}
            min={1.15}
            max={1.75}
            step={0.05}
            format={(value) => value.toFixed(2)}
            onChange={(lineHeight) => setDesign({ lineHeight })}
          />
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="mb-2 text-xs font-semibold">Spacing</h3>
        <div className="space-y-3">
          <SliderRow
            label="Section spacing"
            value={design.sectionSpacing}
            min={8}
            max={32}
            step={1}
            format={(value) => `${value} px`}
            onChange={(sectionSpacing) => setDesign({ sectionSpacing })}
          />
          <SliderRow
            label="Page margin"
            value={design.pagePadding}
            min={8}
            max={24}
            step={1}
            format={(value) => `${value} mm`}
            onChange={(pagePadding) => setDesign({ pagePadding })}
          />
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="mb-2 text-xs font-semibold">Headings</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {HEADING_STYLES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDesign({ headingStyle: option.value })}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                design.headingStyle === option.value
                  ? "border-foreground/30 bg-secondary font-medium"
                  : "border-border text-muted-foreground hover:bg-secondary/60",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2.5">
          <ToggleRow
            id="uppercase-headings"
            label="Uppercase section headings"
            checked={design.uppercaseHeadings}
            onChange={(uppercaseHeadings) => setDesign({ uppercaseHeadings })}
          />
          <ToggleRow
            id="show-icons"
            label="Show contact icons"
            checked={design.showIcons}
            onChange={(showIcons) => setDesign({ showIcons })}
          />
          <ToggleRow
            id="show-photo-design"
            label="Show profile photo"
            checked={design.showPhoto}
            onChange={(showPhoto) => setDesign({ showPhoto })}
            hint={
              template.supportsPhoto
                ? undefined
                : `${template.name} doesn't use a photo`
            }
          />
        </div>
      </section>

      <Separator />

      <section>
        <h3 className="mb-2 text-xs font-semibold">Date format</h3>
        <div className="grid grid-cols-2 gap-1.5">
          {DATE_FORMATS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setDesign({ dateFormat: option.value })}
              className={cn(
                "rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors",
                design.dateFormat === option.value
                  ? "border-foreground/30 bg-secondary"
                  : "border-border hover:bg-secondary/60",
              )}
            >
              <span className="block font-medium">{option.label}</span>
              <span className="block text-[11px] text-muted-foreground">
                {option.example}
              </span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Applied everywhere dates are rendered. Your typed values are kept as-is, so you
          can switch formats freely.
        </p>
      </section>

      <Separator />

      <section>
        <h3 className="mb-2 text-xs font-semibold">Sections</h3>
        <SectionManager />
      </section>
    </div>
  );
}

function ColorRow({
  label,
  value,
  onChange,
  presets,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  presets?: string[];
}) {
  return (
    <div className="flex items-center gap-2">
      <Label className="w-20 shrink-0 text-xs font-normal">{label}</Label>

      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`Change ${label} colour`}
            className="size-7 shrink-0 rounded-md border border-border shadow-xs"
            style={{ backgroundColor: value }}
          />
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3">
          <HexColorPicker color={value} onChange={onChange} />
          <div className="mt-2.5 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">#</span>
            <HexColorInput
              color={value}
              onChange={onChange}
              className="h-8 w-24 rounded-md border border-input bg-transparent px-2 text-sm uppercase outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
          </div>
        </PopoverContent>
      </Popover>

      {presets ? (
        <div className="flex flex-wrap gap-1">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`Use ${preset}`}
              onClick={() => onChange(preset)}
              className={cn(
                "size-5 rounded border",
                value.toLowerCase() === preset.toLowerCase()
                  ? "border-foreground"
                  : "border-border",
              )}
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
      ) : (
        <span className="text-xs tabular-nums text-muted-foreground uppercase">
          {value}
        </span>
      )}
    </div>
  );
}

function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: FontKey;
  onChange: (value: FontKey) => void;
}) {
  const id = React.useId();
  return (
    <div>
      <Label htmlFor={id} className="mb-1.5 text-xs">
        {label}
      </Label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as FontKey)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {FONTS.map((font) => (
          <option key={font.key} value={font.key}>
            {font.label} · {font.kind}
          </option>
        ))}
      </select>
    </div>
  );
}

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label className="text-xs font-normal">{label}</Label>
        <span className="text-[11px] tabular-nums text-muted-foreground">
          {format(value)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
      />
    </div>
  );
}

function ToggleRow({
  id,
  label,
  checked,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-xs font-normal">
        {label}
        {hint ? (
          <span className="ml-1.5 text-[11px] text-muted-foreground">({hint})</span>
        ) : null}
      </Label>
    </div>
  );
}
