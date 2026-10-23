import { defineConfig } from '@playwright/test';
import pagesConfig from './playwright.pages.config';

export default defineConfig({
  ...pagesConfig,
  outputDir: './test-results-vercel',
  use: { ...pagesConfig.use, baseURL: 'http://127.0.0.1:4174/' },
  webServer: {
    command:
      'node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4174 --strictPort --configLoader native',
    url: 'http://127.0.0.1:4174/',
    reuseExistingServer: !process.env.CI,
  },
});
