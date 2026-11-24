import crypto from 'node:crypto';
import { defineConfig, devices } from '@playwright/test';

const ephemeralSandboxSecret =
  process.env.KODERA_SANDBOX_EPHEMERAL_SECRET ||
  `Kdr_${crypto.randomBytes(12).toString('hex')}!9`;
process.env.KODERA_SANDBOX_EPHEMERAL_SECRET = ephemeralSandboxSecret;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(process.env.CI ? {} : { channel: 'chrome' }),
      },
    },
  ],
  webServer: {
    command: 'node scripts/dev-sandbox.mjs --port 4173 --host 127.0.0.1',
    url: 'http://127.0.0.1:4173/api/health',
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
