"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CircleAlert,
  FileText,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { ReviewField } from "@/components/import/ReviewField";
import { UnclassifiedContent } from "@/components/import/UnclassifiedContent";
import { ResumeThumbnail } from "@/components/resume/ResumeDocument";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { TEMPLATE_LIST } from "@/lib/templates";
import {
  createEmptyEducation,
  createEmptyExperience,
  createEmptyProject,
} from "@/lib/resume-defaults";
import { formatBytes, isNonEmpty, move, uid } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import type { Confidence, ResumeData, TemplateId } from "@/types/resume";
import type { ParseReport } from "@/types/parser";

type Stage = "review" | "template";

const SECTION_LABEL: Record<string, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  languages: "Languages",
  awards: "Awards",
  volunteering: "Volunteering",
  links: "Links",
  interests: "Interests",
  unknown: "Unrecognised heading",
};

export function ImportReview() {
  const router = useRouter();
  const hydrated = useResumeStore((state) => state.hydrated);
  const pendingImport = useResumeStore((state) => state.pendingImport);
  const setPendingImport = useResumeStore((state) => state.setPendingImport);
  const acceptPendingImport = useResumeStore((state) => state.acceptPendingImport);
  const setTemplate = useResumeStore((state) => state.setTemplate);

  // Edits live locally until the user confirms, so nothing overwrites the saved
  // draft mid-review. Before the first edit we simply render the parsed resume.
  const [edited, setEdited] = React.useState<ResumeData | null>(null);
  const [stage, setStage] = React.useState<Stage>("review");
  const draft = edited ?? pendingImport?.resume ?? null;

  if (!hydrated) {
    return <p className="py-24 text-center text-sm text-muted-foreground">Loading…</p>;
  }

  if (!pendingImport || !draft) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardContent className="p-6 pt-6 text-center">
          <FileText className="mx-auto size-6 text-muted-foreground" />
          <h1 className="mt-3 text-lg font-semibold">No import in progress</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Imported resumes are held in memory only, so this page resets if you reload it.
            Upload your file again to continue.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button asChild>
              <Link href="/import">Upload a resume</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/builder">Open builder</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const report = pendingImport.report;
  const confidenceOf = (path: string): Confidence | undefined => draft.confidence[path];

  const update = (mutate: (current: ResumeData) => ResumeData) => {
    setEdited((current) => {
      const base = current ?? pendingImport?.resume;
      return base ? mutate(base) : current;
    });
  };

  const clearConfidence = (path: string) =>
    update((current) => {
      const confidence = { ...current.confidence };
      delete confidence[path];
      return { ...current, confidence };
    });

  const setField = (path: string, value: string) => {
    update((current) => applyStringPath(current, path, value));
    if (draft.confidence[path]) clearConfidence(path);
  };

  const goToTemplates = () => {
    setPendingImport({ resume: draft, report });
    setStage("template");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const finish = (templateId: TemplateId) => {
    setPendingImport({
      resume: { ...draft, design: { ...draft.design, templateId } },
      report,
    });
    acceptPendingImport();
    setTemplate(templateId);
    toast.success(
      "Your resume is ready to edit",
      "Everything we extracted is now in the builder. Switch template any time.",
    );
    router.push("/builder?imported=1");
  };

  if (stage === "template") {
    return (
      <div>
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => setStage("review")}>
          <ArrowLeft />
          Back to review
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight">Choose a new look</h1>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted-foreground">
            Every preview below uses your own information. Pick one to open the builder —
            you can switch template later without losing anything.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATE_LIST.map((template) => (
            <article
              key={template.id}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-md"
            >
              <div className="flex justify-center border-b border-border bg-[#eef0f5] p-4">
                <div className="overflow-hidden rounded-md shadow-sm ring-1 ring-black/5">
                  <ResumeThumbnail
                    resume={{
                      ...draft,
                      design: {
                        ...draft.design,
                        ...template.defaults,
                        templateId: template.id,
                      },
                    }}
                    width={276}
                    ratio={0.8}
                  />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{template.name}</h2>
                  {template.atsFriendly ? <Badge variant="success">ATS safe</Badge> : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{template.tagline}</p>
                <Button className="mt-4" onClick={() => finish(template.id)}>
                  Use {template.name}
                  <ArrowRight />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  const lowConfidenceCount = Object.values(draft.confidence).filter(
    (value) => value === "low",
  ).length;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <Badge variant="outline" className="mb-3">
          Step 4 of 5 · Review
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight">Review your resume</h1>
        <p className="mt-2.5 leading-relaxed text-muted-foreground">
          Here&apos;s what we extracted from{" "}
          <span className="font-medium text-foreground">{report.fileName}</span>. Resume
          layouts vary a lot, so please correct anything we got wrong before continuing.
        </p>
      </div>

      <ImportSummaryCard report={report} lowConfidenceCount={lowConfidenceCount} />

      <div className="mt-6 space-y-6">
        {/* Personal information */}
        <ReviewSection title="Personal information">
          <div className="grid gap-4 sm:grid-cols-2">
            <ReviewField
              label="Full name"
              value={draft.personalInfo.fullName}
              confidence={confidenceOf("personalInfo.fullName")}
              onChange={(value) => setField("personalInfo.fullName", value)}
              placeholder="Your name"
            />
            <ReviewField
              label="Professional title"
              value={draft.personalInfo.jobTitle}
              confidence={confidenceOf("personalInfo.jobTitle")}
              onChange={(value) => setField("personalInfo.jobTitle", value)}
              placeholder="e.g. React Native Developer"
            />
            <ReviewField
              label="Email"
              value={draft.personalInfo.email}
              confidence={confidenceOf("personalInfo.email")}
              onChange={(value) => setField("personalInfo.email", value)}
              placeholder="you@example.com"
            />
            <ReviewField
              label="Phone"
              value={draft.personalInfo.phone}
              confidence={confidenceOf("personalInfo.phone")}
              onChange={(value) => setField("personalInfo.phone", value)}
              placeholder="+91 98250 41122"
            />
            <ReviewField
              label="City"
              value={draft.personalInfo.city}
              confidence={confidenceOf("personalInfo.city")}
              onChange={(value) => setField("personalInfo.city", value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <ReviewField
                label="State"
                value={draft.personalInfo.state}
                onChange={(value) => setField("personalInfo.state", value)}
              />
              <ReviewField
                label="Country"
                value={draft.personalInfo.country}
                onChange={(value) => setField("personalInfo.country", value)}
              />
            </div>
          </div>
        </ReviewSection>

        {/* Summary */}
        <ReviewSection
          title="Summary"
          empty={!isNonEmpty(draft.summary)}
          emptyMessage="We didn't find a summary section. You can write one in the builder."
        >
          <ReviewField
            label="Professional summary"
            value={draft.summary}
            multiline
            rows={5}
            confidence={confidenceOf("summary")}
            onChange={(value) => setField("summary", value)}
          />
        </ReviewSection>

        {/* Experience */}
        <ReviewSection
          title="Experience"
          count={draft.experience.length}
          empty={draft.experience.length === 0}
          emptyMessage="We couldn't find a work experience section."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                update((current) => ({
                  ...current,
                  experience: [...current.experience, createEmptyExperience()],
                }))
              }
            >
              <Plus />
              Add role
            </Button>
          }
        >
          <div className="space-y-4">
            {draft.experience.map((entry, index) => (
              <EntryCard
                key={entry.id}
                title={entry.role || entry.company || `Role ${index + 1}`}
                index={index}
                total={draft.experience.length}
                onMove={(direction) =>
                  update((current) => ({
                    ...current,
                    experience: move(current.experience, index, index + direction),
                  }))
                }
                onRemove={() =>
                  update((current) => ({
                    ...current,
                    experience: current.experience.filter((item) => item.id !== entry.id),
                  }))
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReviewField
                    label="Job title"
                    value={entry.role}
                    confidence={confidenceOf(`experience.${index}.role`)}
                    onChange={(value) => setField(`experience.${index}.role`, value)}
                  />
                  <ReviewField
                    label="Company"
                    value={entry.company}
                    confidence={confidenceOf(`experience.${index}.company`)}
                    onChange={(value) => setField(`experience.${index}.company`, value)}
                  />
                  <ReviewField
                    label="Start date"
                    value={entry.startDate}
                    confidence={confidenceOf(`experience.${index}.startDate`)}
                    onChange={(value) => setField(`experience.${index}.startDate`, value)}
                    placeholder="2023-03"
                    hint="Any of 2023-03, 03/2023, Mar 2023 or 2023 works."
                  />
                  <ReviewField
                    label={entry.current ? "End date (current role)" : "End date"}
                    value={entry.endDate}
                    confidence={confidenceOf(`experience.${index}.endDate`)}
                    onChange={(value) => setField(`experience.${index}.endDate`, value)}
                    placeholder={entry.current ? "Present" : "2024-08"}
                  />
                  <ReviewField
                    label="Location"
                    value={entry.location}
                    onChange={(value) => setField(`experience.${index}.location`, value)}
                    className="sm:col-span-2"
                  />
                </div>

                <BulletEditor
                  label="Achievements"
                  bullets={entry.achievements}
                  onChange={(bullets) =>
                    update((current) => ({
                      ...current,
                      experience: current.experience.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, achievements: bullets } : item,
                      ),
                    }))
                  }
                />

                {isNonEmpty(entry.description) ? (
                  <ReviewField
                    label="Description"
                    value={entry.description}
                    multiline
                    rows={3}
                    onChange={(value) => setField(`experience.${index}.description`, value)}
                    className="mt-4"
                  />
                ) : null}
              </EntryCard>
            ))}
          </div>
        </ReviewSection>

        {/* Education */}
        <ReviewSection
          title="Education"
          count={draft.education.length}
          empty={draft.education.length === 0}
          emptyMessage="We couldn't find an education section."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                update((current) => ({
                  ...current,
                  education: [...current.education, createEmptyEducation()],
                }))
              }
            >
              <Plus />
              Add entry
            </Button>
          }
        >
          <div className="space-y-4">
            {draft.education.map((entry, index) => (
              <EntryCard
                key={entry.id}
                title={entry.degree || entry.institution || `Education ${index + 1}`}
                index={index}
                total={draft.education.length}
                onMove={(direction) =>
                  update((current) => ({
                    ...current,
                    education: move(current.education, index, index + direction),
                  }))
                }
                onRemove={() =>
                  update((current) => ({
                    ...current,
                    education: current.education.filter((item) => item.id !== entry.id),
                  }))
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReviewField
                    label="Qualification"
                    value={entry.degree}
                    confidence={confidenceOf(`education.${index}.degree`)}
                    onChange={(value) => setField(`education.${index}.degree`, value)}
                  />
                  <ReviewField
                    label="Institution"
                    value={entry.institution}
                    confidence={confidenceOf(`education.${index}.institution`)}
                    onChange={(value) => setField(`education.${index}.institution`, value)}
                  />
                  <ReviewField
                    label="Field of study"
                    value={entry.field}
                    onChange={(value) => setField(`education.${index}.field`, value)}
                  />
                  <ReviewField
                    label="Grade"
                    value={entry.grade}
                    onChange={(value) => setField(`education.${index}.grade`, value)}
                  />
                  <ReviewField
                    label="Start date"
                    value={entry.startDate}
                    onChange={(value) => setField(`education.${index}.startDate`, value)}
                  />
                  <ReviewField
                    label="End date"
                    value={entry.endDate}
                    confidence={confidenceOf(`education.${index}.endDate`)}
                    onChange={(value) => setField(`education.${index}.endDate`, value)}
                  />
                </div>
              </EntryCard>
            ))}
          </div>
        </ReviewSection>

        {/* Skills */}
        <ReviewSection
          title="Skills"
          count={draft.skills.reduce((total, group) => total + group.items.length, 0)}
          empty={draft.skills.length === 0}
          emptyMessage="We couldn't find a skills section."
        >
          <div className="space-y-4">
            {draft.skills.map((group, index) => (
              <div key={group.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={group.category}
                    aria-label="Skill group name"
                    className="h-8 max-w-[220px] font-medium"
                    onChange={(event) =>
                      setField(`skills.${index}.category`, event.target.value)
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove skill group"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        skills: current.skills.filter((item) => item.id !== group.id),
                      }))
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
                <div className="mt-3">
                  <Label className="mb-1.5">Skills (comma separated)</Label>
                  <Input
                    value={group.items.join(", ")}
                    onChange={(event) =>
                      update((current) => ({
                        ...current,
                        skills: current.skills.map((item, itemIndex) =>
                          itemIndex === index
                            ? {
                                ...item,
                                items: event.target.value
                                  .split(",")
                                  .map((value) => value.trim())
                                  .filter(Boolean),
                              }
                            : item,
                        ),
                      }))
                    }
                  />
                </div>
              </div>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                update((current) => ({
                  ...current,
                  skills: [
                    ...current.skills,
                    { id: uid("skl"), category: "Skills", items: [] },
                  ],
                }))
              }
            >
              <Plus />
              Add skill group
            </Button>
          </div>
        </ReviewSection>

        {/* Projects */}
        <ReviewSection
          title="Projects"
          count={draft.projects.length}
          empty={draft.projects.length === 0}
          emptyMessage="No projects section found — optional."
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                update((current) => ({
                  ...current,
                  projects: [...current.projects, createEmptyProject()],
                }))
              }
            >
              <Plus />
              Add project
            </Button>
          }
        >
          <div className="space-y-4">
            {draft.projects.map((entry, index) => (
              <EntryCard
                key={entry.id}
                title={entry.name || `Project ${index + 1}`}
                index={index}
                total={draft.projects.length}
                onMove={(direction) =>
                  update((current) => ({
                    ...current,
                    projects: move(current.projects, index, index + direction),
                  }))
                }
                onRemove={() =>
                  update((current) => ({
                    ...current,
                    projects: current.projects.filter((item) => item.id !== entry.id),
                  }))
                }
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <ReviewField
                    label="Project name"
                    value={entry.name}
                    confidence={confidenceOf(`projects.${index}.name`)}
                    onChange={(value) => setField(`projects.${index}.name`, value)}
                  />
                  <ReviewField
                    label="Your role"
                    value={entry.role}
                    onChange={(value) => setField(`projects.${index}.role`, value)}
                  />
                  <ReviewField
                    label="Live URL"
                    value={entry.url}
                    onChange={(value) => setField(`projects.${index}.url`, value)}
                  />
                  <ReviewField
                    label="Repository URL"
                    value={entry.repoUrl}
                    onChange={(value) => setField(`projects.${index}.repoUrl`, value)}
                  />
                </div>
                <ReviewField
                  label="Description"
                  value={entry.description}
                  multiline
                  rows={3}
                  confidence={confidenceOf(`projects.${index}.description`)}
                  onChange={(value) => setField(`projects.${index}.description`, value)}
                  className="mt-4"
                />
                <BulletEditor
                  label="Highlights"
                  bullets={entry.achievements}
                  onChange={(bullets) =>
                    update((current) => ({
                      ...current,
                      projects: current.projects.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, achievements: bullets } : item,
                      ),
                    }))
                  }
                />
              </EntryCard>
            ))}
          </div>
        </ReviewSection>

        {/* Links */}
        <ReviewSection
          title="Links"
          count={draft.links.length}
          empty={draft.links.length === 0}
          emptyMessage="No links detected."
        >
          <div className="space-y-3">
            {draft.links.map((link, index) => (
              <div key={link.id} className="flex flex-wrap items-end gap-3">
                <div className="min-w-[140px] flex-1">
                  <Label className="mb-1.5">Label</Label>
                  <Input
                    value={link.label}
                    onChange={(event) => setField(`links.${index}.label`, event.target.value)}
                  />
                </div>
                <div className="min-w-[220px] flex-[2]">
                  <Label className="mb-1.5">URL</Label>
                  <Input
                    value={link.url}
                    onChange={(event) => setField(`links.${index}.url`, event.target.value)}
                  />
                </div>
                <Badge variant="secondary" className="mb-2.5">
                  {link.kind}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove link"
                  className="mb-1"
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      links: current.links.filter((item) => item.id !== link.id),
                    }))
                  }
                >
                  <Trash2 />
                </Button>
              </div>
            ))}
          </div>
        </ReviewSection>

        {/* Certifications & languages, shown only when present */}
        {draft.certifications.length > 0 ? (
          <ReviewSection title="Certifications" count={draft.certifications.length}>
            <div className="space-y-3">
              {draft.certifications.map((entry, index) => (
                <div key={entry.id} className="grid gap-3 sm:grid-cols-[2fr_1.4fr_0.8fr_auto]">
                  <ReviewField
                    label="Name"
                    value={entry.name}
                    confidence={confidenceOf(`certifications.${index}.name`)}
                    onChange={(value) => setField(`certifications.${index}.name`, value)}
                  />
                  <ReviewField
                    label="Issuer"
                    value={entry.issuer}
                    confidence={confidenceOf(`certifications.${index}.issuer`)}
                    onChange={(value) => setField(`certifications.${index}.issuer`, value)}
                  />
                  <ReviewField
                    label="Date"
                    value={entry.date}
                    onChange={(value) => setField(`certifications.${index}.date`, value)}
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove certification"
                    className="mt-6"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        certifications: current.certifications.filter(
                          (item) => item.id !== entry.id,
                        ),
                      }))
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </ReviewSection>
        ) : null}

        {draft.languages.length > 0 ? (
          <ReviewSection title="Languages" count={draft.languages.length}>
            <div className="flex flex-wrap gap-2">
              {draft.languages.map((entry, index) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <Input
                    value={entry.name}
                    aria-label="Language"
                    className="h-7 w-[110px] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
                    onChange={(event) =>
                      setField(`languages.${index}.name`, event.target.value)
                    }
                  />
                  {entry.level ? (
                    <Badge variant="secondary">{entry.level}</Badge>
                  ) : null}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove language"
                    onClick={() =>
                      update((current) => ({
                        ...current,
                        languages: current.languages.filter((item) => item.id !== entry.id),
                      }))
                    }
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
          </ReviewSection>
        ) : null}

        <UnclassifiedContent resume={draft} onChange={(next) => setEdited(next)} />
      </div>

      <div className="sticky bottom-0 mt-8 -mx-5 border-t border-border bg-background/95 px-5 py-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {lowConfidenceCount > 0 ? (
              <span className="flex items-center gap-1.5 text-[var(--severity-warning)]">
                <CircleAlert className="size-4" />
                {lowConfidenceCount} {lowConfidenceCount === 1 ? "field" : "fields"} worth a
                second look
              </span>
            ) : (
              "Everything looks reviewed."
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/import">
                <ArrowLeft />
                Different file
              </Link>
            </Button>
            <Button onClick={goToTemplates}>
              Continue
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImportSummaryCard({
  report,
  lowConfidenceCount,
}: {
  report: ParseReport;
  lowConfidenceCount: number;
}) {
  return (
    <Card>
      <CardContent className="p-5 pt-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <FileText className="size-4 text-muted-foreground" />
            {report.fileName}
          </span>
          <span className="text-muted-foreground">{formatBytes(report.fileSize)}</span>
          <span className="text-muted-foreground">
            {report.pageCount} {report.pageCount === 1 ? "page" : "pages"}
          </span>
          <span className="text-muted-foreground">{report.linkCount} links found</span>
          {lowConfidenceCount > 0 ? (
            <Badge variant="warning">{lowConfidenceCount} to review</Badge>
          ) : (
            <Badge variant="success">Parsed cleanly</Badge>
          )}
        </div>

        {report.detectedSections.length > 0 ? (
          <>
            <Separator className="my-4" />
            <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Sections we recognised
            </p>
            <div className="flex flex-wrap gap-1.5">
              {report.detectedSections.map((section, index) => (
                <Badge
                  key={`${section.canonical}-${index}`}
                  variant={section.canonical === "unknown" ? "warning" : "secondary"}
                  className="font-normal"
                >
                  {section.rawHeading || SECTION_LABEL[section.canonical] || section.canonical}
                  <span className="ml-1 opacity-60">{section.lineCount}</span>
                </Badge>
              ))}
            </div>
          </>
        ) : null}

        {report.warnings.length > 0 ? (
          <div className="mt-4 space-y-2">
            {report.warnings.map((warning) => (
              <p
                key={warning}
                className="flex gap-2 rounded-lg bg-[var(--severity-suggestion-bg)] p-3 text-xs leading-relaxed text-[color-mix(in_srgb,var(--severity-suggestion)_85%,#000000)]"
              >
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {warning}
              </p>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function ReviewSection({
  title,
  count,
  children,
  action,
  empty,
  emptyMessage,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
  action?: React.ReactNode;
  empty?: boolean;
  emptyMessage?: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          {title}
          {typeof count === "number" && count > 0 ? (
            <Badge variant="secondary">{count}</Badge>
          ) : null}
        </h2>
        {action}
      </div>
      {empty ? (
        <p className="rounded-lg bg-secondary/60 p-3 text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      ) : (
        children
      )}
    </section>
  );
}

function EntryCard({
  title,
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  title: string;
  index: number;
  total: number;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="truncate text-sm font-medium">{title}</p>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Move up"
            disabled={index === 0}
            onClick={() => onMove(-1)}
          >
            <ChevronUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(1)}
          >
            <ChevronDown />
          </Button>
          <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={onRemove}>
            <Trash2 />
          </Button>
        </div>
      </div>
      {children}
    </div>
  );
}

function BulletEditor({
  label,
  bullets,
  onChange,
}: {
  label: string;
  bullets: string[];
  onChange: (bullets: string[]) => void;
}) {
  return (
    <div className="mt-4">
      <Label className="mb-2">{label}</Label>
      <div className="space-y-2">
        {bullets.map((bullet, index) => (
          <div key={index} className="flex items-start gap-2">
            <span aria-hidden className="mt-2 text-muted-foreground">
              •
            </span>
            <Input
              value={bullet}
              onChange={(event) =>
                onChange(
                  bullets.map((item, itemIndex) =>
                    itemIndex === index ? event.target.value : item,
                  ),
                )
              }
            />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Remove bullet"
              onClick={() => onChange(bullets.filter((_, i) => i !== index))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="ghost" onClick={() => onChange([...bullets, ""])}>
          <Plus />
          Add bullet
        </Button>
      </div>
    </div>
  );
}

/** Sets a dotted string path on a copy of the resume. */
function applyStringPath(resume: ResumeData, path: string, value: string): ResumeData {
  const keys = path.split(".");

  const walk = (node: unknown, index: number): unknown => {
    const key = keys[index];
    const last = index === keys.length - 1;

    if (Array.isArray(node)) {
      const copy = [...node];
      const position = Number(key);
      copy[position] = last ? value : walk(copy[position], index + 1);
      return copy;
    }

    const source = (node ?? {}) as Record<string, unknown>;
    return { ...source, [key]: last ? value : walk(source[key], index + 1) };
  };

  return walk(resume, 0) as ResumeData;
}
