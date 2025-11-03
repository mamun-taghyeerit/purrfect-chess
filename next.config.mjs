/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Output directory customization (optional)
  // distDir: '.next',

  // Configure TypeScript
  typescript: {
    // Set to false if you want production builds to complete even with type errors
    ignoreBuildErrors: false,
  },

  // Configure ESLint
  eslint: {
    // Don't run ESLint during production builds (we'll run it separately)
    ignoreDuringBuilds: false,
  },

  // Configure webpack to handle Web Workers
  webpack: (config, { isServer }) => {
    // Add support for Web Workers
    if (!isServer) {
      config.output.publicPath = '/_next/';
    }

    // Handle worker files
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: { loader: 'worker-loader' },
    });

    return config;
  },

  // Experimental features
  experimental: {
    // Enable server actions if needed in the future
    // serverActions: true,
  },
};

export default nextConfig;
