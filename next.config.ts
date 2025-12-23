import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  serverExternalPackages: ["@prisma/adapter-libsql", "@libsql/client", "prisma"],
};

export default nextConfig;
