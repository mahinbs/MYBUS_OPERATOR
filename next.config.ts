import type { NextConfig } from "next";

/** Set when the app is served from a subpath (e.g. GitHub Pages: `/my-repo`). Must start with `/`. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";
/** Vercel runs a standard Next.js build; static export + path patching is for offline/subpath hosts only. */
const isVercel = process.env.VERCEL === "1";

const nextConfig: NextConfig = {
  ...(!isVercel ? { output: "export" as const } : {}),
  ...(basePath
    ? {
        basePath,
        assetPrefix: basePath.endsWith("/") ? basePath : `${basePath}/`,
      }
    : {}),
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
