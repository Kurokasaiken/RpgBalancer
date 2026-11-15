/**
 * MUST-PASS fixture for skin:no-adhoc-css (PLAN-122 T-3).
 * The sanctioned path for a new skin: a preset registered in
 * skinConfigRegistry — not a standalone .css file. A non-.css file is
 * simply outside this check's surface and MUST pass.
 * `governance:check --selftest` verifies that.
 */
export const fixtureSkinPreset = {
  id: 'fixture-preset',
  tokens: {
    '--skin-surface': '#1a0f2e',
  },
} as const;
