import { defineConfig, devices } from '@playwright/test';
import os from 'os';
import path from 'path';

export default defineConfig({
  testDir: './src/tests/ui',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Add retries for flaky tests
  workers: process.env.CI ? 1 : 2, // Reduce workers to avoid overwhelming the server
  reporter: 'list', // Minimal console output, no HTML files
  timeout: process.env.CI ? 120000 : 60000, // Increase global timeout to 2 minutes in CI
  expect: {
    timeout: process.env.CI ? 15000 : 10000, // Increase expect timeout in CI
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off', // No tracing
    screenshot: 'off', // No screenshots
    actionTimeout: process.env.CI ? 20000 : 15000, // Increase action timeout in CI
    navigationTimeout: process.env.CI ? 45000 : 30000, // Increase navigation timeout in CI
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Comment out other browsers for now to reduce complexity
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000, // 2 minutes
  },

  // Use system temp directory for output (automatically cleaned up by OS)
  outputDir: path.join(os.tmpdir(), 'playwright-output'),
  preserveOutput: 'never', // Don't preserve any output
});
