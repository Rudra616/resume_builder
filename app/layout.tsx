import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: {
    default: "ResumeForge — Build it. Improve it. Make it yours.",
    template: "%s · ResumeForge",
  },
  description:
    "Create a professional resume from scratch or upload your current resume and transform it into a polished, modern design. No signup, and your resume stays on your device.",
  applicationName: "ResumeForge",
  keywords: [
    "resume builder",
    "resume redesign",
    "CV builder",
    "resume templates",
    "resume import",
  ],
  openGraph: {
    title: "ResumeForge — Build it. Improve it. Make it yours.",
    description:
      "Upload an existing resume or start from scratch, improve the writing and apply one of ten premium templates.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#14213d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
