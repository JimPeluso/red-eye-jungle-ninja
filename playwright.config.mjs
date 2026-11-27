// Playwright test setup. Run with ./dev npm test (inside the Node dev container).
// Two browsers: Chromium on a laptop screen with a keyboard, and WebKit (Safari's engine) as an iPad in landscape.
// The level model and the bot playthrough only need one engine, so they run on Chromium only.
import { defineConfig, devices } from '@playwright/test';

const chromiumOnly = ['levels.spec.mjs', 'playthrough.spec.mjs'];

export default defineConfig({
  testDir: 'tests',
  testMatch: '*.spec.mjs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  workers: process.env.CI ? 2 : undefined,
  timeout: 120_000,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: { trace: 'retain-on-failure' },
  projects: [
    {
      name: 'chromium-laptop',
      use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } },
    },
    {
      name: 'webkit-ipad',
      use: { ...devices['iPad (gen 7) landscape'], viewport: { width: 1024, height: 768 } },
      testIgnore: chromiumOnly,
    },
  ],
});
