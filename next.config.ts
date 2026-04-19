import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  experimental: {
    turbopack: {
      root: __dirname,
    },
  },
};

export default nextConfig;
