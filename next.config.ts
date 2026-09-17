import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The repo documents itself in README.md; no generated agent files.
  agentRules: false,
  // pdfjs-dist ships a browser-only canvas dependency graph that we never use.
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      canvas: false,
    };
    return config;
  },
  turbopack: {
    resolveAlias: {
      canvas: { browser: "./lib/empty-module.ts" },
    },
  },
};

export default nextConfig;
