import type { NextConfig } from 'next';
import path from 'path';
import fs from 'fs';

// Copy pdf.worker.min.mjs from pdfjs-dist to public/ so PdfViewer can
// reference it as a local static asset instead of an external CDN URL.
// This runs once per build (isServer guard prevents double-copy).
function copyPdfWorker() {
  const src = path.join(
    path.dirname(require.resolve('pdfjs-dist/package.json')),
    'build',
    'pdf.worker.min.mjs',
  );
  const dest = path.join(process.cwd(), 'public', 'pdf.worker.min.mjs');
  if (!fs.existsSync(dest)) {
    fs.copyFileSync(src, dest);
  }
}

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    if (!isServer) copyPdfWorker();
    return config;
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.firebaseapp.com',
      },
      {
        protocol: 'https',
        hostname: '**.storage.googleapis.com',
      },
    ],
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
