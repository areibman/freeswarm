/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Disable image optimization for static export
  experimental: {
    // Add any experimental features if needed
  }
};

module.exports = nextConfig;
