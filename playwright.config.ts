import { defineConfig } from '@playwright/test';

process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

export default defineConfig({
  testDir: './tests',
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
