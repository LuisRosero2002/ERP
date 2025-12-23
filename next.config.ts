import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["@prisma/adapter-pg", "pg", "prisma"],
  typescript: {
    ignoreBuildErrors: true
  }
};

export default nextConfig;
