import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Vercel-compatible config */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
