// Fails unless the headless witness ran end to end: every step PASS, zero console/page errors, 1280x720.
const r = require('../plan076-witness/results.json');
const fails = r.steps.filter((s) => !s.pass);
if (fails.length || r.errors.length || r.viewport !== '1280x720' || r.steps.length < 16) {
  console.error('witness not clean', { fails, errors: r.errors.slice(0, 3), steps: r.steps.length });
  process.exit(1);
}
console.log(`witness clean: ${r.steps.length} steps PASS, 0 errors, ${r.viewport}, navigations ${r.mainFrameNavigations}`);
