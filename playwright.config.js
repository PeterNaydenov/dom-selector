import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test',
  timeout: 30000,
  retries: 0,
  fullyParallel: true,
  reporter: 'list',
  webServer: {
    command: 'npx http-server . -p 5173 -c-1 --cors',
    port: 5173,
    stdout: 'ignore',
    stderr: 'ignore',
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    // Headed Chrome by default for local work; HEADLESS=1 (or CI) runs headless.
    headless: !!process.env.HEADLESS || !!process.env.CI,
    channel: 'chrome',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});