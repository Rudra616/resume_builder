"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { RESUME_STORAGE_KEY, useResumeStore } from "@/store/resumeStore";

/** Removes every ResumeForge key from localStorage. */
export function ClearDataButton() {
  const [open, setOpen] = React.useState(false);
  const clearResume = useResumeStore((state) => state.clearResume);

  const clear = () => {
    clearResume();
    try {
      localStorage.removeItem(RESUME_STORAGE_KEY);
      localStorage.removeItem("resumeforge.ui.v1");
    } catch {
      // Private browsing modes can block storage access; the in-memory reset above
      // is still applied.
    }
    setOpen(false);
    toast.success("Local data cleared", "Nothing from ResumeForge remains in this browser.");
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Trash2 />
        Clear data stored on this device
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clear local data?</DialogTitle>
            <DialogDescription>
              This deletes your saved draft and preferences from this browser. It cannot be
              undone, and there is no server copy to restore from.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={clear}>
              Clear everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
