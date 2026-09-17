"use client";

import * as React from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Eye, EyeOff, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { hasSectionContent, sectionHeading } from "@/lib/resume-view";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import type { SectionKey } from "@/types/resume";

/**
 * Reorders and hides resume sections. Hiding a section never deletes its
 * content — it just stops the template from rendering it.
 */
export function SectionManager({ compact }: { compact?: boolean }) {
  const sectionOrder = useResumeStore((state) => state.resume.sectionOrder);
  const resume = useResumeStore((state) => state.resume);
  const moveSection = useResumeStore((state) => state.moveSection);
  const toggleSection = useResumeStore((state) => state.toggleSection);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = sectionOrder.findIndex((entry) => entry.key === active.id);
    const to = sectionOrder.findIndex((entry) => entry.key === over.id);
    if (from === -1 || to === -1) return;
    moveSection(from, to);
  };

  return (
    <div>
      {!compact ? (
        <p className="mb-2 text-[11px] leading-relaxed text-muted-foreground">
          Drag to reorder. Hidden sections keep their content — they just stop appearing
          in the template.
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={sectionOrder.map((entry) => entry.key)}
          strategy={verticalListSortingStrategy}
        >
          <ul className="space-y-1">
            {sectionOrder.map((entry) => (
              <SectionRow
                key={entry.key}
                sectionKey={entry.key}
                label={sectionHeading(resume, entry.key)}
                visible={entry.visible}
                empty={!hasSectionContent(resume, entry.key)}
                onToggle={() => toggleSection(entry.key)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SectionRow({
  sectionKey,
  label,
  visible,
  empty,
  onToggle,
}: {
  sectionKey: SectionKey;
  label: string;
  visible: boolean;
  empty: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: sectionKey });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1 rounded-md border border-border bg-card px-1.5 py-1.5",
        isDragging && "relative z-10 shadow-md",
        !visible && "opacity-60",
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${label}`}
        className="cursor-grab rounded p-1 text-muted-foreground/70 hover:bg-secondary hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>

      <span className="min-w-0 flex-1 truncate text-xs">
        {label}
        {empty ? (
          <span className="ml-1.5 text-[10px] text-muted-foreground">empty</span>
        ) : null}
      </span>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={visible ? `Hide ${label}` : `Show ${label}`}
        className="text-muted-foreground"
        onClick={onToggle}
      >
        {visible ? <Eye /> : <EyeOff />}
      </Button>
    </li>
  );
}
