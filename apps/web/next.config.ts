import type { NextConfig } from 'next';

import { parseEnv } from './src/env/parse';
import { clientSchema, serverSchema } from './src/env/schema';

// Fail the build early if the environment is misconfigured.
parseEnv(serverSchema, process.env, 'server');
parseEnv(clientSchema, process.env, 'client');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: ['@twirl/config-schema', '@twirl/viewer'],
  async headers() {
    return [
      {
        // Baseline hardening for every response. (Vercel adds HSTS on its domains.)
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
          },
        ],
      },
      {
        // Everything except the embed refuses to be framed (clickjacking protection). The embed
        // sends no framing restriction, so any page can show it: `frame-ancestors *` would
        // still block pages without a web origin, such as a local test file.
        source: '/((?!embed/).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        ],
      },
      {
        // embed.js is loaded by other sites; let browsers cache it briefly.
        source: '/embed.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=300, stale-while-revalidate=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;
