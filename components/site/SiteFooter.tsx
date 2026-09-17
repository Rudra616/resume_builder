import Link from "next/link";
import { FileText, ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="print-hidden border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 font-semibold">
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <FileText className="size-3.5" />
            </span>
            ResumeForge
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Build a resume from scratch or bring the one you already have. Everything
            runs in your browser — no account, no database.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
          <Link href="/templates" className="text-muted-foreground hover:text-foreground">
            Templates
          </Link>
          <Link href="/import" className="text-muted-foreground hover:text-foreground">
            Import a resume
          </Link>
          <Link href="/builder" className="text-muted-foreground hover:text-foreground">
            Builder
          </Link>
          <Link href="/compare" className="text-muted-foreground hover:text-foreground">
            Compare templates
          </Link>
          <Link href="/preview" className="text-muted-foreground hover:text-foreground">
            Full-page preview
          </Link>
          <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
            Privacy
          </Link>
        </div>
      </div>

      <div className="border-t border-border px-5 py-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            Your resume stays on your device.
          </p>
          <p>Writing checks are local rules, not AI.</p>
        </div>
      </div>
    </footer>
  );
}
