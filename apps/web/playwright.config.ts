import { defineConfig, devices } from '@playwright/test';

const PORT = 3200;

/**
 * Smoke tests against a production build. Run `pnpm build` first (CI does), then `pnpm e2e`.
 * Chromium uses SwiftShader so WebGL works headless, without a GPU.
 */
export default defineConfig({
  testDir: './e2e',
  // Software WebGL (SwiftShader) renders the full studio scene on the CPU: slow, and two
  // browsers in parallel starve each other. Run one at a time with generous timeouts.
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    launchOptions: {
      args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
    },
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `pnpm start -p ${PORT}`,
    port: PORT,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
