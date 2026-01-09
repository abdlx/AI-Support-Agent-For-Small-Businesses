import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Externalize LanceDB for server-side (native modules)
  serverExternalPackages: ["@lancedb/lancedb", "apache-arrow"],

  // Use webpack for build (Turbopack doesn't support LanceDB native modules yet)
  turbopack: {},
};

export default nextConfig;
