"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  BulletsField,
  TextAreaField,
  TextField,
} from "@/components/builder/fields";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { uid } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import type { CustomSection, CustomSectionItem } from "@/types/resume";

function emptyItem(): CustomSectionItem {
  return {
    id: uid("custom-item"),
    title: "",
    subtitle: "",
    date: "",
    description: "",
    bullets: [],
  };
}

export function CustomSectionsForm({ sectionId }: { sectionId?: string }) {
  const customSections = useResumeStore((state) => state.resume.customSections);
  const addCustomSection = useResumeStore((state) => state.addCustomSection);
  const removeCustomSection = useResumeStore((state) => state.removeCustomSection);
  const updateResume = useResumeStore((state) => state.updateResume);

  const sections = sectionId
    ? customSections.filter((section) => section.id === sectionId)
    : customSections;

  const patchSection = (id: string, patch: Partial<CustomSection>) =>
    updateResume((draft) => ({
      ...draft,
      customSections: draft.customSections.map((section) =>
        section.id === id ? { ...section, ...patch } : section,
      ),
    }));

  const patchItem = (
    sectionKey: string,
    itemId: string,
    patch: Partial<CustomSectionItem>,
  ) =>
    updateResume((draft) => ({
      ...draft,
      customSections: draft.customSections.map((section) =>
        section.id !== sectionKey
          ? section
          : {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
              ),
            },
      ),
    }));

  return (
    <div className="space-y-4">
      {sections.length === 0 ? (
        <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
          Custom sections are useful for publications, speaking, patents — anything the
          standard sections don&apos;t cover.
        </p>
      ) : null}

      {sections.map((section, sectionIndex) => (
        <div key={section.id} className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-end gap-2">
            <TextField
              label="Section heading"
              value={section.heading}
              onChange={(value) => patchSection(section.id, { heading: value })}
              fieldPath={`customSections.${sectionIndex}.heading`}
              placeholder="Publications"
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove section"
              className="mb-0.5 text-muted-foreground hover:text-[var(--severity-error)]"
              onClick={() => removeCustomSection(section.id)}
            >
              <Trash2 />
            </Button>
          </div>

          <div className="mt-3 space-y-3">
            {section.items.map((item, itemIndex) => (
              <div key={item.id}>
                {itemIndex > 0 ? <Separator className="mb-3" /> : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  <TextField
                    label="Title"
                    value={item.title}
                    onChange={(value) => patchItem(section.id, item.id, { title: value })}
                    placeholder="Offline-first mobile architecture"
                  />
                  <TextField
                    label="Subtitle"
                    hint="optional"
                    value={item.subtitle}
                    onChange={(value) =>
                      patchItem(section.id, item.id, { subtitle: value })
                    }
                    placeholder="React Native EU"
                  />
                  <TextField
                    label="Date"
                    hint="optional"
                    value={item.date}
                    onChange={(value) => patchItem(section.id, item.id, { date: value })}
                    placeholder="Sep 2024"
                    className="sm:col-span-2"
                  />
                </div>

                <TextAreaField
                  label="Description"
                  hint="optional"
                  className="mt-3"
                  value={item.description}
                  onChange={(value) =>
                    patchItem(section.id, item.id, { description: value })
                  }
                  fieldPath={`customSections.${sectionIndex}.items.${itemIndex}.description`}
                  rows={2}
                />

                <BulletsField
                  label="Bullets"
                  className="mt-3"
                  values={item.bullets}
                  onChange={(values) => patchItem(section.id, item.id, { bullets: values })}
                  fieldPathPrefix={`customSections.${sectionIndex}.items.${itemIndex}.bullets`}
                />

                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    className="text-muted-foreground hover:text-[var(--severity-error)]"
                    onClick={() =>
                      patchSection(section.id, {
                        items: section.items.filter((entry) => entry.id !== item.id),
                      })
                    }
                  >
                    <Trash2 />
                    Remove entry
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            size="xs"
            variant="outline"
            className="mt-1"
            onClick={() =>
              patchSection(section.id, { items: [...section.items, emptyItem()] })
            }
          >
            <Plus />
            Add entry
          </Button>
        </div>
      ))}

      {!sectionId ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => addCustomSection("New Section", [emptyItem()])}
        >
          <Plus />
          Add custom section
        </Button>
      ) : null}
    </div>
  );
}
