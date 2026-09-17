import { Suspense } from "react";
import type { Metadata } from "next";
import { TemplateGallery } from "@/components/templates/TemplateGallery";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Ten premium resume templates with genuinely different layouts. Switch between them at any time without losing content.",
};

export default function TemplatesPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <Suspense
          fallback={
            <div className="py-24 text-center text-sm text-muted-foreground">
              Loading templates…
            </div>
          }
        >
          <TemplateGallery />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
