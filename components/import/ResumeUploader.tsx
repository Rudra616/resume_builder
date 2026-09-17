"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  FileText,
  Lock,
  PenLine,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { ImportProgress, IMPORT_STEPS } from "@/components/import/ImportProgress";
import { UploadDropzone } from "@/components/import/UploadDropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  buildResumeFromExtraction,
  detectFileKind,
  extractFile,
  validateFile,
} from "@/lib/resume-parser/resumeParser";
import { formatBytes, isNonEmpty } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import { ResumeParseError, type ParseFailureCode } from "@/types/parser";

type Phase = "idle" | "confirm" | "working" | "failed";

interface FailureState {
  code: ParseFailureCode;
  message: string;
  hint?: string;
}

const KIND_LABEL: Record<string, string> = {
  pdf: "PDF document",
  docx: "Word document",
  txt: "Plain text",
};

/** Lets the progress steps render long enough to be readable. */
function pause(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms));
}

export function ResumeUploader() {
  const router = useRouter();
  const hydrated = useResumeStore((state) => state.hydrated);
  const hasDraft = useResumeStore((state) => state.hasDraft);
  const existingResume = useResumeStore((state) => state.resume);
  const setPendingImport = useResumeStore((state) => state.setPendingImport);

  const [file, setFile] = React.useState<File | null>(null);
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [step, setStep] = React.useState(0);
  const [failure, setFailure] = React.useState<FailureState | null>(null);
  const [replaceOpen, setReplaceOpen] = React.useState(false);

  const draftHasContent =
    hydrated &&
    hasDraft &&
    (isNonEmpty(existingResume.personalInfo.fullName) ||
      existingResume.experience.length > 0);

  const handleFile = (selected: File) => {
    setFailure(null);
    try {
      validateFile(selected);
    } catch (error) {
      if (error instanceof ResumeParseError) {
        setFailure({ code: error.code, message: error.message, hint: error.hint });
        setPhase("failed");
        setFile(null);
        return;
      }
      throw error;
    }
    setFile(selected);
    setPhase("confirm");
  };

  const runImport = React.useCallback(
    async (selected: File) => {
      setPhase("working");
      setStep(0);
      setFailure(null);

      try {
        await pause(320);
        setStep(1);
        const extraction = await extractFile(selected);

        setStep(2);
        await pause(360);
        const parsed = buildResumeFromExtraction(
          extraction,
          existingResume.design.templateId,
        );

        setStep(3);
        await pause(320);
        setPendingImport({ resume: parsed.resume, report: parsed.report });

        setStep(4);
        await pause(260);
        router.push("/import/review");
      } catch (error) {
        if (error instanceof ResumeParseError) {
          setFailure({ code: error.code, message: error.message, hint: error.hint });
        } else {
          setFailure({
            code: "unknown",
            message: "Something went wrong while reading this file.",
            hint: (error as Error)?.message,
          });
        }
        setPhase("failed");
      }
    },
    [existingResume.design.templateId, router, setPendingImport],
  );

  const startImport = () => {
    if (!file) return;
    if (draftHasContent) {
      setReplaceOpen(true);
      return;
    }
    void runImport(file);
  };

  if (phase === "working") {
    return (
      <ImportProgress step={Math.min(step, IMPORT_STEPS.length - 1)} fileName={file?.name ?? ""} />
    );
  }

  return (
    <>
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">
            Upload your existing resume
          </h1>
          <p className="mt-2.5 leading-relaxed text-muted-foreground">
            We&apos;ll read it in your browser, pull out your information and load it
            straight into the builder. You review everything before continuing — no
            retyping.
          </p>
        </div>

        {failure ? (
          <Card className="mb-6 border-[color-mix(in_srgb,var(--severity-error)_30%,transparent)] bg-[var(--severity-error-bg)]">
            <CardContent className="flex gap-3 p-5 pt-5">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[var(--severity-error)]" />
              <div className="min-w-0">
                <p className="font-medium text-[var(--severity-error)]">
                  {failure.message}
                </p>
                {failure.hint ? (
                  <p className="mt-1 text-sm leading-relaxed text-[color-mix(in_srgb,var(--severity-error)_80%,#000000)]">
                    {failure.hint}
                  </p>
                ) : null}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFailure(null);
                      setFile(null);
                      setPhase("idle");
                    }}
                  >
                    Try another file
                  </Button>
                  <Button size="sm" variant="ghost" asChild>
                    <Link href="/builder?new=1">
                      <PenLine />
                      Continue manually
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {file && phase === "confirm" ? (
          <Card className="mb-6">
            <CardContent className="p-5 pt-5">
              <div className="flex items-start gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <FileText className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{file.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span>{formatBytes(file.size)}</span>
                    <span aria-hidden>·</span>
                    <span>
                      {KIND_LABEL[detectFileKind(file) ?? ""] ?? file.type ?? "Unknown"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove file"
                  onClick={() => {
                    setFile(null);
                    setPhase("idle");
                  }}
                >
                  <Trash2 />
                </Button>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button onClick={startImport}>
                  Continue
                  <ArrowRight />
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFile(null);
                    setPhase("idle");
                  }}
                >
                  Choose a different file
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <UploadDropzone onFile={handleFile} />
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
            <Lock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Processed in your browser</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Your file is not sent to us or to any third-party service.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Not permanently stored</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                Only the editable draft is kept, in this browser.{" "}
                <Link href="/privacy" className="underline">
                  How this works
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            What we handle well
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "Text-based PDFs",
              "Multi-page resumes",
              "Word DOCX",
              "Plain text",
              "Bullet lists",
              "LinkedIn & GitHub links",
              "Unusual headings",
              "Two-column layouts",
            ].map((item) => (
              <Badge key={item} variant="secondary" className="font-normal">
                {item}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Scanned or image-only PDFs have no text to extract, and password-protected
            files can&apos;t be opened. We&apos;ll say so clearly rather than guessing at
            your content.
          </p>
        </div>
      </div>

      <Dialog open={replaceOpen} onOpenChange={setReplaceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace your current draft?</DialogTitle>
            <DialogDescription>
              Importing another resume will replace the current draft saved in this
              browser. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReplaceOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setReplaceOpen(false);
                if (file) void runImport(file);
                else toast.error("No file selected");
              }}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
