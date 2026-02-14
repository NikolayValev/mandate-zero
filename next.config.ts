import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config) {
    config.ignoreWarnings = config.ignoreWarnings ?? [];
    config.ignoreWarnings.push({
      module: /@supabase\/realtime-js\/dist\/main\/RealtimeClient\.js/,
      message:
        /Critical dependency: the request of a dependency is an expression/,
    });

    return config;
  },
};

export default nextConfig;
