import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileUp,
  LayoutTemplate,
  ListChecks,
  Lock,
  Palette,
  Printer,
  ScanText,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { DraftBanner } from "@/components/landing/DraftBanner";
import { TemplateShowcase } from "@/components/landing/TemplateShowcase";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TEMPLATE_LIST } from "@/lib/templates";

const CAPABILITIES = [
  {
    icon: ScanText,
    title: "Extract",
    body: "PDF, DOCX and TXT resumes are read in your browser and turned into structured, editable fields.",
  },
  {
    icon: Wand2,
    title: "Improve",
    body: "Spelling, weak phrasing, duplicated content and long bullets are flagged with suggestions you choose to apply.",
  },
  {
    icon: LayoutTemplate,
    title: "Redesign",
    body: "Switch between ten genuinely different premium templates. Your content never changes.",
  },
  {
    icon: Palette,
    title: "Customize",
    body: "Colours, fonts, spacing, section order, visibility and a profile photo — all live.",
  },
  {
    icon: Printer,
    title: "Export",
    body: "A4 PDF with real selectable text and clickable links, never a flattened screenshot.",
  },
  {
    icon: Lock,
    title: "Private",
    body: "No account, no database, no upload. Your draft is saved to this browser only.",
  },
];

const IMPORT_STEPS = [
  "Upload your PDF, DOCX or TXT resume",
  "We read it locally and identify your sections",
  "Review and correct anything we got wrong",
  "Pick a new template and export",
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-70"
            style={{
              background:
                "radial-gradient(60% 100% at 20% 0%, #dfe7fb 0%, transparent 70%), radial-gradient(50% 90% at 90% 10%, #e8e3fb 0%, transparent 70%)",
            }}
            aria-hidden
          />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
            <div>
              <Badge variant="outline" className="mb-5 gap-1.5 bg-card/80 py-1">
                <Sparkles className="size-3" />
                Already have a resume? Bring it with you.
              </Badge>

              <h1 className="text-4xl leading-[1.08] font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem]">
                Build it. Improve it. Make it yours.
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Create a professional resume from scratch or upload your current resume
                and transform it into a polished, modern design.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="xl" asChild>
                  <Link href="/templates?intent=new">
                    Create New Resume
                    <ArrowRight />
                  </Link>
                </Button>
                <Button size="xl" variant="outline" asChild>
                  <Link href="/import">
                    <FileUp />
                    Upload Existing Resume
                  </Link>
                </Button>
                <Button size="xl" variant="ghost" asChild>
                  <Link href="/templates">Browse Templates</Link>
                </Button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="size-4 text-[var(--severity-success)]" />
                  No signup required.
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-[var(--severity-success)]" />
                  Your resume stays on your device.
                </span>
              </div>
            </div>

            <TemplateShowcase />
          </div>
        </section>

        {/* Two start options */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <DraftBanner />

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Where would you like to start?
            </h2>
            <p className="mt-2 text-muted-foreground">
              Both paths end in the same place: a polished, exportable resume.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col p-7 pt-7">
                <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-secondary">
                  <ListChecks className="size-5" />
                </span>
                <h3 className="text-xl font-semibold">Create New Resume</h3>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                  Start from a blank resume and build it step by step.
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <Button asChild>
                    <Link href="/templates?intent=new">
                      Start Building
                      <ArrowRight />
                    </Link>
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Choose a template first
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-primary/25 bg-gradient-to-br from-card to-[#f4f7ff] transition-shadow hover:shadow-md">
              <CardContent className="flex h-full flex-col p-7 pt-7">
                <span className="mb-5 flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <FileUp className="size-5" />
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-semibold">Improve Existing Resume</h3>
                  <Badge variant="info">Most popular</Badge>
                </div>
                <p className="mt-2 flex-1 text-[15px] leading-relaxed text-muted-foreground">
                  Upload your current resume, automatically extract your information, fix
                  content and apply a new professional template.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button asChild>
                    <Link href="/import">
                      Upload Resume
                      <ArrowRight />
                    </Link>
                  </Button>
                  <span className="flex gap-1.5">
                    {["PDF", "DOCX", "TXT"].map((format) => (
                      <Badge key={format} variant="secondary" className="font-mono text-[11px]">
                        {format}
                      </Badge>
                    ))}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Import journey */}
        <section className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl text-balance">
                  You don&apos;t need to start over
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Upload the resume you already have. ResumeForge reads it in your
                  browser, organises the content into editable sections, helps you improve
                  the writing and gives it a completely new professional design.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Resume documents vary enormously, so we never pretend parsing is
                  perfect — there is always a review step where you can correct anything
                  before continuing.
                </p>
                <Button className="mt-6" asChild>
                  <Link href="/import">
                    Try it with your resume
                    <ArrowRight />
                  </Link>
                </Button>
              </div>

              <ol className="space-y-3">
                {IMPORT_STEPS.map((step, index) => (
                  <li
                    key={step}
                    className="flex items-start gap-4 rounded-xl border border-border bg-background p-4"
                  >
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {index + 1}
                    </span>
                    <p className="pt-0.5 text-[15px]">{step}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Capabilities */}
        <section className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Everything the resume needs, nothing it doesn&apos;t
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((item) => (
              <Card key={item.title}>
                <CardContent className="p-5 pt-5">
                  <item.icon className="size-5 text-muted-foreground" />
                  <h3 className="mt-3 font-semibold">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {item.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Template gallery teaser */}
        <section className="border-t border-border bg-card">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  Ten premium templates
                </h2>
                <p className="mt-2 text-muted-foreground">
                  Genuinely different layouts — not the same page in ten colours.
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/templates">
                  See all templates
                  <ArrowRight />
                </Link>
              </Button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {TEMPLATE_LIST.map((template) => (
                <Link
                  key={template.id}
                  href={`/templates#${template.id}`}
                  className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-secondary/50"
                >
                  <p className="font-medium">{template.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {template.tagline}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
