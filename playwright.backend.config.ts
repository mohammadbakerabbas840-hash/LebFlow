import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir:'./tests/backend', outputDir:'./test-results-backend', workers:1, timeout:60000,
  use:{baseURL:'http://127.0.0.1:8010',browserName:'chromium',channel:'chrome',headless:true,trace:'retain-on-failure',extraHTTPHeaders:{Origin:'http://127.0.0.1:8010',Accept:'application/json'}},
  webServer:[
    {command:'node scripts/serve-test-backend.cjs',url:'http://127.0.0.1:8010/up',timeout:120000,reuseExistingServer:false,stderr:'ignore'},
  ],
});
