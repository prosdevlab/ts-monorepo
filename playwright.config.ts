import { defineConfig, devices } from '@playwright/test';

// Browser tests live next to each browser package in e2e/*.e2e.ts and run against its built dist/.
export default defineConfig({
  testMatch: 'packages/*/e2e/**/*.e2e.ts',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
