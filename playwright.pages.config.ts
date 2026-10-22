import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/pages',
  outputDir: './test-results-pages',
  workers: 1,
  timeout: 30000,
  use: {
    baseURL: 'http://127.0.0.1:4173/LebFlow/',
    browserName: 'chromium',
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'node node_modules/vite/bin/vite.js preview --mode pages --host 127.0.0.1 --port 4173 --strictPort --configLoader native',
    url: 'http://127.0.0.1:4173/LebFlow/',
    reuseExistingServer: !process.env.CI,
  },
});
