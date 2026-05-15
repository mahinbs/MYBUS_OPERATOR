import type { NextConfig } from "next";

/** Set when the app is served from a subpath (e.g. GitHub Pages: `/my-repo`). Must start with `/`. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.trim() || "";

const nextConfig: NextConfig = {
  output: "export",
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
  typescript: {
    // ignoreBuildErrors: true,
  },
};

export default nextConfig;
