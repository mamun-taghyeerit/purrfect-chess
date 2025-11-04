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

  // Configure webpack for Web Workers and stockfish package
  webpack: (config, { isServer }) => {
    // Handle Web Workers in client-side builds
    if (!isServer) {
      // Support for dynamic imports of workers
      config.output.publicPath = '/_next/';
      
      // Ensure proper handling of .wasm files for stockfish
      config.experiments = {
        ...config.experiments,
        asyncWebAssembly: true,
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    // Enable server actions if needed in the future
    // serverActions: true,
  },
};

export default nextConfig;
