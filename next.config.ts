import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    reactCompiler: false,
  },
  webpack: (config) => {
    // Disable Webpack's filesystem cache to avoid PackFileCacheStrategy
    // errors like `Cannot read properties of undefined (reading 'lastAccess')`
    // during development. This trades a small amount of rebuild speed for
    // stability until the upstream issue is resolved.
    config.cache = false;
    return config;
  },
};

export default config;
