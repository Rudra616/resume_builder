"use client";

import * as React from "react";
import { CircleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Confidence } from "@/types/resume";

/**
 * An editable field that is honest about how sure the parser was.
 *
 * Low-confidence values get a subtle amber treatment and an explicit "Please
 * review this field" note rather than being presented as fact.
 */
export function ReviewField({
  label,
  value,
  onChange,
  confidence,
  placeholder,
  multiline,
  rows = 4,
  className,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  confidence?: Confidence;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  className?: string;
  hint?: string;
}) {
  const id = React.useId();
  const uncertain = confidence === "low";
  const [touched, setTouched] = React.useState(false);
  const showWarning = uncertain && !touched;

  const uncertainClass = showWarning
    ? "border-[color-mix(in_srgb,var(--severity-warning)_45%,transparent)] bg-[var(--severity-warning-bg)]"
    : undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {confidence === "medium" && !touched ? (
          <span className="text-[11px] text-muted-foreground">Worth a check</span>
        ) : null}
      </div>

      {multiline ? (
        <Textarea
          id={id}
          value={value}
          rows={rows}
          placeholder={placeholder}
          className={uncertainClass}
          onChange={(event) => {
            setTouched(true);
            onChange(event.target.value);
          }}
        />
      ) : (
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          className={uncertainClass}
          onChange={(event) => {
            setTouched(true);
            onChange(event.target.value);
          }}
        />
      )}

      {showWarning ? (
        <p className="flex items-center gap-1.5 text-[11px] text-[var(--severity-warning)]">
          <CircleAlert className="size-3" />
          Please review this field.
        </p>
      ) : hint ? (
        <p className="text-[11px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
