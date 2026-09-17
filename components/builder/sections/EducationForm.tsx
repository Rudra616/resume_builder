"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { SortableEntry, SortableList } from "@/components/builder/SortableList";
import { EmptyState } from "@/components/builder/sections/ExperienceForm";
import { TextAreaField, TextField } from "@/components/builder/fields";
import { Button } from "@/components/ui/button";
import { createEmptyEducation } from "@/lib/resume-defaults";
import { useResumeStore } from "@/store/resumeStore";
import type { EducationEntry } from "@/types/resume";

export function EducationForm() {
  const education = useResumeStore((state) => state.resume.education);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const moveListItem = useResumeStore((state) => state.moveListItem);
  const [openId, setOpenId] = React.useState<string | null>(education[0]?.id ?? null);

  const add = () => {
    const entry = createEmptyEducation();
    addListItem("education", entry);
    setOpenId(entry.id);
  };

  const patch = (id: string, value: Partial<EducationEntry>) =>
    updateListItem("education", id, value);

  return (
    <div className="space-y-3">
      {education.length === 0 ? (
        <EmptyState
          message="Add your degree, diploma or bootcamp."
          onAdd={add}
          label="Add education"
        />
      ) : (
        <SortableList
          items={education}
          onReorder={(from, to) => moveListItem("education", from, to)}
        >
          {(entry, index) => (
            <SortableEntry
              key={entry.id}
              id={entry.id}
              title={entry.degree || "New qualification"}
              subtitle={[entry.institution, entry.endDate].filter(Boolean).join(" · ")}
              open={openId === entry.id}
              onOpenChange={(open) => setOpenId(open ? entry.id : null)}
              onRemove={() => removeListItem("education", entry.id)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Degree"
                  value={entry.degree}
                  onChange={(value) => patch(entry.id, { degree: value })}
                  fieldPath={`education.${index}.degree`}
                  placeholder="B.E. Computer Engineering"
                />
                <TextField
                  label="Institution"
                  value={entry.institution}
                  onChange={(value) => patch(entry.id, { institution: value })}
                  fieldPath={`education.${index}.institution`}
                  placeholder="Gujarat Technological University"
                />
                <TextField
                  label="Field of study"
                  hint="optional"
                  value={entry.field}
                  onChange={(value) => patch(entry.id, { field: value })}
                  placeholder="Software Engineering"
                />
                <TextField
                  label="Location"
                  hint="optional"
                  value={entry.location}
                  onChange={(value) => patch(entry.id, { location: value })}
                  placeholder="Ahmedabad, IN"
                />
                <TextField
                  label="Start date"
                  value={entry.startDate}
                  onChange={(value) => patch(entry.id, { startDate: value })}
                  fieldPath={`education.${index}.startDate`}
                  placeholder="2016"
                />
                <TextField
                  label="End date"
                  value={entry.endDate}
                  onChange={(value) => patch(entry.id, { endDate: value })}
                  fieldPath={`education.${index}.endDate`}
                  placeholder="2020"
                />
                <TextField
                  label="Grade"
                  hint="optional"
                  value={entry.grade}
                  onChange={(value) => patch(entry.id, { grade: value })}
                  placeholder="8.4 CGPA"
                  className="sm:col-span-2"
                />
              </div>

              <TextAreaField
                label="Notes"
                hint="optional"
                value={entry.description}
                onChange={(value) => patch(entry.id, { description: value })}
                rows={2}
                placeholder="Coursework, thesis or honours worth mentioning."
              />
            </SortableEntry>
          )}
        </SortableList>
      )}

      {education.length > 0 ? (
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={add}>
          <Plus />
          Add education
        </Button>
      ) : null}
    </div>
  );
}
