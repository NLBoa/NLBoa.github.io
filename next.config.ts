import type { NextConfig } from "next";

/**
 * The site is exported as plain static files (the `out/` folder) so it can be
 * hosted on GitHub Pages. A project site lives under a sub-path such as
 * /portfolio; the deploy workflow passes it in as NEXT_PUBLIC_BASE_PATH.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  // Every page is written as <path>/index.html, which any static host serves.
  trailingSlash: true,
  // No image server on a static host.
  images: { unoptimized: true },
};

export default nextConfig;
