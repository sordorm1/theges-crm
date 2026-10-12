import type { NextConfig } from "next";
import { BASE_PATH } from "./lib/base-path";

const nextConfig: NextConfig = {
  output: "export",
  basePath: BASE_PATH || undefined,
  assetPrefix: BASE_PATH ? `${BASE_PATH}/` : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
