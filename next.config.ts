import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // This repo lives inside E:\location-tracker (npm workspace root) — anchor
  // Turbopack to *this* project so it doesn't treat the outer lockfile as root.
  turbopack: {
    root: __dirname,
  },

  // Keep Prisma + the Neon driver out of the client bundle / bundler graph.
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
  ],
};

export default nextConfig;