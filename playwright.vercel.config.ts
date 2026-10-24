import { defineConfig } from '@playwright/test';
import backendConfig from './playwright.backend.config';

export default defineConfig({
  ...backendConfig,
  testDir: './tests',
  testMatch: ['backend/**/*.spec.ts', 'vercel/**/*.spec.ts'],
  outputDir: './test-results-vercel',
  use: {
    ...backendConfig.use,
    baseURL: 'http://localhost:4174',
    extraHTTPHeaders: { Origin: 'http://localhost:4174', Accept: 'application/json' },
  },
  webServer: [
    {
      command: 'node scripts/serve-test-backend.cjs',
      env: { TEST_FRONTEND_URL: 'http://localhost:4174' },
      url: 'http://127.0.0.1:8010/up',
      timeout: 120000,
      reuseExistingServer: false,
      stderr: 'ignore',
    },
    {
      command: 'node scripts/serve-test-vercel.cjs',
      url: 'http://localhost:4174/',
      reuseExistingServer: false,
    },
  ],
});
