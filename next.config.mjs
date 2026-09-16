/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Production uses .next; dev uses .next-dev (must be relative — absolute distDir breaks on Windows).
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
