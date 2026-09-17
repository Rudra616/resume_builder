"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { SortableEntry, SortableList } from "@/components/builder/SortableList";
import { EmptyState } from "@/components/builder/sections/ExperienceForm";
import {
  BulletsField,
  TagsField,
  TextAreaField,
  TextField,
} from "@/components/builder/fields";
import { Button } from "@/components/ui/button";
import { createEmptyProject } from "@/lib/resume-defaults";
import { useResumeStore } from "@/store/resumeStore";
import type { ProjectEntry } from "@/types/resume";

export function ProjectsForm() {
  const projects = useResumeStore((state) => state.resume.projects);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const moveListItem = useResumeStore((state) => state.moveListItem);
  const [openId, setOpenId] = React.useState<string | null>(projects[0]?.id ?? null);

  const add = () => {
    const entry = createEmptyProject();
    addListItem("projects", entry);
    setOpenId(entry.id);
  };

  const patch = (id: string, value: Partial<ProjectEntry>) =>
    updateListItem("projects", id, value);

  return (
    <div className="space-y-3">
      {projects.length === 0 ? (
        <EmptyState
          message="Projects are a good place to show work that isn't covered by a job."
          onAdd={add}
          label="Add a project"
        />
      ) : (
        <SortableList
          items={projects}
          onReorder={(from, to) => moveListItem("projects", from, to)}
        >
          {(entry, index) => (
            <SortableEntry
              key={entry.id}
              id={entry.id}
              title={entry.name || "New project"}
              subtitle={[entry.role, entry.technologies.slice(0, 3).join(", ")]
                .filter(Boolean)
                .join(" · ")}
              open={openId === entry.id}
              onOpenChange={(open) => setOpenId(open ? entry.id : null)}
              onRemove={() => removeListItem("projects", entry.id)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Project name"
                  value={entry.name}
                  onChange={(value) => patch(entry.id, { name: value })}
                  fieldPath={`projects.${index}.name`}
                  placeholder="Trailhead"
                />
                <TextField
                  label="Your role"
                  hint="optional"
                  value={entry.role}
                  onChange={(value) => patch(entry.id, { role: value })}
                  placeholder="Solo developer"
                />
                <TextField
                  label="Live URL"
                  hint="optional"
                  value={entry.url}
                  onChange={(value) => patch(entry.id, { url: value })}
                  fieldPath={`projects.${index}.url`}
                  placeholder="https://trailhead.app"
                />
                <TextField
                  label="Repository"
                  hint="optional"
                  value={entry.repoUrl}
                  onChange={(value) => patch(entry.id, { repoUrl: value })}
                  fieldPath={`projects.${index}.repoUrl`}
                  placeholder="https://github.com/you/trailhead"
                />
                <TextField
                  label="Start date"
                  hint="optional"
                  value={entry.startDate}
                  onChange={(value) => patch(entry.id, { startDate: value })}
                  placeholder="Feb 2024"
                />
                <TextField
                  label="End date"
                  hint="optional"
                  value={entry.endDate}
                  onChange={(value) => patch(entry.id, { endDate: value })}
                  placeholder="Jun 2024"
                />
              </div>

              <TextAreaField
                label="Description"
                value={entry.description}
                onChange={(value) => patch(entry.id, { description: value })}
                fieldPath={`projects.${index}.description`}
                rows={3}
                placeholder="What it does and what you built."
              />

              <TagsField
                label="Technologies"
                values={entry.technologies}
                onChange={(values) => patch(entry.id, { technologies: values })}
                placeholder="Next.js, PostgreSQL"
              />

              <BulletsField
                label="Highlights"
                hint="optional"
                values={entry.achievements}
                onChange={(values) => patch(entry.id, { achievements: values })}
                fieldPathPrefix={`projects.${index}.achievements`}
                placeholder="Shipped offline sync using a local-first store"
              />
            </SortableEntry>
          )}
        </SortableList>
      )}

      {projects.length > 0 ? (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={add}>
          <Plus />
          Add project
        </Button>
      ) : null}
    </div>
  );
}
