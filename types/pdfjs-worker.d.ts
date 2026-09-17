/**
 * The pdf.js worker bundle has no types because it is never called directly:
 * importing it only registers `globalThis.pdfjsWorker` for pdf.js to find. See
 * `loadBundledWorker` in lib/resume-parser/extractPdf.ts.
 */
declare module "pdfjs-dist/build/pdf.worker.min.mjs";
