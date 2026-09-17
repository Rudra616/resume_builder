"use client";

import * as React from "react";
import { FileUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MAX_FILE_BYTES } from "@/lib/resume-parser/resumeParser";

const ACCEPT = ".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

export function UploadDropzone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void;
  disabled?: boolean;
}) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = React.useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (disabled) return;
        handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors",
        dragging
          ? "border-primary bg-secondary/60"
          : "border-border bg-card hover:border-primary/40",
        disabled && "pointer-events-none opacity-60",
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-xl bg-secondary">
        {dragging ? <Upload className="size-5" /> : <FileUp className="size-5" />}
      </span>

      <p className="mt-4 text-lg font-medium">
        {dragging ? "Drop your resume here" : "Drag & drop your resume"}
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">
        or choose a file from your device
      </p>

      <Button className="mt-5" onClick={() => inputRef.current?.click()} type="button">
        Browse files
      </Button>

      <p className="mt-5 text-xs text-muted-foreground">
        PDF, DOCX or TXT · recommended maximum{" "}
        {Math.round(MAX_FILE_BYTES / (1024 * 1024))} MB
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        onChange={(event) => {
          handleFiles(event.target.files);
          // Allows re-selecting the same file after a failed attempt.
          event.target.value = "";
        }}
      />
    </div>
  );
}
