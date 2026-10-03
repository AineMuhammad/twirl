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
        // Everything except the embed refuses to be framed (clickjacking protection).
        source: '/((?!embed/).*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
        ],
      },
      {
        // The embed is meant to be framed by merchants' sites.
        source: '/embed/:path*',
        headers: [{ key: 'Content-Security-Policy', value: 'frame-ancestors *' }],
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
