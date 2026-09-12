import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // touched to force a Turbopack module-resolution cache reset
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "xstocks-metadata.backed.fi",
      },
    ],
  },
};

export default nextConfig;
