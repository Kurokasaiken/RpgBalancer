/**
 * PLAN-127 V2 probe config — runs slicekit-v2-probe.spec.ts against the
 * canonical Vite dev server on :5173 (`.windsurf/rules/10-canonical-dev-port`)
 * instead of the build+preview webServer the root config spawns on :5179.
 *
 * Rationale: the V2 probe measures structural DOM facts (scroll metrics,
 * computed styles, rects) which are build-mode independent — using the dev
 * server keeps iteration ~10x faster than the `preview:playwright` rebuild.
 * The full V3 matrix (PLAN-127 §5) still runs on the preview build.
 *
 * Usage:
 *   npm run dev                      # canonical dev server on :5173
 *   npx playwright test --config tests/vrt/playwright.v2-probe.config.ts
 */

import { defineConfig } from '@playwright/test';
import { resolve } from 'path';
import baseConfig from '../../playwright.config';

export default defineConfig({
  ...baseConfig,
  testDir: '..',
  outputDir: '../../test-results/.artifacts',
  testMatch: 'slicekit-v2-probe.spec.ts',
  // Base config declares these relative to the repo root; re-anchor them so
  // they still resolve from tests/vrt/.
  globalSetup: resolve(process.cwd(), 'tests/helpers/mobileLoggerSetup.ts'),
  globalTeardown: resolve(process.cwd(), 'tests/helpers/mobileLoggerTeardown.ts'),
  // Base reporters include root-relative paths; use a plain list reporter here.
  reporter: [['list']],
  // Desktop only — the probe asserts desktop HUD layout facts. SwiftShader
  // lets Pixi boot its real WebGL path headless (R-304 probe contract).
  projects: (baseConfig.projects ?? [])
    .filter((p) => p.name === 'Desktop Chrome')
    .map((p) => ({
      ...p,
      use: {
        ...p.use,
        launchOptions: { args: ['--enable-unsafe-swiftshader'] },
      },
    })),
  use: {
    ...baseConfig.use,
    baseURL: 'http://localhost:5173',
  },
  webServer: undefined,
});
