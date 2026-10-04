import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:3000' },
  projects: [
    { name: 'chromium', use: devices['Pixel 7'] },
    { name: 'firefox', use: { ...devices['Desktop Firefox'], viewport: { width: 412, height: 915 } } },
    { name: 'webkit', use: devices['iPhone 14'] },
  ],
  webServer: { command: 'npm start -- -l 3000', url: 'http://localhost:3000', reuseExistingServer: true },
});
