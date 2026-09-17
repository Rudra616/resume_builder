import * as React from "react";
import type { Metadata } from "next";
import { PreviewStage } from "@/components/preview/PreviewStage";

export const metadata: Metadata = {
  title: "Preview",
  description: "See your resume at full A4 size before you export it.",
};

export default function PreviewPage() {
  return (
    <React.Suspense fallback={null}>
      <PreviewStage />
    </React.Suspense>
  );
}
