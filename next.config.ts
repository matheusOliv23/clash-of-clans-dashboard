import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // O canal de debug do Next segura a hidratação até o websocket de
    // desenvolvimento fechar. Com ele ligado, filtros e gráficos não respondem.
    reactDebugChannel: false,
  },
  serverExternalPackages: ["pg", "@prisma/adapter-pg"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
