import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:3000', ...devices['Pixel 7'] },
  webServer: { command: 'npm start -- -l 3000', url: 'http://localhost:3000', reuseExistingServer: true },
});
