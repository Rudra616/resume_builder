import type { Metadata } from "next";
import Link from "next/link";
import { Cpu, Database, FileUp, HardDrive, ShieldCheck, Trash2 } from "lucide-react";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ClearDataButton } from "@/components/site/ClearDataButton";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How ResumeForge handles your resume: processed in your browser, stored only on your device, never sent to a server.",
};

const FACTS = [
  {
    icon: FileUp,
    title: "Uploads are read in your browser",
    body: "PDF parsing uses pdf.js and DOCX parsing uses Mammoth, both running as JavaScript on your machine. The file is read from disk into memory and never transmitted anywhere.",
  },
  {
    icon: Database,
    title: "There is no database",
    body: "ResumeForge has no accounts, no server-side storage and no analytics on your resume content. There is nothing for us to look up, because nothing is recorded.",
  },
  {
    icon: HardDrive,
    title: "Your draft lives in this browser",
    body: "The editable resume is saved to localStorage so you can close the tab and come back. It stays on this device and this browser profile only.",
  },
  {
    icon: Trash2,
    title: "The original file is not kept",
    body: "Once an upload is converted into editable fields, the uploaded document is discarded from memory. Only the structured draft remains.",
  },
  {
    icon: Cpu,
    title: "Writing checks are local rules",
    body: "Spelling, grammar, weak-phrase and duplicate detection all run from rule sets bundled with the app. No AI provider is called, and your text is not sent to a spelling service.",
  },
  {
    icon: ShieldCheck,
    title: "If that ever changes",
    body: "Any future server endpoint would be stateless: no logging of resume content, no retention of uploaded documents, temporary files deleted immediately, and it would be opt-in rather than default.",
  },
];

export default function PrivacyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-14">
        <h1 className="text-3xl font-semibold tracking-tight">Privacy</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
          Your resume is processed in your browser whenever possible, and your resume is
          not permanently stored.
        </p>

        <div className="mt-10 space-y-4">
          {FACTS.map((fact) => (
            <Card key={fact.title}>
              <CardContent className="flex gap-4 p-5 pt-5">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                  <fact.icon className="size-4" />
                </span>
                <div>
                  <h2 className="font-semibold">{fact.title}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {fact.body}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <section className="mt-10 rounded-xl border border-border bg-card p-6">
          <h2 className="font-semibold">What is stored on this device</h2>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                resumeforge.draft.v1
              </code>{" "}
              — your resume content, design settings and dismissed suggestions.
            </li>
            <li>
              <code className="rounded bg-secondary px-1.5 py-0.5 text-xs">
                resumeforge.ui.v1
              </code>{" "}
              — layout preferences such as zoom level and whether the assistant panel is
              open.
            </li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <ClearDataButton />
            <Button variant="ghost" asChild>
              <Link href="/builder">Back to builder</Link>
            </Button>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold tracking-tight">
            A note on PDF export
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Export uses your browser&apos;s own print pipeline with print stylesheets,
            rather than rasterising the page into an image. That keeps the text selectable
            and the hyperlinks clickable in the resulting PDF, and it means the file is
            generated entirely on your machine.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
