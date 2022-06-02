import { type PlaywrightTestConfig } from '@playwright/test';
import * as os from 'os';
const cpuCount = os.cpus().length;
const slowMotionMs = 0;
const config: PlaywrightTestConfig = {
  testDir: 'tests',
  outputDir: '../test-results',
  timeout: slowMotionMs * 120 || 30000,
  // It's recommended to only use a maximum of a quarter of the available CPU cores,
  // otherwise a few tests could fail due to the heavy CPU load.
  // But feel free to try higher values for your machine.
  workers: Math.max(1, Math.floor(cpuCount / 4)),
  retries: 1, // Retry each failed test one time to create a tracing file (trace-option 'on-first-retry' below)
  use: {
    // Browser options
    headless: false,
    // Context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Artifacts
    screenshot: 'only-on-failure',
    video: 'retry-with-video',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'Chromium',
      use: {
        browserName: 'chromium',
        launchOptions: {
          devtools: true,
          slowMo: slowMotionMs,
          args: [
            // Comment the next line in if you want the dev tools to open automatically after the browser opened
            // '--auto-open-devtools-for-tabs',
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream',
          ],
        },
        permissions: ['camera'],
      },
    },
    {
      name: 'Firefox',
      use: {
        browserName: 'firefox',
        launchOptions: {
          slowMo: slowMotionMs,
          firefoxUserPrefs: {
            'media.navigator.streams.fake': true,
            'media.navigator.permission.disabled': true,
          },
        },
      },
    },
    {
      name: 'WebKit',
      use: {
        browserName: 'webkit',
      },
    },
  ],
};
export default config;
