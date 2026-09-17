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
import { ChevronDown, Copy, GripVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Drag-and-drop list used by every repeatable resume section. Keyboard users can
 * reorder with the handle focused (space to lift, arrows to move).
 */
export function SortableList<T extends { id: string }>({
  items,
  onReorder,
  children,
  className,
}: {
  items: T[];
  onReorder: (from: number, to: number) => void;
  children: (item: T, index: number) => React.ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    if (from === -1 || to === -1) return;
    onReorder(from, to);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className={cn("space-y-2.5", className)}>
          {items.map((item, index) => children(item, index))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/**
 * A collapsible, draggable card for one entry (a job, a degree, a project…).
 */
export function SortableEntry({
  id,
  title,
  subtitle,
  open,
  onOpenChange,
  onRemove,
  onDuplicate,
  badge,
  children,
}: {
  id: string;
  title: string;
  subtitle?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemove: () => void;
  onDuplicate?: () => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "rounded-lg border border-border bg-card",
        isDragging && "relative z-10 shadow-lg",
      )}
    >
      <div className="flex items-center gap-1 px-2 py-2">
        <button
          type="button"
          aria-label="Reorder entry"
          className="cursor-grab rounded p-1 text-muted-foreground/70 hover:bg-secondary hover:text-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>

        <button
          type="button"
          className="min-w-0 flex-1 rounded px-1 py-0.5 text-left"
          onClick={() => onOpenChange(!open)}
          aria-expanded={open}
        >
          <p className="truncate text-[13px] font-medium">
            {title || <span className="text-muted-foreground">Untitled</span>}
          </p>
          {subtitle ? (
            <p className="truncate text-[11px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </button>

        {badge}

        {onDuplicate ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Duplicate entry"
            className="text-muted-foreground"
            onClick={onDuplicate}
          >
            <Copy />
          </Button>
        ) : null}

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label="Remove entry"
          className="text-muted-foreground hover:text-[var(--severity-error)]"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={open ? "Collapse entry" : "Expand entry"}
          className="text-muted-foreground"
          onClick={() => onOpenChange(!open)}
        >
          <ChevronDown className={cn("transition-transform", open && "rotate-180")} />
        </Button>
      </div>

      {open ? (
        <div className="space-y-3 border-t border-border px-3 pt-3 pb-3.5">{children}</div>
      ) : null}
    </div>
  );
}
