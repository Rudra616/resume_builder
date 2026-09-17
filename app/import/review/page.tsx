import type { Metadata } from "next";
import { ImportReview } from "@/components/import/ImportReview";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Review your resume",
  description:
    "Check and correct the information extracted from your uploaded resume before choosing a template.",
};

export default function ImportReviewPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <ImportReview />
      </main>
    </div>
  );
}
