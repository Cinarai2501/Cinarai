import type { NextConfig } from 'next';
import path from 'path';
import fs from 'fs';

// Copy pdf.worker.min.mjs from pdfjs-dist to public/ so PdfViewer can
// reference it as a local static asset instead of an external CDN URL.
// This runs once per build so the worker cannot remain stale after dependency updates.
function copyPdfWorker() {
  const src = path.join(
    path.dirname(require.resolve('pdfjs-dist/package.json')),
    'build',
    'pdf.worker.min.mjs',
  );
  const dest = path.join(process.cwd(), 'public', 'pdf.worker.min.mjs');
  fs.copyFileSync(src, dest);
}

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.alias.canvas = false;
    // Prevent Next from attempting to load native `sharp` binary in environments
    // where it's not available (CI/dev containers). Next will fall back when
    // image optimization cannot use sharp.
    config.resolve.alias.sharp = false;
    if (!isServer) copyPdfWorker();
    return config;
  },
  reactStrictMode: true,
  images: {
    // Explicitly configure allowed quality presets to avoid Next.js
    // runtime warnings about unconfigured `images.qualities` when
    // `quality={100}` is used throughout the app. These presets are
    // harmless defaults and do not change runtime image logic because
    // `unoptimized: true` is already set.
    qualities: [75, 100],
    // Disable Next.js image optimization in constrained build environments
    // where native `sharp` binaries are unavailable. CI should enable/ensure
    // sharp is present if production optimization is required.
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [360, 414, 768, 1024, 1280, 1600],
    imageSizes: [320, 480, 640, 800, 1200, 1600],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.firebaseapp.com',
      },
      {
        protocol: 'https',
        hostname: '**.storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: '**.wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/comics/:slug/comic.pdf',
        headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }],
      },
      {
        source: '/comics/:slug/comic.pdf',
        has: [{ type: 'query', key: 'v' }],
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/comics/generated/:slug/:page.png',
        headers: [{ key: 'Cache-Control', value: 'no-cache, must-revalidate' }],
      },
      {
        source: '/comics/generated/:slug/:page.png',
        has: [{ type: 'query', key: 'v' }],
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
