/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  // Disable image optimization for static export
  experimental: {
    // Add any experimental features if needed
  },
  // Exclude backend directory from build
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        sqlite3: false,
      };
    }
    
    // Exclude backend files from the build
    config.module.rules.push({
      test: /backend/,
      use: 'ignore-loader'
    });
    
    return config;
  },
};

module.exports = nextConfig;
