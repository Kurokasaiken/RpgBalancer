import base from './playwright.config';

/**
 * Debug-only config: reuses a manually started `vite preview` on 5179 instead of
 * running `preview:playwright` (sync + full build + preview) on every run. Not for
 * CI — the served dist-playwright must already contain the code under test.
 */
export default {
  ...base,
  /* Separate port: concurrent sessions fight over 5179 (strictPort). */
  use: { ...base.use, baseURL: 'http://127.0.0.1:5199' },
  webServer: undefined,
};
