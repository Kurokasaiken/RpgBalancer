import base from './playwright.config';

/**
 * Debug-only config for the WS-0/WS-1 evidence spec stored under test-results/
 * (outside the default testDir). Reuses the manually started `vite preview`
 * on 5179 — dist-playwright must already contain the code under test.
 */
export default {
  ...base,
  testDir: './test-results/plan-043/ws0ws1',
  webServer: undefined,
};
