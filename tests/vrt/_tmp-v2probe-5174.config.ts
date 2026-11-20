/** TEMP (conversion run 2026-11-19): v2-probe config pointed at port 5174 —
 *  canonical :5173 is occupied by a different project's dev server
 *  (fighting-style, T-13 shared machine). Identical to
 *  playwright.v2-probe.config.ts except baseURL. */
import { defineConfig } from '@playwright/test';
import base from './playwright.v2-probe.config';

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: 'http://localhost:5174' },
});
