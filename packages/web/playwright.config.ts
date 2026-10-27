import { defineConfig, devices } from '@playwright/test';

// Browser tests live in e2e/*.e2e.ts and run against this package's built dist/.
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
