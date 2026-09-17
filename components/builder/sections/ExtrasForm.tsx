"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { SortableEntry, SortableList } from "@/components/builder/SortableList";
import { EmptyState } from "@/components/builder/sections/ExperienceForm";
import {
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/builder/fields";
import { Button } from "@/components/ui/button";
import { uid } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import type {
  AwardEntry,
  CertificationEntry,
  LanguageEntry,
  LanguageLevel,
  ReferenceEntry,
  VolunteeringEntry,
} from "@/types/resume";

const LEVEL_OPTIONS: { value: LanguageLevel; label: string }[] = [
  { value: "", label: "Not specified" },
  { value: "Native", label: "Native" },
  { value: "Fluent", label: "Fluent" },
  { value: "Professional", label: "Professional" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Basic", label: "Basic" },
];

export function CertificationsForm() {
  const items = useResumeStore((state) => state.resume.certifications);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const moveListItem = useResumeStore((state) => state.moveListItem);
  const [openId, setOpenId] = React.useState<string | null>(items[0]?.id ?? null);

  const add = () => {
    const entry: CertificationEntry = {
      id: uid("cert"),
      name: "",
      issuer: "",
      date: "",
      url: "",
    };
    addListItem("certifications", entry);
    setOpenId(entry.id);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <EmptyState
          message="Certifications and licences go here."
          onAdd={add}
          label="Add certification"
        />
      ) : (
        <SortableList
          items={items}
          onReorder={(from, to) => moveListItem("certifications", from, to)}
        >
          {(entry, index) => (
            <SortableEntry
              key={entry.id}
              id={entry.id}
              title={entry.name || "New certification"}
              subtitle={[entry.issuer, entry.date].filter(Boolean).join(" · ")}
              open={openId === entry.id}
              onOpenChange={(open) => setOpenId(open ? entry.id : null)}
              onRemove={() => removeListItem("certifications", entry.id)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Name"
                  value={entry.name}
                  onChange={(value) =>
                    updateListItem("certifications", entry.id, { name: value })
                  }
                  placeholder="AWS Certified Developer"
                />
                <TextField
                  label="Issuer"
                  value={entry.issuer}
                  onChange={(value) =>
                    updateListItem("certifications", entry.id, { issuer: value })
                  }
                  placeholder="Amazon Web Services"
                />
                <TextField
                  label="Date"
                  value={entry.date}
                  onChange={(value) =>
                    updateListItem("certifications", entry.id, { date: value })
                  }
                  placeholder="Mar 2024"
                />
                <TextField
                  label="Credential URL"
                  hint="optional"
                  value={entry.url}
                  onChange={(value) =>
                    updateListItem("certifications", entry.id, { url: value })
                  }
                  fieldPath={`certifications.${index}.url`}
                  placeholder="https://…"
                />
              </div>
            </SortableEntry>
          )}
        </SortableList>
      )}

      {items.length > 0 ? (
        <AddButton onClick={add} label="Add certification" />
      ) : null}
    </div>
  );
}

export function LanguagesForm() {
  const items = useResumeStore((state) => state.resume.languages);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const moveListItem = useResumeStore((state) => state.moveListItem);

  const add = () => {
    const entry: LanguageEntry = { id: uid("lang"), name: "", level: "" };
    addListItem("languages", entry);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <EmptyState
          message="Useful when you apply across regions."
          onAdd={add}
          label="Add language"
        />
      ) : (
        <SortableList
          items={items}
          onReorder={(from, to) => moveListItem("languages", from, to)}
          className="space-y-2"
        >
          {(entry) => (
            <SortableEntry
              key={entry.id}
              id={entry.id}
              title={entry.name || "New language"}
              subtitle={entry.level || undefined}
              open
              onOpenChange={() => {}}
              onRemove={() => removeListItem("languages", entry.id)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Language"
                  value={entry.name}
                  onChange={(value) =>
                    updateListItem("languages", entry.id, { name: value })
                  }
                  placeholder="English"
                />
                <SelectField
                  label="Proficiency"
                  value={entry.level}
                  onChange={(value) =>
                    updateListItem("languages", entry.id, {
                      level: value as LanguageLevel,
                    })
                  }
                  options={LEVEL_OPTIONS}
                />
              </div>
            </SortableEntry>
          )}
        </SortableList>
      )}

      {items.length > 0 ? <AddButton onClick={add} label="Add language" /> : null}
    </div>
  );
}

export function AwardsForm() {
  const items = useResumeStore((state) => state.resume.awards);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const moveListItem = useResumeStore((state) => state.moveListItem);
  const [openId, setOpenId] = React.useState<string | null>(items[0]?.id ?? null);

  const add = () => {
    const entry: AwardEntry = {
      id: uid("award"),
      title: "",
      issuer: "",
      date: "",
      description: "",
    };
    addListItem("awards", entry);
    setOpenId(entry.id);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <EmptyState message="Recognition, prizes, hackathons." onAdd={add} label="Add award" />
      ) : (
        <SortableList items={items} onReorder={(from, to) => moveListItem("awards", from, to)}>
          {(entry) => (
            <SortableEntry
              key={entry.id}
              id={entry.id}
              title={entry.title || "New award"}
              subtitle={[entry.issuer, entry.date].filter(Boolean).join(" · ")}
              open={openId === entry.id}
              onOpenChange={(open) => setOpenId(open ? entry.id : null)}
              onRemove={() => removeListItem("awards", entry.id)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Title"
                  value={entry.title}
                  onChange={(value) => updateListItem("awards", entry.id, { title: value })}
                  placeholder="Employee of the year"
                />
                <TextField
                  label="Issuer"
                  value={entry.issuer}
                  onChange={(value) => updateListItem("awards", entry.id, { issuer: value })}
                  placeholder="Northwind Labs"
                />
                <TextField
                  label="Date"
                  value={entry.date}
                  onChange={(value) => updateListItem("awards", entry.id, { date: value })}
                  placeholder="2024"
                  className="sm:col-span-2"
                />
              </div>
              <TextAreaField
                label="Description"
                hint="optional"
                value={entry.description}
                onChange={(value) =>
                  updateListItem("awards", entry.id, { description: value })
                }
                rows={2}
              />
            </SortableEntry>
          )}
        </SortableList>
      )}

      {items.length > 0 ? <AddButton onClick={add} label="Add award" /> : null}
    </div>
  );
}

export function VolunteeringForm() {
  const items = useResumeStore((state) => state.resume.volunteering);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const moveListItem = useResumeStore((state) => state.moveListItem);
  const [openId, setOpenId] = React.useState<string | null>(items[0]?.id ?? null);

  const add = () => {
    const entry: VolunteeringEntry = {
      id: uid("vol"),
      role: "",
      organization: "",
      startDate: "",
      endDate: "",
      description: "",
    };
    addListItem("volunteering", entry);
    setOpenId(entry.id);
  };

  return (
    <div className="space-y-3">
      {items.length === 0 ? (
        <EmptyState
          message="Community work, mentoring, open source organising."
          onAdd={add}
          label="Add volunteering"
        />
      ) : (
        <SortableList
          items={items}
          onReorder={(from, to) => moveListItem("volunteering", from, to)}
        >
          {(entry) => (
            <SortableEntry
              key={entry.id}
              id={entry.id}
              title={entry.role || "New volunteering"}
              subtitle={entry.organization || undefined}
              open={openId === entry.id}
              onOpenChange={(open) => setOpenId(open ? entry.id : null)}
              onRemove={() => removeListItem("volunteering", entry.id)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Role"
                  value={entry.role}
                  onChange={(value) =>
                    updateListItem("volunteering", entry.id, { role: value })
                  }
                  placeholder="Mentor"
                />
                <TextField
                  label="Organisation"
                  value={entry.organization}
                  onChange={(value) =>
                    updateListItem("volunteering", entry.id, { organization: value })
                  }
                  placeholder="Code for Good"
                />
                <TextField
                  label="Start date"
                  value={entry.startDate}
                  onChange={(value) =>
                    updateListItem("volunteering", entry.id, { startDate: value })
                  }
                  placeholder="2023"
                />
                <TextField
                  label="End date"
                  value={entry.endDate}
                  onChange={(value) =>
                    updateListItem("volunteering", entry.id, { endDate: value })
                  }
                  placeholder="Present"
                />
              </div>
              <TextAreaField
                label="Description"
                hint="optional"
                value={entry.description}
                onChange={(value) =>
                  updateListItem("volunteering", entry.id, { description: value })
                }
                rows={2}
              />
            </SortableEntry>
          )}
        </SortableList>
      )}

      {items.length > 0 ? <AddButton onClick={add} label="Add volunteering" /> : null}
    </div>
  );
}

export function ReferencesForm() {
  const items = useResumeStore((state) => state.resume.references);
  const addListItem = useResumeStore((state) => state.addListItem);
  const updateListItem = useResumeStore((state) => state.updateListItem);
  const removeListItem = useResumeStore((state) => state.removeListItem);
  const moveListItem = useResumeStore((state) => state.moveListItem);
  const [openId, setOpenId] = React.useState<string | null>(items[0]?.id ?? null);

  const add = () => {
    const entry: ReferenceEntry = {
      id: uid("ref"),
      name: "",
      relationship: "",
      company: "",
      email: "",
      phone: "",
    };
    addListItem("references", entry);
    setOpenId(entry.id);
  };

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Only include references if the employer asked for them, and confirm with each
        person first.
      </p>

      {items.length === 0 ? (
        <EmptyState message="No references listed." onAdd={add} label="Add reference" />
      ) : (
        <SortableList
          items={items}
          onReorder={(from, to) => moveListItem("references", from, to)}
        >
          {(entry, index) => (
            <SortableEntry
              key={entry.id}
              id={entry.id}
              title={entry.name || "New reference"}
              subtitle={[entry.relationship, entry.company].filter(Boolean).join(" · ")}
              open={openId === entry.id}
              onOpenChange={(open) => setOpenId(open ? entry.id : null)}
              onRemove={() => removeListItem("references", entry.id)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField
                  label="Name"
                  value={entry.name}
                  onChange={(value) =>
                    updateListItem("references", entry.id, { name: value })
                  }
                />
                <TextField
                  label="Relationship"
                  value={entry.relationship}
                  onChange={(value) =>
                    updateListItem("references", entry.id, { relationship: value })
                  }
                  placeholder="Former manager"
                />
                <TextField
                  label="Company"
                  value={entry.company}
                  onChange={(value) =>
                    updateListItem("references", entry.id, { company: value })
                  }
                />
                <TextField
                  label="Email"
                  type="email"
                  value={entry.email}
                  onChange={(value) =>
                    updateListItem("references", entry.id, { email: value })
                  }
                  fieldPath={`references.${index}.email`}
                />
                <TextField
                  label="Phone"
                  value={entry.phone}
                  onChange={(value) =>
                    updateListItem("references", entry.id, { phone: value })
                  }
                  className="sm:col-span-2"
                />
              </div>
            </SortableEntry>
          )}
        </SortableList>
      )}

      {items.length > 0 ? <AddButton onClick={add} label="Add reference" /> : null}
    </div>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="outline" size="sm" className="w-full" onClick={onClick}>
      <Plus />
      {label}
    </Button>
  );
}
