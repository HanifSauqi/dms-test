import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack configuration - dynamic path resolution for monorepo
  // Points to parent directory (monorepo root) where node_modules/next exists
  turbopack: {
    root: resolve(__dirname, '..'),
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone',
};

export default nextConfig;
