import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    ppr: true,
    useCache: true,
    reactCompiler: true,
  },
};

export default nextConfig;
