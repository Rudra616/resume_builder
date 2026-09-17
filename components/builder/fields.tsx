"use client";

import * as React from "react";
import { GripVertical, Plus, TriangleAlert, X } from "lucide-react";
import { SuggestionList } from "@/components/assistant/AssistantPanel";
import { useAssistantContext } from "@/components/builder/assistant-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn, wordCount } from "@/lib/utils";

/** "⚠ 3 suggestions" — opens the suggestions that belong to one field. */
export function FieldSuggestions({ fieldPath }: { fieldPath: string }) {
  const assistant = useAssistantContext();
  const suggestions = assistant?.forField(fieldPath) ?? [];
  if (!assistant || suggestions.length === 0) return null;

  const hasError = suggestions.some((item) => item.severity === "error");

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition-colors",
            hasError
              ? "bg-[var(--severity-error-bg)] text-[var(--severity-error)] hover:brightness-95"
              : "bg-[var(--severity-warning-bg)] text-[var(--severity-warning)] hover:brightness-95",
          )}
        >
          <TriangleAlert className="size-3" />
          {suggestions.length} {suggestions.length === 1 ? "suggestion" : "suggestions"}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-2">
        <div className="max-h-80 overflow-y-auto scrollbar-slim">
          <SuggestionList
            suggestions={suggestions}
            onApply={assistant.applySuggestion}
            onDismiss={assistant.dismiss}
            onIgnoreWord={assistant.ignoreAllOfWord}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}

function FieldHeader({
  id,
  label,
  fieldPath,
  hint,
  children,
}: {
  id: string;
  label: string;
  fieldPath?: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-1.5 flex min-h-6 items-center justify-between gap-2">
      <Label htmlFor={id} className="text-xs">
        {label}
        {hint ? (
          <span className="ml-1.5 font-normal text-muted-foreground">{hint}</span>
        ) : null}
      </Label>
      <div className="flex items-center gap-1.5">
        {children}
        {fieldPath ? <FieldSuggestions fieldPath={fieldPath} /> : null}
      </div>
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  fieldPath,
  placeholder,
  hint,
  type = "text",
  className,
  inputMode,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fieldPath?: string;
  placeholder?: string;
  hint?: string;
  type?: string;
  className?: string;
  inputMode?: React.ComponentProps<"input">["inputMode"];
  autoComplete?: string;
}) {
  const id = React.useId();
  return (
    <div className={className}>
      <FieldHeader id={id} label={label} fieldPath={fieldPath} hint={hint} />
      <Input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  fieldPath,
  placeholder,
  hint,
  rows = 4,
  className,
  showWordCount,
  guidance,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  fieldPath?: string;
  placeholder?: string;
  hint?: string;
  rows?: number;
  className?: string;
  showWordCount?: boolean;
  guidance?: string;
}) {
  const id = React.useId();
  const words = showWordCount ? wordCount(value) : 0;

  return (
    <div className={className}>
      <FieldHeader id={id} label={label} fieldPath={fieldPath} hint={hint}>
        {showWordCount && words > 0 ? (
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {words} words
          </span>
        ) : null}
      </FieldHeader>
      <Textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
      {guidance ? (
        <p className="mt-1 text-[11px] text-muted-foreground">{guidance}</p>
      ) : null}
    </div>
  );
}

/**
 * Comma-friendly tag editor used for skills and technologies. Typing a comma or
 * pressing Enter commits the tag; Backspace on an empty input removes the last.
 */
export function TagsField({
  label,
  values,
  onChange,
  fieldPath,
  placeholder = "Add and press Enter",
  hint,
  className,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  fieldPath?: string;
  placeholder?: string;
  hint?: string;
  className?: string;
}) {
  const id = React.useId();
  const [entry, setEntry] = React.useState("");

  const commit = (raw: string) => {
    const parts = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const next = [...values];
    for (const part of parts) {
      if (!next.some((item) => item.toLowerCase() === part.toLowerCase())) {
        next.push(part);
      }
    }
    onChange(next);
    setEntry("");
  };

  return (
    <div className={className}>
      <FieldHeader id={id} label={label} fieldPath={fieldPath} hint={hint} />

      {values.length > 0 ? (
        <ul className="mb-2 flex flex-wrap gap-1.5">
          {values.map((value, index) => (
            <li
              key={`${value}-${index}`}
              className="inline-flex items-center gap-1 rounded-md bg-secondary py-1 pr-1 pl-2 text-xs"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                className="rounded text-muted-foreground hover:text-foreground"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
              >
                <X className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Input
        id={id}
        value={entry}
        placeholder={placeholder}
        onChange={(event) => {
          const next = event.target.value;
          if (next.includes(",")) commit(next);
          else setEntry(next);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(entry);
          } else if (event.key === "Backspace" && entry === "" && values.length > 0) {
            onChange(values.slice(0, -1));
          }
        }}
        onBlur={() => commit(entry)}
      />
    </div>
  );
}

/**
 * Bullet editor. Each bullet has its own suggestion badge, because the assistant
 * analyses bullets individually.
 */
export function BulletsField({
  label,
  values,
  onChange,
  fieldPathPrefix,
  placeholder = "Describe an achievement",
  hint,
  addLabel = "Add bullet",
  className,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  fieldPathPrefix?: string;
  placeholder?: string;
  hint?: string;
  addLabel?: string;
  className?: string;
}) {
  const setAt = (index: number, value: string) => {
    const next = [...values];
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= values.length) return;
    const next = [...values];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <Label className="text-xs">
          {label}
          {hint ? (
            <span className="ml-1.5 font-normal text-muted-foreground">{hint}</span>
          ) : null}
        </Label>
        <Button
          type="button"
          size="xs"
          variant="ghost"
          onClick={() => onChange([...values, ""])}
        >
          <Plus />
          {addLabel}
        </Button>
      </div>

      {values.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
          No bullets yet. Short, specific achievements read best.
        </p>
      ) : (
        <ul className="space-y-2">
          {values.map((value, index) => (
            // Index keys are safe here: the textareas are controlled, so their
            // content always follows `values` after a move or removal.
            <li key={index} className="group">
              <div className="flex items-start gap-1.5">
                <div className="flex flex-col pt-1.5">
                  <button
                    type="button"
                    aria-label="Move bullet up"
                    disabled={index === 0}
                    className="text-muted-foreground/60 hover:text-foreground disabled:opacity-30"
                    onClick={() => move(index, -1)}
                  >
                    <GripVertical className="size-3.5" />
                  </button>
                </div>
                <Textarea
                  rows={2}
                  value={value}
                  placeholder={placeholder}
                  className="min-h-16 flex-1 text-[13px]"
                  onChange={(event) => setAt(index, event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      const next = [...values];
                      next.splice(index + 1, 0, "");
                      onChange(next);
                    }
                    if (
                      event.key === "ArrowUp" &&
                      (event.metaKey || event.ctrlKey) &&
                      event.shiftKey
                    ) {
                      event.preventDefault();
                      move(index, -1);
                    }
                    if (
                      event.key === "ArrowDown" &&
                      (event.metaKey || event.ctrlKey) &&
                      event.shiftKey
                    ) {
                      event.preventDefault();
                      move(index, 1);
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove bullet"
                  className="mt-0.5 text-muted-foreground"
                  onClick={() => removeAt(index)}
                >
                  <X />
                </Button>
              </div>
              {fieldPathPrefix ? (
                <div className="mt-1 flex justify-end pr-9">
                  <FieldSuggestions fieldPath={`${fieldPathPrefix}.${index}`} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Small labelled select used for date formats, link kinds and language levels. */
export function SelectField({
  label,
  value,
  onChange,
  options,
  className,
  fieldPath,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  fieldPath?: string;
}) {
  const id = React.useId();
  return (
    <div className={className}>
      <FieldHeader id={id} label={label} fieldPath={fieldPath} />
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
