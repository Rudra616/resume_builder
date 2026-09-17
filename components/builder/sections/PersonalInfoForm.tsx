"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { PhotoUploader } from "@/components/builder/PhotoUploader";
import { SortableEntry, SortableList } from "@/components/builder/SortableList";
import { SelectField, TextField } from "@/components/builder/fields";
import { Button } from "@/components/ui/button";
import { LINK_KIND_OPTIONS, normalizeUrl } from "@/lib/links";
import { uid } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import type { LinkKind } from "@/types/resume";

export function PersonalInfoForm() {
  const personalInfo = useResumeStore((state) => state.resume.personalInfo);
  const links = useResumeStore((state) => state.resume.links);
  const setFieldByPath = useResumeStore((state) => state.setFieldByPath);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const moveListItem = useResumeStore((state) => state.moveListItem);
  const [openLink, setOpenLink] = React.useState<string | null>(null);

  const set = (field: string) => (value: string) =>
    setFieldByPath(`personalInfo.${field}`, value);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TextField
          label="Full name"
          value={personalInfo.fullName}
          onChange={set("fullName")}
          fieldPath="personalInfo.fullName"
          placeholder="Rudra Panchal"
          autoComplete="name"
        />
        <TextField
          label="Professional title"
          value={personalInfo.jobTitle}
          onChange={set("jobTitle")}
          fieldPath="personalInfo.jobTitle"
          placeholder="React Native Developer"
        />
        <TextField
          label="Email"
          type="email"
          value={personalInfo.email}
          onChange={set("email")}
          fieldPath="personalInfo.email"
          placeholder="you@example.com"
          inputMode="email"
          autoComplete="email"
        />
        <TextField
          label="Phone"
          value={personalInfo.phone}
          onChange={set("phone")}
          fieldPath="personalInfo.phone"
          placeholder="+91 98765 43210"
          inputMode="tel"
          autoComplete="tel"
        />
        <TextField
          label="City"
          value={personalInfo.city}
          onChange={set("city")}
          fieldPath="personalInfo.city"
          placeholder="Ahmedabad"
        />
        <TextField
          label="State / region"
          value={personalInfo.state}
          onChange={set("state")}
          placeholder="Gujarat"
        />
        <TextField
          label="Country"
          value={personalInfo.country}
          onChange={set("country")}
          placeholder="India"
          className="sm:col-span-2"
        />
      </div>

      <PhotoUploader />

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-semibold">Links</h3>
            <p className="text-[11px] text-muted-foreground">
              Stay clickable in the preview and the exported PDF.
            </p>
          </div>
          <Button
            type="button"
            size="xs"
            variant="outline"
            onClick={() => {
              const id = uid("link");
              addListItem("links", { id, kind: "custom", label: "", url: "" });
              setOpenLink(id);
            }}
          >
            <Plus />
            Add link
          </Button>
        </div>

        {links.length === 0 ? (
          <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted-foreground">
            No links yet. LinkedIn and GitHub are the two most commonly expected.
          </p>
        ) : (
          <SortableList
            items={links}
            onReorder={(from, to) => moveListItem("links", from, to)}
          >
            {(link, index) => (
              <SortableEntry
                key={link.id}
                id={link.id}
                title={link.label || LINK_KIND_OPTIONS.find((o) => o.value === link.kind)?.label || "Link"}
                subtitle={link.url}
                open={openLink === link.id}
                onOpenChange={(open) => setOpenLink(open ? link.id : null)}
                onRemove={() => removeListItem("links", link.id)}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <SelectField
                    label="Type"
                    value={link.kind}
                    onChange={(value) =>
                      updateListItem("links", link.id, { kind: value as LinkKind })
                    }
                    options={LINK_KIND_OPTIONS}
                  />
                  <TextField
                    label="Label"
                    value={link.label}
                    onChange={(value) => updateListItem("links", link.id, { label: value })}
                    placeholder="linkedin.com/in/username"
                  />
                </div>
                <TextField
                  label="URL"
                  value={link.url}
                  onChange={(value) => updateListItem("links", link.id, { url: value })}
                  fieldPath={`links.${index}.url`}
                  placeholder="https://linkedin.com/in/username"
                  hint="https:// is added automatically"
                />
                {link.url && normalizeUrl(link.url) !== link.url ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      updateListItem("links", link.id, { url: normalizeUrl(link.url) })
                    }
                  >
                    Normalise to {normalizeUrl(link.url)}
                  </Button>
                ) : null}
              </SortableEntry>
            )}
          </SortableList>
        )}
      </div>
    </div>
  );
}
