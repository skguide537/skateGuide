import { defineConfig, devices } from '@playwright/test';
import os from 'os';
import path from 'path';

export default defineConfig({
  testDir: './tests/ui',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list', // Minimal console output, no HTML files
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'off', // No tracing
    screenshot: 'off', // No screenshots
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
