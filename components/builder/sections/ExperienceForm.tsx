"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { SortableEntry, SortableList } from "@/components/builder/SortableList";
import {
  BulletsField,
  TagsField,
  TextAreaField,
  TextField,
} from "@/components/builder/fields";
import { useAssistantContext } from "@/components/builder/assistant-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createEmptyExperience } from "@/lib/resume-defaults";
import { useResumeStore } from "@/store/resumeStore";
import type { ExperienceEntry } from "@/types/resume";
import { uid } from "@/lib/utils";

export function ExperienceForm() {
  const experience = useResumeStore((state) => state.resume.experience);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const moveListItem = useResumeStore((state) => state.moveListItem);
  const assistant = useAssistantContext();

  const [openId, setOpenId] = React.useState<string | null>(
    experience[0]?.id ?? null,
  );

  const add = () => {
    const entry = createEmptyExperience();
    addListItem("experience", entry);
    setOpenId(entry.id);
  };

  const patch = (id: string, value: Partial<ExperienceEntry>) =>
    updateListItem("experience", id, value);

  return (
    <div className="space-y-3">
      {experience.length === 0 ? (
        <EmptyState
          message="Add the roles you want on this resume. Most recent first works best."
          onAdd={add}
          label="Add your first role"
        />
      ) : (
        <SortableList
          items={experience}
          onReorder={(from, to) => moveListItem("experience", from, to)}
        >
          {(entry, index) => {
            const issues =
              assistant?.suggestions.filter(
                (item) =>
                  item.fieldPath?.startsWith(`experience.${index}.`) &&
                  item.severity !== "success",
              ).length ?? 0;

            return (
              <SortableEntry
                key={entry.id}
                id={entry.id}
                title={entry.role || "New role"}
                subtitle={[entry.company, entry.startDate && `${entry.startDate} – ${entry.current ? "Present" : entry.endDate || "?"}`]
                  .filter(Boolean)
                  .join(" · ")}
                open={openId === entry.id}
                onOpenChange={(open) => setOpenId(open ? entry.id : null)}
                onRemove={() => removeListItem("experience", entry.id)}
                onDuplicate={() =>
                  addListItem("experience", {
                    ...entry,
                    id: uid("exp"),
                    role: `${entry.role} (copy)`,
                  })
                }
                badge={
                  issues > 0 ? (
                    <Badge variant="warning" className="tabular-nums">
                      {issues}
                    </Badge>
                  ) : null
                }
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Role"
                    value={entry.role}
                    onChange={(value) => patch(entry.id, { role: value })}
                    fieldPath={`experience.${index}.role`}
                    placeholder="Senior React Native Developer"
                  />
                  <TextField
                    label="Company"
                    value={entry.company}
                    onChange={(value) => patch(entry.id, { company: value })}
                    fieldPath={`experience.${index}.company`}
                    placeholder="Northwind Labs"
                  />
                  <TextField
                    label="Location"
                    value={entry.location}
                    onChange={(value) => patch(entry.id, { location: value })}
                    placeholder="Remote · Ahmedabad, IN"
                    className="sm:col-span-2"
                  />
                  <TextField
                    label="Start date"
                    value={entry.startDate}
                    onChange={(value) => patch(entry.id, { startDate: value })}
                    fieldPath={`experience.${index}.startDate`}
                    placeholder="Jan 2022"
                  />
                  <TextField
                    label="End date"
                    value={entry.current ? "" : entry.endDate}
                    onChange={(value) => patch(entry.id, { endDate: value })}
                    fieldPath={`experience.${index}.endDate`}
                    placeholder={entry.current ? "Present" : "Mar 2024"}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Switch
                    id={`current-${entry.id}`}
                    checked={entry.current}
                    onCheckedChange={(checked) =>
                      patch(entry.id, {
                        current: checked,
                        endDate: checked ? "" : entry.endDate,
                      })
                    }
                  />
                  <Label htmlFor={`current-${entry.id}`} className="text-xs font-normal">
                    I currently work here
                  </Label>
                </div>

                <TextAreaField
                  label="Role summary"
                  hint="optional"
                  value={entry.description}
                  onChange={(value) => patch(entry.id, { description: value })}
                  fieldPath={`experience.${index}.description`}
                  rows={3}
                  placeholder="One or two lines about the team, product or scope."
                />

                <BulletsField
                  label="Achievements"
                  values={entry.achievements}
                  onChange={(values) => patch(entry.id, { achievements: values })}
                  fieldPathPrefix={`experience.${index}.achievements`}
                  hint="1–2 lines each"
                  placeholder="Rebuilt the checkout flow, cutting crash reports on Android"
                />

                <TagsField
                  label="Technologies"
                  hint="optional"
                  values={entry.technologies}
                  onChange={(values) => patch(entry.id, { technologies: values })}
                  placeholder="React Native, TypeScript"
                />
              </SortableEntry>
            );
          }}
        </SortableList>
      )}

      {experience.length > 0 ? (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={add}>
          <Plus />
          Add role
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  message,
  onAdd,
  label,
}: {
  message: string;
  onAdd: () => void;
  label: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border px-4 py-6 text-center">
      <p className="text-xs text-muted-foreground">{message}</p>
      <Button type="button" size="sm" variant="outline" className="mt-3" onClick={onAdd}>
        <Plus />
        {label}
      </Button>
    </div>
  );
}
