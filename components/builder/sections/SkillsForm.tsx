"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { SortableEntry, SortableList } from "@/components/builder/SortableList";
import { EmptyState } from "@/components/builder/sections/ExperienceForm";
import { TagsField, TextField } from "@/components/builder/fields";
import { Button } from "@/components/ui/button";
import { createEmptySkillGroup } from "@/lib/resume-defaults";
import { useResumeStore } from "@/store/resumeStore";
import type { SkillGroup } from "@/types/resume";

const SUGGESTED_GROUPS = ["Frontend", "Backend", "Mobile", "Tooling", "Cloud", "Design"];

export function SkillsForm() {
  const skills = useResumeStore((state) => state.resume.skills);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const moveListItem = useResumeStore((state) => state.moveListItem);
  const [openId, setOpenId] = React.useState<string | null>(skills[0]?.id ?? null);

  const add = (category?: string) => {
    const group = createEmptySkillGroup(category ?? "Core Skills");
    addListItem("skills", group);
    setOpenId(group.id);
  };

  const patch = (id: string, value: Partial<SkillGroup>) =>
    updateListItem("skills", id, value);

  const used = new Set(skills.map((group) => group.category.toLowerCase()));
  const remaining = SUGGESTED_GROUPS.filter((name) => !used.has(name.toLowerCase()));

  return (
    <div className="space-y-3">
      {skills.length === 0 ? (
        <EmptyState
          message="Group your skills so recruiters can scan them quickly."
          onAdd={() => add()}
          label="Add a skill group"
        />
      ) : (
        <SortableList
          items={skills}
          onReorder={(from, to) => moveListItem("skills", from, to)}
        >
          {(group, index) => (
            <SortableEntry
              key={group.id}
              id={group.id}
              title={group.category || "Untitled group"}
              subtitle={`${group.items.length} ${group.items.length === 1 ? "skill" : "skills"}`}
              open={openId === group.id}
              onOpenChange={(open) => setOpenId(open ? group.id : null)}
              onRemove={() => removeListItem("skills", group.id)}
            >
              <TextField
                label="Group name"
                value={group.category}
                onChange={(value) => patch(group.id, { category: value })}
                fieldPath={`skills.${index}.category`}
                placeholder="Frontend"
              />
              <TagsField
                label="Skills"
                values={group.items}
                onChange={(values) => patch(group.id, { items: values })}
                fieldPath={`skills.${index}.items`}
                placeholder="Type a skill, or paste a comma-separated list"
              />
            </SortableEntry>
          )}
        </SortableList>
      )}

      {skills.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button type="button" variant="outline" size="sm" onClick={() => add()}>
            <Plus />
            Add group
          </Button>
          {remaining.slice(0, 4).map((name) => (
            <Button
              key={name}
              type="button"
              size="xs"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => add(name)}
            >
              + {name}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
