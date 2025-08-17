import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'npx next dev -p 3002',
    url: 'http://localhost:3002',
    reuseExistingServer: !process.env.CI,
  },
});
