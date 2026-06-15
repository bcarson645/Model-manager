/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Separate from production .next so `next build` does not break a running dev server
  distDir: process.env.NODE_ENV === "production" ? ".next" : ".next-dev",
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false;
      config.resolve.symlinks = false;
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1000,
        aggregateTimeout: 300,
      };
    }
    return config;
  },
};

export default nextConfig;
