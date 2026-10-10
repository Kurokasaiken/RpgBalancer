import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Ad-hoc config to run specs against an already-running dev/preview server
 * (BASE_URL env, default vite dev :5173). Not part of the committed suite —
 * used when the playwright build is too heavy for the current machine load.
 * `webServer` is unset so nothing is spawned.
 */
export default defineConfig({
  ...baseConfig,
  use: {
    ...baseConfig.use,
    baseURL: process.env.PW_BASE_URL ?? 'http://127.0.0.1:5173',
  },
  webServer: undefined,
});
