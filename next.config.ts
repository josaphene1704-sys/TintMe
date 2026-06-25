import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL || "https://descriptive-grasshopper-402.convex.cloud",
  },
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
