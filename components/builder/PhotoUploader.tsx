"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Trash2, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useResumeStore } from "@/store/resumeStore";
import type { PersonalInfo } from "@/types/resume";

const MAX_DIMENSION = 512;
const ACCEPTED = ["image/png", "image/jpeg", "image/webp"];

/**
 * Resizes the chosen image with the browser Canvas API before storing it as a
 * data URL. Nothing is uploaded anywhere — the photo lives in localStorage with
 * the rest of the draft.
 */
async function resizePhoto(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read that image."));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const element = new window.Image();
    element.onload = () => resolve(element);
    element.onerror = () => reject(new Error("That image could not be decoded."));
    element.src = dataUrl;
  });

  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale);
  const height = Math.round(image.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  // JPEG keeps the stored draft small enough for localStorage quotas.
  return canvas.toDataURL("image/jpeg", 0.88);
}

const SHAPES: { value: NonNullable<PersonalInfo["photoShape"]>; label: string }[] = [
  { value: "circle", label: "Circle" },
  { value: "rounded", label: "Rounded" },
  { value: "square", label: "Square" },
];

export function PhotoUploader() {
  const personalInfo = useResumeStore((state) => state.resume.personalInfo);
  const showPhoto = useResumeStore((state) => state.resume.design.showPhoto);
  const setFieldByPath = useResumeStore((state) => state.setFieldByPath);
  const setDesign = useResumeStore((state) => state.setDesign);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      toast.error("Unsupported image", "Use a PNG, JPEG or WebP image.");
      return;
    }
    setBusy(true);
    try {
      const resized = await resizePhoto(file);
      setFieldByPath("personalInfo.photo", resized);
      if (!personalInfo.photoShape) setFieldByPath("personalInfo.photoShape", "circle");
      if (!showPhoto) setDesign({ showPhoto: true });
    } catch (error) {
      toast.error(
        "Could not use that image",
        error instanceof Error ? error.message : undefined,
      );
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const photo = personalInfo.photo;
  const shape = personalInfo.photoShape ?? "circle";

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "grid size-16 shrink-0 place-items-center overflow-hidden bg-secondary text-muted-foreground",
            shape === "circle" && "rounded-full",
            shape === "rounded" && "rounded-lg",
          )}
        >
          {photo ? (
            <Image
              src={photo}
              alt="Profile photo preview"
              width={64}
              height={64}
              unoptimized
              className="size-16 object-cover"
            />
          ) : (
            <UserRound className="size-6" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium">
            {photo ? "Profile photo" : "Add a profile photo?"}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
            Optional. Resized in your browser, stored only on this device. Templates
            without a photo slot simply ignore it.
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus />
              {busy ? "Processing…" : photo ? "Replace" : "Upload Photo"}
            </Button>

            {photo ? (
              <>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  className="text-muted-foreground hover:text-[var(--severity-error)]"
                  onClick={() => setFieldByPath("personalInfo.photo", "")}
                >
                  <Trash2 />
                  Remove
                </Button>
                <div className="ml-auto flex items-center gap-1.5">
                  {SHAPES.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={cn(
                        "rounded-md px-1.5 py-0.5 text-[11px]",
                        shape === option.value
                          ? "bg-secondary font-medium"
                          : "text-muted-foreground hover:bg-secondary/60",
                      )}
                      onClick={() =>
                        setFieldByPath("personalInfo.photoShape", option.value)
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          {photo ? (
            <div className="mt-2.5 flex items-center gap-2">
              <Switch
                id="show-photo"
                checked={showPhoto}
                onCheckedChange={(checked) => setDesign({ showPhoto: checked })}
              />
              <Label htmlFor="show-photo" className="text-xs font-normal">
                Show photo in template
              </Label>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
