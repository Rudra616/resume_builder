import * as React from "react";
import type { Metadata } from "next";
import { BuilderShell } from "@/components/builder/BuilderShell";

export const metadata: Metadata = {
  title: "Resume builder",
  description:
    "Edit your resume, review writing suggestions and export a text-based PDF — all in your browser.",
};

export default function BuilderPage() {
  return (
    <React.Suspense fallback={null}>
      <BuilderShell />
    </React.Suspense>
  );
}
