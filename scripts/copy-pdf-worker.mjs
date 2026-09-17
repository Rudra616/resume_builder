// Copies the pdf.js worker into /public so the browser can load it from a
// same-origin URL. Keeps PDF parsing entirely client-side.
import { copyFile, mkdir, access } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);

const candidates = [
  "pdfjs-dist/build/pdf.worker.min.mjs",
  "pdfjs-dist/build/pdf.worker.mjs",
];

async function main() {
  const publicDir = path.join(process.cwd(), "public");
  await mkdir(publicDir, { recursive: true });

  for (const candidate of candidates) {
    try {
      const resolved = require.resolve(candidate);
      await access(resolved);
      await copyFile(resolved, path.join(publicDir, "pdf.worker.min.mjs"));
      console.log(`[resumeforge] pdf worker copied from ${candidate}`);
      return;
    } catch {
      // try next candidate
    }
  }

  console.warn(
    "[resumeforge] Could not locate the pdfjs-dist worker. PDF import will fall back to the bundled worker.",
  );
}

main().catch((error) => {
  console.warn("[resumeforge] pdf worker copy failed:", error?.message ?? error);
});
