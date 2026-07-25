/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true
  },
  webpack: (config) => {
    // pdf-lib/fontkit needs this to resolve cleanly in the serverless bundle
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    return config;
  }
};

module.exports = nextConfig;
