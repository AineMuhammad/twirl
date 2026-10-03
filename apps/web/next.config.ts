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
};

export default nextConfig;
