/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable Turbopack and use webpack (stable for Tailwind v4)
  experimental: {
    turbopack: false,
  },
};

export default nextConfig;
