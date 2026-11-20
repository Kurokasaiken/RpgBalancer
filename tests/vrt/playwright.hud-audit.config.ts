/**
 * PLAN-127/128 HUD scale audit config — runs slicekit-hud-audit.spec.ts
 * against the canonical Vite dev server on :5173
 * (`.windsurf/rules/10-canonical-dev-port`). Headless Chromium +
 * `--enable-unsafe-swiftshader` so Pixi boots its real WebGL path (R-304).
 *
 * NOTE (audit run 2026-11-20): canonical :5173 was occupied by a FOREIGN
 * project's dev server (`fighting-style`, PID on lsof — not ours, not killed).
 * This config targets :5174 via HUD_AUDIT_PORT fallback — the audit is a
 * harness run and the rule allows harness port overrides.
 *
 * Usage:
 *   npm run dev -- --port 5174 --strictPort   # when :5173 is occupied
 *   HUD_AUDIT_PORT=5174 npx playwright test --config tests/vrt/playwright.hud-audit.config.ts
 */

import { defineConfig } from '@playwright/test';
import { resolve } from 'path';
import baseConfig from '../../playwright.config';

export default defineConfig({
  ...baseConfig,
  testDir: '..',
  outputDir: '../../test-results/.artifacts',
  testMatch: 'slicekit-hud-audit.spec.ts',
  globalSetup: resolve(process.cwd(), 'tests/helpers/mobileLoggerSetup.ts'),
  globalTeardown: resolve(process.cwd(), 'tests/helpers/mobileLoggerTeardown.ts'),
  reporter: [['list']],
  timeout: 600_000,
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
    baseURL: `http://localhost:${process.env.HUD_AUDIT_PORT ?? '5173'}`,
  },
  webServer: undefined,
});
