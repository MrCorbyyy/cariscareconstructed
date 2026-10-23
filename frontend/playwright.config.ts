import { defineConfig, devices } from '@playwright/test';

/**
 * End-to-end tests run against a running frontend (E2E_BASE_URL, default http://localhost:3000)
 * and API. Start both first (see README). Admin credentials come from E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD.
 * The setup project signs in once; other tests reuse that session.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/admin.json' },
      dependencies: ['setup'],
      testIgnore: /(mobile\.spec|auth\.setup)\.ts/,
    },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testMatch: /mobile\.spec\.ts/ },
  ],
});
