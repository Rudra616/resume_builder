import type { Metadata } from "next";
import { SiteHeader } from "@/components/site/SiteHeader";
import { TemplateCompare } from "@/components/templates/TemplateCompare";

export const metadata: Metadata = {
  title: "Compare templates",
  description:
    "See your own resume side by side in up to three premium templates before you choose.",
};

export default function ComparePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10">
        <TemplateCompare />
      </main>
    </div>
  );
}
