import { PlaywrightTestConfig, devices } from '@playwright/test';

// Prefer APP_URL from environment, fall back to localhost:4002 for local dev
const appUrl = process.env.APP_URL || 'http://localhost:4002';

const config: PlaywrightTestConfig = {
  workers: 1,
  globalSetup: require.resolve('./tests/e2e/support/globalSetup.ts'),
  // Timeout per test
  timeout: 100 * 1000,
  // Assertion timeout
  expect: {
    timeout: 10 * 1000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: 'support/*.setup.ts',
      teardown: 'cleanup db',
    },
    {
      name: 'cleanup db',
      testMatch: 'support/*.teardown.ts',
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
  reporter: 'html',
  webServer: {
    command: 'npm run start',
    url: appUrl,
    reuseExistingServer: !process.env.CI,
  },
  retries: 1,
  use: {
    headless: true,
    ignoreHTTPSErrors: true,
    baseURL: appUrl,
    trace: 'retain-on-first-failure',
  },
  testDir: './tests/e2e',
};

export default config;
