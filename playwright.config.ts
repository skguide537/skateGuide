import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.GITHUB_ACTIONS || process.env.CI);

export default defineConfig({
  testDir: './src/tests/ui',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]]
    : 'list',
  timeout: isCI ? 60000 : 45000,
  expect: { timeout: 10000 },
  globalSetup: './src/tests/ui/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: isCI ? 'retain-on-failure' : 'off',
    screenshot: isCI ? 'only-on-failure' : 'off',
    actionTimeout: 15000,
    navigationTimeout: 30000,
    geolocation: { latitude: 32.073, longitude: 34.789 },
    permissions: ['geolocation'],
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'mkdir -p .next/standalone/public .next/standalone/.next/static && cp -R public/. .next/standalone/public && cp -R .next/static/. .next/standalone/.next/static && node .next/standalone/server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 180000,
    env: {
      // The application uses CI-only mock API responses outside test mode.
      // The workflow supplies an isolated local MongoDB URI to this server.
      CI: '',
      NEXT_TELEMETRY_DISABLED: '1',
      HOSTNAME: '0.0.0.0',
      PORT: '3000',
    },
  },
  outputDir: 'test-results',
  preserveOutput: 'failures-only',
});
