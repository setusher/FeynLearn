import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The floating dev badge clashes with the no-floating-UI rule; hide it.
  devIndicators: false,
};

export default nextConfig;
