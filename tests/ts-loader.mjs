/**
 * Minimal ESM loader so `node --test` can run the TypeScript test files on any
 * Node 20+ install: it resolves the `@/*` path alias from tsconfig and strips
 * types with esbuild. Registered via `node --import ./tests/register.mjs`.
 */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve as resolvePath } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { transform } from "esbuild";

const root = resolvePath(dirname(fileURLToPath(import.meta.url)), "..");
const CANDIDATES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function firstExisting(basePath) {
  for (const suffix of CANDIDATES) {
    const candidate = `${basePath}${suffix}`;
    if (existsSync(candidate) && !candidate.endsWith("/")) return candidate;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const found = firstExisting(resolvePath(root, specifier.slice(2)));
    if (found) return { url: pathToFileURL(found).href, format: "module", shortCircuit: true };
  }

  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const parentDir = dirname(fileURLToPath(context.parentURL));
    const found = firstExisting(resolvePath(parentDir, specifier));
    if (found) return { url: pathToFileURL(found).href, format: "module", shortCircuit: true };
  }

  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (/\.tsx?$/.test(url)) {
    const path = fileURLToPath(url);
    const { code } = await transform(readFileSync(path, "utf8"), {
      loader: url.endsWith(".tsx") ? "tsx" : "ts",
      format: "esm",
      target: "node20",
      sourcefile: path,
    });
    return { format: "module", source: code, shortCircuit: true };
  }

  return nextLoad(url, context);
}
