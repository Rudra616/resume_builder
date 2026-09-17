import type { Metadata } from "next";
import { ResumeUploader } from "@/components/import/ResumeUploader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";

export const metadata: Metadata = {
  title: "Import a resume",
  description:
    "Upload a PDF, DOCX or TXT resume. ResumeForge reads it in your browser and converts it into editable fields.",
};

export default function ImportPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <ResumeUploader />
      </main>
      <SiteFooter />
    </div>
  );
}
