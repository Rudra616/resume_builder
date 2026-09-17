"use client";

import * as React from "react";
import {
  Award,
  Briefcase,
  FolderGit2,
  GraduationCap,
  HandHeart,
  Languages,
  Layers,
  ScrollText,
  Sparkles,
  User,
  UserCheck,
  Wrench,
} from "lucide-react";
import { UnclassifiedPanel } from "@/components/builder/UnclassifiedPanel";
import { CustomSectionsForm } from "@/components/builder/sections/CustomSectionsForm";
import { EducationForm } from "@/components/builder/sections/EducationForm";
import { ExperienceForm } from "@/components/builder/sections/ExperienceForm";
import {
  AwardsForm,
  CertificationsForm,
  LanguagesForm,
  ReferencesForm,
  VolunteeringForm,
} from "@/components/builder/sections/ExtrasForm";
import { PersonalInfoForm } from "@/components/builder/sections/PersonalInfoForm";
import { ProjectsForm } from "@/components/builder/sections/ProjectsForm";
import { SkillsForm } from "@/components/builder/sections/SkillsForm";
import { SummaryForm } from "@/components/builder/sections/SummaryForm";
import { useAssistantContext } from "@/components/builder/assistant-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import { useUIStore } from "@/store/uiStore";

interface EditorSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Field-path prefixes used to count this section's open suggestions. */
  paths: string[];
  render: () => React.ReactNode;
}

const SECTIONS: EditorSection[] = [
  {
    id: "personal",
    label: "Personal & links",
    icon: User,
    paths: ["personalInfo", "links"],
    render: () => <PersonalInfoForm />,
  },
  {
    id: "summary",
    label: "Summary",
    icon: Sparkles,
    paths: ["summary"],
    render: () => <SummaryForm />,
  },
  {
    id: "experience",
    label: "Experience",
    icon: Briefcase,
    paths: ["experience"],
    render: () => <ExperienceForm />,
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    paths: ["education"],
    render: () => <EducationForm />,
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderGit2,
    paths: ["projects"],
    render: () => <ProjectsForm />,
  },
  {
    id: "skills",
    label: "Skills",
    icon: Wrench,
    paths: ["skills"],
    render: () => <SkillsForm />,
  },
  {
    id: "certifications",
    label: "Certifications",
    icon: ScrollText,
    paths: ["certifications"],
    render: () => <CertificationsForm />,
  },
  {
    id: "languages",
    label: "Languages",
    icon: Languages,
    paths: ["languages"],
    render: () => <LanguagesForm />,
  },
  {
    id: "awards",
    label: "Awards",
    icon: Award,
    paths: ["awards"],
    render: () => <AwardsForm />,
  },
  {
    id: "volunteering",
    label: "Volunteering",
    icon: HandHeart,
    paths: ["volunteering"],
    render: () => <VolunteeringForm />,
  },
  {
    id: "references",
    label: "References",
    icon: UserCheck,
    paths: ["references"],
    render: () => <ReferencesForm />,
  },
  {
    id: "custom",
    label: "Custom sections",
    icon: Layers,
    paths: ["customSections"],
    render: () => <CustomSectionsForm />,
  },
];

export function EditorPanel({ className }: { className?: string }) {
  const activeId = useUIStore((state) => state.activeEditorSection);
  const setActiveId = useUIStore((state) => state.setActiveEditorSection);
  const unclassified = useResumeStore((state) => state.resume.unclassifiedContent);
  const assistant = useAssistantContext();

  const active = SECTIONS.find((section) => section.id === activeId) ?? SECTIONS[0];

  const countFor = React.useCallback(
    (paths: string[]) =>
      assistant?.suggestions.filter(
        (item) =>
          item.severity !== "success" &&
          paths.some(
            (path) =>
              item.fieldPath === path || item.fieldPath?.startsWith(`${path}.`),
          ),
      ).length ?? 0,
    [assistant],
  );

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <nav className="border-b border-border px-2 py-2">
        <ul className="flex gap-1 overflow-x-auto scrollbar-slim pb-0.5">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const count = countFor(section.paths);
            const isActive = section.id === active.id;
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => setActiveId(section.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap transition-colors",
                    isActive
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                  )}
                >
                  <Icon className="size-3.5" />
                  {section.label}
                  {count > 0 ? (
                    <Badge
                      variant={isActive ? "warning" : "secondary"}
                      className="ml-0.5 px-1.5 py-0 text-[10px] tabular-nums"
                    >
                      {count}
                    </Badge>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-slim px-4 py-4">
        {unclassified.length > 0 ? <UnclassifiedPanel className="mb-4" /> : null}

        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <active.icon className="size-4 text-muted-foreground" />
          {active.label}
        </h2>

        {active.render()}
      </div>
    </div>
  );
}

export { SECTIONS as EDITOR_SECTIONS };
