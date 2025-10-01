import { defineConfig, devices } from '@playwright/test';
import os from 'os';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  testDir: './src/tests/ui',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1, // Add retries for flaky tests
  // Use maximum recommended workers: all cores locally, half cores in CI for stability
  workers: process.env.CI ? '50%' : '100%',
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
    // Ensure geolocation-based features work consistently in all tests (especially CI)
    geolocation: { latitude: 32.073, longitude: 34.789 },
    permissions: ['geolocation'],
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
    // Use production server; CI builds earlier
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180 * 1000, // 3 minutes for build+start
  },

  // Use system temp directory for output (automatically cleaned up by OS)
  outputDir: path.join(os.tmpdir(), 'playwright-output'),
  preserveOutput: 'never', // Don't preserve any output
});
